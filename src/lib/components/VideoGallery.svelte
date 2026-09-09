<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import VideoCard from './VideoCard.svelte';
	import { supabase } from '$lib/supabaseClient';
	import { authState } from '$lib/authStore.svelte';
	import type { VideoRecord, SourceProvider } from '$lib/types';

	interface Props {
		videos: VideoRecord[];
		selectedTag: string | null;
		selectedProvider?: SourceProvider | 'all';
		onTagSelect: (tag: string | null) => void;
		onProviderSelect?: (provider: SourceProvider | 'all') => void;
	}

	let {
		videos = $bindable([]),
		selectedTag,
		selectedProvider = 'all',
		onTagSelect,
		onProviderSelect
	}: Props = $props();

	type FeedViewMode = 'all' | 'my_streams' | 'public_underground' | 'shared';

	let activeFeedView = $state<FeedViewMode>('all');
	let searchQuery = $state('');
	let activeProvider = $state<SourceProvider | 'all'>('all');
	let realtimeChannel: any = null;
	let pollInterval: any = null;

	$effect(() => {
		activeProvider = selectedProvider;
	});

	const feedViewTabs: { id: FeedViewMode; label: string; icon: string; count?: number }[] = $derived([
		{ id: 'all', label: 'All Feeds', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
		{ id: 'my_streams', label: 'My Streams', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
		{ id: 'public_underground', label: 'Public Underground', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ id: 'shared', label: 'Shared with Me', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
	]);

	const providersList: { id: SourceProvider | 'all'; label: string }[] = [
		{ id: 'all', label: 'All Providers' },
		{ id: 'ios_photos', label: 'iOS Photos' },
		{ id: 'google_drive', label: 'Google Drive' },
		{ id: 'dropbox', label: 'Dropbox' },
		{ id: 'onedrive', label: 'OneDrive' },
		{ id: 'r2_bucket', label: 'Cloudflare R2' },
		{ id: 's3_bucket', label: 'AWS S3' }
	];

	// Extract unique visual tags from loaded videos
	const allTags = $derived.by(() => {
		const tagSet = new Set<string>();
		for (const v of videos) {
			if (v.visual_tags && Array.isArray(v.visual_tags)) {
				for (const t of v.visual_tags) {
					if (t && !t.startsWith('Analyzing')) {
						tagSet.add(t);
					}
				}
			}
		}
		return Array.from(tagSet);
	});

	// Filter and sort videos
	const filteredVideos = $derived.by(() => {
		let result = [...videos];

		// 1. Filter by Feed View Mode (My Streams vs Public Underground vs Shared)
		if (activeFeedView === 'my_streams') {
			result = result.filter(
				(v) =>
					v.visibility === 'private' ||
					v.user_id === authState.user?.id ||
					v.team_id === authState.activeWorkspaceId ||
					!v.user_id
			);
		} else if (activeFeedView === 'public_underground') {
			result = result.filter((v) => v.visibility === 'public');
		} else if (activeFeedView === 'shared') {
			result = result.filter(
				(v) =>
					v.visibility === 'team' ||
					(v.shares && v.shares.length > 0) ||
					v.team_id === authState.activeWorkspaceId
			);
		}

		// 2. Filter by cloud source provider
		if (activeProvider !== 'all') {
			result = result.filter((v) => v.source_provider === activeProvider);
		}

		// 3. Filter by tag
		if (selectedTag) {
			result = result.filter((v) => v.visual_tags && v.visual_tags.includes(selectedTag));
		}

		// 4. Filter by search query
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(v) =>
					v.filename?.toLowerCase().includes(q) ||
					v.artist?.toLowerCase().includes(q) ||
					v.venue?.toLowerCase().includes(q) ||
					v.transcript?.toLowerCase().includes(q) ||
					v.visual_tags?.some((t) => t.toLowerCase().includes(q)) ||
					v.lore_links?.some((l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))
			);
		}

		// Sort newest first
		return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
	});

	function handleVideoUpdated(updated: VideoRecord) {
		const idx = videos.findIndex((v) => v.id === updated.id);
		if (idx !== -1) {
			videos[idx] = { ...videos[idx], ...updated };
		}
	}

	onMount(() => {
		// 1. Supabase Realtime channel for live multi-cloud worker updates
		try {
			realtimeChannel = supabase
				.channel('public:videos')
				.on(
					'postgres_changes',
					{ event: '*', schema: 'public', table: 'videos' },
					(payload: any) => {
						if (payload.eventType === 'INSERT') {
							const newVid = payload.new as VideoRecord;
							const existingIdx = videos.findIndex(
								(v) => v.id === newVid.id || v.storage_key === newVid.storage_key
							);
							if (existingIdx !== -1) {
								videos[existingIdx] = { ...videos[existingIdx], ...newVid };
							} else {
								videos = [newVid, ...videos];
							}
						} else if (payload.eventType === 'UPDATE') {
							const updated = payload.new as VideoRecord;
							const idx = videos.findIndex(
								(v) => v.id === updated.id || v.storage_key === updated.storage_key
							);
							if (idx !== -1) {
								videos[idx] = { ...videos[idx], ...updated };
							}
						}
					}
				)
				.subscribe();
		} catch (err) {
			console.warn('Realtime subscription fallback:', err);
		}

		// 2. Poll every 6 seconds if any video is processing
		pollInterval = setInterval(async () => {
			const hasProcessing = videos.some((v) => v.status === 'processing' || v.status === 'ingesting');
			if (hasProcessing) {
				try {
					const res = await fetch('/api/videos');
					if (res.ok) {
						const data = await res.json();
						if (data.videos && Array.isArray(data.videos)) {
							videos = data.videos;
						}
					}
				} catch {
					// Fallback
				}
			}
		}, 6000);
	});

	onDestroy(() => {
		if (realtimeChannel) {
			supabase.removeChannel(realtimeChannel);
		}
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	function handleProviderChange(prov: SourceProvider | 'all') {
		activeProvider = prov;
		onProviderSelect?.(prov);
	}
</script>

<div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Underground Soundboard: Feed Views, Search & Provider Filters -->
	<div class="flex flex-col gap-4 mb-8">
		<!-- Top View Level Switcher: My Streams vs Public Underground vs Shared -->
		<div class="flex items-center gap-2 p-1.5 bg-[#16181d] rounded-2xl border border-zinc-800 overflow-x-auto scrollbar-none shadow-sm">
			{#each feedViewTabs as tab}
				<button
					type="button"
					onclick={() => (activeFeedView = tab.id)}
					class="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer shrink-0 {activeFeedView === tab.id
						? 'bg-zinc-800 text-amber-300 border border-amber-500/50 shadow-sm'
						: 'text-zinc-300 hover:text-white hover:bg-zinc-800/60 border border-transparent'}"
				>
					<svg class="w-4 h-4 {activeFeedView === tab.id ? 'text-amber-400' : 'text-zinc-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} />
					</svg>
					<span>{tab.label}</span>
				</button>
			{/each}
		</div>

		<!-- Underground Search Input -->
		<div class="relative w-full">
			<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
				</svg>
			</div>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search by artist, song lyrics, venue, or band member..."
				class="w-full pl-12 pr-14 py-3.5 rounded-2xl bg-[#16181d] border border-zinc-700/90 hover:border-zinc-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-base text-zinc-100 placeholder-zinc-400 transition-all outline-none shadow-sm"
			/>
			{#if searchQuery}
				<button
					type="button"
					onclick={() => (searchQuery = '')}
					class="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-mono font-bold text-zinc-400 hover:text-amber-400 cursor-pointer"
				>
					CLEAR
				</button>
			{/if}
		</div>

		<!-- Stream Provider Filter Tabs (Audio Switchboard Style) -->
		<div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
			{#each providersList as prov}
				<button
					type="button"
					onclick={() => handleProviderChange(prov.id)}
					class="shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer {activeProvider === prov.id
						? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-sm'
						: 'bg-[#16181d] text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-750'}"
				>
					{prov.label}
				</button>
			{/each}
		</div>

		<!-- Domain Tag Pills Filter Bar -->
		{#if allTags.length > 0}
			<div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
				<button
					type="button"
					onclick={() => onTagSelect(null)}
					class="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {selectedTag === null
						? 'bg-zinc-700 text-white border border-zinc-500'
						: 'bg-[#16181d] text-zinc-400 hover:text-zinc-200 border border-zinc-800'}"
				>
					ALL TAGS
				</button>

				{#each allTags as tag}
					<button
						type="button"
						onclick={() => onTagSelect(selectedTag === tag ? null : tag)}
						class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer {selectedTag === tag
							? 'bg-amber-950/80 text-amber-200 border border-amber-500 shadow-sm'
							: 'bg-[#16181d] text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'}"
					>
						<span class="w-1.5 h-1.5 rounded-full {selectedTag === tag ? 'bg-amber-400' : 'bg-zinc-400'}"></span>
						<span>{tag}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Gallery Grid Section -->
	{#if filteredVideos.length === 0}
		<div class="text-center py-20 px-6 rounded-3xl border border-dashed border-zinc-750 bg-[#16181d]/50">
			<div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-850 border border-zinc-700 flex items-center justify-center text-zinc-400">
				<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
				</svg>
			</div>
			<h3 class="text-lg font-bold text-zinc-200">No Tapes Found in {activeFeedView === 'public_underground' ? 'Public Underground' : activeFeedView === 'my_streams' ? 'My Streams' : activeFeedView === 'shared' ? 'Shared Feeds' : 'Current View'}</h3>
			<p class="text-sm text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed">
				Favorite concert clips in your iOS Photos, Google Drive, Dropbox, or drop MP4 files in your cloud bucket to automatically extract lyrics and show metadata.
			</p>
			{#if searchQuery || selectedTag || activeProvider !== 'all' || activeFeedView !== 'all'}
				<button
					type="button"
					onclick={() => {
						searchQuery = '';
						onTagSelect(null);
						handleProviderChange('all');
						activeFeedView = 'all';
					}}
					class="mt-5 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 transition-colors cursor-pointer"
				>
					Reset All Filters
				</button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
			{#each filteredVideos as video (video.id || video.storage_key)}
				<VideoCard
					{video}
					onTagClick={(tag) => onTagSelect(selectedTag === tag ? null : tag)}
					onVideoUpdated={handleVideoUpdated}
				/>
			{/each}
		</div>
	{/if}
</div>
