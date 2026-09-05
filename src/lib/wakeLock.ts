/**
 * Screen Wake Lock API manager for preventing screen sleep during video uploads on iOS / Android / Desktop.
 */

let activeWakeLock: any = null;
let wakeLockCount = 0;

export async function requestScreenWakeLock(): Promise<boolean> {
	if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
		return false;
	}

	wakeLockCount++;
	if (activeWakeLock !== null) {
		return true;
	}

	try {
		activeWakeLock = await (navigator as any).wakeLock.request('screen');
		activeWakeLock.addEventListener('release', () => {
			activeWakeLock = null;
		});
		return true;
	} catch (err) {
		console.warn('Could not acquire screen wake lock:', err);
		return false;
	}
}

export async function releaseScreenWakeLock(): Promise<void> {
	if (wakeLockCount > 0) {
		wakeLockCount--;
	}

	if (wakeLockCount === 0 && activeWakeLock) {
		try {
			await activeWakeLock.release();
		} catch (err) {
			console.warn('Error releasing screen wake lock:', err);
		} finally {
			activeWakeLock = null;
		}
	}
}

// Re-acquire wake lock if document becomes visible again during active upload
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', async () => {
		if (wakeLockCount > 0 && document.visibilityState === 'visible' && activeWakeLock === null) {
			try {
				if ('wakeLock' in navigator) {
					activeWakeLock = await (navigator as any).wakeLock.request('screen');
					activeWakeLock.addEventListener('release', () => {
						activeWakeLock = null;
					});
				}
			} catch (err) {
				console.warn('Re-acquiring screen wake lock failed:', err);
			}
		}
	});
}
