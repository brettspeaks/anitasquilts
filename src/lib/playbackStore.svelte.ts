class PlaybackStore {
	activeVideoId = $state<string | null>(null);

	play(videoId: string) {
		this.activeVideoId = videoId;
	}

	pause(videoId?: string) {
		if (!videoId || this.activeVideoId === videoId) {
			this.activeVideoId = null;
		}
	}

	isPlaying(videoId: string): boolean {
		return this.activeVideoId === videoId;
	}
}

export const playbackStore = new PlaybackStore();
