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
	<title>AnitaDoesQuiltsAI • Instant Quilt Video & AI Tagging</title>
</svelte:head>

<div class="flex-1 flex flex-col">
	<!-- Hero Section with Ultra-Clean Master Upload UI & Stitched SVG Underlay -->
	<section class="relative pt-8 pb-4 px-4 overflow-hidden text-center">
		<!-- Decorative Quilt Stitch Underlay (Lower Left to Upper Right with Loop) -->
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden -z-0">
			<svg
				class="w-full h-full max-w-5xl opacity-40 sm:opacity-50"
				viewBox="0 0 1000 400"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				preserveAspectRatio="xMidYMid meet"
			>
				<!-- Quilt stitch line path with smooth loop -->
				<path
					d="M -20 380 C 180 340, 260 300, 380 260 C 500 220, 620 180, 720 110 C 780 70, 830 25, 870 50 C 905 75, 875 145, 815 130 C 765 118, 775 60, 825 35 C 875 10, 940 30, 1020 5"
					stroke="#94a3b8"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-dasharray="8 7"
				/>
				<!-- Tiny decorative stitch needle/knot point at loop -->
				<circle cx="820" cy="38" r="2.5" fill="#cbd5e1" opacity="0.6" />
			</svg>
		</div>

		<div class="max-w-2xl mx-auto relative z-10">
			<h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-pink-100 to-indigo-200 tracking-tight drop-shadow-sm">
				Showcase Your Quilt.
			</h2>
			<p class="mt-2 text-sm sm:text-base text-slate-300 font-normal max-w-lg mx-auto">
				Direct S3/R2 streaming. Screen sleep locked. Automated Gemini 1.5 Flash multimodal quilt & pattern tagging.
			</p>
		</div>

		<!-- Single Master Upload UI Component -->
		<div class="relative z-10">
			<UploadButton
				onUploadStart={handleUploadStart}
				onUploadProgress={handleUploadProgress}
				onUploadComplete={handleUploadComplete}
				onUploadError={handleUploadError}
			/>
		</div>
	</section>

	<!-- Modern Video Gallery -->
	<VideoGallery
		bind:videos={videos}
		{selectedTag}
		onTagSelect={(tag) => (selectedTag = tag)}
	/>
</div>
