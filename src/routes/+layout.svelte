<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import AdminModerationPanel from '$lib/components/AdminModerationPanel.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen text-zinc-200 flex flex-col font-sans selection:bg-emerald-500 selection:text-black bg-[#07080c]">
	<Header />
	<main class="flex-1 flex flex-col">
		{@render children()}
	</main>
	<footer class="border-t border-zinc-900 bg-[#090a0f]/90 backdrop-blur-md py-6 text-center text-xs text-zinc-500 font-mono">
		<p>Anita's Underground <span class="text-emerald-500/60">•</span> Stream Intelligence & Asset Sharing <span class="text-emerald-500/60">•</span> Gemini 1.5 Flash</p>
	</footer>

	<!-- Global Admin Moderation Drawer & Content Governance -->
	<AdminModerationPanel />
</div>
