<script lang="ts">
	import { requestScreenWakeLock, releaseScreenWakeLock } from '$lib/wakeLock';
	import { getOrCreateDeviceSessionToken } from '$lib/deviceSession';
	import type { VideoRecord, PresignUploadResponse } from '$lib/types';

	interface Props {
		onUploadStart: (video: VideoRecord) => void;
		onUploadProgress: (videoId: string, progress: number) => void;
		onUploadComplete: (videoId: string, readyVideo?: VideoRecord) => void;
		onUploadError: (videoId: string, error: string) => void;
	}

	let { onUploadStart, onUploadProgress, onUploadComplete, onUploadError }: Props = $props();

	let fileInput: HTMLInputElement | null = $state(null);
	let isUploading = $state(false);
	let currentProgress = $state(0);
	let currentFileName = $state('');
	let uploadSpeed = $state('');
	let statusMessage = $state('');
	let isDragging = $state(false);
	let isWakeLockActive = $state(false);

	function handleButtonClick() {
		fileInput?.click();
	}

	async function handleFileSelected(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		await startUpload(file);
		// Reset input so same file can be re-selected if needed
		if (fileInput) fileInput.value = '';
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		const file = event.dataTransfer?.files?.[0];
		if (file && file.type.startsWith('video/')) {
			startUpload(file);
		}
	}

	async function startUpload(file: File) {
		if (isUploading) return;

		if (typeof navigator !== 'undefined' && !navigator.onLine) {
			alert('Device is currently offline. Please reconnect to cellular or Wi-Fi.');
			return;
		}

		isUploading = true;
		currentProgress = 0;
		currentFileName = file.name;
		statusMessage = 'Requesting secure upload slot...';

		// 1. Prevent iOS/Android screen sleep during upload
		const wakeLockAcquired = await requestScreenWakeLock();
		isWakeLockActive = wakeLockAcquired;

		// 2. Prepare Optimistic UI placeholder card
		const localPreviewUrl = URL.createObjectURL(file);
		const tempId = 'temp_' + Date.now();
		const deviceToken = getOrCreateDeviceSessionToken();

		const optimisticVideo: VideoRecord = {
			id: tempId,
			device_session_token: deviceToken,
			filename: file.name,
			storage_key: `pending/${file.name}`,
			storage_url: localPreviewUrl,
			file_size: file.size,
			mime_type: file.type || 'video/mp4',
			status: 'uploading',
			visual_tags: ['Uploading...'],
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			localPreviewUrl,
			uploadProgress: 0,
			isOptimistic: true
		};

		// Immediately render local placeholder card
		onUploadStart(optimisticVideo);

		try {
			// 3. Request Presigned Upload URL from SvelteKit backend
			const presignRes = await fetch('/api/upload/presign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filename: file.name,
					fileType: file.type || 'video/mp4',
					fileSize: file.size,
					deviceSessionToken: deviceToken
				})
			});

			if (!presignRes.ok) {
				const errData = await presignRes.json().catch(() => ({}));
				throw new Error(errData.error || 'Failed to acquire upload authorization');
			}

			const presignData: PresignUploadResponse = await presignRes.json();
			const activeVideoId = presignData.videoId || tempId;

			// 4. Direct upload to R2/S3 using XMLHttpRequest for accurate progress tracking
			statusMessage = 'Uploading directly to high-speed storage...';
			await uploadDirectlyToS3(file, presignData.uploadUrl, (progress, speed) => {
				currentProgress = progress;
				uploadSpeed = speed;
				onUploadProgress(activeVideoId, progress);
				onUploadProgress(tempId, progress);
			});

			statusMessage = 'Upload complete! Analyzing concert video with Gemini AI...';
			currentProgress = 100;

			// 5. Trigger AI Tagging Serverless Worker / Webhook
			const processRes = await fetch('/api/process-video', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					videoId: presignData.videoId,
					storageKey: presignData.storageKey,
					storageUrl: presignData.publicUrl,
					mimeType: file.type || 'video/mp4'
				})
			});

			let analyzedVideo: VideoRecord | undefined;
			if (processRes.ok) {
				const processData = await processRes.json();
				analyzedVideo = processData.video;
			}

			onUploadComplete(tempId, analyzedVideo);
			if (activeVideoId !== tempId) {
				onUploadComplete(activeVideoId, analyzedVideo);
			}

			statusMessage = 'AI analysis finished!';
		} catch (error: any) {
			console.error('Upload error:', error);
			const errorMsg = error?.message || 'Upload failed. Please check network and retry.';
			statusMessage = errorMsg;
			onUploadError(tempId, errorMsg);
		} finally {
			isUploading = false;
			await releaseScreenWakeLock();
			isWakeLockActive = false;
			setTimeout(() => {
				if (!isUploading) {
					statusMessage = '';
					currentProgress = 0;
					currentFileName = '';
				}
			}, 4000);
		}
	}

	function uploadDirectlyToS3(
		file: File,
		uploadUrl: string,
		onProgress: (percent: number, speedText: string) => void
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			const startTime = Date.now();

			xhr.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					const percent = Math.round((e.loaded / e.total) * 100);
					const elapsedSeconds = (Date.now() - startTime) / 1000;
					const bytesPerSecond = elapsedSeconds > 0 ? e.loaded / elapsedSeconds : 0;
					const mbPerSecond = (bytesPerSecond / (1024 * 1024)).toFixed(1);
					const speedText = `${mbPerSecond} MB/s`;
					onProgress(percent, speedText);
				}
			});

			xhr.addEventListener('load', () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					resolve();
				} else {
					reject(new Error(`Storage rejected upload with HTTP ${xhr.status}: ${xhr.statusText}`));
				}
			});

			xhr.addEventListener('error', () => {
				reject(new Error('Network error during direct S3/R2 storage upload.'));
			});

			xhr.addEventListener('abort', () => {
				reject(new Error('Upload was aborted.'));
			});

			xhr.open('PUT', uploadUrl, true);
			xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
			xhr.send(file);
		});
	}
