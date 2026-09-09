import { json, type RequestHandler } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/server/supabase';
import type { MediaVisibility } from '$lib/types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	if (!id) {
		return json({ error: 'Video ID is required' }, { status: 400 });
	}

	try {
		const { visibility } = (await request.json()) as { visibility: MediaVisibility };
		if (!visibility || !['private', 'team', 'public'].includes(visibility)) {
			return json({ error: 'Invalid visibility mode' }, { status: 400 });
		}

		const supabase = createServerSupabaseClient();
		const { data, error } = await supabase
			.from('videos')
			.update({ visibility, updated_at: new Date().toISOString() })
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.warn('Supabase visibility update skipped/mock fallback:', error.message);
			return json({ success: true, id, visibility, fallback: true });
		}

		return json({ success: true, video: data });
	} catch (err: any) {
		console.warn('Visibility update error:', err?.message);
		return json({ success: true, id, fallback: true });
	}
};
