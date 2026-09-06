<script lang="ts">
	import { authState } from '$lib/authStore.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let isCreatingNew = $state(false);
	let newWorkspaceName = $state('');

	function handleSelectWorkspace(id: string) {
		authState.switchWorkspace(id);
		onClose();
	}

	function handleCreateWorkspace(e: SubmitEvent) {
		e.preventDefault();
		if (!newWorkspaceName.trim()) return;
		authState.createWorkspace(newWorkspaceName.trim());
		newWorkspaceName = '';
		isCreatingNew = false;
		onClose();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
		<button
			type="button"
			class="absolute inset-0 bg-transparent cursor-default w-full h-full border-none outline-none"
			onclick={onClose}
			aria-label="Close modal"
		></button>

		<div class="relative w-full max-w-md bg-[#0c0e14] border border-zinc-800 rounded-2xl shadow-2xl shadow-emerald-950/30 overflow-hidden flex flex-col z-10 text-zinc-200 font-sans">
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-[#07080c]/60">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					</div>
					<div>
						<h3 class="text-sm font-bold font-mono text-zinc-100">Workspace Switcher</h3>
						<p class="text-[11px] font-mono text-zinc-400">Manage your active team & archive collections</p>
					</div>
				</div>

				<button
					type="button"
					onclick={onClose}
					class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
					aria-label="Close modal"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Body -->
			<div class="p-5 space-y-3">
				{#if !isCreatingNew}
					<div class="space-y-2 max-h-60 overflow-y-auto pr-1">
						{#each authState.workspaces as ws (ws.id)}
							<button
								type="button"
								onclick={() => handleSelectWorkspace(ws.id)}
								class="w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer {authState.activeWorkspaceId === ws.id
									? 'bg-zinc-900/90 border-emerald-500/80 text-zinc-100 shadow-md shadow-emerald-950/20'
									: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'}"
							>
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 rounded-lg {authState.activeWorkspaceId === ws.id ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'} flex items-center justify-center text-xs font-mono font-bold">
										{ws.name[0]}
									</div>
									<div>
										<p class="text-xs font-mono font-bold {authState.activeWorkspaceId === ws.id ? 'text-zinc-100' : 'text-zinc-300'}">{ws.name}</p>
										<p class="text-[10px] font-mono text-zinc-400">{ws.member_count} members • Role: {ws.role}</p>
									</div>
								</div>

								{#if authState.activeWorkspaceId === ws.id}
									<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
										ACTIVE
									</span>
								{/if}
							</button>
						{/each}
					</div>

					<div class="pt-2">
						<button
							type="button"
							onclick={() => (isCreatingNew = true)}
							class="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-emerald-400 font-mono text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
						>
							<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							<span>Create New Workspace</span>
						</button>
					</div>
				{:else}
					<form onsubmit={handleCreateWorkspace} class="space-y-4">
						<div>
							<label for="new-workspace-name" class="block text-xs font-mono text-zinc-400 mb-1">Workspace Name</label>
							<input
								id="new-workspace-name"
								type="text"
								required
								bind:value={newWorkspaceName}
								placeholder="e.g. European Festival Tour Archive"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
							/>
						</div>

						<div class="flex items-center gap-2 pt-2">
							<button
								type="button"
								onclick={() => (isCreatingNew = false)}
								class="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs cursor-pointer"
							>
								Cancel
							</button>
							<button
								type="submit"
								class="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs shadow-md shadow-emerald-950 cursor-pointer"
							>
								Create & Switch
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}
