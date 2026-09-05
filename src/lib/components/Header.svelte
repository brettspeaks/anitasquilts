<script lang="ts">
	import { onMount } from 'svelte';
	import { getOrCreateDeviceSessionToken } from '$lib/deviceSession';

	let deviceToken = $state('');
	let isOnline = $state(true);
	let isCopied = $state(false);

	onMount(() => {
		deviceToken = getOrCreateDeviceSessionToken();
		isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

		const handleOnline = () => (isOnline = true);
		const handleOffline = () => (isOnline = false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	function copySession() {
		if (deviceToken) {
			navigator.clipboard?.writeText(deviceToken);
			isCopied = true;
			setTimeout(() => (isCopied = false), 2000);
		}
	}
</script>

<header class="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
		<!-- Brand Logo & Title -->
		<div class="flex items-center gap-3">
			<div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
				<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
				</svg>
			</div>
			<div>
				<h1 class="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
					ConcertAI
					<span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
						Gemini 1.5
					</span>
				</h1>
			</div>
		</div>

		<!-- Status & Hands-Off Device Token -->
		<div class="flex items-center gap-2 sm:gap-3">
			<!-- Online / Offline Badge -->
			{#if !isOnline}
				<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80">
					<span class="w-2 h-2 rounded-full bg-rose-500"></span>
					Offline
				</span>
			{/if}

			<!-- Device Token Badge -->
			{#if deviceToken}
				<button
					type="button"
					onclick={copySession}
					class="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
					title="Persistent device token stored in localStorage for hands-off auth"
				>
					<svg class="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
					</svg>
					<span class="hidden sm:inline">Device:</span>
					<span>{deviceToken.slice(0, 8)}...</span>
					{#if isCopied}
						<span class="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>
					{/if}
				</button>
			{/if}
		</div>
	</div>
</header>
