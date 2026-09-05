const DEVICE_SESSION_KEY = 'concert_device_session_token';

/**
 * Retrieves the persistent device session token or generates a new one.
 * Stored in localStorage for hands-off, zero-friction authentication on iOS/Android.
 */
export function getOrCreateDeviceSessionToken(): string {
	if (typeof window === 'undefined') {
		return 'ssr-session';
	}

	try {
		let token = localStorage.getItem(DEVICE_SESSION_KEY);
		if (!token) {
			token = generateUUID();
			localStorage.setItem(DEVICE_SESSION_KEY, token);
		}
		return token;
	} catch (e) {
		// Defensive fallback for private browsing / restricted storage
		console.warn('localStorage access restricted, using temporary in-memory session token', e);
		return generateUUID();
	}
}

function generateUUID(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
