<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import VideoCard from './VideoCard.svelte';
	import { supabase } from '$lib/supabaseClient';
	import type { VideoRecord } from '$lib/types';

	interface Props {
		videos: VideoRecord[];
		selectedTag: string | null;
		onTagSelect: (tag: string | null) => void;
	}

	let { videos = $bindable([]), selectedTag, onTagSelect }: Props = $props();

	let searchQuery = $state('');
	let realtimeChannel: any = null;
	let pollInterval: any = null;

	// Extract unique visual tags from all loaded videos
	const allTags = $derived.by(() => {
		const tagSet = new Set<string>();
		for (const v of videos) {
			if (v.visual_tags && Array.isArray(v.visual_tags)) {
				for (const t of v.visual_tags) {
					if (t && t !== 'Uploading...' && !t.startsWith('Analyzing')) {
						tagSet.add(t);
					}
				}
			}
		}
		return Array.from(tagSet);
	});

	// Filter and sort videos (newest first)
	const filteredVideos = $derived.by(() => {
		let result = [...videos];

		// Filter by tag
		if (selectedTag) {
			result = result.filter((v) => v.visual_tags && v.visual_tags.includes(selectedTag));
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(v) =>
					v.filename?.toLowerCase().includes(q) ||
					v.artist?.toLowerCase().includes(q) ||
					v.venue?.toLowerCase().includes(q) ||
					v.transcript?.toLowerCase().includes(q) ||
					v.visual_tags?.some((t) => t.toLowerCase().includes(q))
			);
		}

		// Sort newest first
		return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
	});

	onMount(() => {
		// 1. Setup Supabase Realtime channel for instant multi-device / background worker updates
		try {
			realtimeChannel = supabase
				.channel('public:videos')
				.on(
					'postgres_changes',
					{ event: '*', schema: 'public', table: 'videos' },
					(payload: any) => {
						if (payload.eventType === 'INSERT') {
							const newVid = payload.new as VideoRecord;
							// Replace matching optimistic temp video or prepend
							const existingIdx = videos.findIndex(
								(v) => v.id === newVid.id || v.storage_key === newVid.storage_key
							);
							if (existingIdx !== -1) {
								videos[existingIdx] = { ...videos[existingIdx], ...newVid, isOptimistic: false };
							} else {
								videos = [newVid, ...videos];
							}
						} else if (payload.eventType === 'UPDATE') {
							const updated = payload.new as VideoRecord;
							const idx = videos.findIndex(
								(v) => v.id === updated.id || v.storage_key === updated.storage_key
							);
							if (idx !== -1) {
								videos[idx] = { ...videos[idx], ...updated, isOptimistic: false };
							}
						}
					}
				)
				.subscribe();
		} catch (err) {
			console.warn('Realtime subscription fallback:', err);
		}

		// 2. Poll every 5 seconds if any video is actively processing
		pollInterval = setInterval(async () => {
			const hasProcessing = videos.some((v) => v.status === 'processing' || v.status === 'uploading');
			if (hasProcessing) {
				try {
					const res = await fetch('/api/videos');
					if (res.ok) {
						const data = await res.json();
						if (data.videos && Array.isArray(data.videos)) {
							// Merge keeping optimistic properties
							updateVideosList(data.videos);
						}
					}
				} catch (e) {
					// Silent fallback
				}
			}
		}, 5000);
	});

	onDestroy(() => {
		if (realtimeChannel) {
			supabase.removeChannel(realtimeChannel);
		}
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	function updateVideosList(freshVideos: VideoRecord[]) {
		const optimisticItems = videos.filter((v) => v.isOptimistic && v.status === 'uploading');
		const merged = [...optimisticItems];

		for (const fresh of freshVideos) {
			if (!merged.some((m) => m.id === fresh.id || m.storage_key === fresh.storage_key)) {
				merged.push(fresh);
			}
		}
		videos = merged;
	}
</script>

<section class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Concert videos feed">
	<!-- Feed Controls: Search & Tag Filter Pills -->
	<div class="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
				<span>Video Showcase</span>
				<span class="px-2.5 py-0.5 rounded-full text-xs font-mono bg-pink-950/60 text-pink-300 border border-pink-800/60">
					{filteredVideos.length} {filteredVideos.length === 1 ? 'clip' : 'clips'}
				</span>
			</h2>
			<p class="text-xs text-slate-400 mt-0.5">Live recordings with automated AI multimodal tagging</p>
		</div>

		<!-- Search Bar -->
		<div class="relative w-full sm:w-72">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search artist, venue, tags..."
				class="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-indigo-900/40 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors shadow-inner"
			/>
			<svg
				class="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
			</svg>
			{#if searchQuery}
				<button
					type="button"
					onclick={() => (searchQuery = '')}
					class="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
					aria-label="Clear search query"
				>
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<!-- Visual Tag Filter Strip -->
	{#if allTags.length > 0}
		<div class="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
			<button
				type="button"
				onclick={() => onTagSelect(null)}
				class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer {selectedTag === null
					? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md shadow-pink-600/30 border border-white/20'
					: 'bg-slate-900/90 text-slate-300 hover:text-white border border-indigo-900/40 hover:border-pink-500/30'}"
			>
				All Clips
			</button>
			{#each allTags as tag}
				<button
					type="button"
					onclick={() => onTagSelect(selectedTag === tag ? null : tag)}
					class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer {selectedTag === tag
						? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md shadow-pink-600/30 border border-white/20'
						: 'bg-slate-900/90 text-slate-300 hover:text-white border border-indigo-900/40 hover:border-pink-500/40'}"
				>
					{tag}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Video Grid (Mobile 1 col, Tablet 2 cols, Desktop 3 cols) -->
	{#if filteredVideos.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
			{#each filteredVideos as video (video.id)}
				<VideoCard
					{video}
					onTagClick={(t) => onTagSelect(selectedTag === t ? null : t)}
				/>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<div class="py-16 px-4 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60 flex flex-col items-center justify-center">
			<div class="w-16 h-16 rounded-full bg-slate-800/60 text-slate-500 flex items-center justify-center mb-4">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
				</svg>
			</div>
			<h3 class="text-base font-bold text-slate-200">No concert videos found</h3>
			<p class="text-xs text-slate-400 max-w-sm mt-1">
				{#if searchQuery || selectedTag}
					No clips match your active search or tag filter. Try clearing filters.
				{:else}
					Be the first to upload a concert recording using the button above!
				{/if}
			</p>
			{#if searchQuery || selectedTag}
				<button
					type="button"
					onclick={() => {
						searchQuery = '';
						onTagSelect(null);
					}}
					class="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
				>
					Clear Filters
				</button>
			{/if}
		</div>
	{/if}
</section>
