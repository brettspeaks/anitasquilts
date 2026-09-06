<script lang="ts">
	import { onMount } from 'svelte';
	import UserAvatarMenu from './UserAvatarMenu.svelte';
	import { authState } from '$lib/authStore.svelte';
	import { adminStore } from '$lib/adminStore.svelte';

	interface Props {
		onSyncTriggered?: () => void;
	}

	let { onSyncTriggered }: Props = $props();

	let isOnline = $state(true);
	let isSyncing = $state(false);
	let syncFeedback = $state('');

	const isAdmin = $derived(authState.activeRole === 'admin');
	const pendingReviewsCount = $derived(adminStore.pendingReviewsCount);

	onMount(() => {
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

	async function triggerCloudSync() {
		if (isSyncing) return;
		isSyncing = true;
		syncFeedback = 'Scanning...';

		try {
			const res = await fetch('/api/ingest/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prefix: 'favorites/' })
			});
			if (res.ok) {
				const data = await res.json();
				syncFeedback = `Synced ${data.ingestedCount || 0}`;
				onSyncTriggered?.();
			} else {
				syncFeedback = 'Synced';
			}
		} catch {
			syncFeedback = 'Offline';
		} finally {
			setTimeout(() => {
				isSyncing = false;
				syncFeedback = '';
			}, 3000);
		}
	}
</script>

<header class="w-full border-b border-zinc-800/80 bg-[#07080c]/90 backdrop-blur-xl sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
		<!-- Underground Brand Mark & Wordmark -->
		<div class="flex items-center gap-2.5">
			<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-inner group">
				<svg class="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
				</svg>
			</div>
			<div class="flex items-center gap-2">
				<h1 class="text-sm font-bold tracking-wider text-zinc-100 uppercase font-mono">
					Anita's <span class="text-emerald-400">Underground</span>
				</h1>
			</div>
		</div>

		<!-- Status, Passive Sync Controls & User Avatar Menu -->
		<div class="flex items-center gap-2 sm:gap-2.5">
			<!-- Stream Pulse Status Indicator -->
			<div class="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-400">
				<span class="relative flex h-1.5 w-1.5">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
				</span>
				<span>INGEST:</span>
				<span class="text-zinc-300">PASSIVE AUTO-SYNC</span>
			</div>

			<!-- Offline Indicator -->
			{#if !isOnline}
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-red-950/60 text-red-400 border border-red-800/60">
					<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
					OFFLINE
				</span>
			{/if}

			<!-- Admin Pending Reviews Status Indicator Badge -->
			{#if isAdmin}
				<button
					type="button"
					onclick={() => adminStore.openPanel('queue')}
					class="group flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/50 hover:bg-amber-950/80 border border-amber-600/50 hover:border-amber-500 text-[11px] font-mono text-amber-300 transition-all cursor-pointer shadow-sm active:scale-95"
					title="Open Admin Moderation Panel"
				>
					<span class="relative flex h-2 w-2">
						{#if pendingReviewsCount > 0}
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
						{/if}
						<span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
					</span>
					<span class="font-bold whitespace-nowrap">{pendingReviewsCount} PENDING REVIEWS</span>
				</button>
			{/if}

			<!-- Manual Ingest Sync Button (Curator / Admin) -->
			{#if authState.canIngest}
				<button
					type="button"
					onclick={triggerCloudSync}
					disabled={isSyncing}
					class="group flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:border-emerald-500/40 active:scale-95 border border-zinc-700/80 text-xs font-mono text-zinc-300 hover:text-emerald-400 transition-all cursor-pointer shadow-sm disabled:opacity-50"
					title="Trigger manual cloud stream poll"
				>
					<svg
						class="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors {isSyncing ? 'animate-spin text-emerald-400' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					<span>{syncFeedback || (isSyncing ? 'SYNCING...' : 'SYNC FEED')}</span>
				</button>
			{/if}

			<!-- User Avatar Menu & Session Controls -->
			<div class="pl-1 sm:pl-2 border-l border-zinc-800/80">
				<UserAvatarMenu />
			</div>
		</div>
	</div>
</header>
