import { json, type RequestHandler } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/supabaseClient';
import { analyzeVideoWithGemini } from '$lib/server/gemini';
import { getPublicStorageUrl, createPresignedDownloadUrl } from '$lib/server/s3';
import type { IngestWebhookPayload, SourceProvider } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Optional webhook secret verification
		const webhookSecret = process.env.WEBHOOK_SECRET;
		if (webhookSecret) {
			const authHeader = request.headers.get('x-webhook-secret') || request.headers.get('authorization');
			if (authHeader !== webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
				return json({ error: 'Unauthorized webhook invocation' }, { status: 401 });
			}
		}

		const payload: IngestWebhookPayload = await request.json();
		const {
			sourceProvider = 'webhook' as SourceProvider,
			storageKey,
			storageUrl,
			filename,
			fileSize,
			mimeType = 'video/mp4',
			isFavorited = true,
			metadata = {}
		} = payload;

		if (!storageKey && !storageUrl) {
			return json({ error: 'Missing storageKey or storageUrl in webhook payload' }, { status: 400 });
		}

		// Upstream Curated Filtering
		if (isFavorited === false) {
			return json({
				success: true,
				status: 'filtered_out',
				message: 'Asset skipped: Not marked as favorited/curated.'
			});
		}

		const effectiveFilename = filename || (storageKey ? storageKey.split('/').pop() || 'concert_clip.mp4' : 'concert_clip.mp4');
		const effectiveKey = storageKey || `ingest/${sourceProvider}/${Date.now()}_${effectiveFilename}`;
		const effectiveUrl = storageUrl || getPublicStorageUrl(effectiveKey);

		const supabase = createServerSupabaseClient();

		// Check if record exists
		const { data: existing } = await supabase
			.from('videos')
			.select('*')
			.eq('storage_key', effectiveKey)
			.maybeSingle();

		let videoRecord = existing;

		if (!videoRecord) {
			const { data: newRecord, error: insertError } = await supabase
				.from('videos')
				.insert({
					source_provider: sourceProvider,
					filename: effectiveFilename,
					storage_key: effectiveKey,
					storage_url: effectiveUrl,
					file_size: fileSize || null,
					mime_type: mimeType,
					is_favorited: isFavorited,
					status: 'processing',
					metadata: {
						...metadata,
						ingested_at: new Date().toISOString()
					}
				})
				.select()
				.single();

			if (insertError) {
				console.error('Error creating video record for ingestion:', insertError);
			}
			videoRecord = newRecord;
		} else {
			await supabase
				.from('videos')
				.update({ status: 'processing', updated_at: new Date().toISOString() })
				.eq('id', videoRecord.id);
		}

		const recordId = videoRecord?.id;

		// Asynchronously stream through Gemini 1.5 Flash
		let downloadUrl = effectiveUrl;
		try {
			if (storageKey && process.env.S3_ACCESS_KEY_ID) {
				downloadUrl = await createPresignedDownloadUrl(storageKey, 1800);
			}
		} catch (e) {
			console.warn('Presigned download URL fallback:', e);
		}

		const analysis = await analyzeVideoWithGemini(downloadUrl, mimeType);

		if (recordId) {
			await supabase
				.from('videos')
				.update({
					status: 'ready',
					artist: analysis.artist,
					performer_details: analysis.performer_details,
					venue: analysis.venue,
					lyrics_synced: analysis.lyrics_synced,
					transcript: analysis.transcript,
					visual_tags: analysis.visual_tags,
					lore_links: analysis.lore_links,
					metadata: {
						...metadata,
						summary: analysis.summary,
						analyzed_at: new Date().toISOString()
					}
				})
				.eq('id', recordId);
		}

		return json({
			success: true,
			status: 'ready',
			recordId,
			sourceProvider,
			analysis
		});
	} catch (error: any) {
		console.error('Error handling ingestion webhook:', error);
		return json({ error: error?.message || 'Ingestion Webhook Failed' }, { status: 500 });
	}
};
