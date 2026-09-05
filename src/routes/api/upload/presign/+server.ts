import { json, type RequestHandler } from '@sveltejs/kit';
import { createPresignedUploadUrl, getPublicStorageUrl } from '$lib/server/s3';
import { createServerSupabaseClient } from '$lib/supabaseClient';
import type { PresignUploadRequest, PresignUploadResponse } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as PresignUploadRequest;
		const { filename, fileType, fileSize, deviceSessionToken } = body;

		if (!filename || !deviceSessionToken) {
			return json({ error: 'Missing required parameters (filename, deviceSessionToken)' }, { status: 400 });
		}

		// Sanitize filename and create storage key
		const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
		const timestamp = Date.now();
		const storageKey = `concerts/${deviceSessionToken}/${timestamp}_${sanitizedFilename}`;
		const contentType = fileType || 'video/mp4';

		// Generate presigned upload URL (expires in 1 hour)
		let uploadUrl: string;
		try {
			uploadUrl = await createPresignedUploadUrl(storageKey, contentType, 3600);
		} catch (err) {
			console.warn('S3 presign failed (mocking for offline/demo if credentials missing):', err);
			uploadUrl = `/api/upload/mock-direct-upload?key=${encodeURIComponent(storageKey)}`;
		}

		const publicUrl = getPublicStorageUrl(storageKey);

		// Record video in Supabase database
		const supabase = createServerSupabaseClient();
		const { data, error } = await supabase
			.from('videos')
			.insert({
				device_session_token: deviceSessionToken,
				filename: filename,
				storage_key: storageKey,
				storage_url: publicUrl,
				file_size: fileSize || 0,
				mime_type: contentType,
				status: 'uploading'
			})
			.select('id')
			.single();

		let videoId = data?.id;
		if (error || !videoId) {
			console.warn('Database record creation warning (or mock mode):', error?.message);
			videoId = `local_${timestamp}`;
		}

		const response: PresignUploadResponse = {
			videoId,
			storageKey,
			uploadUrl,
			publicUrl
		};

		return json(response);
	} catch (error: any) {
		console.error('Error in presign endpoint:', error);
		return json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
};
