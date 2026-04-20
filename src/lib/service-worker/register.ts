/**
 * Service worker registration for the client
 * The @vite-pwa/sveltekit plugin automatically registers the service worker
 * This file can be used for custom SW management if needed
 */

export function registerSW(): void {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
		return;
	}

	// The service worker is automatically registered by @vite-pwa/sveltekit
	// Listen for service worker updates
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			// Service worker has been updated
			console.log('Service worker updated');
		});
	}
}

export function getRegistration(): Promise<ServiceWorkerRegistration | null> {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
		return Promise.resolve(null);
	}
	return navigator.serviceWorker.getRegistration() as Promise<ServiceWorkerRegistration | null>;
}
