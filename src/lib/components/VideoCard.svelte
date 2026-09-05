<script lang="ts">
	import type { VideoRecord } from '$lib/types';

	interface Props {
		video: VideoRecord;
		onTagClick?: (tag: string) => void;
	}

	let { video, onTagClick }: Props = $props();

	let showTranscript = $state(false);
	let isCopied = $state(false);

	const videoSource = $derived(video.localPreviewUrl || video.storage_url);
	const formattedDate = $derived(
		new Date(video.created_at).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	);

	async function handleShare() {
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({
					title: video.artist ? `${video.artist} Concert Video` : 'Concert Video',
					text: video.transcript || 'Watch this concert clip!',
					url: video.storage_url
				});
			} catch (err) {
				// User cancelled or share failed
			}
		} else {
			// Fallback copy link
			navigator.clipboard?.writeText(video.storage_url);
			isCopied = true;
			setTimeout(() => (isCopied = false), 2000);
		}
	}
</script>

<div
	class="group relative flex flex-col overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 shadow-xl hover:shadow-indigo-950/20"
>
	<!-- Video Player Container -->
	<div class="relative aspect-video w-full bg-black/90 overflow-hidden flex items-center justify-center">
		{#if video.status === 'uploading'}
			<!-- Optimistic local upload state -->
			{#if video.localPreviewUrl}
				<video
					src={video.localPreviewUrl}
					muted
					playsinline
					class="w-full h-full object-cover opacity-60 filter blur-[1px]"
				></video>
			{/if}
			<div class="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
				<div class="relative w-14 h-14 mb-3">
					<svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
						<path
							class="text-slate-800"
							stroke-width="3.5"
							stroke="currentColor"
							fill="none"
							d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
						/>
						<path
							class="text-indigo-500 transition-all duration-300"
							stroke-dasharray="{video.uploadProgress || 10}, 100"
							stroke-width="3.5"
							stroke-linecap="round"
							stroke="currentColor"
							fill="none"
							d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
						/>
					</svg>
					<span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
						{video.uploadProgress || 0}%
					</span>
				</div>
				<p class="text-sm font-semibold text-slate-200">Uploading to Direct S3/R2</p>
				<p class="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{video.filename}</p>
			</div>
		{:else if video.status === 'processing'}
			<!-- AI Processing state -->
			{#if videoSource}
				<video
					src={videoSource}
					muted
					playsinline
					class="w-full h-full object-cover opacity-40 filter blur-xs"
				></video>
			{/if}
			<div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
				<div class="relative flex items-center justify-center w-12 h-12 mb-3">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-40"></span>
					<div class="relative p-3 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/50">
						<svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
				</div>
				<p class="text-sm font-bold text-violet-300">Gemini 1.5 Flash AI</p>
				<p class="text-xs text-slate-400 mt-0.5">Extracting artist, venue, visual tags & lyrics...</p>
			</div>
		{:else if video.status === 'failed'}
			<!-- Failure state -->
			<div class="p-6 text-center flex flex-col items-center justify-center">
				<div class="w-12 h-12 rounded-full bg-rose-950/80 text-rose-400 flex items-center justify-center mb-2 border border-rose-800/60">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
					</svg>
				</div>
				<p class="text-sm font-medium text-rose-300">Video Processing Error</p>
				<p class="text-xs text-slate-400 mt-1 max-w-[220px]">{video.error_message || 'Unable to decode video.'}</p>
			</div>
		{:else}
			<!-- Ready: Native HTML5 Video Player -->
			<video
				src={videoSource}
				controls
				playsinline
				preload="metadata"
				class="w-full h-full object-contain bg-black"
			>
				<track kind="captions" />
			</video>
		{/if}

		<!-- Upload Date Badge -->
		<div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-[11px] font-mono text-slate-300 border border-slate-800/80 pointer-events-none">
			{formattedDate}
		</div>
	</div>

	<!-- Video Content & Intelligence Metadata -->
	<div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
		<div>
			<!-- Artist & Venue Header -->
			<div class="flex items-start justify-between gap-2 mb-2">
				<div class="min-w-0">
					<h3 class="font-bold text-base sm:text-lg text-white truncate flex items-center gap-1.5">
						{#if video.artist}
							<span class="text-indigo-400">{video.artist}</span>
						{:else}
							<span class="text-slate-300">{video.filename}</span>
						{/if}
					</h3>
					{#if video.venue}
						<p class="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
							<svg class="w-3.5 h-3.5 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
							</svg>
							<span class="truncate">{video.venue}</span>
						</p>
					{/if}
				</div>

				<!-- Native Mobile Share CTA -->
				<button
					type="button"
					onclick={handleShare}
					class="shrink-0 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors active:scale-95 cursor-pointer"
					title="Share Clip"
					aria-label="Share video clip"
				>
					{#if isCopied}
						<span class="text-[10px] text-emerald-400 font-bold px-1">Copied!</span>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
						</svg>
					{/if}
				</button>
			</div>

			<!-- Summary text if available -->
			{#if video.metadata && (video.metadata as any).summary}
				<p class="text-xs text-slate-300/90 leading-relaxed mb-3 line-clamp-2">
					{(video.metadata as any).summary}
				</p>
			{/if}

			<!-- Auto-Generated Tag Pills Beneath Clip -->
			<div class="flex flex-wrap gap-1.5 my-2">
				{#each video.visual_tags as tag}
					<button
						type="button"
						onclick={() => onTagClick?.(tag)}
						class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/90 hover:bg-indigo-950/80 text-indigo-200 hover:text-indigo-100 border border-slate-700/60 hover:border-indigo-500/50 transition-all cursor-pointer active:scale-95"
					>
						<span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
						{tag}
					</button>
				{:else}
					{#if video.status === 'ready'}
						<span class="text-xs text-slate-500 italic">No specific visual tags detected</span>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Lyrics / Spoken Transcript Accordion -->
		{#if video.transcript}
			<div class="mt-3 pt-3 border-t border-slate-800/60">
				<button
					type="button"
					onclick={() => (showTranscript = !showTranscript)}
					class="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
				>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
							<path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path>
						</svg>
						Transcript & Lyrics
					</span>
					<svg
						class="w-3.5 h-3.5 transform transition-transform duration-200 {showTranscript ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
					</svg>
				</button>

				{#if showTranscript}
					<div class="mt-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans max-h-40 overflow-y-auto">
						<p class="whitespace-pre-wrap">{video.transcript}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
