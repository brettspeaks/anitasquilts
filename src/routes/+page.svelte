<script lang="ts">
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
</script>

<svelte:head>
	<title>Anita's Underground • Live Intelligence</title>
</svelte:head>

<div class="flex-1 flex flex-col">
	<!-- Hero Section: Minimalist Live Intelligence & Ambient Stream -->
	<section class="relative w-full py-8 sm:py-10 px-4 text-center bg-[#07080c] border-b border-zinc-900/80 overflow-hidden select-none">
		<!-- Subtle ambient glow in center -->
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25 -z-0">
			<div class="w-[600px] h-[220px] bg-gradient-to-r from-emerald-600/10 via-zinc-800/30 to-teal-600/10 blur-3xl rounded-full"></div>
		</div>

		<!-- Curved Dashed Thread Stitch Line across Hero -->
		<svg
			class="pointer-events-none absolute inset-0 w-full h-full z-0 opacity-40 sm:opacity-50"
			viewBox="0 0 1400 180"
			preserveAspectRatio="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M -20,95 C 180,140 380,130 520,95 C 660,60 820,50 1020,70 C 1140,82 1220,90 1310,95"
				fill="none"
				stroke="#666666"
				stroke-width="1.75"
				stroke-dasharray="6 6"
				stroke-linecap="round"
			/>
		</svg>

		<div class="max-w-6xl mx-auto relative z-10 flex items-center justify-between">
			<!-- Spacer on left for symmetry on large screens -->
			<div class="hidden lg:block w-20 xl:w-24 shrink-0"></div>

			<!-- Center Hero Content -->
			<div class="flex-1 flex flex-col items-center max-w-2xl mx-auto">
				<!-- Passive Stream Archive / Gemini 1.5 Flash Pill -->
				<div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-sm mb-3.5 text-xs font-mono">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
					<span class="text-zinc-300 tracking-wider">PASSIVE STREAM ARCHIVE</span>
					<span class="text-zinc-600">/</span>
					<span class="text-emerald-400 font-medium tracking-wider">GEMINI 1.5 FLASH</span>
				</div>

				<!-- Main Headline -->
				<h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight font-sans">
					Live Intelligence.
				</h1>

				<!-- Ingestion Providers Ribbon -->
				<div class="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs font-mono">
					<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-sm hover:border-zinc-700 transition-colors">
						<svg class="w-3.5 h-3.5 text-zinc-300" fill="currentColor" viewBox="0 0 24 24">
							<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 .6-2.64 1.35-.56.65-1.06 1.7-0.93 2.73 1.01.08 2.03-.49 2.64-1.23z" />
						</svg>
						<span>iOS Favorites</span>
					</div>

					<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-sm hover:border-zinc-700 transition-colors">
						<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
						<span>Google Drive</span>
					</div>

					<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-sm hover:border-zinc-700 transition-colors">
						<span class="w-2 h-2 rounded-full bg-sky-400"></span>
						<span>Dropbox</span>
					</div>

					<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-sm hover:border-zinc-700 transition-colors">
						<span class="w-2 h-2 rounded-full bg-teal-400"></span>
						<span>OneDrive</span>
					</div>

					<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-sm hover:border-zinc-700 transition-colors">
						<span class="w-2 h-2 rounded-full bg-amber-400"></span>
						<span>R2 / S3</span>
					</div>
				</div>
			</div>

			<!-- AU Sewing Needle & Monogram Emblem (Right Side) -->
			<div class="hidden md:flex items-center justify-end w-20 xl:w-24 shrink-0">
				<div
					class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#08090e] border border-zinc-600/80 p-1 flex items-center justify-center shadow-lg hover:border-zinc-500 transition-colors"
					title="Anita's Underground • Quilt & Needle Monogram"
				>
					<svg class="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
						<!-- Outer Ring -->
						<circle cx="50" cy="50" r="46" stroke="#52525b" stroke-width="2" />
						
						<!-- Decorative Thread Curly Loops around Needle Eye -->
						<path
							d="M 68,26 C 62,12 46,14 44,26 C 42,36 56,40 60,32 C 64,24 56,18 48,22 C 40,26 38,36 44,44"
							stroke="#d4d4d8"
							stroke-width="1.5"
							stroke-linecap="round"
							fill="none"
						/>
						
						<!-- Needle (Diagonal from top-right to bottom-left) -->
						<!-- Needle body -->
						<line x1="72" y1="20" x2="26" y2="76" stroke="#f4f4f5" stroke-width="2.5" stroke-linecap="round" />
						<!-- Needle Eye -->
						<ellipse cx="68" cy="25" rx="1.5" ry="4.5" transform="rotate(-40 68 25)" fill="#08090e" stroke="#71717a" stroke-width="0.75" />
						
						<!-- "AU" Monogram (Classic Serif Typography) -->
						<text
							x="56"
							y="80"
							font-family="ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
							font-size="22"
							font-weight="bold"
							fill="#e4e4e7"
							text-anchor="middle"
							letter-spacing="1"
						>AU</text>
					</svg>
				</div>
			</div>
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
