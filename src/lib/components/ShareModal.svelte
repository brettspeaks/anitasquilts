<script lang="ts">
	import type { VideoRecord, MediaShare, SharePermission } from '$lib/types';
	import { authState } from '$lib/authStore.svelte';

	interface Props {
		video: VideoRecord;
		isOpen: boolean;
		onClose: () => void;
		onShareUpdated?: (updatedVideo: VideoRecord) => void;
	}

	let { video, isOpen, onClose, onShareUpdated }: Props = $props();

	let activeTab = $state<'link' | 'invite' | 'embed'>('link');
	let inviteEmail = $state('');
	let invitePermission = $state<SharePermission>('view');
	let expirationOption = $state<'never' | '24h' | '7d' | '30d'>('never');
	let isPasswordProtected = $state(false);
	let sharePassword = $state('');
	let isCopiedLink = $state(false);
	let isCopiedEmbed = $state(false);

	// Mock or live shares list
	let currentShares = $state<MediaShare[]>([]);

	$effect(() => {
		currentShares = video.shares || [
			{
				id: 'share-1',
				video_id: video.id,
				shared_with_email: 'crew@soundstage.fm',
				permission: 'annotate',
				created_at: new Date().toISOString()
			},
			{
				id: 'share-2',
				video_id: video.id,
				shared_with_email: 'scout@underground.org',
				permission: 'view',
				created_at: new Date().toISOString()
			}
		];
	});

	const publicShareUrl = $derived.by(() => {
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://anitasunderground.ai';
		const token = video.share_token || video.id;
		return `${origin}/share/${token}`;
	});

	const embedSnippet = $derived.by(() => {
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://anitasunderground.ai';
		return `<iframe src="${origin}/embed/${video.id}" width="640" height="360" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${video.artist || 'Underground Concert Video'}"></iframe>`;
	});

	async function copyShareLink() {
		try {
			await navigator.clipboard.writeText(publicShareUrl);
			isCopiedLink = true;
			setTimeout(() => (isCopiedLink = false), 2200);
		} catch (err) {
			console.warn('Clipboard write error:', err);
		}
	}

	async function copyEmbedSnippet() {
		try {
			await navigator.clipboard.writeText(embedSnippet);
			isCopiedEmbed = true;
			setTimeout(() => (isCopiedEmbed = false), 2200);
		} catch (err) {
			console.warn('Clipboard write error:', err);
		}
	}

	function handleAddInvite(e: SubmitEvent) {
		e.preventDefault();
		if (!inviteEmail.trim()) return;

		const newShare: MediaShare = {
			id: 'share-' + Math.random().toString(36).substring(2, 8),
			video_id: video.id,
			shared_with_email: inviteEmail.trim().toLowerCase(),
			permission: invitePermission,
			created_at: new Date().toISOString()
		};

		currentShares = [newShare, ...currentShares];
		inviteEmail = '';

		// If video was private, auto-upgrade to shared
		if (video.visibility === 'private') {
			video.visibility = 'team';
		}
		video.shares = currentShares;
		onShareUpdated?.(video);
	}

	function removeShare(shareId: string) {
		currentShares = currentShares.filter((s) => s.id !== shareId);
		video.shares = currentShares;
		onShareUpdated?.(video);
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
		<!-- Backdrop click to close -->
		<button
			type="button"
			class="absolute inset-0 bg-transparent cursor-default w-full h-full border-none outline-none"
			onclick={onClose}
			aria-label="Close modal"
		></button>

		<!-- Modal Dialog Box -->
		<div class="relative w-full max-w-lg bg-[#0c0e14] border border-zinc-800 rounded-2xl shadow-2xl shadow-emerald-950/30 overflow-hidden flex flex-col z-10 text-zinc-200 font-sans">
			<!-- Modal Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-[#07080c]/60">
				<div class="flex items-center gap-2.5">
					<div class="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
						</svg>
					</div>
					<div>
						<h3 class="text-sm font-bold font-mono text-zinc-100">Asset Sharing & Access Control</h3>
						<p class="text-[11px] font-mono text-zinc-400 truncate max-w-xs">{video.artist || video.filename}</p>
					</div>
				</div>

				<button
					type="button"
					onclick={onClose}
					class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
					aria-label="Close modal"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Navigation Tabs -->
			<div class="flex border-b border-zinc-800 bg-zinc-950/40 px-4 pt-2 gap-2 text-xs font-mono">
				<button
					type="button"
					onclick={() => (activeTab = 'link')}
					class="px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer {activeTab === 'link'
						? 'border-emerald-400 text-emerald-300'
						: 'border-transparent text-zinc-400 hover:text-zinc-200'}"
				>
					Public Link
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'invite')}
					class="px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer {activeTab === 'invite'
						? 'border-emerald-400 text-emerald-300'
						: 'border-transparent text-zinc-400 hover:text-zinc-200'}"
				>
					Invite People ({currentShares.length})
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'embed')}
					class="px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer {activeTab === 'embed'
						? 'border-emerald-400 text-emerald-300'
						: 'border-transparent text-zinc-400 hover:text-zinc-200'}"
				>
					Embed Snippet
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-5 space-y-4">
				{#if activeTab === 'link'}
					<!-- Public Share Link Tab -->
					<div class="space-y-4">
						<div>
							<label for="share-url-input" class="block text-xs font-mono text-zinc-400 mb-1.5 font-medium">Public Stream URL</label>
							<div class="flex items-center gap-2">
								<input
									id="share-url-input"
									type="text"
									readonly
									value={publicShareUrl}
									class="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/50"
								/>
								<button
									type="button"
									onclick={copyShareLink}
									class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0 shadow-md shadow-emerald-950"
								>
									{isCopiedLink ? 'COPIED!' : 'COPY LINK'}
								</button>
							</div>
						</div>

						<!-- Security & Expiration Settings -->
						<div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span class="text-xs font-mono text-zinc-300">Link Expiration</span>
								</div>
								<select
									bind:value={expirationOption}
									class="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
								>
									<option value="never">Never expires</option>
									<option value="24h">24 Hours</option>
									<option value="7d">7 Days</option>
									<option value="30d">30 Days</option>
								</select>
							</div>

							<div class="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
									<span class="text-xs font-mono text-zinc-300">Password Protection</span>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" bind:checked={isPasswordProtected} class="sr-only peer" />
									<div class="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
								</label>
							</div>

							{#if isPasswordProtected}
								<div class="pt-1">
									<input
										type="password"
										bind:value={sharePassword}
										placeholder="Set passphrase to unlock video..."
										class="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
									/>
								</div>
							{/if}
						</div>
					</div>
				{:else if activeTab === 'invite'}
					<!-- Granular User Invitations Tab -->
					<div class="space-y-4">
						<form onsubmit={handleAddInvite} class="flex flex-col sm:flex-row gap-2">
							<input
								type="email"
								required
								bind:value={inviteEmail}
								placeholder="Enter teammate or curator email..."
								class="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
							/>
							<div class="flex gap-2">
								<select
									bind:value={invitePermission}
									class="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-500"
								>
									<option value="view">Can View</option>
									<option value="annotate">Can Annotate/Tag</option>
								</select>
								<button
									type="submit"
									class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md"
								>
									INVITE
								</button>
							</div>
						</form>

						<!-- Current Invited Members List -->
						<div class="space-y-2 max-h-48 overflow-y-auto pr-1">
							<p class="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Access List</p>

							<!-- Owner row -->
							<div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
								<div class="flex items-center gap-2.5">
									<div class="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center text-xs font-bold font-mono">
										{authState.user?.name ? authState.user.name[0].toUpperCase() : 'A'}
									</div>
									<div>
										<p class="text-xs font-mono text-zinc-200 font-medium">{authState.user?.name || 'Anita S.'} (You)</p>
										<p class="text-[10px] font-mono text-zinc-400">{authState.user?.email || 'anita@underground.ai'}</p>
									</div>
								</div>
								<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
									Owner / Admin
								</span>
							</div>

							<!-- Invited Members -->
							{#each currentShares as share (share.id)}
								<div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
									<div class="flex items-center gap-2.5 min-w-0">
										<div class="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xs font-bold font-mono shrink-0">
											{share.shared_with_email ? share.shared_with_email[0].toUpperCase() : 'U'}
										</div>
										<div class="min-w-0">
											<p class="text-xs font-mono text-zinc-200 truncate">{share.shared_with_email}</p>
											<p class="text-[10px] font-mono text-zinc-400">Invited via direct share</p>
										</div>
									</div>

									<div class="flex items-center gap-2 shrink-0">
										<span class="px-2 py-0.5 rounded text-[10px] font-mono {share.permission === 'annotate' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}">
											{share.permission === 'annotate' ? 'Can Annotate' : 'Can View'}
										</span>
										<button
											type="button"
											onclick={() => removeShare(share.id)}
											class="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
											title="Revoke access"
											aria-label="Revoke user access"
										>
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else if activeTab === 'embed'}
					<!-- One-Click Embed Snippet Tab -->
					<div class="space-y-3">
						<p class="text-xs font-mono text-zinc-400">
							Embed this live video with Gemini lyric intelligence directly into external websites, blogs, or setlist pages.
						</p>

						<div class="relative">
							<textarea
								readonly
								rows="4"
								value={embedSnippet}
								class="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500 resize-none"
							></textarea>
						</div>

						<div class="flex justify-end">
							<button
								type="button"
								onclick={copyEmbedSnippet}
								class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-950 flex items-center gap-1.5"
							>
								{#if isCopiedEmbed}
									<span>SNIPPET COPIED!</span>
								{:else}
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
									<span>COPY EMBED SNIPPET</span>
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="px-5 py-3 border-t border-zinc-800 bg-[#07080c]/80 flex items-center justify-between text-xs font-mono">
				<div class="flex items-center gap-1.5 text-zinc-400">
					<span class="w-1.5 h-1.5 rounded-full {video.visibility === 'public' ? 'bg-emerald-400' : video.visibility === 'team' ? 'bg-cyan-400' : 'bg-zinc-500'}"></span>
					<span class="capitalize">Current: {video.visibility}</span>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
