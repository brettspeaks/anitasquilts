<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
	<Header />
	<main class="flex-1 flex flex-col">
		{@render children()}
	</main>
	<footer class="border-t border-indigo-950/60 bg-slate-950/80 backdrop-blur-md py-6 text-center text-xs text-slate-400">
		<p>AnitaDoesQuiltsAI • Direct-to-S3/R2 Pipeline • Automated Gemini 1.5 Flash Multimodal Tagging</p>
	</footer>
</div>
