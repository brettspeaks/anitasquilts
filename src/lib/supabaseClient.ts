import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read public environment variables safely (supporting new Supabase Publishable Key with legacy Anon Key fallback)
const supabaseUrl =
	(typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_URL) ||
	(typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_URL) ||
	'https://placeholder-project.supabase.co';

const supabasePublishableKey =
	(typeof process !== 'undefined' && (process.env?.PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env?.PUBLIC_SUPABASE_ANON_KEY)) ||
	(typeof import.meta !== 'undefined' && (import.meta.env?.PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.PUBLIC_SUPABASE_ANON_KEY)) ||
	'sb_pub_placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false
	}
});

/**
 * Creates an admin / server-side Supabase client with secret key privileges
 */
export function createServerSupabaseClient(secretKey?: string): SupabaseClient {
	const key =
		secretKey ||
		(typeof process !== 'undefined' && (process.env?.SUPABASE_SECRET_KEY || process.env?.SUPABASE_SERVICE_ROLE_KEY)) ||
		(typeof import.meta !== 'undefined' && ((import.meta.env as any)?.SUPABASE_SECRET_KEY || (import.meta.env as any)?.SUPABASE_SERVICE_ROLE_KEY)) ||
		supabasePublishableKey;

	return createClient(supabaseUrl, key, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
