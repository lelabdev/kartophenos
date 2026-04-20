/**
 * PWA utility - Svelte 5 rune-based PWA install prompt and status management
 */

declare global {
	interface WindowEventMap {
		beforeinstallprompt: BeforeInstallPromptEvent;
	}
}

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let canInstall = $state(false);
let isOnline = $state(true);
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isInstalled = $state(false);

function init() {
	if (typeof window === 'undefined') return;

	// Check if app is already installed
	if (window.matchMedia('(display-mode: standalone)').matches) {
		isInstalled = true;
	}

	// Listen for beforeinstallprompt
	window.addEventListener('beforeinstallprompt', (event) => {
		event.preventDefault();
		deferredPrompt = event as BeforeInstallPromptEvent;
		canInstall = true;
	});

	// Listen for app installed
	window.addEventListener('appinstalled', () => {
		canInstall = false;
		deferredPrompt = null;
		isInstalled = true;
	});

	// Listen for online/offline events
	window.addEventListener('online', () => {
		isOnline = true;
	});
	window.addEventListener('offline', () => {
		isOnline = false;
	});

	// Set initial online status
	isOnline = navigator.onLine;
}

async function promptInstall(): Promise<boolean> {
	if (!deferredPrompt || !canInstall) {
		return false;
	}
	try {
		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			canInstall = false;
			deferredPrompt = null;
		}
		return outcome === 'accepted';
	} catch {
		return false;
	}
}

/**
 * Service worker registration
 * This will be called by the @vite-pwa/sveltekit plugin automatically
 */
async function registerSW(): Promise<void> {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
		return;
	}
	try {
		// The service worker is automatically registered by @vite-pwa/sveltekit
		// This function can be used for additional SW management if needed
	} catch {
		// Ignore if SW registration fails
	}
}

export const pwaStore = {
	get canInstall() {
		return canInstall;
	},
	get isOnline() {
		return isOnline;
	},
	get isInstalled() {
		return isInstalled;
	},
	init,
	promptInstall,
	registerSW
};