</script>

<div
	class="w-full max-w-xl mx-auto my-6 px-4"
	role="region"
	aria-label="Quilt video upload area"
>
	<!-- Hidden File Input for iOS/Android camera roll and file picker -->
	<input
		type="file"
		accept="video/*"
		capture="environment"
		class="hidden"
		bind:this={fileInput}
		onchange={handleFileSelected}
		disabled={isUploading}
	/>

	<!-- Drag and drop zone / Master single button -->
	<div
		class="relative overflow-hidden rounded-3xl border-2 transition-all duration-300 shadow-2xl {isDragging
			? 'border-pink-500 bg-pink-950/40 scale-[1.01]'
			: 'border-indigo-900/60 bg-slate-950/85 backdrop-blur-xl hover:border-pink-500/40 shadow-indigo-950/50'}"
		ondragover={(e) => {
			e.preventDefault();
			isDragging = true;
		}}
		ondragleave={() => (isDragging = false)}
		ondrop={handleDrop}
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleButtonClick();
			}
		}}
	>
		<!-- Glow Accent Background -->
		<div
			class="pointer-events-none absolute -inset-px opacity-30 blur-2xl transition-opacity duration-500 {isUploading
				? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-500 opacity-60 animate-pulse'
				: 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20'}"
		></div>

		<div class="relative p-6 sm:p-8 flex flex-col items-center text-center">
			<!-- Upload Button Master CTA (High Contrast) -->
			<button
				type="button"
				onclick={handleButtonClick}
				disabled={isUploading}
				class="group w-full py-5 px-8 rounded-2xl font-black text-lg sm:text-xl text-white shadow-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer border border-white/20 {isUploading
					? 'bg-slate-800 text-slate-400 cursor-not-allowed border-transparent'
					: 'bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:from-pink-500 hover:via-rose-400 hover:to-amber-400 hover:shadow-pink-500/35 hover:scale-[1.01] active:scale-[0.98]'}"
			>
				{#if isUploading}
					<svg class="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span class="text-white drop-shadow-sm">Uploading ({currentProgress}%)</span>
				{:else}
					<svg
						class="w-7 h-7 text-white drop-shadow-sm group-hover:scale-110 transition-transform"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.6"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						></path>
					</svg>
					<span class="tracking-tight drop-shadow-md text-white font-black">Upload Quilt Video</span>
				{/if}
			</button>

			<!-- Subtitle / iOS WakeLock Badge -->
			<div class="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
				<span>Tap to record or pick from gallery</span>
				<span class="text-slate-500">•</span>
				<span>Direct to S3/R2</span>
				{#if isWakeLockActive}
					<span class="text-slate-500">•</span>
					<span class="inline-flex items-center gap-1 text-emerald-300 font-medium bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/60">
						<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
								clip-rule="evenodd"
							></path>
						</svg>
						Screen Awake
					</span>
				{/if}
			</div>

			<!-- Live Upload Progress Card -->
			{#if isUploading || statusMessage}
				<div class="w-full mt-5 pt-4 border-t border-slate-800/80 text-left">
					<div class="flex justify-between items-center text-xs mb-1.5 font-medium">
						<span class="text-slate-200 truncate max-w-[200px]">{currentFileName || 'Processing video...'}</span>
						<span class="text-pink-400 font-mono font-bold">{currentProgress}% {uploadSpeed ? `(${uploadSpeed})` : ''}</span>
					</div>

					<!-- Progress bar -->
					<div class="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
						<div
							class="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 rounded-full transition-all duration-200"
							style="width: {currentProgress}%"
						></div>
					</div>

					{#if statusMessage}
						<p class="mt-2 text-xs text-slate-300 flex items-center gap-1.5">
							<span class="inline-block w-2 h-2 rounded-full {isUploading ? 'bg-pink-400 animate-ping' : 'bg-emerald-400'}"></span>
							{statusMessage}
						</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
