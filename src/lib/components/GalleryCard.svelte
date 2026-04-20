<script lang="ts">
	import { getGalleryService } from '$lib/services/gallery.svelte';
	import { viewFilter } from '$lib/utils/view-filter.svelte';
	import type { GalleryImage } from '$lib/types/gallery';

	interface Props {
		image: GalleryImage;
		onclick?: () => void;
	}

	let { image, onclick }: Props = $props();
	const galleryService = getGalleryService();

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
	class="relative group cursor-pointer overflow-hidden bg-white/5 border border-white/10 rounded-lg hover:border-red-500/50 transition-all"
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
		class="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
		aria-label={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
	>
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill={image.isFavorite ? 'currentColor' : 'none'}
			stroke="currentColor"
			stroke-width="2"
			class={image.isFavorite ? 'text-red-500' : 'text-white/70'}
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
			/>
		</svg>
	</button>

	<!-- Info Overlay -->
	<div
		class="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent"
	>
		<p class="text-white/90 text-sm font-medium truncate">
			{image.name}
		</p>
		<div class="flex items-center justify-between mt-1">
			<span
				class="text-xs text-red-400/80 px-2 py-0.5 bg-red-500/10 rounded-full"
			>
				{image.category}
			</span>
			{#if image.isPdf}
				<span class="text-xs text-white/50">
					{image.pdfPageCount}p
				</span>
			{/if}
		</div>
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
				class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-white/10 rounded-xl p-4 shadow-xl"
			>
				<p class="text-white/90 text-sm mb-3">
					Are you sure you want to delete this image?
				</p>
				<div class="flex gap-2">
					<button
						onclick={() => (showDeleteMenu = false)}
						class="flex-1 px-3 py-2 bg-white/5 text-white/70 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm"
					>
						Cancel
					</button>
					<button
						onclick={handleDelete}
						class="flex-1 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
