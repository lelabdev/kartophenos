<script lang="ts">
	import { viewFilter, VIEW_FILTERS } from '$lib/utils/view-filter.svelte';
	import type { GalleryImage } from '$lib/types/gallery';

	interface Props {
		image: GalleryImage;
		pinMode: boolean;
		brightness: number;
		visible: boolean;
		onBack: () => void;
		onTogglePinMode: () => void;
		onResetView: () => void;
		onToggleFavorite: (id: string) => void;
		onBrightnessChange: (value: number) => void;
	}

	let {
		image,
		pinMode,
		brightness,
		visible,
		onBack,
		onTogglePinMode,
		onResetView,
		onToggleFavorite,
		onBrightnessChange
	}: Props = $props();
</script>

<div
	class="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-white/10 transition-opacity {visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
>
	<div class="flex items-center justify-center gap-4 px-4 py-4">
		<button
			onclick={onBack}
			class="p-2 text-white/70 hover:text-white/100 transition-colors"
			aria-label="Back"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<button
			onclick={onTogglePinMode}
			class="p-2 {pinMode ? 'text-primary-400' : 'text-white/70'} hover:text-white/100 transition-colors"
			aria-label="Toggle pin mode"		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
				/>
				<circle cx="12" cy="9" r="2.5" />
			</svg>
		</button>

		<button
			onclick={onResetView}
			class="p-2 text-white/70 hover:text-white/100 transition-colors"
			aria-label="Reset view"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
		</button>

		<button
			onclick={() => onToggleFavorite(image.id)}
			class="p-2 {image.isFavorite ? 'text-primary-500' : 'text-white/70'} hover:text-white/100 transition-colors"
			aria-label={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill={image.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
				/>
			</svg>
		</button>

		<!-- View filters -->
		<div class="flex items-center gap-1">
			{#each VIEW_FILTERS as f}
				<button
					onclick={() => viewFilter.set(f.id)}
					class="w-6 h-6 rounded-full transition-all {viewFilter.active === f.id
						? 'ring-2 ring-white/80 scale-110'
						: 'opacity-40 hover:opacity-70'}"
					style="background-color: {f.dot};"
					aria-label={f.label}
					title={f.label}
				></button>
			{/each}
		</div>

		<!-- Brightness slider -->
		<div class="flex items-center gap-2">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white/40 shrink-0">
				<circle cx="12" cy="12" r="5" />
				<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
			</svg>
			<input
				type="range"
				min="20"
				max="200"
				step="5"
				value={brightness}
				oninput={(e) => onBrightnessChange(Number((e.target as HTMLInputElement).value))}
				class="w-20 h-1 appearance-none bg-white/20 rounded-full accent-white/60 cursor-pointer"
				aria-label="Brightness"
			/>
		</div>

		<div class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs truncate max-w-[120px]">
			{image.name}
		</div>
	</div>
</div>
