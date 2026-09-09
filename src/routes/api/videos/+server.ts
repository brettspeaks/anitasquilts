import { json, type RequestHandler } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/server/supabase';
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

		let formattedVideos: VideoRecord[] = (data as any[]).map((row) => ({
			...row,
			thumbnail_url: row.thumbnail_url || row.metadata?.thumbnail_url || null,
			thumbnail_key: row.thumbnail_key || row.metadata?.thumbnail_key || null,
			source_provider: row.source_provider || row.metadata?.source_provider || 'r2_bucket',
			performer_details: row.performer_details || row.metadata?.performer_details || null,
			lyrics_synced: row.lyrics_synced || row.metadata?.lyrics_synced || [],
			lore_links: row.lore_links || row.metadata?.lore_links || [],
			is_favorited: row.is_favorited ?? true,
			visibility: row.visibility || 'public'
		}));

		if (provider && provider !== 'all') {
			formattedVideos = formattedVideos.filter(
				(v) => v.source_provider === provider || (v.metadata as any)?.source_provider === provider
			);
		}

		if (tag) {
			formattedVideos = formattedVideos.filter(
				(v) => Array.isArray(v.visual_tags) && v.visual_tags.includes(tag)
			);
		}

		if (search) {
			const s = search.toLowerCase();
			formattedVideos = formattedVideos.filter(
				(v) =>
					v.artist?.toLowerCase().includes(s) ||
					v.venue?.toLowerCase().includes(s) ||
					v.transcript?.toLowerCase().includes(s) ||
					v.filename?.toLowerCase().includes(s)
			);
		}

		return json({ videos: formattedVideos });
	} catch (error: any) {
		console.warn('Supabase videos fallback:', error?.message);
		return json({ videos: getSampleConcertVideos(provider, tag, search) });
	}
};

