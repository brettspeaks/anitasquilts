/**
 * Cloudflare Worker / Serverless Edge Function: ConcertAI Ingestion & Gemini 1.5 Flash Intelligence Pipeline
 * 
 * Ingestion Triggers:
 * 1. Cloudflare R2 / AWS S3 ObjectCreated Event Notifications
 * 2. Background Watcher / Queue Sync
 * 3. HTTP Webhooks from iOS Shortcuts (iCloud Favorites), Google Drive, Dropbox, OneDrive
 * 
 * Features:
 * - Upstream Curated Filtering: Checks if asset is marked as favorite/curated before processing
 * - Gemini 1.5 Flash Multimodal Extraction (Performer ID, Time-Synced Lyrics, Domain Tags, Lore Links)
 * - Persists structured intelligence to Supabase PostgreSQL (videos table)
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SourceProvider, SyncedLyricLine, LoreLink, PerformerDetails } from '../src/lib/types';

export interface Env {
	GEMINI_API_KEY: string;
	SUPABASE_URL: string;
	SUPABASE_SECRET_KEY?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string; // Legacy fallback
	WEBHOOK_SECRET?: string;
	S3_PUBLIC_DOMAIN?: string;
	R2_BUCKET?: any; // Cloudflare R2 Bucket Binding if deployed on CF
}

export interface IngestionWebhookPayload {
	videoId?: string;
	sourceProvider?: SourceProvider;
	sourceFileId?: string;
	storageKey?: string;
	storageUrl?: string;
	thumbnailUrl?: string;
	thumbnailKey?: string;
	filename?: string;
	fileSize?: number;
	mimeType?: string;
	isFavorited?: boolean;
	metadata?: Record<string, unknown>;
}

export default {
	async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
				status: 405,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Webhook Security Token Check
		if (env.WEBHOOK_SECRET) {
			const authHeader = request.headers.get('x-webhook-secret') || request.headers.get('authorization');
			if (authHeader !== env.WEBHOOK_SECRET && authHeader !== `Bearer ${env.WEBHOOK_SECRET}`) {
				return new Response(JSON.stringify({ error: 'Unauthorized webhook invocation' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		try {
			const payload: IngestionWebhookPayload = await request.json();
			const result = await processIngestedVideo(payload, env);

			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (error: any) {
			console.error('Ingestion worker error:', error);
			return new Response(
				JSON.stringify({
					success: false,
					error: error?.message || 'Internal Ingestion Worker Error'
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}
	},

	// Cloudflare Queue or R2 Event handler for background push ingestion
	async queue(batch: any, env: Env): Promise<void> {
		for (const message of batch.messages) {
			try {
				const event = message.body;
				const storageKey = event.object?.key || event.Records?.[0]?.s3?.object?.key;
				const isFavorited = event.isFavorited ?? (storageKey?.includes('/favorites/') || storageKey?.includes('/curated/') || true);
				
				if (storageKey) {
					await processIngestedVideo({
						storageKey,
						sourceProvider: 'r2_bucket',
						isFavorited
					}, env);
				}
				message.ack();
			} catch (err) {
				console.error('Queue ingestion error:', err);
				message.retry();
			}
		}
	}
};

/**
 * Core processing pipeline:
 * 1. Filter upstream: Only process favorited/curated media
 * 2. Fetch video binary stream
 * 3. Extract multimodal concert intelligence via Gemini 1.5 Flash
 * 4. Upsert Supabase record with complete metadata
 */
