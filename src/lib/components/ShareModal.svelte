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
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
		<!-- Backdrop click to close -->
		<button
			type="button"
			class="absolute inset-0 bg-transparent cursor-default w-full h-full border-none outline-none"
			onclick={onClose}
			aria-label="Close modal"
		></button>

		<!-- Modal Dialog Box -->
		<div class="relative w-full max-w-lg bg-[#16181e] border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 text-zinc-100 font-sans">
			<!-- Modal Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-zinc-750 bg-[#121316]/90">
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-600/50">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
						</svg>
					</div>
					<div>
						<h3 class="text-base font-bold text-zinc-100">Share Concert Tape</h3>
						<p class="text-xs text-zinc-300 truncate max-w-xs">{video.artist || video.filename}</p>
					</div>
				</div>

				<button
					type="button"
					onclick={onClose}
					class="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
					aria-label="Close modal"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Navigation Tabs -->
			<div class="flex border-b border-zinc-750 bg-zinc-900/60 px-5 pt-2.5 gap-2 text-sm">
				<button
					type="button"
					onclick={() => (activeTab = 'link')}
					class="px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer {activeTab === 'link'
						? 'border-amber-400 text-amber-300'
						: 'border-transparent text-zinc-400 hover:text-zinc-200'}"
				>
					Public Link
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'invite')}
					class="px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer {activeTab === 'invite'
						? 'border-amber-400 text-amber-300'
						: 'border-transparent text-zinc-400 hover:text-zinc-200'}"
				>
					Invite People ({currentShares.length})
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'embed')}
					class="px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer {activeTab === 'embed'
						? 'border-amber-400 text-amber-300'
						: 'border-transparent text-zinc-400 hover:text-zinc-200'}"
				>
					Embed Player
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6 space-y-4">
				{#if activeTab === 'link'}
					<!-- Public Share Link Tab -->
					<div class="space-y-4">
						<div>
							<label for="share-url-input" class="block text-sm text-zinc-300 mb-1.5 font-medium">Direct Tape Link</label>
							<div class="flex items-center gap-2">
								<input
									id="share-url-input"
									type="text"
									readonly
									value={publicShareUrl}
									class="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
								/>
								<button
									type="button"
									onclick={copyShareLink}
									class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0 shadow-md"
								>
									{isCopiedLink ? 'COPIED!' : 'COPY LINK'}
								</button>
							</div>
						</div>

						<!-- Security & Expiration Settings -->
						<div class="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-750 space-y-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span class="text-sm text-zinc-200">Link Expiration</span>
								</div>
								<select
									bind:value={expirationOption}
									class="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
								>
									<option value="never">Never expires</option>
									<option value="24h">24 Hours</option>
									<option value="7d">7 Days</option>
									<option value="30d">30 Days</option>
								</select>
							</div>

							<div class="pt-2 border-t border-zinc-750 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
									<span class="text-sm text-zinc-200">Passphrase Protection</span>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" bind:checked={isPasswordProtected} class="sr-only peer" />
									<div class="w-10 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
								</label>
							</div>

							{#if isPasswordProtected}
								<div class="pt-1">
									<input
										type="password"
										bind:value={sharePassword}
										placeholder="Set passphrase to unlock video..."
										class="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
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
								placeholder="Enter teammate or band email..."
								class="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
							/>
							<div class="flex gap-2">
								<select
									bind:value={invitePermission}
									class="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
								>
									<option value="view">Can View</option>
									<option value="annotate">Can Annotate</option>
								</select>
								<button
									type="submit"
									class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md"
								>
									INVITE
								</button>
							</div>
						</form>

						<!-- Current Invited Members List -->
						<div class="space-y-2 max-h-48 overflow-y-auto pr-1">
							<p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Access List</p>

							<!-- Owner row -->
							<div class="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-zinc-750">
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 rounded-xl bg-amber-950 text-amber-300 border border-amber-700/60 flex items-center justify-center text-xs font-bold">
										{authState.user?.name ? authState.user.name[0].toUpperCase() : 'A'}
									</div>
									<div>
										<p class="text-sm text-zinc-200 font-medium">{authState.user?.name || 'Anita S.'} (You)</p>
										<p class="text-xs text-zinc-400">{authState.user?.email || 'anita@underground.ai'}</p>
									</div>
								</div>
								<span class="px-2.5 py-1 rounded-lg text-xs bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium">
									Owner
								</span>
							</div>

							<!-- Invited Members -->
							{#each currentShares as share (share.id)}
								<div class="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/50 border border-zinc-750 hover:border-zinc-700 transition-colors">
									<div class="flex items-center gap-3 min-w-0">
										<div class="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xs font-bold shrink-0">
											{share.shared_with_email ? share.shared_with_email[0].toUpperCase() : 'U'}
										</div>
										<div class="min-w-0">
											<p class="text-sm text-zinc-200 truncate">{share.shared_with_email}</p>
											<p class="text-xs text-zinc-400">Invited via tape link</p>
										</div>
									</div>

									<div class="flex items-center gap-2 shrink-0">
										<span class="px-2.5 py-1 rounded-lg text-xs {share.permission === 'annotate' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}">
											{share.permission === 'annotate' ? 'Can Annotate' : 'Can View'}
										</span>
										<button
											type="button"
											onclick={() => removeShare(share.id)}
											class="p-1.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
											title="Revoke access"
											aria-label="Revoke user access"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
						<p class="text-sm text-zinc-300">
							Embed this concert tape player with full synced song lyrics into external websites, blogs, or setlist pages.
						</p>

						<div class="relative">
							<textarea
								readonly
								rows="4"
								value={embedSnippet}
								class="w-full p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
							></textarea>
						</div>

						<div class="flex justify-end">
							<button
								type="button"
								onclick={copyEmbedSnippet}
								class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5"
							>
								{#if isCopiedEmbed}
									<span>SNIPPET COPIED!</span>
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
			<div class="px-6 py-4 border-t border-zinc-750 bg-[#121316]/90 flex items-center justify-between text-xs">
				<div class="flex items-center gap-2 text-zinc-300">
					<span class="w-2 h-2 rounded-full {video.visibility === 'public' ? 'bg-amber-400' : video.visibility === 'team' ? 'bg-cyan-400' : 'bg-zinc-500'}"></span>
					<span class="capitalize font-medium">Access: {video.visibility}</span>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors cursor-pointer"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
