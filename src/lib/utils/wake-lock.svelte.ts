/**
 * Wake Lock utility - Svelte 5 rune-based screen wake lock management
 * Used during image viewing to keep the screen on
 */

let isLocked = $state(false);
let wakeLock: WakeLockSentinel | null = null;

async function request(): Promise<void> {
	if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
		return;
	}
	try {
		wakeLock = await navigator.wakeLock.request('screen');
		isLocked = true;
		wakeLock.addEventListener('release', () => {
			isLocked = false;
		});
	} catch {
		// Ignore if wake lock is not available or denied
	}
}

async function release(): Promise<void> {
	if (wakeLock) {
		try {
			await wakeLock.release();
		} catch {
			// Ignore if already released
		}
		wakeLock = null;
		isLocked = false;
	}
}

// Reacquire wake lock when visibility changes (if it was locked)
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', async () => {
		if (isLocked && document.visibilityState === 'visible') {
			await request();
		}
	});
}

export const wakeLockStore = {
	get isLocked() {
		return isLocked;
	},
	request,
	release
};
