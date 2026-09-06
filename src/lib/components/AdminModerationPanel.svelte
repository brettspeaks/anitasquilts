<script lang="ts">
	import { adminStore } from '$lib/adminStore.svelte';
	import { authState } from '$lib/authStore.svelte';
	import type { UserRole, UserAccountStatus, VideoRecord, SourceProvider } from '$lib/types';

	let searchQuery = $state('');
	let statusFilter = $state<UserAccountStatus | 'all'>('all');
	let roleFilter = $state<UserRole | 'all'>('all');
	let postSearch = $state('');
	let selectedProviderFilter = $state<string>('all');
	let rejectingPostId = $state<string | null>(null);
	let rejectReason = $state('Flagged: Quality or copyright verification needed');

	const user = $derived(authState.user);
	const isAdmin = $derived(authState.activeRole === 'admin');
	const isOpen = $derived(adminStore.isOpen);
	const activeTab = $derived(adminStore.activeTab);
	const pendingCount = $derived(adminStore.pendingReviewsCount);
	const pendingUsersCount = $derived(adminStore.pendingUsersCount);
	const managedUsers = $derived(adminStore.managedUsers);
	const moderationQueue = $derived(adminStore.moderationQueue);
	const auditLogs = $derived(adminStore.auditLogs);
	const notification = $derived(adminStore.actionNotification);

	// Filtered users
	const filteredUsers = $derived.by(() => {
		return managedUsers.filter((u) => {
			const matchesSearch =
				!searchQuery ||
				u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
			const matchesRole = roleFilter === 'all' || u.role === roleFilter;

			return matchesSearch && matchesStatus && matchesRole;
		});
	});

	// Filtered moderation posts
	const filteredPosts = $derived.by(() => {
		return moderationQueue.filter((p) => {
			const matchesSearch =
				!postSearch ||
				(p.artist && p.artist.toLowerCase().includes(postSearch.toLowerCase())) ||
				(p.venue && p.venue.toLowerCase().includes(postSearch.toLowerCase())) ||
				(p.filename && p.filename.toLowerCase().includes(postSearch.toLowerCase())) ||
				p.visual_tags.some((t) => t.toLowerCase().includes(postSearch.toLowerCase()));

			const matchesProvider =
				selectedProviderFilter === 'all' || p.source_provider === selectedProviderFilter;

			return matchesSearch && matchesProvider;
		});
	});

	function close() {
		adminStore.closePanel();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			close();
		}
	}

	function getProviderBadge(provider?: SourceProvider) {
		switch (provider) {
			case 'ios_photos':
				return { label: 'iOS Photos', color: 'bg-zinc-800 text-zinc-200 border-zinc-700' };
			case 'google_drive':
			case 'google_photos':
				return { label: 'Google Drive', color: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60' };
			case 'dropbox':
				return { label: 'Dropbox', color: 'bg-sky-950/80 text-sky-400 border-sky-700/60' };
			case 'onedrive':
				return { label: 'OneDrive', color: 'bg-teal-950/80 text-teal-400 border-teal-700/60' };
			case 'r2_bucket':
			case 's3_bucket':
				return { label: 'R2 / S3 Bucket', color: 'bg-amber-950/80 text-amber-400 border-amber-700/60' };
			default:
				return { label: 'Cloud Stream', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
		}
	}

	function getStatusBadge(status: UserAccountStatus) {
		switch (status) {
			case 'active':
				return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60';
			case 'pending':
				return 'bg-amber-950/80 text-amber-400 border-amber-700/60 animate-pulse';
			case 'suspended':
				return 'bg-red-950/80 text-red-400 border-red-700/60';
			default:
				return 'bg-zinc-800 text-zinc-400 border-zinc-700';
		}
	}

	function handleRejectPrompt(postId: string) {
		rejectingPostId = postId;
	}

	function confirmReject(postId: string) {
		adminStore.rejectPost(postId, rejectReason);
		rejectingPostId = null;
	}

	function cancelReject() {
		rejectingPostId = null;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop Overlay -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-200"
		onclick={close}
	></div>

	<!-- Slide-in Drawer Container -->
	<div
		class="fixed inset-y-0 right-0 max-w-5xl w-full bg-[#08090e] border-l border-zinc-800 shadow-2xl z-50 flex flex-col font-sans text-zinc-200 animate-in slide-in-from-right duration-250"
		role="dialog"
		aria-modal="true"
		aria-labelledby="admin-panel-title"
	>
		<!-- Top Drawer Header -->
		<div class="px-6 py-4 border-b border-zinc-800/90 bg-[#0a0c12] flex items-center justify-between shrink-0">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shadow-inner">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h2 id="admin-panel-title" class="text-base sm:text-lg font-bold text-zinc-100 font-mono tracking-wide">
							ADMIN MODERATION <span class="text-emerald-400">PANEL</span>
						</h2>
						<span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 font-semibold">
							Role: {authState.activeRole}
						</span>
					</div>
					<p class="text-xs text-zinc-400 font-mono mt-0.5">
						Zero-friction content governance, user access moderation & ingestion approval queue
					</p>
				</div>
			</div>

			<!-- Close Button -->
			<button
				type="button"
				onclick={close}
				class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
				title="Close Admin Panel"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Notification Banner -->
		{#if notification}
			<div
				class="px-6 py-2.5 text-xs font-mono flex items-center justify-between border-b transition-all {notification.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80' : notification.type === 'danger' ? 'bg-red-950/90 text-red-300 border-red-800/80' : 'bg-cyan-950/90 text-cyan-300 border-cyan-800/80'}"
			>
				<div class="flex items-center gap-2">
					<span class="w-2 h-2 rounded-full {notification.type === 'success' ? 'bg-emerald-400 animate-ping' : 'bg-red-400 animate-ping'}"></span>
					<span class="font-semibold">{notification.message}</span>
				</div>
				<button
					type="button"
					onclick={() => (adminStore.actionNotification = null)}
					class="text-zinc-400 hover:text-white cursor-pointer font-bold"
				>
					✕
				</button>
			</div>
		{/if}

		<!-- Role Gate Warning (if viewer / non-admin somehow opens) -->
		{#if !isAdmin}
			<div class="m-6 p-5 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200">
				<div class="flex items-start gap-3">
					<svg class="w-6 h-6 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<div>
						<h3 class="font-bold font-mono text-sm text-amber-300">ADMINISTRATIVE PRIVILEGES REQUIRED</h3>
						<p class="text-xs font-mono mt-1 text-amber-200/90">
							Your current active role is <strong class="text-amber-100 uppercase font-semibold">{authState.activeRole}</strong>. You must switch your role to <strong class="text-emerald-400 uppercase font-semibold">ADMIN</strong> to execute approvals and manage users.
						</p>
						<button
							type="button"
							onclick={() => authState.switchRole('admin')}
							class="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold text-xs shadow-sm transition-colors cursor-pointer"
						>
							Switch to Admin Role Now
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Navigation Tabs -->
		<div class="px-6 border-b border-zinc-800 bg-[#0a0c12]/50 flex items-center gap-2 overflow-x-auto shrink-0">
			<button
				type="button"
				onclick={() => (adminStore.activeTab = 'queue')}
				class="flex items-center gap-2 py-3 px-3 border-b-2 font-mono text-xs font-medium cursor-pointer transition-colors whitespace-nowrap {activeTab === 'queue' ? 'border-emerald-500 text-emerald-400 font-bold bg-zinc-900/30' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
				</svg>
				<span>Stream Moderation Queue</span>
				<span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono {pendingCount > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-zinc-800 text-zinc-400'}">
					{pendingCount}
				</span>
			</button>

			<button
				type="button"
				onclick={() => (adminStore.activeTab = 'users')}
				class="flex items-center gap-2 py-3 px-3 border-b-2 font-mono text-xs font-medium cursor-pointer transition-colors whitespace-nowrap {activeTab === 'users' ? 'border-emerald-500 text-emerald-400 font-bold bg-zinc-900/30' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
				<span>User Access & Permissions</span>
				{#if pendingUsersCount > 0}
					<span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40">
						{pendingUsersCount} PENDING
					</span>
				{:else}
					<span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
						{managedUsers.length}
					</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={() => (adminStore.activeTab = 'audit')}
				class="flex items-center gap-2 py-3 px-3 border-b-2 font-mono text-xs font-medium cursor-pointer transition-colors whitespace-nowrap {activeTab === 'audit' ? 'border-emerald-500 text-emerald-400 font-bold bg-zinc-900/30' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
				</svg>
				<span>Audit & Security Log</span>
				<span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
					{auditLogs.length}
				</span>
			</button>
		</div>

		<!-- Drawer Body Content -->
		<div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#08090e]">
			<!-- TAB 1: STREAM MODERATION QUEUE -->
			{#if activeTab === 'queue'}
				<!-- Filter & Controls Toolbar -->
				<div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2">
					<div class="relative flex-1 max-w-md">
						<input
							type="text"
							bind:value={postSearch}
							placeholder="Search pending streams by artist, tag, or venue..."
							class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
						/>
						<svg class="w-4 h-4 text-zinc-500 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>

					<div class="flex items-center gap-2">
						<span class="text-[11px] font-mono text-zinc-500 uppercase">Provider:</span>
						<select
							bind:value={selectedProviderFilter}
							class="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/60"
						>
							<option value="all">All Cloud Providers</option>
							<option value="ios_photos">iOS Photos</option>
							<option value="google_drive">Google Drive</option>
							<option value="dropbox">Dropbox</option>
							<option value="onedrive">OneDrive</option>
							<option value="r2_bucket">Cloudflare R2 / S3</option>
						</select>
					</div>
				</div>

				<!-- Queue List / Grid -->
				{#if filteredPosts.length === 0}
					<!-- Empty State -->
					<div class="py-16 text-center border border-dashed border-zinc-800/80 rounded-2xl bg-zinc-950/40 p-8">
						<div class="w-14 h-14 mx-auto rounded-full bg-emerald-950/60 border border-emerald-600/40 flex items-center justify-center text-emerald-400 mb-3.5">
							<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h3 class="text-sm sm:text-base font-bold font-mono text-zinc-200">Moderation Queue is Clean</h3>
						<p class="text-xs text-zinc-500 font-mono mt-1 max-w-md mx-auto">
							All ingested cloud media streams have been reviewed and published. New favorited uploads from iOS, Google Drive, and Dropbox will populate automatically.
						</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each filteredPosts as post (post.id)}
							{@const providerInfo = getProviderBadge(post.source_provider)}
							<div
								class="rounded-xl bg-[#0d0f17] border border-zinc-800/90 hover:border-zinc-700 p-4 sm:p-5 shadow-lg transition-all flex flex-col lg:flex-row gap-5 items-start justify-between"
							>
								<!-- Left: Post Preview & Metadata -->
								<div class="flex-1 flex flex-col sm:flex-row gap-4 w-full">
									<!-- Thumbnail / Video Mock Preview Container -->
									<div class="w-full sm:w-56 h-36 bg-black rounded-lg border border-zinc-800 overflow-hidden relative shrink-0 group">
										{#if post.thumbnail_url || (post.metadata as any)?.thumbnail_url}
											<img
												src={post.thumbnail_url || (post.metadata as any)?.thumbnail_url}
												alt={post.artist || post.filename}
												class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
												loading="lazy"
											/>
										{:else}
											<video
												src={post.storage_url}
												class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
												preload="metadata"
												muted
											></video>
										{/if}

										<!-- Overlay Badges -->
										<div class="absolute top-2 left-2 flex items-center gap-1.5">
											<span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-500/90 text-black shadow-sm">
												PENDING_APPROVAL
											</span>
										</div>

										<div class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-zinc-300 backdrop-blur-sm border border-zinc-700">
											{(post.file_size ? (post.file_size / (1024 * 1024)).toFixed(1) + ' MB' : 'VIDEO')}
										</div>
									</div>

									<!-- Middle Details: Artist, Venue, AI Tags, Lyrics snippet -->
									<div class="flex-1 min-w-0 space-y-2.5">
										<div class="flex flex-wrap items-center gap-2">
											<span class="px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-semibold {providerInfo.color}">
												{providerInfo.label}
											</span>
											{#if post.owner_name}
												<span class="text-[11px] font-mono text-zinc-400">
													Uploaded by <strong class="text-zinc-200">{post.owner_name}</strong>
												</span>
											{/if}
											<span class="text-[11px] font-mono text-zinc-500">
												• {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
										</div>

										<div>
											<h4 class="text-base font-bold font-mono text-zinc-100 truncate">
												{post.artist || 'Unidentified Artist'}
											</h4>
											<p class="text-xs font-mono text-emerald-400/90 truncate">
												{post.venue || post.filename}
											</p>
										</div>

										<!-- Auto-Generated AI Tags -->
										{#if post.visual_tags && post.visual_tags.length > 0}
											<div class="flex flex-wrap gap-1.5 pt-0.5">
												{#each post.visual_tags as tag}
													<span class="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
														#{tag}
													</span>
												{/each}
											</div>
										{/if}

										<!-- Lyrics preview snippet -->
										{#if post.lyrics_synced && post.lyrics_synced.length > 0}
											<div class="p-2 rounded-lg bg-black/40 border border-zinc-850 text-xs font-mono text-zinc-400">
												<span class="text-emerald-400 font-semibold text-[11px]">Synced Lyrics Snippet:</span>
												<p class="italic text-zinc-300 truncate mt-0.5">
													"{post.lyrics_synced[0].text}"
												</p>
											</div>
										{/if}
									</div>
								</div>

								<!-- Right: Moderation Action Buttons -->
								<div class="w-full lg:w-48 flex lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800/80 pt-3 lg:pt-0 lg:pl-4 justify-end">
									{#if rejectingPostId === post.id}
										<!-- Quarantine Confirmation Submenu -->
										<div class="w-full space-y-2 p-2.5 rounded-lg bg-red-950/40 border border-red-800/80 animate-in fade-in">
											<p class="text-[11px] font-mono font-bold text-red-300">Select Quarantine Reason:</p>
											<select
												bind:value={rejectReason}
												class="w-full p-1.5 rounded bg-zinc-900 border border-red-700/60 text-[11px] font-mono text-zinc-200"
											>
												<option value="Quality below minimum ingestion threshold">Quality threshold</option>
												<option value="Audio copyright conflict / takedown">Copyright conflict</option>
												<option value="Explicit or non-concert content">Non-concert clip</option>
												<option value="Corrupt stream payload">Corrupt media</option>
											</select>
											<div class="flex gap-1.5 pt-1">
												<button
													type="button"
													onclick={() => confirmReject(post.id)}
													class="flex-1 py-1 px-2 rounded bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[10px] cursor-pointer"
												>
													Confirm Reject
												</button>
												<button
													type="button"
													onclick={cancelReject}
													class="py-1 px-2 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] cursor-pointer"
												>
													Cancel
												</button>
											</div>
										</div>
									{:else}
										<!-- Primary Action: Approve & Publish (Green) -->
										<button
											type="button"
											onclick={() => adminStore.approvePost(post.id)}
											class="flex-1 lg:w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-black font-mono font-bold text-xs shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
											</svg>
											<span>Approve & Publish</span>
										</button>

										<!-- Secondary Action: Reject & Quarantine (Red) -->
										<button
											type="button"
											onclick={() => handleRejectPrompt(post.id)}
											class="flex-1 lg:w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-red-950/80 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-700/60 font-mono text-xs transition-colors cursor-pointer"
										>
											<svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
											</svg>
											<span>Reject & Quarantine</span>
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/if}

			<!-- TAB 2: USER ACCESS MODERATION TABLE -->
			{#if activeTab === 'users'}
				<!-- Filters and Search -->
				<div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2">
					<div class="relative flex-1 max-w-md">
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search users by username, name, or email..."
							class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
						/>
						<svg class="w-4 h-4 text-zinc-500 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<!-- Status Filter -->
						<select
							bind:value={statusFilter}
							class="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/60"
						>
							<option value="all">All Statuses</option>
							<option value="active">Active</option>
							<option value="pending">Pending Review</option>
							<option value="suspended">Suspended</option>
						</select>

						<!-- Role Filter -->
						<select
							bind:value={roleFilter}
							class="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/60"
						>
							<option value="all">All Roles</option>
							<option value="admin">Admin</option>
							<option value="curator">Curator</option>
							<option value="viewer">Viewer</option>
						</select>
					</div>
				</div>

				<!-- Users Moderation Data Table -->
				<div class="overflow-x-auto rounded-xl border border-zinc-800 bg-[#0c0e14] shadow-md">
					<table class="w-full text-left border-collapse text-xs font-mono">
						<thead>
							<tr class="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase text-[11px]">
								<th class="py-3 px-4 font-semibold">Username & Name</th>
								<th class="py-3 px-4 font-semibold">Email</th>
								<th class="py-3 px-4 font-semibold">Role</th>
								<th class="py-3 px-4 font-semibold">Status</th>
								<th class="py-3 px-4 font-semibold text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-850">
							{#each filteredUsers as u (u.id)}
								<tr class="hover:bg-zinc-900/50 transition-colors">
									<!-- Username & Name -->
									<td class="py-3.5 px-4">
										<div class="flex items-center gap-2.5">
											<div class="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-emerald-400">
												{u.name ? u.name[0].toUpperCase() : 'U'}
											</div>
											<div>
												<div class="font-bold text-zinc-200">@{u.username}</div>
												<div class="text-[11px] text-zinc-400 font-normal">{u.name}</div>
											</div>
										</div>
									</td>

									<!-- Email -->
									<td class="py-3.5 px-4 text-zinc-300 truncate max-w-xs">
										{u.email}
									</td>

									<!-- Role -->
									<td class="py-3.5 px-4">
										<div class="inline-flex items-center gap-1.5">
											<span class="px-2 py-0.5 rounded border text-[10px] uppercase font-semibold {u.role === 'admin' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60' : u.role === 'curator' ? 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}">
												{u.role}
											</span>
										</div>
									</td>

									<!-- Status -->
									<td class="py-3.5 px-4">
										<span class="px-2 py-0.5 rounded border text-[10px] uppercase font-semibold {getStatusBadge(u.status)}">
											{u.status}
										</span>
									</td>

									<!-- Action Buttons -->
									<td class="py-3.5 px-4 text-right">
										<div class="inline-flex items-center gap-1.5 justify-end">
											{#if u.status === 'pending'}
												<!-- Quick Action: Approve Account -->
												<button
													type="button"
													onclick={() => adminStore.approveUser(u.id)}
													class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
												>
													Approve Account
												</button>
											{/if}

											{#if u.status !== 'suspended'}
												<!-- Quick Action: Suspend User -->
												<button
													type="button"
													onclick={() => adminStore.suspendUser(u.id)}
													class="px-2 py-1 rounded bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-700/50 text-[11px] transition-colors cursor-pointer"
													title="Suspend Account"
												>
													Suspend
												</button>
											{:else}
												<!-- Reactivate -->
												<button
													type="button"
													onclick={() => adminStore.approveUser(u.id)}
													class="px-2 py-1 rounded bg-zinc-800 hover:bg-emerald-950 text-zinc-300 hover:text-emerald-300 border border-zinc-700 text-[11px] transition-colors cursor-pointer"
												>
													Reactivate
												</button>
											{/if}

											{#if u.role !== 'admin'}
												<!-- Quick Action: Promote to Admin -->
												<button
													type="button"
													onclick={() => adminStore.promoteUserToAdmin(u.id)}
													class="px-2 py-1 rounded bg-zinc-900 hover:bg-emerald-950 text-zinc-400 hover:text-emerald-400 border border-zinc-800 hover:border-emerald-700/50 text-[11px] transition-colors cursor-pointer"
													title="Promote to Administrator"
												>
													Promote Admin
												</button>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<!-- TAB 3: AUDIT & SECURITY LOGS -->
			{#if activeTab === 'audit'}
				<div class="space-y-3">
					<div class="flex items-center justify-between pb-2">
						<h3 class="text-xs font-mono font-bold uppercase text-zinc-400">
							Security & Moderation Event History
						</h3>
						<span class="text-[11px] font-mono text-zinc-500">Realtime sync logging</span>
					</div>

					<div class="space-y-2">
						{#each auditLogs as log (log.id)}
							<div class="p-3.5 rounded-lg bg-[#0c0e14] border border-zinc-800/80 flex items-start justify-between font-mono text-xs">
								<div class="space-y-1">
									<div class="flex items-center gap-2">
										<span class="px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold {log.action.includes('approved') ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50' : log.action.includes('suspended') || log.action.includes('rejected') ? 'bg-red-950 text-red-400 border border-red-700/50' : 'bg-cyan-950 text-cyan-400 border border-cyan-700/50'}">
											{log.action.replace('_', ' ')}
										</span>
										<span class="font-bold text-zinc-200">{log.target_title}</span>
									</div>
									{#if log.details}
										<p class="text-[11px] text-zinc-400">{log.details}</p>
									{/if}
									<p class="text-[10px] text-zinc-500">
										Executed by <strong class="text-zinc-300">{log.admin_name}</strong>
									</p>
								</div>
								<span class="text-[10px] text-zinc-500 whitespace-nowrap">
									{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Drawer Footer -->
		<div class="px-6 py-3 border-t border-zinc-800 bg-[#0a0c12] flex items-center justify-between font-mono text-xs text-zinc-400 shrink-0">
			<div class="flex items-center gap-2">
				<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
				<span>Connected as <strong class="text-zinc-200">{user?.name || 'Anita S.'}</strong> ({authState.activeRole.toUpperCase()})</span>
			</div>
			<button
				type="button"
				onclick={close}
				class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
			>
				Close Panel
			</button>
		</div>
	</div>
{/if}
