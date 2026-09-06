import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

// Read public environment variables safely (supporting new Supabase Publishable Key with legacy Anon Key fallback)
function getSupabaseUrl(): string {
	return (
		publicEnv.PUBLIC_SUPABASE_URL ||
		(typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_URL) ||
		(typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_URL) ||
		'https://placeholder-project.supabase.co'
	);
}

function getSupabasePublishableKey(): string {
	return (
		publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
		(typeof process !== 'undefined' && (process.env?.PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env?.PUBLIC_SUPABASE_ANON_KEY)) ||
		(typeof import.meta !== 'undefined' && (import.meta.env?.PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.PUBLIC_SUPABASE_ANON_KEY)) ||
		'sb_publishable_placeholder'
	);
}

export const supabase: SupabaseClient = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
	auth: {
		persistSession: false,
		autoRefreshToken: false
	}
});

/**
 * Creates an admin / server-side Supabase client with secret key privileges
 */
export function createServerSupabaseClient(secretKey?: string): SupabaseClient {
	const url = getSupabaseUrl();
	const key =
		secretKey ||
		privateEnv.SUPABASE_SECRET_KEY ||
		privateEnv.SUPABASE_SERVICE_ROLE_KEY ||
		(typeof process !== 'undefined' && (process.env?.SUPABASE_SECRET_KEY || process.env?.SUPABASE_SERVICE_ROLE_KEY)) ||
		(typeof import.meta !== 'undefined' && ((import.meta.env as any)?.SUPABASE_SECRET_KEY || (import.meta.env as any)?.SUPABASE_SERVICE_ROLE_KEY)) ||
		getSupabasePublishableKey();

	return createClient(url, key, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
