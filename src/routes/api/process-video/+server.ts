import { json, type RequestHandler } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/supabaseClient';
import { analyzeVideoWithGemini } from '$lib/server/gemini';
import { createPresignedDownloadUrl, getPublicStorageUrl } from '$lib/server/s3';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = await request.json();
		const { videoId, storageKey, storageUrl, thumbnailUrl, mimeType, isFavorited = true } = payload;

		if (!videoId && !storageKey) {
			return json({ error: 'Missing videoId or storageKey' }, { status: 400 });
		}

		if (isFavorited === false) {
			return json({
				status: 'filtered_out',
				message: 'Asset skipped: Upstream filtering excluded non-favorited item.'
			});
		}

		const supabase = createServerSupabaseClient();

		// Fetch video record if needed
		let recordId = videoId;
		let effectiveStorageKey = storageKey;
		let effectiveStorageUrl = storageUrl;
		let effectiveMimeType = mimeType || 'video/mp4';

		let existingMetadata: Record<string, any> = {};

		if (recordId && (!effectiveStorageKey || !effectiveStorageUrl)) {
			const { data: record } = await supabase
				.from('videos')
				.select('*')
				.eq('id', recordId)
				.single();

			if (record) {
				effectiveStorageKey = record.storage_key;
				effectiveStorageUrl = record.storage_url;
				effectiveMimeType = record.mime_type || effectiveMimeType;
				existingMetadata = record.metadata || {};
			}
		}

		// Update state to processing
		if (recordId) {
			await supabase
				.from('videos')
				.update({ status: 'processing', updated_at: new Date().toISOString() })
				.eq('id', recordId);
		}

		// Resolve download URL for Gemini
		let videoAccessUrl = effectiveStorageUrl || getPublicStorageUrl(effectiveStorageKey);
		try {
			if (effectiveStorageKey && process.env.S3_ACCESS_KEY_ID) {
				videoAccessUrl = await createPresignedDownloadUrl(effectiveStorageKey, 1800);
			}
		} catch (err) {
			console.warn('Presigned download URL generation fallback:', err);
		}

		// Run Gemini 1.5 Flash video intelligence extraction
		try {
			const analysis = await analyzeVideoWithGemini(videoAccessUrl, effectiveMimeType);

			// Save to Supabase PostgreSQL
			if (recordId) {
				const { data: updatedRecord, error: updateError } = await supabase
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
							...existingMetadata,
							summary: analysis.summary,
							thumbnail_url: thumbnailUrl || existingMetadata.thumbnail_url || null,
							analyzed_at: new Date().toISOString()
						}
					})
					.eq('id', recordId)
					.select()
					.single();

				if (updateError) {
					console.error('Database update error:', updateError);
				}

				return json({
					success: true,
					video: updatedRecord || {
						id: recordId,
						status: 'ready',
						...analysis
					}
				});
			}

			return json({
				success: true,
				analysis
			});
		} catch (analysisError: any) {
			console.error('Gemini analysis failed:', analysisError);
			if (recordId) {
				await supabase
					.from('videos')
					.update({
						status: 'failed',
						error_message: analysisError?.message || 'AI video processing failed'
					})
					.eq('id', recordId);
			}

			return json(
				{
					error: analysisError?.message || 'AI video analysis failed',
					status: 'failed'
				},
				{ status: 500 }
			);
		}
	} catch (error: any) {
		console.error('Error in process-video endpoint:', error);
		return json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
};
