<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { adminStore } from '$lib/adminStore.svelte';
	import { authState } from '$lib/authStore.svelte';

	onMount(() => {
		adminStore.openPanel('queue');
		goto('/', { replaceState: true });
	});
</script>

<svelte:head>
	<title>Admin Moderation • Anita's Underground</title>
</svelte:head>

<div class="flex-1 flex items-center justify-center min-h-[50vh] text-center p-6">
	<div class="space-y-3 font-mono">
		<div class="w-8 h-8 mx-auto rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
		<p class="text-sm text-zinc-400">Loading Admin Moderation Panel...</p>
	</div>
</div>
