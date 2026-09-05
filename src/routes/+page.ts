import type { PageLoad } from './$types';
import type { VideoRecord } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const res = await fetch('/api/videos');
		if (res.ok) {
			const data = await res.json();
			return {
				initialVideos: (data.videos as VideoRecord[]) || []
			};
		}
	} catch (e) {
		console.warn('Initial load fetch error:', e);
	}

	return {
		initialVideos: [] as VideoRecord[]
	};
};
