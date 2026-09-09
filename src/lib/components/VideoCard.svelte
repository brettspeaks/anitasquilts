<script lang="ts">
	import type { VideoRecord, SyncedLyricLine, LoreLink, SourceProvider, MediaVisibility } from '$lib/types';
	import { authState } from '$lib/authStore.svelte';
	import { playbackStore } from '$lib/playbackStore.svelte';
	import ShareModal from './ShareModal.svelte';

	interface Props {
		video: VideoRecord;
		onTagClick?: (tag: string) => void;
		onVideoUpdated?: (updatedVideo: VideoRecord) => void;
	}

	let { video = $bindable(), onTagClick, onVideoUpdated }: Props = $props();

	let cardEl = $state<HTMLDivElement | null>(null);
	let videoEl = $state<HTMLVideoElement | null>(null);
	let isPlaying = $state(false);
	let showLyrics = $state(true);
	let showLore = $state(true);
	let isShareModalOpen = $state(false);
	let isUpdatingVisibility = $state(false);

	const videoKey = $derived(video.id || video.storage_key || video.filename);
	const videoSource = $derived(video.storage_url);
	const thumbnailUrl = $derived(video.thumbnail_url || (video.metadata as any)?.thumbnail_url || null);
	const formattedDate = $derived(
		new Date(video.created_at).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	);

	// Synchronize playback across multiple videos (pause when another video plays)
	$effect(() => {
		const activeId = playbackStore.activeVideoId;
		if (activeId !== videoKey && isPlaying) {
			if (videoEl && !videoEl.paused) {
				videoEl.pause();
			}
			isPlaying = false;
		}
	});

	// Global click-away handler: pause this video if the user clicks off / outside this card
	$effect(() => {
		if (!isPlaying) return;

		function handleGlobalPointerDown(e: MouseEvent | TouchEvent) {
			const target = e.target as Node | null;
			if (!target) return;

			// If click is within this card, keep playing
			if (cardEl && cardEl.contains(target)) {
				return;
			}

			// If share modal for this video is open, do not interrupt
			if (isShareModalOpen) {
				return;
			}

			// User clicked outside the card - pause playback
			if (videoEl && !videoEl.paused) {
				videoEl.pause();
			}
			isPlaying = false;
			playbackStore.pause(videoKey);
		}

		document.addEventListener('pointerdown', handleGlobalPointerDown, true);
		return () => {
			document.removeEventListener('pointerdown', handleGlobalPointerDown, true);
		};
	});

	function getProviderBadge(provider?: SourceProvider) {
		switch (provider) {
			case 'ios_photos':
				return { label: 'iOS Photos', bg: 'bg-zinc-900/95', text: 'text-sky-300', border: 'border-zinc-700' };
			case 'google_drive':
			case 'google_photos':
				return { label: 'Google Photos', bg: 'bg-zinc-900/95', text: 'text-emerald-300', border: 'border-zinc-700' };
			case 'dropbox':
				return { label: 'Dropbox', bg: 'bg-zinc-900/95', text: 'text-cyan-300', border: 'border-zinc-700' };
			case 'onedrive':
				return { label: 'OneDrive', bg: 'bg-zinc-900/95', text: 'text-teal-300', border: 'border-zinc-700' };
			case 'r2_bucket':
				return { label: 'Cloudflare R2', bg: 'bg-zinc-900/95', text: 'text-amber-300', border: 'border-zinc-700' };
			case 's3_bucket':
			default:
				return { label: 'AWS S3', bg: 'bg-zinc-900/95', text: 'text-zinc-200', border: 'border-zinc-700' };
		}
	}

	function startPlayback() {
		playbackStore.play(videoKey);
		isPlaying = true;
		if (videoEl) {
			videoEl.play().catch(() => {});
		}
	}

	function seekToTimestamp(line: SyncedLyricLine) {
		playbackStore.play(videoKey);
		isPlaying = true;
		if (!videoEl) return;
		let targetSeconds = line.seconds;
		if (targetSeconds === undefined && line.timestamp) {
			const parts = line.timestamp.split(':').map((p) => parseInt(p, 10));
			if (parts.length === 2) {
				targetSeconds = parts[0] * 60 + parts[1];
			} else if (parts.length === 3) {
				targetSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
			}
		}

		if (targetSeconds !== undefined && !isNaN(targetSeconds)) {
			videoEl.currentTime = targetSeconds;
			videoEl.play().catch(() => {});
		}
	}

	async function handleVisibilityChange(newVisibility: MediaVisibility) {
		if (video.visibility === newVisibility) return;
		video.visibility = newVisibility;
		isUpdatingVisibility = true;

		try {
			await fetch(`/api/videos/${video.id}/visibility`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ visibility: newVisibility })
			});
		} catch (e) {
			console.warn('Visibility update failed, kept optimistic state:', e);
		} finally {
			isUpdatingVisibility = false;
			onVideoUpdated?.(video);
		}
	}

	const providerInfo = $derived(getProviderBadge(video.source_provider));
