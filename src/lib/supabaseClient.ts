import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';

// Read public environment variables safely (supporting new Supabase Publishable Key with legacy Anon Key fallback)
function getSupabaseUrl(): string {
	return (
		publicEnv.PUBLIC_SUPABASE_URL ||
		(typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_URL) ||
		(typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_URL) ||
		'https://cljntfpowxqehfdmxguf.supabase.co'
	);
}

function getSupabasePublishableKey(): string {
	return (
		publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
		(typeof process !== 'undefined' && (process.env?.PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env?.PUBLIC_SUPABASE_ANON_KEY)) ||
		(typeof import.meta !== 'undefined' && (import.meta.env?.PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.PUBLIC_SUPABASE_ANON_KEY)) ||
		'sb_publishable_c82cRjU-AglEUe9GhSMYBg_1iCoJeDt'
	);
}

export const supabase: SupabaseClient = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
	auth: {
		persistSession: false,
		autoRefreshToken: false
	}
});
