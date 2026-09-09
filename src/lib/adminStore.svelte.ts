import type {
	ManagedUser,
	VideoRecord,
	ModerationAuditLog,
	UserRole,
	UserAccountStatus
} from './types';
import { authState } from './authStore.svelte';

const INITIAL_USERS: ManagedUser[] = [
	{
		id: 'usr-anita-001',
		username: 'anita_s',
		name: 'Anita S.',
		email: 'anita@underground.ai',
		role: 'admin',
		status: 'active',
		workspace_count: 3,
		created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
		last_login_at: new Date().toISOString()
	},
	{
		id: 'usr-marcus-002',
		username: 'marcus_sound',
		name: 'Marcus Vance',
		email: 'marcus.vance@soundstage.fm',
		role: 'curator',
		status: 'active',
		workspace_count: 2,
		created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
		last_login_at: new Date(Date.now() - 3600000).toISOString()
	},
	{
		id: 'usr-elena-003',
		username: 'elena_fest',
		name: 'Elena Rostova',
		email: 'elena.rostova@feststream.live',
		role: 'viewer',
		status: 'pending',
		workspace_count: 1,
		created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
		last_login_at: new Date(Date.now() - 7200000).toISOString()
	},
	{
		id: 'usr-kai-004',
		username: 'kai_audio',
		name: 'Kai Takahashi',
		email: 'kai.t@tokyo-underground.jp',
		role: 'curator',
		status: 'pending',
		workspace_count: 1,
		created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
		last_login_at: new Date(Date.now() - 1800000).toISOString()
	},
	{
		id: 'usr-dave-005',
		username: 'dave_ripper',
		name: 'Dave Morrison',
		email: 'dave.m@bootlegvault.net',
		role: 'viewer',
		status: 'suspended',
		workspace_count: 0,
		created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
		last_login_at: new Date(Date.now() - 10 * 86400000).toISOString()
	}
];