</script>

<div
	bind:this={cardEl}
	class="group relative flex flex-col overflow-hidden rounded-3xl bg-[#16181e] border border-zinc-750 hover:border-amber-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl"
>
	<!-- Video Player Container (Soundstage black) -->
	<div class="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
		{#if video.status === 'processing' || video.status === 'ingesting'}
			<!-- AI Processing state -->
			<div class="absolute inset-0 bg-[#121316]/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
				<div class="relative flex items-center justify-center w-12 h-12 mb-3">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-30"></span>
					<div class="relative p-3 rounded-2xl bg-zinc-900 border border-amber-600/50 text-amber-400 shadow-md">
						<svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
				</div>
				<p class="text-sm font-mono font-bold text-amber-400 uppercase tracking-wide">Indexing Tape</p>
				<p class="text-xs text-zinc-300 mt-1">Extracting song lyrics & stage lore...</p>
			</div>
		{:else if video.status === 'failed'}
			<!-- Failure state -->
			<div class="p-6 text-center flex flex-col items-center justify-center">
				<div class="w-12 h-12 rounded-2xl bg-red-950/60 text-red-400 flex items-center justify-center mb-2 border border-red-800/60">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
					</svg>
				</div>
				<p class="text-sm font-bold text-red-400">Tape Unavailable</p>
				<p class="text-xs text-zinc-400 mt-1 max-w-[220px]">{video.error_message || 'Video stream unreachable.'}</p>
			</div>
		{:else}
			<!-- Ready: Video with Stored R2 Thumbnail Poster & Fast Play Overlay -->
			<div class="relative w-full h-full flex items-center justify-center bg-black group/player">
				<video
					bind:this={videoEl}
					src={videoSource}
					poster={thumbnailUrl || undefined}
					controls={isPlaying}
					playsinline
					preload="metadata"
					class="w-full h-full object-contain bg-black {isPlaying ? 'opacity-100 z-10' : 'opacity-90'}"
					onplay={() => {
						isPlaying = true;
						playbackStore.play(videoKey);
					}}
					onpause={() => {
						isPlaying = false;
						if (playbackStore.isPlaying(videoKey)) {
							playbackStore.pause(videoKey);
						}
					}}
					onended={() => {
						isPlaying = false;
						playbackStore.pause(videoKey);
					}}
				>
					<track kind="captions" />
				</video>

				<!-- Stored Thumbnail Poster Overlay (Shows before direct video playback) -->
				{#if !isPlaying}
					<button
						type="button"
						onclick={startPlayback}
						class="absolute inset-0 z-10 w-full h-full flex items-center justify-center cursor-pointer bg-black/35 group/poster focus:outline-none"
						aria-label="Play concert video"
					>
						{#if thumbnailUrl}
							<img
								src={thumbnailUrl}
								alt={video.artist ? `${video.artist} concert performance` : video.filename}
								class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
								loading="lazy"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 group-hover/poster:via-black/10 transition-colors"></div>
						{/if}

						<!-- Central Glowing Play Button - Warm Underground Amber -->
						<div class="relative flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-zinc-900/90 backdrop-blur-md border border-amber-400/40 text-amber-400 shadow-2xl group-hover/poster:scale-110 group-hover/poster:bg-amber-400 group-hover/poster:text-black group-hover/poster:border-amber-300 group-hover/poster:shadow-amber-500/50 transition-all duration-300">
							<svg class="w-8 h-8 sm:w-9 sm:h-9 ml-1 fill-current" viewBox="0 0 24 24">
								<path d="M8 5v14l11-7z" />
							</svg>
						</div>

						<!-- Bottom Right Quality Tag on Poster -->
						<div class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-zinc-700 text-xs font-mono font-medium text-zinc-200 flex items-center gap-2 shadow-sm">
							<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
							<span>LIVE TAPE</span>
						</div>
					</button>
				{/if}
			</div>
		{/if}

		<!-- Source Provider Badge (Top Left) -->
		<div class="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1 rounded-lg {providerInfo.bg} {providerInfo.text} border {providerInfo.border} text-xs font-medium tracking-wide shadow-md">
			<span class="w-2 h-2 rounded-full bg-current"></span>
			{providerInfo.label}
		</div>

		<!-- Visibility Status Badge (Top Right) -->
		<div class="absolute top-3 right-3 z-20 flex items-center gap-1">
			<span class="flex items-center gap-1.5 px-3 py-1 rounded-lg backdrop-blur-md text-xs font-semibold tracking-wide border shadow-md {video.visibility === 'public'
				? 'bg-amber-950/90 text-amber-200 border-amber-600/70'
				: video.visibility === 'team'
					? 'bg-cyan-950/90 text-cyan-200 border-cyan-600/70'
					: 'bg-zinc-950/90 text-zinc-300 border-zinc-700'}">
				{#if video.visibility === 'public'}
					<svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>Public</span>
				{:else if video.visibility === 'team'}
					<svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
					<span>Shared</span>
				{:else}
					<svg class="w-3.5 h-3.5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<span>Private</span>
				{/if}
			</span>
		</div>
	</div>

	<!-- Underground Video Intelligence Card Body -->
	<div class="p-5 flex-1 flex flex-col justify-between gap-3.5">
		<div>
			<!-- Artist, Performer Confidence & Share / Visibility CTAs -->
			<div class="flex items-start justify-between gap-3 mb-2">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<h3 class="font-bold text-lg sm:text-xl text-white truncate font-sans">
							{#if video.artist}
								<span class="hover:text-amber-300 transition-colors">
									{video.artist}
								</span>
							{:else}
								<span class="text-zinc-200">{video.filename}</span>
							{/if}
						</h3>

						{#if video.performer_details?.genre}
							<span class="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium">
								{video.performer_details.genre}
							</span>
						{/if}
					</div>

					{#if video.venue}
						<p class="text-sm text-zinc-300 flex items-center gap-1.5 mt-1 truncate font-sans">
							<svg class="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
							</svg>
							<span class="truncate">{video.venue}</span>
						</p>
					{/if}
				</div>

				<!-- Action Controls: Visibility Quick-Selector & Share Button -->
				<div class="flex items-center gap-2 shrink-0">
					<!-- Quick Visibility Toggle Dropdown (Curator/Admin/Owner) -->
					{#if authState.canPublishPublic || authState.canIngest}
						<select
							value={video.visibility}
							onchange={(e) => handleVisibilityChange(e.currentTarget.value as MediaVisibility)}
							disabled={isUpdatingVisibility}
							class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
							title="Toggle media visibility"
						>
							<option value="private">🔒 Private (Me)</option>
							<option value="team">👥 Shared (Team)</option>
							<option value="public">🌐 Public</option>
						</select>
					{/if}

					<!-- Granular Share Modal Trigger Button -->
					<button
						type="button"
						onclick={() => (isShareModalOpen = true)}
						class="shrink-0 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-zinc-700 transition-colors active:scale-95 cursor-pointer"
						title="Open Sharing & Embed Modal"
						aria-label="Share video clip"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
						</svg>
					</button>
				</div>
			</div>

			<!-- Summary text -->
			{#if video.metadata && (video.metadata as any).summary}
				<p class="text-sm text-zinc-300 leading-relaxed my-2.5 line-clamp-2">
					{(video.metadata as any).summary}
				</p>
			{/if}

			<!-- Visual & Domain Tag Pills -->
			<div class="flex flex-wrap gap-2 my-2.5">
				{#each video.visual_tags as tag}
					<button
						type="button"
						onclick={() => onTagClick?.(tag)}
						class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-amber-200 border border-zinc-700 hover:border-amber-500/50 transition-all cursor-pointer active:scale-95"
					>
						<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
						{tag}
					</button>
				{:else}
					{#if video.status === 'ready'}
						<span class="text-xs text-zinc-500 italic">No tags detected</span>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Interactive Time-Synced Lyrics & Transcript Section -->
		{#if video.lyrics_synced && video.lyrics_synced.length > 0}
			<div class="pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => (showLyrics = !showLyrics)}
					class="w-full flex items-center justify-between text-sm font-semibold text-zinc-200 hover:text-amber-300 transition-colors cursor-pointer py-1"
				>
					<span class="flex items-center gap-2">
						<svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
							<path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path>
						</svg>
						Song Lyrics ({video.lyrics_synced.length})
					</span>
					<svg
						class="w-4 h-4 transform transition-transform duration-200 {showLyrics ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
					</svg>
				</button>

				{#if showLyrics}
					<div class="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
						{#each video.lyrics_synced as line}
							<button
								type="button"
								onclick={() => seekToTimestamp(line)}
								class="w-full text-left flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-750 hover:border-amber-500/50 transition-colors group/line cursor-pointer"
								title="Click to jump video to {line.timestamp}"
							>
								<span class="shrink-0 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 group-hover/line:bg-amber-400 group-hover/line:text-black transition-colors">
									{line.timestamp}
								</span>
								<span class="text-sm text-zinc-200 group-hover/line:text-white leading-relaxed font-sans">
									{line.text}
								</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{:else if video.transcript}
			<div class="pt-3 border-t border-zinc-800">
				<div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-750 text-sm text-zinc-300 max-h-36 overflow-y-auto leading-relaxed">
					<p class="whitespace-pre-wrap">{video.transcript}</p>
				</div>
			</div>
		{/if}

		<!-- Wikipedia & Lore Context Links -->
		{#if video.lore_links && video.lore_links.length > 0}
			<div class="pt-3 border-t border-zinc-800">
				<button
					type="button"
					onclick={() => (showLore = !showLore)}
					class="w-full flex items-center justify-between text-sm font-semibold text-zinc-200 hover:text-amber-300 transition-colors cursor-pointer py-1"
				>
					<span class="flex items-center gap-2">
						<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
						</svg>
						Artist & Song Lore ({video.lore_links.length})
					</span>
					<svg
						class="w-4 h-4 transform transition-transform duration-200 {showLore ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
					</svg>
				</button>

				{#if showLore}
					<div class="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1">
						{#each video.lore_links as lore}
							<a
								href={lore.url}
								target="_blank"
								rel="noopener noreferrer"
								class="block p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-750 hover:border-amber-500/50 transition-colors group/lore"
							>
								<div class="flex items-center justify-between text-sm font-bold text-amber-300 group-hover/lore:text-amber-200">
									<span class="truncate">{lore.title}</span>
									<svg class="w-4 h-4 ml-1 shrink-0 opacity-70 group-hover/lore:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
									</svg>
								</div>
								{#if lore.description}
									<p class="text-xs text-zinc-300 mt-1 line-clamp-2 leading-relaxed font-sans">
										{lore.description}
									</p>
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Granular Sharing & Embed Modal -->
<ShareModal
	{video}
	isOpen={isShareModalOpen}
	onClose={() => (isShareModalOpen = false)}
	onShareUpdated={(updated) => onVideoUpdated?.(updated)}
/>
