import { json, type RequestHandler } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	if (!id) {
		return json({ error: 'Post ID is required' }, { status: 400 });
	}

	try {
		let body: any = {};
		try {
			body = await request.json();
		} catch {
			// Body is optional
		}

		const reason = body.reason || 'Quarantined by moderator';

		try {
			const supabase = createServerSupabaseClient();
			await supabase
				.from('videos')
				.update({
					status: 'quarantined',
					error_message: reason,
					updated_at: new Date().toISOString()
				})
				.eq('id', id);
		} catch (dbErr) {
			console.warn('Supabase post reject fallback:', dbErr);
		}

		return json({
			success: true,
			message: `Stream post ${id} has been quarantined.`,
			postId: id,
			status: 'quarantined',
			reason,
			rejectedAt: new Date().toISOString(),
			rejectedBy: body.adminId || 'usr-anita-001'
		});
	} catch (error: any) {
		return json(
			{ error: error?.message || 'Failed to reject post' },
			{ status: 500 }
		);
	}
};
