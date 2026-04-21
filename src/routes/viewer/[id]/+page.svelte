<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Frown } from 'lucide-svelte';
	import { getGalleryService } from '$lib/services';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import type { GalleryImage, Pin } from '$lib/types/gallery';

	const galleryService = getGalleryService();

	let imageData = $state<GalleryImage | null>(null);
	let fullDataUrl = $state('');
	let loading = $state(true);
	let error = $state('');

	const imageId = $derived(page.params.id);

	$effect(() => {
		const img = galleryService.images.find((i) => i.id === imageId);
		if (img) {
			imageData = img;
			galleryService.getFullSizeDataUrl(img.id).then((url) => {
				fullDataUrl = url;
				loading = false;
			}).catch((err) => {
				console.error('[kartoPhenos] Failed to load full image:', err);
				error = 'Failed to load image';
				loading = false;
			});
		} else {
			loading = false;
		}
	});

	async function handleBack() {
		goto('/');
	}

	async function handleFavoriteToggle(id: string) {
		await galleryService.toggleFavorite(id);
	}

	async function handleAddPin(imageId: string, pin: Pin) {
		await galleryService.addPin(imageId, pin);
	}

	async function handleRemovePin(imageId: string, pinId: string) {
		await galleryService.removePin(imageId, pinId);
	}

	async function handleUpdatePin(
		imageId: string,
		pinId: string,
		updates: Partial<Pin>
	) {
		await galleryService.updatePin(imageId, pinId, updates);
	}
</script>

<svelte:head>
	<title>{imageData?.name ?? 'Image'} - kartoPhenos</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen bg-surface-950 flex items-center justify-center">
		<div class="text-surface-500 animate-pulse">Loading...</div>
	</div>
{:else if imageData && fullDataUrl}
	<ImageViewer
		image={{ ...imageData, dataUrl: fullDataUrl }}
		onBack={handleBack}
		onToggleFavorite={handleFavoriteToggle}
		onAddPin={handleAddPin}
		onRemovePin={handleRemovePin}
		onUpdatePin={handleUpdatePin}
	/>
{:else if error}
	<div class="min-h-screen bg-surface-950 flex items-center justify-center">
		<div class="text-center">
		<p class="text-primary-400 mb-4">{error}</p>
		<button
		onclick={handleBack}
		class="px-6 py-3 bg-primary-500/20 text-primary-400 border border-primary-500/50 rounded-lg hover:bg-primary-500/30 transition-colors"
		>
			Go back
		</button>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-surface-950 flex items-center justify-center">
		<div class="text-center">
			<Frown size={80} class="mx-auto mb-4 text-surface-700" />
			<h2 class="text-xl font-bold text-surface-300 mb-2">Image not found</h2>
			<p class="text-surface-600 mb-6">This image may have been deleted.</p>
			<button
				onclick={handleBack}
				class="px-6 py-3 bg-primary-500/20 text-primary-400 border border-primary-500/50 rounded-lg hover:bg-primary-500/30 transition-colors"
			>
				Go back to gallery
			</button>
		</div>
	</div>
{/if}
