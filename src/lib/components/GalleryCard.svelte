<script lang="ts">
	import { getGalleryService } from '$lib/services/gallery.svelte';
	import { viewFilter } from '$lib/utils/view-filter.svelte';
	import { getStyle } from '$lib/utils/style.svelte';
	import type { GalleryImage } from '$lib/types/gallery';
	import { Heart } from 'lucide-svelte';

	interface Props {
		image: GalleryImage;
		onclick?: () => void;
	}

	let { image, onclick }: Props = $props();
	const galleryService = getGalleryService();
	const style = getStyle();

	let showDeleteMenu = $state(false);
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;

	function handleCardClick() {
		onclick?.();
	}

	async function handleFavoriteClick(event: MouseEvent) {
		event.stopPropagation();
		await galleryService.toggleFavorite(image.id);
	}

	function handleLongPressStart() {
		longPressTimer = setTimeout(() => {
			showDeleteMenu = true;
		}, 500);
	}

	function handleLongPressEnd() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	async function handleDelete(event: MouseEvent) {
		event.stopPropagation();
		await galleryService.removeImage(image.id);
		showDeleteMenu = false;
	}

	function handleMenuClickOutside(event: MouseEvent) {
		if (!event.target) return;
		const target = event.target as HTMLElement;
		if (!target.closest('[data-delete-menu]')) {
			showDeleteMenu = false;
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative group cursor-pointer overflow-hidden bg-surface-500/5 border border-surface-300/10 rounded-lg hover:border-primary-500/50 transition-all {style.mode === 'brutalist' ? 'brutalist-card' : ''}"
	role="button"
	tabindex="0"
	onclick={handleCardClick}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
	onmousedown={handleLongPressStart}
	onmouseup={handleLongPressEnd}
	onmouseleave={handleLongPressEnd}
	ontouchstart={handleLongPressStart}
	ontouchend={handleLongPressEnd}
>
	<!-- Thumbnail -->
	<div class="aspect-square overflow-hidden">
		<img
			src={image.thumbnail}
			alt={image.name}
			class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
			style="filter: {viewFilter.css};"
		/>
	</div>

	<!-- Favorite Button -->
	<button
		onclick={handleFavoriteClick}
		class="absolute top-2 right-2 p-2 bg-surface-950/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity {style.mode === 'brutalist' ? '!rounded-none !p-1 brutalist-button !bg-surface-950' : ''}"
		aria-label={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
	>
		<Heart size={18} fill={image.isFavorite ? 'currentColor' : 'none'} class={image.isFavorite ? 'text-primary-500' : 'text-surface-300'} />
	</button>

	<!-- Info Overlay -->
	<div
		class="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent {style.mode === 'brutalist' ? '!bg-surface-950/90 !border-t-3 !border-surface-800' : ''}"
	>
		<p class="text-surface-100 text-sm font-medium truncate {style.mode === 'brutalist' ? '!font-code !text-xs !uppercase !tracking-wider' : ''}">
			{image.name}
		</p>
	</div>

	<!-- Delete Menu -->
	{#if showDeleteMenu}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute inset-0 z-50"
			role="button"
			tabindex="-1"
			onclick={handleMenuClickOutside}
			onkeydown={(e) => e.key === 'Escape' ? (showDeleteMenu = false) : null}
		>
			<div
				data-delete-menu
				class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-950 border border-surface-300/10 rounded-xl p-4 shadow-xl {style.mode === 'brutalist' ? 'brutalist-card !rounded-none !shadow-brutal-lg' : ''}"
			>
				<p class="text-surface-100 text-sm mb-3 {style.mode === 'brutalist' ? '!font-code !uppercase !tracking-wider' : ''}">
					Are you sure you want to delete this image?
				</p>
				<div class="flex gap-2">
					<button
						onclick={() => (showDeleteMenu = false)}
						class="flex-1 px-3 py-2 bg-surface-500/5 text-surface-300 border border-surface-300/10 rounded-lg hover:bg-surface-400/10 transition-colors text-sm {style.mode === 'brutalist' ? 'brutalist-button !rounded-none' : ''}"
					>
						Cancel
					</button>
					<button
						onclick={handleDelete}
						class="flex-1 px-3 py-2 bg-primary-500/20 text-primary-400 border border-primary-500/50 rounded-lg hover:bg-primary-500/30 transition-colors text-sm {style.mode === 'brutalist' ? 'brutalist-button !rounded-none' : ''}"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
