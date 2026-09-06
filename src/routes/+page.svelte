<script lang="ts">
	import VideoGallery from '$lib/components/VideoGallery.svelte';
	import HeroStitchingGraphic from '$lib/components/HeroStitchingGraphic.svelte';
	import type { PageData } from './$types';
	import type { VideoRecord, SourceProvider } from '$lib/types';

	let { data }: { data: PageData } = $props();

	let videos = $state<VideoRecord[]>([]);
	let selectedTag = $state<string | null>(null);
	let selectedProvider = $state<SourceProvider | 'all'>('all');

	$effect(() => {
		if (data?.initialVideos && videos.length === 0) {
			videos = [...data.initialVideos];
		}
	});

	async function refreshFeed() {
		try {
			const res = await fetch('/api/videos');
			if (res.ok) {
				const result = await res.json();
				if (result.videos && Array.isArray(result.videos)) {
					videos = result.videos;
				}
			}
		} catch (e) {
			console.warn('Feed refresh error:', e);
		}
	}
</script>

<svelte:head>
	<title>Anita's Underground • Live Intelligence</title>
</svelte:head>

<div class="flex-1 flex flex-col">
	<!-- Hero Section: Cloudflare R2 Style Moving Stitching Intelligence Hero -->
	<section class="relative w-full pt-8 pb-10 sm:pt-10 sm:pb-12 px-4 bg-[#07080c] border-b border-zinc-900/80 overflow-hidden select-none">
		<div class="max-w-6xl mx-auto flex flex-col items-center">
			<!-- Passive Stream Archive / Gemini 1.5 Flash Pill -->
			<div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-sm mb-3.5 text-xs font-mono">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
				<span class="text-zinc-300 tracking-wider">PASSIVE STREAM ARCHIVE</span>
				<span class="text-zinc-600">/</span>
				<span class="text-emerald-400 font-medium tracking-wider">GEMINI 1.5 FLASH</span>
			</div>

			<!-- Main Headline -->
			<h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight font-sans text-center mb-2 sm:mb-3">
				Live Intelligence.
			</h1>
			<p class="text-sm sm:text-base text-zinc-400 max-w-xl text-center mb-6 sm:mb-8 font-normal">
				Zero-friction cloud media stream stitched directly into Cloudflare R2 with Gemini 1.5 multi-angle concert intelligence.
			</p>

			<!-- Moving Stitching Hero Graphic (Cloudflare R2 Style) -->
			<HeroStitchingGraphic class="w-full" />
		</div>
	</section>

	<!-- Read-Only Presentation Gallery with Realtime Sync -->
	<VideoGallery
		bind:videos={videos}
		{selectedTag}
		{selectedProvider}
		onTagSelect={(tag) => (selectedTag = tag)}
		onProviderSelect={(prov) => (selectedProvider = prov)}
	/>
</div>