export async function processIngestedVideo(payload: IngestionWebhookPayload, env: Env) {
	const {
		videoId,
		sourceProvider = 's3_bucket',
		sourceFileId,
		storageKey,
		storageUrl,
		thumbnailUrl,
		thumbnailKey,
		filename,
		fileSize,
		mimeType = 'video/mp4',
		isFavorited = true,
		metadata = {}
	} = payload;

	const authKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
	const supabase = createClient(env.SUPABASE_URL, authKey);

	// Upstream Curated Filtering
	if (isFavorited === false) {
		console.log(`Skipping non-curated asset to preserve AI budget: ${storageKey || filename}`);
		return {
			success: true,
			status: 'filtered_out',
			message: 'Asset skipped: Not marked as favorited/curated.'
		};
	}

	let effectiveKey = storageKey;
	let effectiveUrl = storageUrl;
	let recordId = videoId;
	let effectiveFilename = filename || (storageKey ? storageKey.split('/').pop() || 'concert_clip.mp4' : 'concert_clip.mp4');

	// Resolve public or R2 video access URL
	if (!effectiveUrl && effectiveKey) {
		effectiveUrl = env.S3_PUBLIC_DOMAIN
			? `${env.S3_PUBLIC_DOMAIN.replace(/\/$/, '')}/${encodeURIComponent(effectiveKey)}`
			: `https://${env.R2_BUCKET?.name || 'storage'}/${encodeURIComponent(effectiveKey)}`;
	}

	if (!effectiveUrl && !effectiveKey) {
		throw new Error('Missing storageKey or storageUrl for ingestion.');
	}

	// 1. Create or update video record in Supabase with status = 'processing'
	if (recordId) {
		await supabase
			.from('videos')
			.update({ status: 'processing', updated_at: new Date().toISOString() })
			.eq('id', recordId);
	} else if (effectiveKey) {
		const { data: existing } = await supabase
			.from('videos')
			.select('id')
			.eq('storage_key', effectiveKey)
			.maybeSingle();

		if (existing) {
			recordId = existing.id;
			await supabase
				.from('videos')
				.update({ status: 'processing', updated_at: new Date().toISOString() })
				.eq('id', recordId);
		} else {
			const { data: newRecord } = await supabase
				.from('videos')
				.insert({
					source_provider: sourceProvider,
					source_file_id: sourceFileId,
					filename: effectiveFilename,
					storage_key: effectiveKey,
					storage_url: effectiveUrl || '',
					file_size: fileSize,
					mime_type: mimeType,
					is_favorited: isFavorited,
					status: 'processing'
				})
				.select()
				.single();

			if (newRecord) {
				recordId = newRecord.id;
			}
		}
	}

	// 2. Fetch video data
	let base64VideoData: string;
	if (env.R2_BUCKET && effectiveKey) {
		const r2Object = await env.R2_BUCKET.get(effectiveKey);
		if (!r2Object) {
			throw new Error(`R2 Object not found: ${effectiveKey}`);
		}
		const arrayBuf = await r2Object.arrayBuffer();
		base64VideoData = uint8ArrayToBase64(new Uint8Array(arrayBuf));
	} else {
		const res = await fetch(effectiveUrl!);
		if (!res.ok) {
			throw new Error(`Failed to download video (${res.status}): ${effectiveUrl}`);
		}
		const arrayBuf = await res.arrayBuffer();
		base64VideoData = uint8ArrayToBase64(new Uint8Array(arrayBuf));
	}

	// 3. Extract Multimodal Intelligence with Gemini 1.5 Flash
	const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
	const model = genAI.getGenerativeModel({
		model: 'gemini-1.5-flash',
		generationConfig: {
			responseMimeType: 'application/json',
			temperature: 0.2
		}
	});

	const prompt = `
You are an expert concert, music, and live performance video intelligence analyzer.
Analyze this live performance clip and extract the following structured information in valid JSON:

{
  "artist": "Identified Artist or Band name, or null if unknown",
  "performer_details": {
    "name": "Primary performer or band name",
    "confidence": 0.95,
    "genre": "e.g., 'Indie Rock', 'Stadium Rock', 'Acoustic Folk'",
    "role": "e.g., 'Lead Vocals & Guitar'",
    "visualCues": ["Key visual stage notes"]
  },
  "venue": "Venue, stage setup, or environment context (e.g. 'Red Rocks Amphitheatre', 'Dim Underground Club')",
  "lyrics_synced": [
    {
      "timestamp": "0:05",
      "text": "Sung lyrics or spoken words",
      "speaker": "Lead Vocal"
    }
  ],
  "transcript": "Continuous full verbatim transcript of all lyrics and speech.",
  "visual_tags": ["Array of concise 1-3 word tags for lighting, instruments, crowd dynamics, stage effects"],
  "lore_links": [
    {
      "title": "Wikipedia or lore topic title",
      "url": "https://en.wikipedia.org/wiki/...",
      "description": "Interesting background trivia or lore regarding this song/tour.",
      "category": "wikipedia"
    }
  ],
  "summary": "1-2 sentence performance summary."
}
`;

	const contents = [
		{
			inlineData: {
				data: base64VideoData,
				mimeType
			}
		},
		prompt
	];

	const result = await model.generateContent(contents);
	const responseText = result.response.text();
	const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
	const parsed = JSON.parse(cleaned);

	const aiOutput = {
		artist: parsed.artist || parsed.performer_details?.name || null,
		performer_details: parsed.performer_details || null,
		venue: parsed.venue || null,
		lyrics_synced: Array.isArray(parsed.lyrics_synced) ? parsed.lyrics_synced : [],
		transcript: parsed.transcript || null,
		visual_tags: Array.isArray(parsed.visual_tags) ? parsed.visual_tags : [],
		lore_links: Array.isArray(parsed.lore_links) ? parsed.lore_links : [],
		summary: parsed.summary || null
	};

	// 4. Save ready record to Supabase
	if (recordId) {
		const { data: updatedVideo, error: dbError } = await supabase
			.from('videos')
			.update({
				status: 'ready',
				artist: aiOutput.artist,
				performer_details: aiOutput.performer_details,
				venue: aiOutput.venue,
				lyrics_synced: aiOutput.lyrics_synced,
				transcript: aiOutput.transcript,
				visual_tags: aiOutput.visual_tags,
				lore_links: aiOutput.lore_links,
				metadata: {
					...metadata,
					summary: aiOutput.summary,
					thumbnail_url: thumbnailUrl || (metadata as any)?.thumbnail_url || null,
					thumbnail_key: thumbnailKey || (metadata as any)?.thumbnail_key || null,
					processed_by_worker: true,
					analyzed_at: new Date().toISOString()
				}
			})
			.eq('id', recordId)
			.select()
			.single();

		if (dbError) {
			console.error('Database update error:', dbError);
		}

		return {
			success: true,
			video: updatedVideo || { id: recordId, status: 'ready', ...aiOutput }
		};
	}

	return {
		success: true,
		analysis: aiOutput
	};
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
