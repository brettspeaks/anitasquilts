export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface VideoRecord {
	id: string;
	device_session_token: string;
	filename: string;
	storage_key: string;
	storage_url: string;
	file_size?: number | null;
	mime_type?: string | null;
	status: VideoStatus;
	error_message?: string | null;
	artist?: string | null;
	venue?: string | null;
	transcript?: string | null;
	visual_tags: string[];
	metadata?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	// Local optimistic UI properties
	localPreviewUrl?: string;
	uploadProgress?: number;
	isOptimistic?: boolean;
}

export interface PresignUploadRequest {
	filename: string;
	fileType: string;
	fileSize: number;
	deviceSessionToken: string;
}

export interface PresignUploadResponse {
	videoId: string;
	storageKey: string;
	uploadUrl: string;
	publicUrl: string;
}

export interface GeminiAnalysisResult {
	artist: string | null;
	venue: string | null;
	transcript: string | null;
	visual_tags: string[];
	summary: string | null;
	confidence?: number;
}
