import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Endpoint = process.env.S3_ENDPOINT || '';
const s3Region = process.env.S3_REGION || 'auto';
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || '';
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'concert-videos';
export const S3_PUBLIC_DOMAIN = process.env.S3_PUBLIC_DOMAIN || '';

/**
 * Initializes S3 client configured for Cloudflare R2 or AWS S3
 */
export function getS3Client(): S3Client {
	return new S3Client({
		region: s3Region,
		endpoint: s3Endpoint || undefined,
		credentials: {
			accessKeyId: s3AccessKeyId,
			secretAccessKey: s3SecretAccessKey
		},
		forcePathStyle: !s3Endpoint.includes('r2.cloudflarestorage.com') // true for local minio / path-style, false for R2
	});
}

/**
 * Generates a presigned PUT URL for direct-from-client S3/R2 upload
 */
export async function createPresignedUploadUrl(
	storageKey: string,
	contentType: string,
	expiresInSeconds = 3600
): Promise<string> {
	const s3 = getS3Client();
	const command = new PutObjectCommand({
		Bucket: S3_BUCKET_NAME,
		Key: storageKey,
		ContentType: contentType
	});

	return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/**
 * Generates the public accessible URL for a video in S3/R2
 */
export function getPublicStorageUrl(storageKey: string): string {
	if (S3_PUBLIC_DOMAIN) {
		const base = S3_PUBLIC_DOMAIN.endsWith('/') ? S3_PUBLIC_DOMAIN.slice(0, -1) : S3_PUBLIC_DOMAIN;
		return `${base}/${encodeURIComponent(storageKey)}`;
	}
	if (s3Endpoint) {
		return `${s3Endpoint}/${S3_BUCKET_NAME}/${encodeURIComponent(storageKey)}`;
	}
	return `https://${S3_BUCKET_NAME}.s3.${s3Region}.amazonaws.com/${encodeURIComponent(storageKey)}`;
}

/**
 * Generates a signed GET URL for private buckets
 */
export async function createPresignedDownloadUrl(
	storageKey: string,
	expiresInSeconds = 86400
): Promise<string> {
	const s3 = getS3Client();
	const command = new GetObjectCommand({
		Bucket: S3_BUCKET_NAME,
		Key: storageKey
	});

	return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
