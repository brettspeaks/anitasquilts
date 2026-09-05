import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read public environment variables safely
const supabaseUrl =
	(typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_URL) ||
	(typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_URL) ||
	'https://placeholder-project.supabase.co';

const supabaseAnonKey =
	(typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_ANON_KEY) ||
	(typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_ANON_KEY) ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false
	}
});

/**
 * Creates an admin/service-role Supabase client for secure backend execution
 */
export function createServerSupabaseClient(serviceRoleKey?: string): SupabaseClient {
	const key =
		serviceRoleKey ||
		(typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
		(typeof import.meta !== 'undefined' && (import.meta.env as any)?.SUPABASE_SERVICE_ROLE_KEY) ||
		supabaseAnonKey;

	return createClient(supabaseUrl, key, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
