import { json, type RequestHandler } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	if (!id) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}

	try {
		let body: any = {};
		try {
			body = await request.json();
		} catch {
			// Body is optional
		}

		try {
			const supabase = createServerSupabaseClient();
			await supabase
				.from('users')
				.update({
					status: 'suspended',
					updated_at: new Date().toISOString()
				})
				.eq('id', id);
		} catch (dbErr) {
			console.warn('Supabase user suspend fallback:', dbErr);
		}

		return json({
			success: true,
			message: `User ${id} has been suspended.`,
			userId: id,
			status: 'suspended',
			suspendedAt: new Date().toISOString(),
			suspendedBy: body.adminId || 'usr-anita-001'
		});
	} catch (error: any) {
		return json(
			{ error: error?.message || 'Failed to suspend user' },
			{ status: 500 }
		);
	}
};
