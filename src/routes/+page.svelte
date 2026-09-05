<script lang="ts">
	import UploadButton from '$lib/components/UploadButton.svelte';
	import VideoGallery from '$lib/components/VideoGallery.svelte';
	import type { PageData } from './$types';
	import type { VideoRecord } from '$lib/types';

	let { data }: { data: PageData } = $props();

	let videos = $state<VideoRecord[]>([]);
	let selectedTag = $state<string | null>(null);

	$effect(() => {
		if (data?.initialVideos && videos.length === 0) {
			videos = [...data.initialVideos];
		}
	});

	function handleUploadStart(optimisticVideo: VideoRecord) {
		// Immediately prepend optimistic placeholder card
		videos = [optimisticVideo, ...videos];
	}

	function handleUploadProgress(videoId: string, progress: number) {
		const idx = videos.findIndex((v) => v.id === videoId);
		if (idx !== -1) {
			videos[idx].uploadProgress = progress;
		}
	}

	function handleUploadComplete(videoId: string, readyVideo?: VideoRecord) {
		const idx = videos.findIndex((v) => v.id === videoId);
		if (idx !== -1) {
			if (readyVideo) {
				videos[idx] = {
					...videos[idx],
					...readyVideo,
					isOptimistic: false,
					status: readyVideo.status || 'ready'
				};
			} else {
				videos[idx].status = 'processing';
			}
		}
	}

	function handleUploadError(videoId: string, error: string) {
		const idx = videos.findIndex((v) => v.id === videoId);
		if (idx !== -1) {
			videos[idx].status = 'failed';
			videos[idx].error_message = error;
		}
	}
</script>

<svelte:head>
	<title>ConcertAI • Instant Video Ingest & AI Tagging</title>
</svelte:head>

<div class="flex-1 flex flex-col">
	<!-- Hero Section with Ultra-Clean Master Upload UI -->
	<section class="relative pt-8 pb-4 px-4 overflow-hidden text-center">
		<div class="max-w-2xl mx-auto">
			<h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
				Drop a Concert Video.
			</h2>
			<p class="mt-2 text-sm sm:text-base text-slate-400 font-normal max-w-lg mx-auto">
				Direct S3/R2 presigned streaming. Screen sleep locked. Automated Gemini 1.5 Flash multimodal tagging.
			</p>
		</div>

		<!-- Single Master Upload UI Component -->
		<UploadButton
			onUploadStart={handleUploadStart}
			onUploadProgress={handleUploadProgress}
			onUploadComplete={handleUploadComplete}
			onUploadError={handleUploadError}
		/>
	</section>

	<!-- Modern Video Gallery -->
	<VideoGallery
		bind:videos={videos}
		{selectedTag}
		onTagSelect={(tag) => (selectedTag = tag)}
	/>
</div>
