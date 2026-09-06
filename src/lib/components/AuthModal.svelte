<script lang="ts">
	import { authState } from '$lib/authStore.svelte';
	import type { UserRole } from '$lib/types';

	interface Props {
		isOpen: boolean;
		initialMode?: 'login' | 'register' | 'profile';
		onClose: () => void;
	}

	let { isOpen, initialMode = 'login', onClose }: Props = $props();

	let mode = $state<'login' | 'register' | 'profile'>('login');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let selectedRole = $state<UserRole>('curator');
	let feedbackMsg = $state('');

	$effect(() => {
		mode = initialMode;
		if (authState.user) {
			name = authState.user.name;
			email = authState.user.email;
			selectedRole = authState.user.role;
		} else {
			name = '';
			email = '';
			password = '';
			selectedRole = 'curator';
		}
	});

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		feedbackMsg = '';

		if (mode === 'login') {
			if (!email) return;
			authState.login(email, email.split('@')[0], selectedRole);
			onClose();
		} else if (mode === 'register') {
			if (!email || !name) return;
			authState.register(name, email);
			authState.switchRole(selectedRole);
			onClose();
		} else if (mode === 'profile') {
			if (!name || !email) return;
			authState.updateProfile(name, email);
			authState.switchRole(selectedRole);
			feedbackMsg = 'Profile updated successfully';
			setTimeout(() => {
				feedbackMsg = '';
				onClose();
			}, 1000);
		}
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
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
						</svg>
					</div>
					<div>
						<h3 class="text-sm font-bold font-mono text-zinc-100">
							{mode === 'profile' ? 'Profile & Role Settings' : mode === 'register' ? 'Join Anita\'s Underground' : 'Sign In to Concert Stream'}
						</h3>
						<p class="text-[11px] font-mono text-zinc-400">
							{mode === 'profile' ? 'Manage your credentials and access permissions' : 'Zero-friction ingestion and intelligence archive'}
						</p>
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
			<form onsubmit={handleSubmit} class="p-5 space-y-4">
				{#if feedbackMsg}
					<div class="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-mono text-center">
						{feedbackMsg}
					</div>
				{/if}

				{#if mode === 'register' || mode === 'profile'}
					<div>
						<label for="name-input" class="block text-xs font-mono text-zinc-400 mb-1">Full Name / Callsign</label>
						<input
							id="name-input"
							type="text"
							required
							bind:value={name}
							placeholder="e.g. Anita Speaks"
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
						/>
					</div>
				{/if}

				<div>
					<label for="email-input" class="block text-xs font-mono text-zinc-400 mb-1">Email Address</label>
					<input
						id="email-input"
						type="email"
						required
						bind:value={email}
						placeholder="curator@anitasunderground.ai"
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
					/>
				</div>

				{#if mode !== 'profile'}
					<div>
						<label for="password-input" class="block text-xs font-mono text-zinc-400 mb-1">Passphrase</label>
						<input
							id="password-input"
							type="password"
							required
							bind:value={password}
							placeholder="••••••••••••"
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
						/>
					</div>
				{/if}

				<!-- Role & Permissions Selector -->
				<div>
					<label for="role-select" class="block text-xs font-mono text-zinc-400 mb-1">Account Role & Rights</label>
					<div class="grid grid-cols-3 gap-2">
						<button
							type="button"
							onclick={() => (selectedRole = 'viewer')}
							class="p-2 rounded-xl border text-left transition-all cursor-pointer {selectedRole === 'viewer'
								? 'bg-zinc-800 border-emerald-500/80 text-emerald-300'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}"
						>
							<div class="text-[11px] font-mono font-bold">Viewer</div>
							<div class="text-[9px] text-zinc-500 leading-tight mt-0.5">Read & share clips</div>
						</button>

						<button
							type="button"
							onclick={() => (selectedRole = 'curator')}
							class="p-2 rounded-xl border text-left transition-all cursor-pointer {selectedRole === 'curator'
								? 'bg-zinc-800 border-emerald-500/80 text-emerald-300'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}"
						>
							<div class="text-[11px] font-mono font-bold">Curator</div>
							<div class="text-[9px] text-zinc-500 leading-tight mt-0.5">Ingest & tag media</div>
						</button>

						<button
							type="button"
							onclick={() => (selectedRole = 'admin')}
							class="p-2 rounded-xl border text-left transition-all cursor-pointer {selectedRole === 'admin'
								? 'bg-zinc-800 border-emerald-500/80 text-emerald-300'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}"
						>
							<div class="text-[11px] font-mono font-bold">Admin</div>
							<div class="text-[9px] text-zinc-500 leading-tight mt-0.5">Full publish & team</div>
						</button>
					</div>
				</div>

				<div class="pt-2">
					<button
						type="submit"
						class="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs transition-all active:scale-98 cursor-pointer shadow-md shadow-emerald-950"
					>
						{mode === 'profile' ? 'SAVE SETTINGS' : mode === 'register' ? 'CREATE ACCOUNT' : 'AUTHENTICATE'}
					</button>
				</div>

				<!-- Mode toggle links -->
				<div class="text-center pt-2 text-xs font-mono text-zinc-400">
					{#if mode === 'login'}
						<span>Don't have an account? </span>
						<button
							type="button"
							onclick={() => (mode = 'register')}
							class="text-emerald-400 hover:underline cursor-pointer"
						>
							Register
						</button>
					{:else if mode === 'register'}
						<span>Already registered? </span>
						<button
							type="button"
							onclick={() => (mode = 'login')}
							class="text-emerald-400 hover:underline cursor-pointer"
						>
							Log In
						</button>
					{/if}
				</div>
			</form>
		</div>
	</div>
{/if}
