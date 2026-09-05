/**
 * Cloudflare Worker / Serverless Edge Function: Gemini 1.5 Flash Video Intelligence Tagger
 * 
 * Triggered by:
 * 1. Cloudflare R2 Event Notifications (Queue / Event Handler)
 * 2. AWS S3 Event Notification Webhook
 * 3. HTTP Webhook POST from Client / Ingestion Pipeline
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Env {
	GEMINI_API_KEY: string;
	SUPABASE_URL: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
	WEBHOOK_SECRET?: string;
	S3_PUBLIC_DOMAIN?: string;
	R2_BUCKET?: any; // Cloudflare R2 Bucket Binding if deployed on CF
}

interface WebhookPayload {
	videoId?: string;
	storageKey?: string;
	storageUrl?: string;
	mimeType?: string;
	bucket?: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
		// Verify method
		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
				status: 405,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Optional Webhook Security Check
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
			const payload: WebhookPayload = await request.json();
			const result = await processVideoIntelligence(payload, env);

			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (error: any) {
			console.error('Worker execution error:', error);
			return new Response(
				JSON.stringify({
					success: false,
					error: error?.message || 'Internal Worker Error'
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}
	},

	// Cloudflare Queue or R2 Event handler
	async queue(batch: any, env: Env): Promise<void> {
		for (const message of batch.messages) {
			try {
				const event = message.body;
				// Format payload from S3/R2 event
				const storageKey = event.object?.key || event.Records?.[0]?.s3?.object?.key;
				if (storageKey) {
					await processVideoIntelligence({ storageKey }, env);
				}
				message.ack();
			} catch (err) {
				console.error('Queue processing error:', err);
				message.retry();
			}
		}
	}
};

/**
 * Core processing logic: fetch video -> analyze with Gemini 1.5 Flash -> store in Supabase
 */
export async function processVideoIntelligence(payload: WebhookPayload, env: Env) {
	const { videoId, storageKey, storageUrl, mimeType } = payload;
	const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

	let effectiveKey = storageKey;
	let effectiveUrl = storageUrl;
	let effectiveMime = mimeType || 'video/mp4';
	let recordId = videoId;

	// Lookup video record in Supabase if not all metadata was passed
	if (recordId || effectiveKey) {
		const query = recordId
			? supabase.from('videos').select('*').eq('id', recordId).single()
			: supabase.from('videos').select('*').eq('storage_key', effectiveKey!).single();

		const { data: record } = await query;
		if (record) {
			recordId = record.id;
			effectiveKey = record.storage_key;
			effectiveUrl = record.storage_url;
			effectiveMime = record.mime_type || effectiveMime;
		}
	}

	// Set status to 'processing'
	if (recordId) {
		await supabase.from('videos').update({ status: 'processing' }).eq('id', recordId);
	}

	// Resolve public or R2 video access URL
	if (!effectiveUrl && effectiveKey) {
		effectiveUrl = env.S3_PUBLIC_DOMAIN
			? `${env.S3_PUBLIC_DOMAIN.replace(/\/$/, '')}/${encodeURIComponent(effectiveKey)}`
			: `https://${env.R2_BUCKET?.name || 'storage'}/${encodeURIComponent(effectiveKey)}`;
	}

	if (!effectiveUrl) {
		throw new Error('Could not resolve video URL for Gemini processing.');
	}

	// 1. Fetch video data
	let base64VideoData: string;
	if (env.R2_BUCKET && effectiveKey) {
		// Direct R2 binding access for zero-latency Cloudflare Worker execution
		const r2Object = await env.R2_BUCKET.get(effectiveKey);
		if (!r2Object) {
			throw new Error(`R2 Object not found: ${effectiveKey}`);
		}
		const arrayBuf = await r2Object.arrayBuffer();
		base64VideoData = uint8ArrayToBase64(new Uint8Array(arrayBuf));
	} else {
		// Standard HTTP fetch
		const res = await fetch(effectiveUrl);
		if (!res.ok) {
			throw new Error(`Failed to download video (${res.status} ${res.statusText}): ${effectiveUrl}`);
		}
		const arrayBuf = await res.arrayBuffer();
		base64VideoData = uint8ArrayToBase64(new Uint8Array(arrayBuf));
	}

	// 2. Call Gemini 1.5 Flash API
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
Analyze this video clip and extract the following structured information in valid JSON:

{
  "artist": "Artist or Band name if identifiable from audio/visuals, or null if unknown",
  "venue": "Venue and environment context (e.g. 'Outdoor Stadium', 'Dim Indoor Bar', 'Underground Club', 'Festival Stage', 'Living Room Session')",
  "transcript": "Verbatim or accurate transcription of sung lyrics and spoken words in the video, or null if no speech/lyrics",
  "visual_tags": ["Array of concise 1-3 word visual tags describing lighting, instruments, performance style, shots, e.g. 'Stage Lighting', 'Pyrotechnics', 'Drum Solo', 'Crowd Shot', 'Mosh Pit', 'Acoustic Performance'"],
  "summary": "1-2 sentence high-level summary of the performance clip"
}

Respond ONLY with valid JSON conforming to this structure.
`;

	const contents = [
		{
			inlineData: {
				data: base64VideoData,
				mimeType: effectiveMime
			}
		},
		prompt
	];

	const result = await model.generateContent(contents);
	const responseText = result.response.text();
	const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
	const parsed = JSON.parse(cleaned);

	const aiOutput = {
		artist: parsed.artist || null,
		venue: parsed.venue || null,
		transcript: parsed.transcript || null,
		visual_tags: Array.isArray(parsed.visual_tags) ? parsed.visual_tags : [],
		summary: parsed.summary || null
	};

	// 3. Store result directly into Supabase PostgreSQL
	if (recordId) {
		const { data: updatedVideo, error: dbError } = await supabase
			.from('videos')
			.update({
				status: 'ready',
				artist: aiOutput.artist,
				venue: aiOutput.venue,
				transcript: aiOutput.transcript,
				visual_tags: aiOutput.visual_tags,
				metadata: {
					summary: aiOutput.summary,
					processed_by_worker: true,
					analyzed_at: new Date().toISOString()
				}
			})
			.eq('id', recordId)
			.select()
			.single();

		if (dbError) {
			console.error('Error updating Supabase database:', dbError);
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

// Fast Base64 encoder helper without Buffer dependency
function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
