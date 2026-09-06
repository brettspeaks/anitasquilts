<script lang="ts">
	import { authState } from '$lib/authStore.svelte';
	import { adminStore } from '$lib/adminStore.svelte';
	import type { UserRole } from '$lib/types';
	import AuthModal from './AuthModal.svelte';
	import WorkspaceModal from './WorkspaceModal.svelte';

	let isMenuOpen = $state(false);
	let isAuthModalOpen = $state(false);
	let authModalMode = $state<'login' | 'register' | 'profile'>('login');
	let isWorkspaceModalOpen = $state(false);

	const user = $derived(authState.user);
	const activeWorkspace = $derived(authState.activeWorkspace);
	const activeRole = $derived(authState.activeRole);

	const roleBadgeColor = $derived.by(() => {
		switch (activeRole) {
			case 'admin':
				return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60';
			case 'curator':
				return 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60';
			case 'viewer':
			default:
				return 'bg-zinc-800 text-zinc-400 border-zinc-700';
		}
	});

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function openLogin() {
		authModalMode = 'login';
		isAuthModalOpen = true;
		isMenuOpen = false;
	}

	function openRegister() {
		authModalMode = 'register';
		isAuthModalOpen = true;
		isMenuOpen = false;
	}

	function openProfile() {
		authModalMode = 'profile';
		isAuthModalOpen = true;
		isMenuOpen = false;
	}

	function openWorkspaces() {
		isWorkspaceModalOpen = true;
		isMenuOpen = false;
	}

	function handleRoleSelect(role: UserRole) {
		authState.switchRole(role);
	}

	function handleSignOut() {
		authState.logout();
		isMenuOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.user-menu-container')) {
			isMenuOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative user-menu-container flex items-center">
	{#if user}
		<!-- Authenticated User Avatar Trigger -->
		<button
			type="button"
			onclick={toggleMenu}
			class="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
			aria-expanded={isMenuOpen}
			aria-haspopup="true"
		>
			<!-- Avatar with status indicator dot -->
			<div class="relative">
				<div class="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-mono font-bold text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
					{user.name ? user.name[0].toUpperCase() : 'A'}
				</div>
				<span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#07080c]"></span>
			</div>

			<!-- User Name & Role badge -->
			<div class="hidden sm:flex flex-col text-left leading-none">
				<span class="text-xs font-mono font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors">
					{user.name}
				</span>
				<span class="text-[9px] font-mono text-zinc-500 uppercase">
					{activeRole}
				</span>
			</div>

			<!-- Chevron -->
			<svg
				class="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 {isMenuOpen ? 'rotate-180' : ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	{:else}
		<!-- Unauthenticated Login/Register Trigger -->
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={openLogin}
				class="px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-300 hover:text-emerald-400 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
			>
				Sign In
			</button>
			<button
				type="button"
				onclick={openRegister}
				class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-colors cursor-pointer"
			>
				Join
			</button>
		</div>
	{/if}

	<!-- Dropdown Menu -->
	{#if isMenuOpen && user}
		<div
			class="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#0c0e14] border border-zinc-800 shadow-2xl shadow-emerald-950/40 p-1.5 z-50 text-zinc-200 font-sans animate-in fade-in slide-in-from-top-1 duration-150"
		>
			<!-- User Header & Details -->
			<div class="px-3 py-2.5 border-b border-zinc-800/80 mb-1">
				<div class="flex items-center justify-between">
					<p class="text-xs font-mono font-bold text-zinc-100 truncate">{user.name}</p>
					<span class="px-1.5 py-0.2 rounded border text-[9px] font-mono uppercase font-semibold {roleBadgeColor}">
						{activeRole}
					</span>
				</div>
				<p class="text-[11px] font-mono text-zinc-400 truncate mt-0.5">{user.email}</p>
			</div>

			<!-- Active Workspace info -->
			<div class="px-2 py-1.5 mb-1 bg-zinc-950/50 rounded-lg border border-zinc-850">
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-mono text-zinc-500 uppercase">Active Workspace</span>
					<button
						type="button"
						onclick={openWorkspaces}
						class="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
					>
						Switch
					</button>
				</div>
				<p class="text-xs font-mono text-zinc-300 font-medium truncate mt-0.5">{activeWorkspace.name}</p>
			</div>

			<!-- Fast Role Switcher (Viewer / Curator / Admin) for Instant Preview -->
			<div class="px-2 py-1 mb-1">
				<p class="text-[10px] font-mono text-zinc-500 uppercase mb-1">Quick Role Switch</p>
				<div class="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
					<button
						type="button"
						onclick={() => handleRoleSelect('viewer')}
						class="py-1 rounded border transition-colors cursor-pointer {activeRole === 'viewer' ? 'bg-zinc-800 text-zinc-200 border-zinc-600' : 'bg-zinc-900/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'}"
					>
						Viewer
					</button>
					<button
						type="button"
						onclick={() => handleRoleSelect('curator')}
						class="py-1 rounded border transition-colors cursor-pointer {activeRole === 'curator' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-zinc-900/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'}"
					>
						Curator
					</button>
					<button
						type="button"
						onclick={() => handleRoleSelect('admin')}
						class="py-1 rounded border transition-colors cursor-pointer {activeRole === 'admin' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-zinc-900/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'}"
					>
						Admin
					</button>
				</div>
			</div>

			<div class="border-t border-zinc-800/80 my-1"></div>

			<!-- Admin Moderation Panel Shortcut (Visible to Admin) -->
			{#if activeRole === 'admin'}
				<button
					type="button"
					onclick={() => {
						adminStore.openPanel('queue');
						isMenuOpen = false;
					}}
					class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/50 hover:border-emerald-600/60 transition-colors text-left cursor-pointer mb-1 shadow-sm"
				>
					<div class="flex items-center gap-2">
						<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/>
						</svg>
						<span class="font-bold">Admin Moderation</span>
					</div>
					{#if adminStore.pendingReviewsCount > 0}
						<span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-black font-bold">
							{adminStore.pendingReviewsCount}
						</span>
					{/if}
				</button>
			{/if}

			<!-- Menu actions -->
			<button
				type="button"
				onclick={openProfile}
				class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-300 hover:text-emerald-400 hover:bg-zinc-850 transition-colors text-left cursor-pointer"
			>
				<svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
				<span>Profile & Rights Settings</span>
			</button>

			<button
				type="button"
				onclick={openWorkspaces}
				class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-300 hover:text-emerald-400 hover:bg-zinc-850 transition-colors text-left cursor-pointer"
			>
				<svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
				</svg>
				<span>Workspace Management</span>
			</button>

			<div class="border-t border-zinc-800/80 my-1"></div>

			<button
				type="button"
				onclick={handleSignOut}
				class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors text-left cursor-pointer"
			>
				<svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
				</svg>
				<span>Disconnect / Sign Out</span>
			</button>
		</div>
	{/if}
</div>

<!-- Modal Dialogs -->
<AuthModal
	isOpen={isAuthModalOpen}
	initialMode={authModalMode}
	onClose={() => (isAuthModalOpen = false)}
/>

<WorkspaceModal
	isOpen={isWorkspaceModalOpen}
	onClose={() => (isWorkspaceModalOpen = false)}
/>
