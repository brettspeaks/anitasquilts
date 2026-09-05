<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
	<Header />
	<main class="flex-1 flex flex-col">
		{@render children()}
	</main>
	<footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
		<p>ConcertAI • Direct-to-S3/R2 Pipeline • Automated Gemini 1.5 Flash Multimodal Tagging</p>
	</footer>
</div>
