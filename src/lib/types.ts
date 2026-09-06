export type SourceProvider =
	| 'ios_photos'
	| 'google_photos'
	| 'google_drive'
	| 'dropbox'
	| 'onedrive'
	| 's3_bucket'
	| 'r2_bucket'
	| 'webhook';

export type VideoStatus =
	| 'pending_sync'
	| 'pending_approval'
	| 'ingesting'
	| 'processing'
	| 'ready'
	| 'filtered_out'
	| 'failed'
	| 'quarantined';

export type UserRole = 'viewer' | 'curator' | 'admin';

export type UserAccountStatus = 'active' | 'pending' | 'suspended';

export interface ManagedUser {
	id: string;
	username: string;
	email: string;
	name: string;
	role: UserRole;
	status: UserAccountStatus;
	avatar_url?: string;
	workspace_count?: number;
	created_at: string;
	last_login_at?: string;
}

export type ModerationAuditAction =
	| 'user_approved'
	| 'user_suspended'
	| 'user_promoted'
	| 'post_approved'
	| 'post_rejected';

export interface ModerationAuditLog {
	id: string;
	action: ModerationAuditAction;
	target_id: string;
	target_title: string;
	admin_id: string;
	admin_name: string;
	timestamp: string;
	details?: string;
}

export type MediaVisibility = 'private' | 'team' | 'public';

export type SharePermission = 'view' | 'annotate';

export interface UserProfile {
	id: string;
	email: string;
	name: string;
	avatar_url?: string;
	role: UserRole;
	active_workspace_id: string;
}

export interface Workspace {
	id: string;
	name: string;
	slug: string;
	role: UserRole;
	member_count: number;
}

export interface MediaShare {
	id: string;
	video_id: string;
	shared_with_email?: string;
	shared_with_user_id?: string;
	permission: SharePermission;
	share_token?: string;
	expires_at?: string | null;
	password_protected?: boolean;
	created_at: string;
}

export interface SyncedLyricLine {
	timestamp: string; // e.g. "0:14" or "01:23"
	seconds?: number;
	text: string;
	speaker?: string;
}

export interface LoreLink {
	title: string;
	url: string;
	description: string;
	category?: 'wikipedia' | 'setlist' | 'album' | 'tour' | 'general';
}

export interface PerformerDetails {
	name: string;
	confidence?: number;
	genre?: string;
	role?: string;
	visualCues?: string[];
}

export interface VideoRecord {
	id: string;
	source_provider?: SourceProvider;
	source_file_id?: string | null;
	filename: string;
	storage_key: string;
	storage_url: string;
	file_size?: number | null;
	mime_type?: string | null;
	is_favorited?: boolean;
	status: VideoStatus;
	error_message?: string | null;

	// Ownership, Visibility & Sharing
	user_id?: string | null;
	team_id?: string | null;
	owner_name?: string;
	visibility: MediaVisibility;
	share_token?: string | null;
	shares?: MediaShare[];
	expires_at?: string | null;
	password_protected?: boolean;

	// Enhanced AI Extracted Intelligence
	artist?: string | null;
	performer_details?: PerformerDetails | null;
	venue?: string | null;
	lyrics_synced?: SyncedLyricLine[] | null;
	transcript?: string | null;
	visual_tags: string[];
	lore_links?: LoreLink[] | null;
	metadata?: Record<string, unknown>;

	created_at: string;
	updated_at: string;
}

export interface GeminiAnalysisResult {
	artist: string | null;
	performer_details: PerformerDetails | null;
	venue: string | null;
	lyrics_synced: SyncedLyricLine[];
	transcript: string | null;
	visual_tags: string[];
	lore_links: LoreLink[];
	summary: string | null;
}

export interface IngestWebhookPayload {
	sourceProvider: SourceProvider;
	storageKey?: string;
	storageUrl?: string;
	filename?: string;
	fileSize?: number;
	mimeType?: string;
	isFavorited?: boolean;
	tags?: string[];
	metadata?: Record<string, unknown>;
}

export interface IngestSyncResponse {
	success: boolean;
	scannedCount: number;
	ingestedCount: number;
	filteredOutCount: number;
	items: Partial<VideoRecord>[];
}
