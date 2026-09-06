import { json, type RequestHandler } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/supabaseClient';
import type { VideoRecord, SourceProvider } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	const provider = url.searchParams.get('provider');
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

		if (provider && provider !== 'all') {
			query = query.eq('source_provider', provider);
		}

		if (tag) {
			query = query.contains('visual_tags', [tag]);
		}

		if (search) {
			query = query.or(`artist.ilike.%${search}%,venue.ilike.%${search}%,transcript.ilike.%${search}%`);
		}

		const { data, error } = await query;

		if (error || !data || data.length === 0) {
			return json({ videos: getSampleConcertVideos(provider, tag, search) });
		}

		return json({ videos: (data as VideoRecord[]) || [] });
	} catch (error: any) {
		console.warn('Supabase videos fallback:', error?.message);
		return json({ videos: getSampleConcertVideos(provider, tag, search) });
	}
};

function getSampleConcertVideos(provider?: string | null, tag?: string | null, search?: string | null): VideoRecord[] {
	const sampleData: VideoRecord[] = [
		{
			id: 'concert-1',
			source_provider: 'ios_photos',
			source_file_id: 'ph-asset-78902',
			filename: '2026-08-coldplay-live-coimbra.mov',
			storage_key: 'concerts/curated/coldplay_coimbra.mp4',
			storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
			file_size: 28400000,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-coldplay-coimbra',
			shares: [
				{
					id: 'share-1',
					video_id: 'concert-1',
					shared_with_email: 'crew@soundstage.fm',
					permission: 'annotate',
					created_at: new Date(Date.now() - 1700000).toISOString()
				}
			],
			artist: 'Coldplay',
			performer_details: {
				name: 'Coldplay (Chris Martin)',
				confidence: 0.98,
				genre: 'Stadium Rock / Pop',
				role: 'Lead Vocals & Piano',
				visualCues: ['Synchronized LED wristbands', 'Upright graffiti piano', 'Confetti cannons']
			},
			venue: 'Estádio Cidade de Coimbra, Music of the Spheres Tour',
			lyrics_synced: [
				{ timestamp: '0:03', seconds: 3, text: 'When you try your best, but you don\'t succeed...', speaker: 'Chris Martin' },
				{ timestamp: '0:14', seconds: 14, text: 'When you get what you want, but not what you need...', speaker: 'Chris Martin' },
				{ timestamp: '0:25', seconds: 25, text: 'Lights will guide you home, and ignite your bones!', speaker: 'Chris Martin & Crowd' },
				{ timestamp: '0:38', seconds: 38, text: 'And I will try to fix you...', speaker: 'Chris Martin' }
			],
			transcript: 'When you try your best, but you don\'t succeed... When you get what you want, but not what you need... Lights will guide you home, and ignite your bones! And I will try to fix you...',
			visual_tags: ['LED Wristbands', 'Laser Canopy', 'Stadium Singalong', 'Grand Piano', 'Pyrotechnics'],
			lore_links: [
				{
					title: 'Fix You (Song) - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Fix_You',
					description: 'Track written for Gwyneth Paltrow featuring a church organ progression.',
					category: 'wikipedia'
				},
				{
					title: 'Music of the Spheres Tour Lore',
					url: 'https://en.wikipedia.org/wiki/Music_of_the_Spheres_World_Tour',
					description: 'Pioneered kinetic energy dance floors and biodegradable wristbands.',
					category: 'tour'
				}
			],
			metadata: {
				summary: 'Electrifying stadium performance with 60,000 synchronized LED wristbands glowing during the guitar swell.',
				source_sync: 'iOS Photos Favorites Automation'
			},
			created_at: new Date(Date.now() - 1800000).toISOString(),
			updated_at: new Date(Date.now() - 1200000).toISOString()
		},
		{
			id: 'concert-2',
			source_provider: 'google_drive',
			source_file_id: 'gdrive-file-99120',
			filename: 'queen_live_aid_wembley_remastered.mp4',
			storage_key: 'concerts/curated/queen_live_aid.mp4',
			storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
			file_size: 45100000,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'team',
			user_id: 'usr-anita-001',
			team_id: 'ws-live-crew',
			share_token: 'tok-queen-liveaid',
			shares: [
				{
					id: 'share-2',
					video_id: 'concert-2',
					shared_with_email: 'scout@underground.org',
					permission: 'view',
					created_at: new Date(Date.now() - 7000000).toISOString()
				}
			],
			artist: 'Queen',
			performer_details: {
				name: 'Freddie Mercury & Queen',
				confidence: 0.99,
				genre: 'Classic Rock',
				role: 'Frontman & Piano',
				visualCues: ['White tank top & studded armband', 'Bottomless microphone stand']
			},
			venue: 'Wembley Stadium, London (Live Aid 1985)',
			lyrics_synced: [
				{ timestamp: '0:02', seconds: 2, text: 'Radio Ga Ga! Radio Goo Goo!', speaker: 'Freddie Mercury & Crowd' },
				{ timestamp: '0:11', seconds: 11, text: 'All we hear is Radio Ga Ga, Radio blah blah!', speaker: 'Freddie Mercury' },
				{ timestamp: '0:22', seconds: 22, text: 'Radio, what\'s new? Someone still loves you!', speaker: 'Freddie Mercury' }
			],
			transcript: 'Radio Ga Ga! Radio Goo Goo! All we hear is Radio Ga Ga, Radio blah blah! Radio, what\'s new? Someone still loves you!',
			visual_tags: ['Iconic Frontman', 'Stadium Crowd', 'Synchronized Clap', 'Piano Solo', 'Daylight Stage'],
			lore_links: [
				{
					title: 'Queen at Live Aid - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Live_Aid#Queen',
					description: 'Widely voted by critics and artists as the greatest live rock performance in history.',
					category: 'wikipedia'
				},
				{
					title: 'Radio Ga Ga - Background & History',
					url: 'https://en.wikipedia.org/wiki/Radio_Ga_Ga',
					description: 'Inspired by Roger Taylor\'s toddler son murmuring "radio ca-ca".',
					category: 'album'
				}
			],
			metadata: {
				summary: 'Legendary 20-minute Live Aid set featuring 72,000 fans double-clapping in unison.',
				source_sync: 'Google Drive Curated Folder Watcher'
			},
			created_at: new Date(Date.now() - 7200000).toISOString(),
			updated_at: new Date(Date.now() - 6900000).toISOString()
		},
		{
			id: 'concert-3',
			source_provider: 'dropbox',
			source_file_id: 'dbx-entry-44101',
			filename: 'phoebe_bridgers_kyoto_acoustic.mp4',
			storage_key: 'concerts/curated/phoebe_kyoto.mp4',
			storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
			file_size: 19800000,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'private',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-phoebe-kyoto',
			shares: [],
			artist: 'Phoebe Bridgers',
			performer_details: {
				name: 'Phoebe Bridgers',
				confidence: 0.96,
				genre: 'Indie Folk / Emo Rock',
				role: 'Lead Vocals & Baritone Guitar',
				visualCues: ['Skeleton suit', 'Warm tungsten stage wash']
			},
			venue: 'Stubbs BBQ Amphitheater, Austin TX',
			lyrics_synced: [
				{ timestamp: '0:04', seconds: 4, text: 'Day off in Kyoto, got bored at the temple...', speaker: 'Phoebe Bridgers' },
				{ timestamp: '0:15', seconds: 15, text: 'Looked at the stars through a payphone...', speaker: 'Phoebe Bridgers' },
				{ timestamp: '0:28', seconds: 28, text: 'I\'m gonna kill you! If you don\'t beat me to it...', speaker: 'Phoebe Bridgers' }
			],
			transcript: 'Day off in Kyoto, got bored at the temple... Looked at the stars through a payphone... I\'m gonna kill you! If you don\'t beat me to it...',
			visual_tags: ['Acoustic Folk', 'Skeleton Suit', 'Tungsten Lighting', 'Close-Up Shot', 'Intimate Stage'],
			lore_links: [
				{
					title: 'Kyoto (Phoebe Bridgers song) - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Kyoto_(Phoebe_Bridgers_song)',
					description: 'Nominated for Best Rock Song and Best Rock Performance at the 63rd Annual Grammy Awards.',
					category: 'wikipedia'
				}
			],
			metadata: {
				summary: 'Intimate outdoor amphitheater rendition of Kyoto with raw acoustic arrangement.',
				source_sync: 'Dropbox Tagged Favorites Sync'
			},
			created_at: new Date(Date.now() - 14400000).toISOString(),
			updated_at: new Date(Date.now() - 14100000).toISOString()
		}
	];

	let filtered = sampleData;
	if (provider && provider !== 'all') {
		filtered = filtered.filter((v) => v.source_provider === provider);
	}
	if (tag) {
		filtered = filtered.filter((v) => v.visual_tags.includes(tag));
	}
	if (search) {
		const q = search.toLowerCase();
		filtered = filtered.filter(
			(v) =>
				v.artist?.toLowerCase().includes(q) ||
				v.venue?.toLowerCase().includes(q) ||
				v.transcript?.toLowerCase().includes(q) ||
				v.visual_tags.some((t) => t.toLowerCase().includes(q)) ||
				v.lore_links?.some((l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))
		);
	}

	return filtered;
}