function getSampleConcertVideos(provider?: string | null, tag?: string | null, search?: string | null): VideoRecord[] {
	const sampleData: VideoRecord[] = [
		{
			id: 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
			source_provider: 'r2_bucket',
			source_file_id: 'r2-kendrick-acl-001',
			filename: 'kendrick_lamar_alright_live_acl.mp4',
			storage_key: 'concerts/shorts/kendrick_lamar_alright.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/kendrick_lamar_alright.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/kendrick_lamar_alright.jpg',
			file_size: 17764700,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-kendrick-acl',
			shares: [],
			artist: 'Kendrick Lamar & Live Band',
			performer_details: {
				name: 'Kendrick Lamar',
				confidence: 0.99,
				genre: 'Hip-Hop / Rap / Live Funk',
				role: 'Lead Vocals & MC',
				visualCues: ['Dynamic Stage Lighting', 'Live Brass Section', 'Festival Crowd Waves', 'Fog Cannons']
			},
			venue: 'Austin City Limits Music Festival (Zilker Park, Austin, TX)',
			lyrics_synced: [
				{ timestamp: '0:03', seconds: 3, text: "All's my life I has to fight, nigga...", speaker: 'Kendrick Lamar' },
				{ timestamp: '0:14', seconds: 14, text: "When you know, we been hurting, year down, but we gon' be alright!", speaker: 'Kendrick Lamar' },
				{ timestamp: '0:25', seconds: 25, text: "Nigga, and if God got us then we gon' be alright! Do you hear me, do you feel me? We gon' be alright!", speaker: 'Kendrick Lamar & Crowd' }
			],
			transcript: "All's my life I has to fight, nigga... When you know, we been hurting, year down, but we gon' be alright! Nigga, and if God got us then we gon' be alright! Do you hear me, do you feel me? We gon' be alright!",
			visual_tags: ['Live Band Hip-Hop', 'Festival Headliner', 'Crowd Singalong', 'Brass Section', 'Austin Night'],
			lore_links: [
				{
					title: 'Alright (Kendrick Lamar Song) - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Alright_(Kendrick_Lamar_song)',
					description: 'Iconic Grammy-winning anthem co-produced by Pharrell Williams.',
					category: 'album'
				},
				{
					title: 'Austin City Limits Festival Lore',
					url: 'https://en.wikipedia.org/wiki/Austin_City_Limits_Music_Festival',
					description: 'Annual two-weekend festival in Zilker Park celebrating live performance.',
					category: 'tour'
				}
			],
			metadata: {
				summary: 'High-energy headlining festival set with full live funk band and 75,000 crowd chorus.',
				source_sync: 'Cloudflare R2 Direct Stream'
			},
			created_at: new Date(Date.now() - 300000).toISOString(),
			updated_at: new Date(Date.now() - 150000).toISOString()
		},
		{
			id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
			source_provider: 'ios_photos',
			source_file_id: 'ph-lauryn-philly-002',
			filename: 'lauryn_hill_doo_wop_roots_picnic.mov',
			storage_key: 'concerts/shorts/lauryn_hill_doo_wop.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/lauryn_hill_doo_wop.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/lauryn_hill_doo_wop.jpg',
			file_size: 8935786,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-lauryn-roots',
			shares: [],
			artist: 'Ms. Lauryn Hill',
			performer_details: {
				name: 'Ms. Lauryn Hill & The Roots',
				confidence: 0.98,
				genre: '90s Hip-Hop / Neo-Soul / Rap',
				role: 'Lead Vocals, MC & Acoustic Arrangement',
				visualCues: ['Horn Section Solo', 'Vintage Microphone', 'Gold Satin Jacket', 'Sunset Glow']
			},
			venue: 'Roots Picnic (The Mann Center, Philadelphia, PA)',
			lyrics_synced: [
				{ timestamp: '0:02', seconds: 2, text: "Guys, you know you better watch out! Some girls, some girls are only about that thing...", speaker: 'Ms. Lauryn Hill' },
				{ timestamp: '0:15', seconds: 15, text: "Showing off your cash, looking like a big shot, boy you better look out!", speaker: 'Ms. Lauryn Hill' },
				{ timestamp: '0:27', seconds: 27, text: "That thing, that thing, that thing! Doo Wop that thing!", speaker: 'Ms. Lauryn Hill & Horns' }
			],
			transcript: "Guys, you know you better watch out! Some girls, some girls are only about that thing... Showing off your cash, looking like a big shot, boy you better look out! That thing, that thing, that thing! Doo Wop that thing!",
			visual_tags: ['Neo-Soul', 'Live Hip-Hop Band', 'Philly Roots Picnic', 'Golden Era', 'Horn Section'],
			lore_links: [
				{
					title: 'Doo Wop (That Thing) - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Doo_Wop_(That_Thing)',
					description: 'Debuted at number one on the Billboard Hot 100, winning two Grammy Awards.',
					category: 'album'
				}
			],
			metadata: {
				summary: 'Timeless live rendition of Doo Wop backed by Questlove and The Roots brass section.',
				source_sync: 'iOS Photos Favorites Automation'
			},
			created_at: new Date(Date.now() - 450000).toISOString(),
			updated_at: new Date(Date.now() - 200000).toISOString()
		},
		{
			id: 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a',
			source_provider: 'dropbox',
			source_file_id: 'dbx-atcq-bk-003',
			filename: 'tribe_called_quest_can_i_kick_it_brooklyn.mp4',
			storage_key: 'concerts/shorts/tribe_called_quest_can_i_kick_it.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/tribe_called_quest_can_i_kick_it.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/tribe_called_quest_can_i_kick_it.jpg',
			file_size: 10399321,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-atcq-bk',
			shares: [],
			artist: 'A Tribe Called Quest',
			performer_details: {
				name: 'Q-Tip, Phife Dawg & Ali Shaheed Muhammad',
				confidence: 0.99,
				genre: 'Jazz Rap / Classic Hip-Hop',
				role: 'MC, Turntables & Double Bass',
				visualCues: ['Turntable Scratches', 'Upright Bass Sample', 'Brooklyn Stage Wash']
			},
			venue: 'Brooklyn Bowl, New York, NY',
			lyrics_synced: [
				{ timestamp: '0:02', seconds: 2, text: "Can I kick it? Yes, you can!", speaker: 'Q-Tip & Crowd' },
				{ timestamp: '0:12', seconds: 12, text: "Can I kick it? Yes, you can!", speaker: 'Q-Tip & Crowd' },
				{ timestamp: '0:22', seconds: 22, text: "Before the rhymes are made, before the beats are laid, let the rhythm flow!", speaker: 'Q-Tip' }
			],
			transcript: "Can I kick it? Yes, you can! Can I kick it? Yes, you can! Before the rhymes are made, before the beats are laid, let the rhythm flow!",
			visual_tags: ['Jazz Rap', 'Vinyl Samples', 'Brooklyn Soundstage', 'Classic Hip-Hop', 'Call & Response'],
			lore_links: [
				{
					title: 'Can I Kick It? - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Can_I_Kick_It%3F',
					description: "Third single from People's Instinctive Travels sampling Lou Reed's Walk on the Wild Side.",
					category: 'album'
				}
			],
			metadata: {
				summary: 'Intimate Brooklyn Bowl session with classic Lou Reed sample and lively call-and-response.',
				source_sync: 'Dropbox Curated Media Folder'
			},
			created_at: new Date(Date.now() - 500000).toISOString(),
			updated_at: new Date(Date.now() - 250000).toISOString()
		},
		{
			id: 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b',
			source_provider: 'r2_bucket',
			source_file_id: 'r2-fleetwood-forum-004',
			filename: 'fleetwood_mac_landslide_the_forum_1982.mp4',
			storage_key: 'concerts/shorts/fleetwood_mac_landslide.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/fleetwood_mac_landslide.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/fleetwood_mac_landslide.jpg',
			file_size: 4007957,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-fleetwood-forum',
			shares: [],
			artist: 'Fleetwood Mac',
			performer_details: {
				name: 'Stevie Nicks & Lindsey Buckingham',
				confidence: 0.99,
				genre: 'Classic Rock / Soft Rock / Folk Rock',
				role: 'Lead Vocals & Acoustic Fingerpicking',
				visualCues: ['Taylor 814ce Acoustic', 'Chiffon Shawl', 'Warm Candlelight Stage Lighting']
			},
			venue: 'The Forum, Inglewood, CA (Mirage Tour)',
			lyrics_synced: [
				{ timestamp: '0:03', seconds: 3, text: "I took my love, I took it down...", speaker: 'Stevie Nicks' },
				{ timestamp: '0:14', seconds: 14, text: "Climbed a mountain and I turned around...", speaker: 'Stevie Nicks' },
				{ timestamp: '0:26', seconds: 26, text: "Well, I've been afraid of changing 'cause I've built my life around you...", speaker: 'Stevie Nicks & Lindsey Buckingham' }
			],
			transcript: "I took my love, I took it down... Climbed a mountain and I turned around... And I saw my reflection in the snow-covered hills 'til the landslide brought me down. Well, I've been afraid of changing 'cause I've built my life around you.",
			visual_tags: ['Acoustic Fingerpicking', 'Classic Rock', 'Harmonies', 'Legendary Performance', 'Intimate Duo'],
			lore_links: [
				{
					title: 'Landslide (Fleetwood Mac Song) - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Landslide_(Fleetwood_Mac_song)',
					description: 'Written by Stevie Nicks in Aspen, Colorado, pondering whether to return to school or keep pursuing music.',
					category: 'album'
				}
			],
			metadata: {
				summary: 'Iconic intimate live duet between Stevie Nicks and Lindsey Buckingham recorded at The Forum.',
				source_sync: 'Cloudflare R2 Direct Ingest'
			},
			created_at: new Date(Date.now() - 550000).toISOString(),
			updated_at: new Date(Date.now() - 280000).toISOString()
		},
		{
			id: 'f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c',
			source_provider: 'google_drive',
			source_file_id: 'gdrive-pearljam-wrigley-005',
			filename: 'pearl_jam_yellow_ledbetter_wrigley_field.mp4',
			storage_key: 'concerts/shorts/pearl_jam_yellow_ledbetter.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/pearl_jam_yellow_ledbetter.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/pearl_jam_yellow_ledbetter.jpg',
			file_size: 7170402,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-pearljam-wrigley',
			shares: [],
			artist: 'Pearl Jam',
			performer_details: {
				name: 'Eddie Vedder & Mike McCready',
				confidence: 0.99,
				genre: 'Grunge / Alternative Rock',
				role: 'Vocals, Harmonica & Stratocaster Guitar Solo',
				visualCues: ['Sunburst 1959 Fender Stratocaster', 'Wrigley Field Ivy Lights', 'Harmonica Harness']
			},
			venue: 'Wrigley Field, Chicago, IL',
			lyrics_synced: [
				{ timestamp: '0:04', seconds: 4, text: "Unsealed on a porch a letter sat...", speaker: 'Eddie Vedder' },
				{ timestamp: '0:16', seconds: 16, text: "Then the sun begins to burn, and I say, I don't know whether I was the boxer or the bag...", speaker: 'Eddie Vedder' },
				{ timestamp: '0:29', seconds: 29, text: "I wanna leave it all behind, make me cry!", speaker: 'Eddie Vedder & Mike McCready' }
			],
			transcript: "Unsealed on a porch a letter sat... Then the sun begins to burn, and I say, I don't know whether I was the boxer or the bag... I wanna leave it all behind, make me cry!",
			visual_tags: ['Guitar Solo', 'Stadium Rock', 'Wrigley Field', 'Stratocaster Blues', 'Grunge Anthem'],
			lore_links: [
				{
					title: 'Yellow Ledbetter - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Yellow_Ledbetter',
					description: "B-side to Jeremy that became one of Pearl Jam's most beloved concert closers.",
					category: 'album'
				}
			],
			metadata: {
				summary: "Electrifying show-closer at Wrigley Field featuring Mike McCready's Hendrix-inspired Stratocaster improvisation.",
				source_sync: 'Google Drive Curated Folder Watcher'
			},
			created_at: new Date(Date.now() - 580000).toISOString(),
			updated_at: new Date(Date.now() - 290000).toISOString()
		},
		{
			id: 'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d',
			source_provider: 'r2_bucket',
			source_file_id: 'r2-petty-rr-006',
			filename: 'tom_petty_free_fallin_red_rocks_live.mp4',
			storage_key: 'concerts/shorts/tom_petty_free_fallin.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/tom_petty_free_fallin.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/tom_petty_free_fallin.jpg',
			file_size: 7052964,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-petty-rr',
			shares: [],
			artist: 'Tom Petty & The Heartbreakers',
			performer_details: {
				name: 'Tom Petty & Mike Campbell',
				confidence: 0.99,
				genre: 'Heartland Rock / Classic Rock',
				role: 'Lead Vocals, 12-String Rickenbacker Guitar',
				visualCues: ['Rickenbacker 360/12', 'Red Rocks Red Sandstone Monoliths', 'Top Hat and Frock Coat']
			},
			venue: 'Red Rocks Amphitheatre, Morrison, CO',
			lyrics_synced: [
				{ timestamp: '0:03', seconds: 3, text: "She's a good girl, loves her mama...", speaker: 'Tom Petty' },
				{ timestamp: '0:13', seconds: 13, text: "Loves Jesus, and America too...", speaker: 'Tom Petty' },
				{ timestamp: '0:24', seconds: 24, text: "And I'm free, free fallin'! Yeah, I'm free, free fallin'!", speaker: 'Tom Petty & 10,000 Fans' }
			],
			transcript: "She's a good girl, loves her mama... Loves Jesus, and America too... And I'm free, free fallin'! Yeah, I'm free, free fallin'!",
			visual_tags: ['12-String Guitar', 'Red Rocks Sunset', 'Classic Singalong', 'Heartland Rock', 'All-American Anthem'],
			lore_links: [
				{
					title: "Free Fallin' - Wikipedia",
					url: "https://en.wikipedia.org/wiki/Free_Fallin%27",
					description: "Opening track of Petty's 1989 debut solo album Full Moon Fever co-written with Jeff Lynne.",
					category: 'album'
				}
			],
			metadata: {
				summary: "Golden hour performance at Red Rocks with 10,000 voices echoing Free Fallin' off the monolithic stones.",
				source_sync: 'Cloudflare R2 Direct Vault'
			},
			created_at: new Date(Date.now() - 590000).toISOString(),
			updated_at: new Date(Date.now() - 295000).toISOString()
		},
		{
			id: 'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e',
			source_provider: 'ios_photos',
			source_file_id: 'ph-joni-newport-007',
			filename: 'joni_mitchell_both_sides_now_newport_folk.mov',
			storage_key: 'concerts/shorts/joni_mitchell_both_sides_now.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/joni_mitchell_both_sides_now.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/joni_mitchell_both_sides_now.jpg',
			file_size: 7358710,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-joni-newport',
			shares: [],
			artist: 'Joni Mitchell & Brandi Carlile',
			performer_details: {
				name: 'Joni Mitchell, Brandi Carlile & Wynonna Judd',
				confidence: 0.99,
				genre: 'Traditional Folk / Singer-Songwriter / Roots',
				role: 'Lead Vocals & Acoustic Guitar Session',
				visualCues: ['Newport Folk Stage Overlooking Harbor', 'Gilded Throne Chair', 'Acoustic Harmonies']
			},
			venue: 'Newport Folk Festival (Fort Adams State Park, RI)',
			lyrics_synced: [
				{ timestamp: '0:04', seconds: 4, text: "Rows and flows of angel hair, and ice cream castles in the air...", speaker: 'Joni Mitchell' },
				{ timestamp: '0:18', seconds: 18, text: "I've looked at clouds from both sides now, from up and down and still somehow...", speaker: 'Joni Mitchell & Brandi Carlile' },
				{ timestamp: '0:32', seconds: 32, text: "It's clouds illusions I recall, I really don't know clouds at all.", speaker: 'Joni Mitchell' }
			],
			transcript: "Rows and flows of angel hair, and ice cream castles in the air... I've looked at clouds from both sides now, from up and down and still somehow... It's clouds illusions I recall, I really don't know clouds at all.",
			visual_tags: ['Newport Folk', 'Acoustic Circle', 'Poetic Lore', 'Legendary Return', 'Emotional Harmonies'],
			lore_links: [
				{
					title: 'Both Sides, Now - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Both_Sides,_Now',
					description: "One of Rolling Stone's 500 Greatest Songs of All Time, recorded on Clouds (1969).",
					category: 'album'
				},
				{
					title: 'Newport Folk Festival History',
					url: 'https://en.wikipedia.org/wiki/Newport_Folk_Festival',
					description: 'Historic American annual folk-oriented music festival founded in 1959.',
					category: 'general'
				}
			],
			metadata: {
				summary: 'Emotional return to the Newport Folk Festival stage after 53 years, performing Both Sides Now in an intimate circle.',
				source_sync: 'iOS Photos Favorites Automation'
			},
			created_at: new Date(Date.now() - 595000).toISOString(),
			updated_at: new Date(Date.now() - 298000).toISOString()
		},
		{
			id: 'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f',
			source_provider: 'dropbox',
			source_file_id: 'dbx-welch-ryman-008',
			filename: 'gillian_welch_look_at_miss_ohio_ryman_nashville.mp4',
			storage_key: 'concerts/shorts/gillian_welch_look_at_miss_ohio.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/gillian_welch_look_at_miss_ohio.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/gillian_welch_look_at_miss_ohio.jpg',
			file_size: 8528576,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-welch-ryman',
			shares: [],
			artist: 'Gillian Welch & David Rawlings',
			performer_details: {
				name: 'Gillian Welch & David Rawlings',
				confidence: 0.99,
				genre: 'Appalachian Folk / Americana / Bluegrass',
				role: 'Acoustic Guitar, Banjo & Sibling Harmonies',
				visualCues: ['1935 Epiphone Olympic Archtop', '1956 Gibson J-50', 'Ryman Auditorium Pew Stage']
			},
			venue: 'Ryman Auditorium (The Mother Church), Nashville, TN',
			lyrics_synced: [
				{ timestamp: '0:03', seconds: 3, text: "Oh me oh my oh, look at Miss Ohio...", speaker: 'Gillian Welch' },
				{ timestamp: '0:14', seconds: 14, text: "She's a-running 'round the soft-shoe in the street...", speaker: 'Gillian Welch & David Rawlings' },
				{ timestamp: '0:27', seconds: 27, text: "Gonna do what I please, gonna do what I please, but I'm gonna do right by and by!", speaker: 'Gillian Welch & David Rawlings' }
			],
			transcript: "Oh me oh my oh, look at Miss Ohio... She's a-running 'round the soft-shoe in the street... Gonna do what I please, gonna do what I please, but I'm gonna do right by and by!",
			visual_tags: ['Ryman Auditorium', 'Appalachian Folk', 'Archtop Guitar Solo', 'Acoustic Duet', 'Nashville Roots'],
			lore_links: [
				{
					title: 'Soul Journey (Album) - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Soul_Journey',
					description: 'Acclaimed fourth studio album featuring Look at Miss Ohio.',
					category: 'album'
				},
				{
					title: 'Ryman Auditorium - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Ryman_Auditorium',
					description: 'Historic 2,362-seat live performance venue in Nashville, known as the Mother Church of Country Music.',
					category: 'general'
				}
			],
			metadata: {
				summary: "Spellbinding acoustic performance at the historic Ryman Auditorium with David Rawlings' intricate Epiphone archtop runs.",
				source_sync: 'Dropbox Curated Media Folder'
			},
			created_at: new Date(Date.now() - 598000).toISOString(),
			updated_at: new Date(Date.now() - 299000).toISOString()
		},
		{
			id: 'd9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3a',
			source_provider: 'r2_bucket',
			source_file_id: 'r2-dylan-electric-009',
			filename: 'bob_dylan_like_a_rolling_stone_electric_1966.mp4',
			storage_key: 'concerts/shorts/bob_dylan_like_a_rolling_stone.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/bob_dylan_like_a_rolling_stone.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/bob_dylan_like_a_rolling_stone.jpg',
			file_size: 3181817,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-dylan-electric',
			shares: [],
			artist: 'Bob Dylan & The Band',
			performer_details: {
				name: 'Bob Dylan & The Hawks (Robbie Robertson, Garth Hudson, Levon Helm)',
				confidence: 0.99,
				genre: 'Folk Rock / Electric Roots / Americana',
				role: 'Lead Vocals, Fender Telecaster & Harmonica',
				visualCues: ['Black Fender Telecaster', 'Hammond B3 Organ Swell', 'Pinstripe Suit & Ray-Ban Wayfarers']
			},
			venue: 'Manchester Free Trade Hall (Royal Albert Hall Bootleg Tape)',
			lyrics_synced: [
				{ timestamp: '0:02', seconds: 2, text: "Once upon a time you dressed so fine, threw the bums a dime in your prime, didn't you?!", speaker: 'Bob Dylan' },
				{ timestamp: '0:15', seconds: 15, text: "People call, say 'Beware doll, you're bound to fall', you thought they were all kidding you...", speaker: 'Bob Dylan' },
				{ timestamp: '0:29', seconds: 29, text: "How does it feel?! How does it feel?! To be without a home, like a complete unknown, like a rolling stone!", speaker: 'Bob Dylan & The Hawks' }
			],
			transcript: "Once upon a time you dressed so fine, threw the bums a dime in your prime, didn't you?! People call, say 'Beware doll, you're bound to fall', you thought they were all kidding you... How does it feel?! How does it feel?! To be without a home, like a complete unknown, like a rolling stone!",
			visual_tags: ['Folk Rock Revolution', 'Telecaster Crunch', 'Hammond Organ', 'Historic Tape', 'Electric Soundstage'],
			lore_links: [
				{
					title: 'Like a Rolling Stone - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Like_a_Rolling_Stone',
					description: "Voted #1 on Rolling Stone's original 500 Greatest Songs of All Time list.",
					category: 'album'
				},
				{
					title: 'Live 1966: The Royal Albert Hall Concert',
					url: 'https://en.wikipedia.org/wiki/The_Bootleg_Series_Vol._4:_Bob_Dylan_Live_1966,_The_%22Royal_Albert_Hall%22_Concert',
					description: 'The legendary electric tour bootleg that changed the course of folk and rock music.',
					category: 'album'
				}
			],
			metadata: {
				summary: 'The legendary 1966 electric set that revolutionized folk music into electrified rock and roll.',
				source_sync: 'Cloudflare R2 Direct Vault'
			},
			created_at: new Date(Date.now() - 599000).toISOString(),
			updated_at: new Date(Date.now() - 299500).toISOString()
		},
		{
			id: 'e1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
			source_provider: 'r2_bucket',
			source_file_id: 'r2-jj-kc-001',
			filename: 'jack_johnson_banana_pancakes_kansas_city_starlight.mp4',
			storage_key: 'concerts/shorts/jack_johnson_banana_pancakes.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/jack_johnson_banana_pancakes.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/jack_johnson_banana_pancakes.jpg',
			file_size: 6772607,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-jj-kc-starlight',
			shares: [],
			artist: 'Jack Johnson',
			performer_details: {
				name: 'Jack Johnson & Zach Gill',
				confidence: 0.99,
				genre: 'Acoustic Rock / Folk / Surf Pop',
				role: 'Acoustic Guitar, Vocals & Melodica',
				visualCues: ['Cole Clark Acoustic Guitar', 'Melodica Solo', 'Starlight Amphitheatre Breeze', 'Warm Golden Stage Lights']
			},
			venue: 'Starlight Theatre, Kansas City, MO',
			lyrics_synced: [
				{ timestamp: '0:02', seconds: 2, text: "Can't you see that it's just raining? There ain't no need to go outside...", speaker: 'Jack Johnson' },
				{ timestamp: '0:14', seconds: 14, text: "Baby, you hardly even notice when I try to show you this song is meant to keep you from doing what you're supposed to...", speaker: 'Jack Johnson' },
				{ timestamp: '0:28', seconds: 28, text: "Waking up too early, maybe we can sleep in, make you banana pancakes, pretend like it's the weekend now!", speaker: 'Jack Johnson & Crowd' }
			],
			transcript: "Can't you see that it's just raining? There ain't no need to go outside... Baby, you hardly even notice when I try to show you this song is meant to keep you from doing what you're supposed to... Waking up too early, maybe we can sleep in, make you banana pancakes, pretend like it's the weekend now!",
			visual_tags: ['Acoustic Guitar', 'Kansas City Open Air', 'Folk Grooves', 'Sunset Soundstage', 'Summer Jam', 'Singalong'],
			lore_links: [
				{
					title: 'Banana Pancakes - Song Lore',
					url: 'https://en.wikipedia.org/wiki/In_Between_Dreams',
					description: 'Lead acoustic anthem from In Between Dreams that became an international singalong favorite.',
					category: 'album'
				},
				{
					title: 'Starlight Theatre (Kansas City, MO)',
					url: 'https://en.wikipedia.org/wiki/Starlight_Theatre_(Kansas_City,_Missouri)',
					description: 'Historic 7,958-seat outdoor amphitheatre located in Swope Park, Kansas City, Missouri.',
					category: 'general'
				}
			],
			metadata: {
				summary: 'Warm sunset acoustic performance of Banana Pancakes under the open skies at Kansas City\'s historic Starlight Theatre.',
				source_sync: 'Cloudflare R2 Direct Ingest'
			},
			created_at: new Date(Date.now() - 600000).toISOString(),
			updated_at: new Date(Date.now() - 300000).toISOString()
		},
		{
			id: 'f2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e',
			source_provider: 'r2_bucket',
			source_file_id: 'r2-avett-rr-002',
			filename: 'avett_brothers_head_full_of_doubt_red_rocks.mp4',
			storage_key: 'concerts/shorts/avett_brothers_i_and_love_and_you.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/avett_brothers_i_and_love_and_you.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/avett_brothers_i_and_love_and_you.png',
			file_size: 36094197,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-avett-redrocks',
			shares: [],
			artist: 'The Avett Brothers',
			performer_details: {
				name: 'The Avett Brothers (Seth & Scott Avett)',
				confidence: 0.99,
				genre: 'Americana / Roots Rock',
				role: 'Banjo, Acoustic Guitar, Lead Vocals',
				visualCues: ['Deering Banjo', 'Guild Acoustic', 'Red Rocks Sandstone Monoliths']
			},
			venue: 'Red Rocks Amphitheatre, Morrison, CO',
			lyrics_synced: [
				{ timestamp: '0:03', seconds: 3, text: "There's a darkness upon me that's fun to mess around with...", speaker: 'Scott Avett' },
				{ timestamp: '0:16', seconds: 16, text: "Decide what to be and go be it!", speaker: 'Seth & Scott Avett' },
				{ timestamp: '0:30', seconds: 30, text: "When everything is said and done, we are all just searching for the sun.", speaker: 'The Avett Brothers' }
			],
			transcript: "There's a darkness upon me that's fun to mess around with, and though I might run with the devil, I know who my true family is. Decide what to be and go be it!",
			visual_tags: ['Banjo Strum', 'Red Rocks Sunset', 'Sibling Harmonies', 'Cello Distortion', 'Roots Anthem'],
			lore_links: [
				{
					title: 'I and Love and You (Album)',
					url: 'https://en.wikipedia.org/wiki/I_and_Love_and_You',
					description: 'Major-label breakthrough produced by Rick Rubin.',
					category: 'album'
				}
			],
			metadata: {
				summary: 'Legendary annual Red Rocks headline session featuring Scott and Seth Avett with electric cello breakdowns.',
				source_sync: 'Cloudflare R2 Direct Vault'
			},
			created_at: new Date(Date.now() - 1200000).toISOString(),
			updated_at: new Date(Date.now() - 600000).toISOString()
		},
		{
			id: 'a3b4c5d6-e7f8-4901-a234-56789abcdef0',
			source_provider: 'dropbox',
			source_file_id: 'dbx-childers-kc-003',
			filename: 'tyler_childers_feathered_indians_uptown_kc.mp4',
			storage_key: 'concerts/shorts/tyler_childers_feathered_indians.mp4',
			storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/tyler_childers_feathered_indians.mp4',
			thumbnail_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/thumbnails/tyler_childers_feathered_indians.jpg',
			file_size: 7738235,
			mime_type: 'video/mp4',
			is_favorited: true,
			status: 'ready',
			visibility: 'public',
			user_id: 'usr-anita-001',
			team_id: 'ws-anita-main',
			share_token: 'tok-childers-kc',
			shares: [],
			artist: 'Tyler Childers',
			performer_details: {
				name: 'Tyler Childers & The Food Stamps',
				confidence: 0.98,
				genre: 'Country / Appalachian Roots',
				role: 'Lead Vocals & Acoustic Rhythm',
				visualCues: ['Vintage Shure 55SH Mic', 'Martin D-28', 'Fiddle player accompaniment']
			},
			venue: 'Uptown Theater, Kansas City, MO',
			lyrics_synced: [
				{ timestamp: '0:04', seconds: 4, text: "Well my buckle makes impressions on the inside of her thigh...", speaker: 'Tyler Childers' },
				{ timestamp: '0:18', seconds: 18, text: "And I'd run through the briars and the brambles just to hold you.", speaker: 'Tyler Childers & Crowd' }
			],
			transcript: "Well my buckle makes impressions on the inside of her thigh, there are stories that the dust on the floor can verify. And I'd run through the briars and the brambles just to hold you.",
			visual_tags: ['Telecaster Twang', 'Appalachian Soul', 'Kansas City Crowd', 'Fiddle Solo', 'Raw Vocals'],
			lore_links: [
				{
					title: 'Purgatory (Album) - Wikipedia',
					url: 'https://en.wikipedia.org/wiki/Purgatory_(Tyler_Childers_album)',
					description: 'Breakthrough 2017 album co-produced by Sturgill Simpson.',
					category: 'album'
				}
			],
			metadata: {
				summary: 'Packed house live bootleg session at Kansas City\'s historic Uptown Theater.',
				source_sync: 'Dropbox Curated Media Folder'
			},
			created_at: new Date(Date.now() - 1800000).toISOString(),
			updated_at: new Date(Date.now() - 900000).toISOString()
		},
		{
			id: 'concert-1',
			source_provider: 'ios_photos',
			source_file_id: 'ph-asset-78902',
			filename: '2026-08-coldplay-live-coimbra.mov',
			storage_key: 'concerts/curated/coldplay_coimbra.mp4',
			storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
			thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
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
			thumbnail_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
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
			thumbnail_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
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
