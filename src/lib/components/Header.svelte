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

<header class="w-full border-b border-zinc-800 bg-[#16181d]/95 backdrop-blur-xl sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
		<!-- Underground Brand Mark & Wordmark -->
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-center shadow-inner group">
				<svg class="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
				</svg>
			</div>
			<div class="flex items-center gap-2">
				<h1 class="text-lg sm:text-xl font-bold tracking-wide text-zinc-100 font-sans">
					Anita's <span class="text-amber-400">Underground</span>
				</h1>
			</div>
		</div>

		<!-- Status, Passive Sync Controls & User Avatar Menu -->
		<div class="flex items-center gap-2.5 sm:gap-3">
			<!-- Stream Pulse Status Indicator -->
			<div class="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300">
				<span class="relative flex h-2 w-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
				</span>
				<span class="font-semibold text-zinc-400">VAULT:</span>
				<span class="text-amber-300 font-medium">LIVE TAPE FEED</span>
			</div>

			<!-- Offline Indicator -->
			{#if !isOnline}
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-950/80 text-red-300 border border-red-800">
					<span class="w-2 h-2 rounded-full bg-red-500"></span>
					OFFLINE
				</span>
			{/if}

			<!-- Admin Pending Reviews Status Indicator Badge -->
			{#if isAdmin}
				<button
					type="button"
					onclick={() => adminStore.openPanel('queue')}
					class="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/60 hover:border-amber-500 text-xs font-medium text-amber-200 transition-all cursor-pointer shadow-sm active:scale-95"
					title="Open Moderation Panel"
				>
					<span class="relative flex h-2 w-2">
						{#if pendingReviewsCount > 0}
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
						{/if}
						<span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
					</span>
					<span class="font-bold whitespace-nowrap">{pendingReviewsCount} PENDING</span>
				</button>
			{/if}

			<!-- Manual Ingest Sync Button (Curator / Admin) -->
			{#if authState.canIngest}
				<button
					type="button"
					onclick={triggerCloudSync}
					disabled={isSyncing}
					class="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 hover:border-amber-500/50 active:scale-95 border border-zinc-700 text-sm font-medium text-zinc-200 hover:text-amber-300 transition-all cursor-pointer shadow-sm disabled:opacity-50"
					title="Check for new concert tapes"
				>
					<svg
						class="w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-colors {isSyncing ? 'animate-spin text-amber-400' : ''}"
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
					<span>{syncFeedback || (isSyncing ? 'CHECKING...' : 'SYNC TAPES')}</span>
				</button>
			{/if}

			<!-- User Avatar Menu & Session Controls -->
			<div class="pl-1.5 sm:pl-3 border-l border-zinc-800">
				<UserAvatarMenu />
			</div>
		</div>
	</div>
</header>