const INITIAL_MODERATION_QUEUE: VideoRecord[] = [
	{
		id: 'mod-post-105',
		source_provider: 'ios_photos',
		source_file_id: 'ph-stream-99411',
		filename: 'jack_johnson_starlight_kc_better_together_backstage.mov',
		storage_key: 'concerts/incoming/jj_kc_better_together.mp4',
		storage_url: 'https://pub-746e0f56527b4112a6bef0fe07dc9f7d.r2.dev/concerts/shorts/avett_brothers_live_acoustic.mp4',
		thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
		file_size: 28400000,
		mime_type: 'video/mp4',
		is_favorited: true,
		status: 'pending_approval',
		visibility: 'public',
		user_id: 'usr-elena-003',
		owner_name: 'Elena Rostova',
		team_id: 'ws-anita-main',
		artist: 'Jack Johnson',
		performer_details: {
			name: 'Jack Johnson (Solo Acoustic)',
			confidence: 0.99,
			genre: 'Acoustic Rock / Folk',
			role: 'Acoustic Guitar & Lead Vocals',
			visualCues: ['Cole Clark Acoustic', 'Kansas City Dressing Room', 'Warm Amber Ambient Lighting']
		},
		venue: 'Starlight Theatre (Greenroom), Kansas City, MO',
		lyrics_synced: [
			{ timestamp: '0:03', seconds: 3, text: "Mmm, it's always better when we're together...", speaker: 'Jack Johnson' },
			{ timestamp: '0:15', seconds: 15, text: "Yeah, we'll look at the stars when we're together.", speaker: 'Jack Johnson' },
			{ timestamp: '0:26', seconds: 26, text: "Well, it's always better when we're together!", speaker: 'Jack Johnson' }
		],
		transcript: "It's always better when we're together. Yeah, we'll look at the stars when we're together, well, it's always better when we're together.",
		visual_tags: ['Backstage Roots', 'Kansas City Soundcheck', 'Acoustic Harmonies', 'Anita Exclusive'],
		lore_links: [
			{
				title: 'Better Together (Song)',
				url: 'https://en.wikipedia.org/wiki/Better_Together_(Jack_Johnson_song)',
				description: 'Opening track of In Between Dreams that topped worldwide acoustic charts.',
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
			summary: 'Intimate backstage acoustic warm-up before the Starlight Theatre headline show in Kansas City.',
			ingest_source: 'iOS Photos Favorites Automation',
			confidence_score: 99.2
		},
		created_at: new Date(Date.now() - 1800000).toISOString(),
		updated_at: new Date(Date.now() - 1800000).toISOString()
	},
	{
		id: 'mod-post-104',
		source_provider: 'dropbox',
		source_file_id: 'dbx-leak-88219',
		filename: 'unverified_distorted_leak_rip_audio.mp4',
		storage_key: 'concerts/incoming/unverified_audio_rip.mp4',
		storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
		thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
		file_size: 14200000,
		mime_type: 'video/mp4',
		is_favorited: false,
		status: 'pending_approval',
		visibility: 'private',
		user_id: 'usr-dave-005',
		owner_name: 'Dave Morrison',
		team_id: 'ws-live-crew',
		artist: 'Unverified Bootleg Stream',
		performer_details: {
			name: 'Unknown Soundboard Rip',
			confidence: 0.42,
			genre: 'Unverified / Distorted',
			role: 'Flagged Ingest',
			visualCues: ['Severe clipping', 'Low lighting', 'Muffled audio']
		},
		venue: 'Unknown Basement / Cellar Rip',
		lyrics_synced: [
			{ timestamp: '0:01', seconds: 1, text: '[Severe Audio Clipping & Heavy Distortion Detected]', speaker: 'Automated Ingest Filter' }
		],
		transcript: '[Severe Audio Clipping & Heavy Distortion Detected - Ingest Flagged for Review]',
		visual_tags: ['Distorted Audio', 'Low Lighting', 'Unverified Source', 'Flagged Audio', 'Rip Flood'],
		lore_links: [],
		metadata: {
			summary: 'High clipping ratio and poor bitrate detected by automated soundstage pre-filter. Recommended for Block / Quarantine.',
			ingest_source: 'Dropbox Curated Media Folder',
			confidence_score: 41.5
		},
		created_at: new Date(Date.now() - 2700000).toISOString(),
		updated_at: new Date(Date.now() - 2700000).toISOString()
	},
	{
		id: 'mod-post-101',
		source_provider: 'ios_photos',
		source_file_id: 'ph-stream-99214',
		filename: '2026-09-radiohead-paranoid-android-live.mov',
		storage_key: 'concerts/incoming/radiohead_live.mp4',
		storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
		file_size: 48200000,
		mime_type: 'video/mp4',
		is_favorited: true,
		status: 'pending_approval',
		visibility: 'public',
		user_id: 'usr-elena-003',
		owner_name: 'Elena Rostova',
		team_id: 'ws-anita-main',
		artist: 'Radiohead',
		performer_details: {
			name: 'Radiohead (Thom Yorke)',
			confidence: 0.99,
			genre: 'Art Rock / Alt Rock',
			role: 'Lead Vocals & Acoustic Guitar',
			visualCues: ['Strobe rain lights', 'Vintage Fender Rhodes', 'Green laser array']
		},
		venue: 'Glastonbury Festival, Pyramid Stage',
		lyrics_synced: [
			{ timestamp: '0:05', seconds: 5, text: 'Please could you stop the noise? I\'m trying to get some rest...', speaker: 'Thom Yorke' },
			{ timestamp: '0:18', seconds: 18, text: 'From all the unborn chicken voices in my head...', speaker: 'Thom Yorke' },
			{ timestamp: '0:31', seconds: 31, text: 'What\'s that? (I may be paranoid, but not an android!)', speaker: 'Thom Yorke & Crowd' }
		],
		transcript: 'Please could you stop the noise? I\'m trying to get some rest from all the unborn chicken voices in my head...',
		visual_tags: ['Pyramid Stage', 'Thom Yorke Guitar', 'Emerald Laser Grid', 'Vintage Tone', 'Crowd Chorus'],
		lore_links: [
			{
				title: 'Paranoid Android - Song Meaning & Production',
				url: 'https://en.wikipedia.org/wiki/Paranoid_Android',
				description: 'Composed of four distinct sections inspired by Bohemian Rhapsody and Happiness Is a Warm Gun.',
				category: 'wikipedia'
			}
		],
		metadata: {
			summary: 'High-definition crowd capture of Radiohead legendary headline set with pristine multi-channel ambient audio.',
			ingest_source: 'iOS Photos Stream Sync',
			confidence_score: 98.4
		},
		created_at: new Date(Date.now() - 3600000).toISOString(),
		updated_at: new Date(Date.now() - 3600000).toISOString()
	},
	{
		id: 'mod-post-102',
		source_provider: 'google_drive',
		source_file_id: 'gdrive-raw-33418',
		filename: 'daft_punk_alive_2007_pyramid_reconstruction.mp4',
		storage_key: 'concerts/incoming/daft_punk_alive.mp4',
		storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
		file_size: 61500000,
		mime_type: 'video/mp4',
		is_favorited: true,
		status: 'pending_approval',
		visibility: 'public',
		user_id: 'usr-kai-004',
		owner_name: 'Kai Takahashi',
		team_id: 'ws-live-crew',
		artist: 'Daft Punk',
		performer_details: {
			name: 'Daft Punk (Guy-Manuel & Thomas Bangalter)',
			confidence: 0.97,
			genre: 'French House / Electronic',
			role: 'Live Electronic Duet',
			visualCues: ['Chrome Helmets', 'LED Pyramid Rig', 'Custom Synth Matrix']
		},
		venue: 'Bercy Arena, Paris (Alive 2007)',
		lyrics_synced: [
			{ timestamp: '0:02', seconds: 2, text: 'Around the world, around the world...', speaker: 'Vocoder' },
			{ timestamp: '0:14', seconds: 14, text: 'Harder, Better, Faster, Stronger!', speaker: 'Vocoder / Sample' },
			{ timestamp: '0:27', seconds: 27, text: 'Work it harder, make it better, do it faster, makes us stronger!', speaker: 'Vocoder' }
		],
		transcript: 'Around the world, around the world... Harder, Better, Faster, Stronger! Work it harder, make it better...',
		visual_tags: ['Illuminated Pyramid', 'Chrome Helmets', 'Analog Synth Rig', 'Crowd Euphoria', 'Red Neon Wash'],
		lore_links: [
			{
				title: 'Alive 2007 Tour - Wikipedia',
				url: 'https://en.wikipedia.org/wiki/Alive_2007',
				description: 'Groundbreaking electronic live tour utilizing custom Ableton and Moog hardware inside an LED pyramid.',
				category: 'tour'
			}
		],
		metadata: {
			summary: 'Clean multi-angle audio sync from the Alive 2007 Paris date with synthesized vocoder cues.',
			ingest_source: 'Google Drive Production Ingestion',
			confidence_score: 97.1
		},
		created_at: new Date(Date.now() - 5400000).toISOString(),
		updated_at: new Date(Date.now() - 5400000).toISOString()
	},
	{
		id: 'mod-post-103',
		source_provider: 'dropbox',
		source_file_id: 'dbx-vault-88120',
		filename: 'arctic_monkeys_505_trnsmt_live.mp4',
		storage_key: 'concerts/incoming/arctic_monkeys_505.mp4',
		storage_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
		file_size: 34900000,
		mime_type: 'video/mp4',
		is_favorited: true,
		status: 'pending_approval',
		visibility: 'public',
		user_id: 'usr-marcus-002',
		owner_name: 'Marcus Vance',
		team_id: 'ws-anita-main',
		artist: 'Arctic Monkeys',
		performer_details: {
			name: 'Arctic Monkeys (Alex Turner)',
			confidence: 0.98,
			genre: 'Indie Rock',
			role: 'Lead Vocals & Electric Organ',
			visualCues: ['Vintage sunglasses', 'Gold microphone', 'Sepia haze lighting']
		},
		venue: 'TRNSMT Festival, Glasgow Green',
		lyrics_synced: [
			{ timestamp: '0:04', seconds: 4, text: 'I\'m going back to 505, if it\'s a 7 hour flight or a 45 minute drive...', speaker: 'Alex Turner' },
			{ timestamp: '0:18', seconds: 18, text: 'In my imagination, you\'re waitin\' lyin\' on your side...', speaker: 'Alex Turner' },
			{ timestamp: '0:32', seconds: 32, text: 'With your hands around your neck, between your teeth!', speaker: 'Alex Turner & 50,000 Fans' }
		],
		transcript: 'I\'m going back to 505, if it\'s a 7 hour flight or a 45 minute drive... In my imagination, you\'re waitin\' lyin\' on your side...',
		visual_tags: ['Alex Turner Vox', 'Retro Organ Intro', 'Festival Sunset', 'Warm Stage Glow', 'Epic Drop'],
		lore_links: [
			{
				title: '505 (Song) - Background',
				url: 'https://en.wikipedia.org/wiki/Favourite_Worst_Nightmare',
				description: 'Features guest organ playing by Miles Kane and samples Ennio Morricone.',
				category: 'album'
			}
		],
		metadata: {
			summary: 'Cinematic festival closing performance with explosive guitar explosion at the 505 crescendo.',
			ingest_source: 'Dropbox Curated Media Folder',
			confidence_score: 96.8
		},
		created_at: new Date(Date.now() - 7200000).toISOString(),
		updated_at: new Date(Date.now() - 7200000).toISOString()
	}
];

class AdminStore {
	isOpen = $state<boolean>(false);
	activeTab = $state<'queue' | 'users' | 'audit'>('queue');
	managedUsers = $state<ManagedUser[]>(INITIAL_USERS);
	moderationQueue = $state<VideoRecord[]>(INITIAL_MODERATION_QUEUE);
	publishedPosts = $state<VideoRecord[]>([]);
	quarantinedPosts = $state<VideoRecord[]>([]);
	auditLogs = $state<ModerationAuditLog[]>([
		{
			id: 'audit-1',
			action: 'user_approved',
			target_id: 'usr-marcus-002',
			target_title: 'Marcus Vance (@marcus_sound)',
			admin_id: 'usr-anita-001',
			admin_name: 'Anita S.',
			timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
			details: 'Granted Curator ingest privileges'
		},
		{
			id: 'audit-2',
			action: 'user_suspended',
			target_id: 'usr-dave-005',
			target_title: 'Dave Morrison (@dave_ripper)',
			admin_id: 'usr-anita-001',
			admin_name: 'Anita S.',
			timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
			details: 'Suspended for unauthorized rip flood'
		}
	]);

	actionNotification = $state<{ message: string; type: 'success' | 'danger' | 'info' } | null>(null);

	// Derived counts
	get pendingReviewsCount(): number {
		return this.moderationQueue.length;
	}

	get pendingUsersCount(): number {
		return this.managedUsers.filter((u) => u.status === 'pending').length;
	}

	get totalPendingCount(): number {
		return this.pendingReviewsCount + this.pendingUsersCount;
	}

	get isAdmin(): boolean {
		return authState.activeRole === 'admin';
	}

	showNotification(message: string, type: 'success' | 'danger' | 'info' = 'success') {
		this.actionNotification = { message, type };
		setTimeout(() => {
			if (this.actionNotification?.message === message) {
				this.actionNotification = null;
			}
		}, 3500);
	}

	openPanel(tab: 'queue' | 'users' | 'audit' = 'queue') {
		this.activeTab = tab;
		this.isOpen = true;
	}

	closePanel() {
		this.isOpen = false;
	}

	togglePanel() {
		this.isOpen = !this.isOpen;
	}

	// User Moderation Actions
	async approveUser(userId: string) {
		const user = this.managedUsers.find((u) => u.id === userId);
		if (!user) return;

		// Immediate optimistic state update
		user.status = 'active';

		const audit: ModerationAuditLog = {
			id: 'audit-' + Math.random().toString(36).substring(2, 9),
			action: 'user_approved',
			target_id: userId,
			target_title: `${user.name} (@${user.username})`,
			admin_id: authState.user?.id || 'usr-anita-001',
			admin_name: authState.user?.name || 'Anita S.',
			timestamp: new Date().toISOString(),
			details: 'Account approved with Active status'
		};
		this.auditLogs.unshift(audit);
		this.showNotification(`User @${user.username} approved successfully!`, 'success');

		try {
			await fetch(`/api/v1/admin/users/${userId}/approve`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, adminId: authState.user?.id })
			});
		} catch (e) {
			console.warn('API sync warning:', e);
		}
	}

	async suspendUser(userId: string) {
		const user = this.managedUsers.find((u) => u.id === userId);
		if (!user) return;

		user.status = 'suspended';

		const audit: ModerationAuditLog = {
			id: 'audit-' + Math.random().toString(36).substring(2, 9),
			action: 'user_suspended',
			target_id: userId,
			target_title: `${user.name} (@${user.username})`,
			admin_id: authState.user?.id || 'usr-anita-001',
			admin_name: authState.user?.name || 'Anita S.',
			timestamp: new Date().toISOString(),
			details: 'Account suspended by administrator'
		};
		this.auditLogs.unshift(audit);
		this.showNotification(`User @${user.username} has been suspended.`, 'danger');

		try {
			await fetch(`/api/v1/admin/users/${userId}/suspend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, adminId: authState.user?.id })
			});
		} catch (e) {
			console.warn('API sync warning:', e);
		}
	}

	async promoteUserToAdmin(userId: string) {
		const user = this.managedUsers.find((u) => u.id === userId);
		if (!user) return;

		user.role = 'admin';
		user.status = 'active';

		const audit: ModerationAuditLog = {
			id: 'audit-' + Math.random().toString(36).substring(2, 9),
			action: 'user_promoted',
			target_id: userId,
			target_title: `${user.name} (@${user.username})`,
			admin_id: authState.user?.id || 'usr-anita-001',
			admin_name: authState.user?.name || 'Anita S.',
			timestamp: new Date().toISOString(),
			details: 'Promoted to Administrator role'
		};
		this.auditLogs.unshift(audit);
		this.showNotification(`User @${user.username} promoted to Admin.`, 'success');
	}

	updateUserRole(userId: string, role: UserRole) {
		const user = this.managedUsers.find((u) => u.id === userId);
		if (!user) return;
		user.role = role;
		this.showNotification(`Updated @${user.username} role to ${role.toUpperCase()}.`, 'info');
	}

	// Post Moderation Actions
	async approvePost(postId: string) {
		const idx = this.moderationQueue.findIndex((p) => p.id === postId);
		if (idx === -1) return;

		const [post] = this.moderationQueue.splice(idx, 1);
		post.status = 'ready';
		this.publishedPosts.unshift(post);

		const audit: ModerationAuditLog = {
			id: 'audit-' + Math.random().toString(36).substring(2, 9),
			action: 'post_approved',
			target_id: postId,
			target_title: `${post.artist || 'Concert Video'} - ${post.venue || post.filename}`,
			admin_id: authState.user?.id || 'usr-anita-001',
			admin_name: authState.user?.name || 'Anita S.',
			timestamp: new Date().toISOString(),
			details: 'Approved for public gallery presentation'
		};
		this.auditLogs.unshift(audit);
		this.showNotification(`Approved & published "${post.artist || 'Stream'}"!`, 'success');

		// Emit real-time reactive event for live gallery
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('underground:post-approved', { detail: post }));
		}

		try {
			await fetch(`/api/v1/admin/posts/${postId}/approve`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ postId, adminId: authState.user?.id })
			});
		} catch (e) {
			console.warn('API sync warning:', e);
		}
	}

	async rejectPost(postId: string, reason = 'Quarantined by moderator') {
		const idx = this.moderationQueue.findIndex((p) => p.id === postId);
		let targetPost: VideoRecord | undefined;
		if (idx !== -1) {
			const [post] = this.moderationQueue.splice(idx, 1);
			post.status = 'quarantined';
			post.error_message = reason;
			this.quarantinedPosts.unshift(post);
			targetPost = post;
		}

		const audit: ModerationAuditLog = {
			id: 'audit-' + Math.random().toString(36).substring(2, 9),
			action: 'post_rejected',
			target_id: postId,
			target_title: targetPost ? `${targetPost.artist || 'Concert Video'} - ${targetPost.venue || targetPost.filename}` : `Tape ${postId}`,
			admin_id: authState.user?.id || 'usr-anita-001',
			admin_name: authState.user?.name || 'Anita S.',
			timestamp: new Date().toISOString(),
			details: reason
		};
		this.auditLogs.unshift(audit);
		this.showNotification(`Blocked & quarantined "${targetPost?.artist || 'Stream'}"`, 'danger');

		// Emit real-time reactive event for live gallery
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('underground:post-blocked', { detail: { postId, reason } }));
		}

		try {
			await fetch(`/api/v1/admin/posts/${postId}/reject`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ postId, reason, adminId: authState.user?.id })
			});
		} catch (e) {
			console.warn('API sync warning:', e);
		}
	}

	async blockPost(video: VideoRecord, reason = 'Flagged & quarantined by Administrator') {
		// If it's in the moderation queue, reject it from there
		const idx = this.moderationQueue.findIndex((p) => p.id === video.id);
		if (idx !== -1) {
			return this.rejectPost(video.id, reason);
		}

		// Otherwise block from active gallery
		video.status = 'quarantined';
		video.error_message = reason;
		this.quarantinedPosts.unshift(video);

		const audit: ModerationAuditLog = {
			id: 'audit-' + Math.random().toString(36).substring(2, 9),
			action: 'post_rejected',
			target_id: video.id,
			target_title: `${video.artist || 'Concert Video'} - ${video.venue || video.filename}`,
			admin_id: authState.user?.id || 'usr-anita-001',
			admin_name: authState.user?.name || 'Anita S.',
			timestamp: new Date().toISOString(),
			details: reason
		};
		this.auditLogs.unshift(audit);
		this.showNotification(`Blocked "${video.artist || 'Tape'}" from feed.`, 'danger');

		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('underground:post-blocked', { detail: { postId: video.id, reason } }));
		}

		try {
			await fetch(`/api/v1/admin/posts/${video.id}/reject`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ postId: video.id, reason, adminId: authState.user?.id })
			});
		} catch (e) {
			console.warn('API sync warning:', e);
		}
	}
}

export const adminStore = new AdminStore();
