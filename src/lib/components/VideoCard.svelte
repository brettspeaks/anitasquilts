<script lang="ts">
	import type { VideoRecord, SyncedLyricLine, LoreLink, SourceProvider, MediaVisibility } from '$lib/types';
	import { authState } from '$lib/authStore.svelte';
	import ShareModal from './ShareModal.svelte';

	interface Props {
		video: VideoRecord;
		onTagClick?: (tag: string) => void;
		onVideoUpdated?: (updatedVideo: VideoRecord) => void;
	}

	let { video = $bindable(), onTagClick, onVideoUpdated }: Props = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let showLyrics = $state(true);
	let showLore = $state(true);
	let isShareModalOpen = $state(false);
	let isUpdatingVisibility = $state(false);

	const videoSource = $derived(video.storage_url);
	const formattedDate = $derived(
		new Date(video.created_at).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	);

	function getProviderBadge(provider?: SourceProvider) {
		switch (provider) {
			case 'ios_photos':
				return { label: 'iOS Photos', bg: 'bg-zinc-900/90', text: 'text-sky-400', border: 'border-zinc-800' };
			case 'google_drive':
			case 'google_photos':
				return { label: 'Google Photos', bg: 'bg-zinc-900/90', text: 'text-emerald-400', border: 'border-zinc-800' };
			case 'dropbox':
				return { label: 'Dropbox', bg: 'bg-zinc-900/90', text: 'text-cyan-400', border: 'border-zinc-800' };
			case 'onedrive':
				return { label: 'OneDrive', bg: 'bg-zinc-900/90', text: 'text-teal-400', border: 'border-zinc-800' };
			case 'r2_bucket':
				return { label: 'Cloudflare R2', bg: 'bg-zinc-900/90', text: 'text-amber-400', border: 'border-zinc-800' };
			case 's3_bucket':
			default:
				return { label: 'AWS S3', bg: 'bg-zinc-900/90', text: 'text-zinc-300', border: 'border-zinc-800' };
		}
	}

	function seekToTimestamp(line: SyncedLyricLine) {
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
	class="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0b0d13] border border-zinc-800/80 hover:border-emerald-500/30 transition-all duration-300 shadow-lg hover:shadow-emerald-950/20"
>
	<!-- Video Player Container (Soundstage black) -->
	<div class="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
		{#if video.status === 'processing' || video.status === 'ingesting'}
			<!-- AI Processing state -->
			<div class="absolute inset-0 bg-[#07080c]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
				<div class="relative flex items-center justify-center w-10 h-10 mb-2.5">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
					<div class="relative p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-emerald-400 shadow-md">
						<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
				</div>
				<p class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">Gemini 1.5 Analysis</p>
				<p class="text-[11px] text-zinc-400 mt-0.5 font-mono">Extracting lyrics, stage lore & ID...</p>
			</div>
		{:else if video.status === 'failed'}
			<!-- Failure state -->
			<div class="p-6 text-center flex flex-col items-center justify-center">
				<div class="w-10 h-10 rounded-xl bg-red-950/60 text-red-400 flex items-center justify-center mb-2 border border-red-800/60">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
					</svg>
				</div>
				<p class="text-xs font-mono font-bold text-red-400">Processing Issue</p>
				<p class="text-[11px] text-zinc-500 mt-1 max-w-[200px]">{video.error_message || 'Video stream unreachable.'}</p>
			</div>
		{:else}
			<!-- Ready: Native HTML5 Video Player -->
			<video
				bind:this={videoEl}
				src={videoSource}
				controls
				playsinline
				preload="metadata"
				class="w-full h-full object-contain bg-black"
			>
				<track kind="captions" />
			</video>
		{/if}

		<!-- Source Provider Badge (Top Left) -->
		<div class="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md {providerInfo.bg} {providerInfo.text} border {providerInfo.border} text-[10px] font-mono font-semibold tracking-wider shadow-sm">
			<span class="w-1.5 h-1.5 rounded-full bg-current"></span>
			{providerInfo.label}
		</div>

		<!-- Visibility Status Badge (Top Right) -->
		<div class="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
			<span class="flex items-center gap-1 px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm {video.visibility === 'public'
				? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
				: video.visibility === 'team'
					? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
					: 'bg-zinc-950/85 text-zinc-400 border-zinc-800'}">
				{#if video.visibility === 'public'}
					<svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>Public</span>
				{:else if video.visibility === 'team'}
					<svg class="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
					<span>Shared</span>
				{:else}
					<svg class="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<span>Private</span>
				{/if}
			</span>
		</div>
	</div>

	<!-- Underground Video Intelligence Card Body -->
	<div class="p-4 flex-1 flex flex-col justify-between gap-3">
		<div>
			<!-- Artist, Performer Confidence & Share / Visibility CTAs -->
			<div class="flex items-start justify-between gap-2 mb-1.5">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-1.5">
						<h3 class="font-bold text-sm sm:text-base text-zinc-100 truncate font-mono">
							{#if video.artist}
								<span class="text-white hover:text-emerald-300 transition-colors">
									{video.artist}
								</span>
							{:else}
								<span class="text-zinc-300">{video.filename}</span>
							{/if}
						</h3>

						{#if video.performer_details?.confidence}
							<span class="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[9px] font-mono font-semibold">
								{Math.round(video.performer_details.confidence * 100)}% ID
							</span>
						{/if}

						{#if video.performer_details?.genre}
							<span class="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 text-[9px] font-mono">
								{video.performer_details.genre}
							</span>
						{/if}
					</div>

					{#if video.venue}
						<p class="text-[11px] font-mono text-zinc-400 flex items-center gap-1 mt-1 truncate">
							<svg class="w-3 h-3 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
							</svg>
							<span class="truncate">{video.venue}</span>
						</p>
					{/if}
				</div>

				<!-- Action Controls: Visibility Quick-Selector & Share Button -->
				<div class="flex items-center gap-1.5 shrink-0">
					<!-- Quick Visibility Toggle Dropdown (Curator/Admin/Owner) -->
					{#if authState.canPublishPublic || authState.canIngest}
						<select
							value={video.visibility}
							onchange={(e) => handleVisibilityChange(e.currentTarget.value as MediaVisibility)}
							disabled={isUpdatingVisibility}
							class="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-[10px] font-mono text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
							title="Toggle media visibility"
						>
							<option value="private">🔒 Private (Me)</option>
							<option value="team">👥 Shared (Team)</option>
							<option value="public">🌐 Public (Underground)</option>
						</select>
					{/if}

					<!-- Granular Share Modal Trigger Button -->
					<button
						type="button"
						onclick={() => (isShareModalOpen = true)}
						class="shrink-0 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 border border-zinc-800 transition-colors active:scale-95 cursor-pointer"
						title="Open Granular Sharing & Embed Modal"
						aria-label="Share video clip"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
						</svg>
					</button>
				</div>
			</div>

			<!-- Summary text -->
			{#if video.metadata && (video.metadata as any).summary}
				<p class="text-xs text-zinc-400 leading-relaxed my-2 line-clamp-2">
					{(video.metadata as any).summary}
				</p>
			{/if}

			<!-- Visual & Domain Tag Pills -->
			<div class="flex flex-wrap gap-1.5 my-2">
				{#each video.visual_tags as tag}
					<button
						type="button"
						onclick={() => onTagClick?.(tag)}
						class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500/40 transition-all cursor-pointer active:scale-95"
					>
						<span class="w-1 h-1 rounded-full bg-emerald-400"></span>
						{tag}
					</button>
				{:else}
					{#if video.status === 'ready'}
						<span class="text-xs text-zinc-600 font-mono italic">No domain tags detected</span>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Interactive Time-Synced Lyrics & Transcript Section -->
		{#if video.lyrics_synced && video.lyrics_synced.length > 0}
			<div class="pt-2 border-t border-zinc-800/60">
				<button
					type="button"
					onclick={() => (showLyrics = !showLyrics)}
					class="w-full flex items-center justify-between text-xs font-mono font-semibold text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer py-1"
				>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
							<path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path>
						</svg>
						TIME-SYNCED LYRICS ({video.lyrics_synced.length})
					</span>
					<svg
						class="w-3.5 h-3.5 transform transition-transform duration-200 {showLyrics ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
					</svg>
				</button>

				{#if showLyrics}
					<div class="mt-2 space-y-1 max-h-36 overflow-y-auto pr-1">
						{#each video.lyrics_synced as line}
							<button
								type="button"
								onclick={() => seekToTimestamp(line)}
								class="w-full text-left flex items-start gap-2 p-1.5 rounded-md bg-zinc-900/60 hover:bg-zinc-855 border border-zinc-800/80 hover:border-emerald-500/40 transition-colors group/line cursor-pointer"
								title="Click to jump video to {line.timestamp}"
							>
								<span class="shrink-0 px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-emerald-400 border border-zinc-700 group-hover/line:bg-emerald-500 group-hover/line:text-black transition-colors">
									{line.timestamp}
								</span>
								<span class="text-xs text-zinc-300 group-hover/line:text-zinc-100 leading-snug">
									{line.text}
								</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{:else if video.transcript}
			<div class="pt-2 border-t border-zinc-800/60">
				<div class="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 font-mono max-h-28 overflow-y-auto">
					<p class="whitespace-pre-wrap">{video.transcript}</p>
				</div>
			</div>
		{/if}

		<!-- Wikipedia & Lore Context Links (Underground Cassette Sleeve style) -->
		{#if video.lore_links && video.lore_links.length > 0}
			<div class="pt-2 border-t border-zinc-800/60">
				<button
					type="button"
					onclick={() => (showLore = !showLore)}
					class="w-full flex items-center justify-between text-xs font-mono font-semibold text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer py-1"
				>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
						</svg>
						ARCHIVE LORE ({video.lore_links.length})
					</span>
					<svg
						class="w-3.5 h-3.5 transform transition-transform duration-200 {showLore ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
					</svg>
				</button>

				{#if showLore}
					<div class="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
						{#each video.lore_links as lore}
							<a
								href={lore.url}
								target="_blank"
								rel="noopener noreferrer"
								class="block p-2 rounded-lg bg-zinc-950/70 hover:bg-zinc-900 border border-zinc-850 hover:border-amber-500/40 transition-colors group/lore"
							>
								<div class="flex items-center justify-between text-xs font-mono font-bold text-amber-300 group-hover/lore:text-amber-200">
									<span class="truncate">{lore.title}</span>
									<svg class="w-3 h-3 ml-1 shrink-0 opacity-60 group-hover/lore:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
									</svg>
								</div>
								{#if lore.description}
									<p class="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed font-sans">
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
