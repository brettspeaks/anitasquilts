<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import VideoGallery from '$lib/components/VideoGallery.svelte';
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

	onMount(() => {
		function onPostApproved(e: Event) {
			const custom = e as CustomEvent<VideoRecord>;
			const post = custom.detail;
			if (post && !videos.some((v) => v.id === post.id)) {
				videos = [post, ...videos];
			}
		}

		function onPostBlocked(e: Event) {
			const custom = e as CustomEvent<{ postId: string; reason: string }>;
			const { postId } = custom.detail || {};
			if (postId) {
				videos = videos.filter((v) => v.id !== postId);
			}
		}

		window.addEventListener('underground:post-approved', onPostApproved);
		window.addEventListener('underground:post-blocked', onPostBlocked);

		return () => {
			window.removeEventListener('underground:post-approved', onPostApproved);
			window.removeEventListener('underground:post-blocked', onPostBlocked);
		};
	});
</script>

<svelte:head>
	<title>Anita's Underground • Concert Tape Vault</title>
</svelte:head>

<div class="flex-1 flex flex-col">
	<!-- Bare, Lightweight Hero with Warm Underground Soundstage Aesthetic -->
	<section class="relative w-full pt-8 pb-6 sm:pt-10 sm:pb-8 px-4 bg-[#16181d] border-b border-zinc-800">
		<div class="max-w-4xl mx-auto flex flex-col items-center text-center">
			<!-- Live Status Tag -->
			<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-amber-550/40 shadow-sm mb-4 text-sm font-medium">
				<span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
				<span class="text-zinc-200 tracking-wide">UNDERGROUND SOUNDSTAGE</span>
				<span class="text-zinc-600">|</span>
				<span class="text-amber-400 font-semibold">LIVE TAPES</span>
			</div>

			<!-- Main Headline - Warm, Large, Human -->
			<h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-3">
				The <span class="text-amber-400">Underground</span>
			</h1>
			<p class="text-base sm:text-lg text-zinc-300 max-w-2xl font-normal leading-relaxed">
				Anita's concert tape vault — live roots sessions, backstage cuts, and festival archives.
			</p>
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
