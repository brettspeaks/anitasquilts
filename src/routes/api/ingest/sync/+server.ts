import { json, type RequestHandler } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/supabaseClient';
import { analyzeVideoWithGemini } from '$lib/server/gemini';
import { getPublicStorageUrl } from '$lib/server/s3';
import type { VideoRecord, SourceProvider, IngestSyncResponse } from '$lib/types';

/**
 * Background Pull / Sync Endpoint
 * Scans cloud storage buckets (or designated favorites/curated prefixes) and triggers AI extraction
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = await request.json().catch(() => ({}));
		const { provider = 's3_bucket', prefix = 'favorites/' } = payload;

		const supabase = createServerSupabaseClient();

		// Check for unanalyzed items or simulate cloud scan in dev environment
		const { data: pendingVideos } = await supabase
			.from('videos')
			.select('*')
			.in('status', ['pending_sync', 'processing'])
			.limit(5);

		const processedItems: VideoRecord[] = [];

		if (pendingVideos && pendingVideos.length > 0) {
			for (const vid of pendingVideos) {
				try {
					const videoUrl = vid.storage_url || getPublicStorageUrl(vid.storage_key);
					const analysis = await analyzeVideoWithGemini(videoUrl, vid.mime_type || 'video/mp4');

					const { data: updated } = await supabase
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
								summary: analysis.summary,
								analyzed_at: new Date().toISOString()
							}
						})
						.eq('id', vid.id)
						.select()
						.single();

					if (updated) {
						processedItems.push(updated);
					}
				} catch (err) {
					console.error(`Failed to process video ${vid.id}:`, err);
				}
			}
		}

		const response: IngestSyncResponse = {
			success: true,
			scannedCount: pendingVideos ? pendingVideos.length : 0,
			ingestedCount: processedItems.length,
			filteredOutCount: 0,
			items: processedItems
		};

		return json(response);
	} catch (error: any) {
		console.error('Error during background sync execution:', error);
		return json({ error: error?.message || 'Sync failed' }, { status: 500 });
	}
};
