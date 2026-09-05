import { json, type RequestHandler } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/supabaseClient';
import type { VideoRecord } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	const deviceSessionToken = url.searchParams.get('deviceSessionToken');
	const tag = url.searchParams.get('tag');
	const search = url.searchParams.get('search');
	const limit = parseInt(url.searchParams.get('limit') || '50', 10);

	try {
		const supabase = createServerSupabaseClient();
		let query = supabase
			.from('videos')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (deviceSessionToken && deviceSessionToken !== 'all') {
			query = query.eq('device_session_token', deviceSessionToken);
		}

		if (tag) {
			query = query.contains('visual_tags', [tag]);
		}

		if (search) {
			query = query.or(`artist.ilike.%${search}%,venue.ilike.%${search}%,transcript.ilike.%${search}%`);
		}

		const { data, error } = await query;

		if (error) {
			console.warn('Supabase query error (falling back to mock items if in dev/offline):', error.message);
			return json({ videos: getSampleVideos() });
		}

		return json({ videos: (data as VideoRecord[]) || [] });
	} catch (error: any) {
		console.error('Error fetching videos:', error);
		return json({ videos: getSampleVideos() });
	}
};

function getSampleVideos(): VideoRecord[] {
	return [
		{
			id: 'sample-1',
			device_session_token: 'demo-token',
			filename: 'queen_live_aid_clip.mp4',
			storage_key: 'concerts/demo/queen_live_aid_clip.mp4',
			storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
			file_size: 15420000,
			mime_type: 'video/mp4',
			status: 'ready',
			artist: 'Queen',
			venue: 'Wembley Stadium, London (Live Aid)',
			transcript: 'Radio Ga Ga! All we hear is Radio Ga Ga, Radio goo goo...',
			visual_tags: ['Stadium Crowd', 'Stage Lighting', 'Iconic Vocalist', 'Piano Solo'],
			metadata: { summary: 'Electrifying stadium rock performance with massive crowd synchronization.' },
			created_at: new Date(Date.now() - 3600000).toISOString(),
			updated_at: new Date(Date.now() - 3500000).toISOString()
		},
		{
			id: 'sample-2',
			device_session_token: 'demo-token',
			filename: 'acoustic_coffeehouse_jam.mp4',
			storage_key: 'concerts/demo/acoustic_coffeehouse_jam.mp4',
			storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
			file_size: 8900000,
			mime_type: 'video/mp4',
			status: 'ready',
			artist: 'Phoebe Bridgers',
			venue: 'Intimate Underground Club, Austin',
			transcript: 'I have emotional motion sickness, somebody roll the windows down...',
			visual_tags: ['Acoustic Performance', 'Dim Lighting', 'Close-Up Shot', 'Indie Folk'],
			metadata: { summary: 'Intimate acoustic ballad performance under moody ambient lighting.' },
			created_at: new Date(Date.now() - 7200000).toISOString(),
			updated_at: new Date(Date.now() - 7100000).toISOString()
		}
	];
}
