import { json, type RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async ({ request, url }) => {
	// Consumes stream and succeeds (for local development/demo)
	const key = url.searchParams.get('key');
	const blob = await request.blob();

	return new Response(null, {
		status: 200,
		headers: {
			'ETag': '"mock-etag-success"',
			'Access-Control-Allow-Origin': '*'
		}
	});
};
