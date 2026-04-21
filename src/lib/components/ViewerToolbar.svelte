<script lang="ts">
	import { viewFilter, VIEW_FILTERS } from '$lib/utils/view-filter.svelte';
	import type { GalleryImage } from '$lib/types/gallery';
	import { ChevronLeft, MapPin, RefreshCw, Heart, Sun } from 'lucide-svelte';

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
	class="fixed bottom-0 left-0 right-0 z-50 bg-surface-950/80 backdrop-blur-sm border-t border-surface-300/10 transition-opacity {visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
>
	<div class="flex items-center justify-center gap-4 px-4 py-4">
		<button
			onclick={onBack}
			class="p-2 text-surface-300 hover:text-surface-50/100 transition-colors"
			aria-label="Back"
		>
			<ChevronLeft size={24} />
		</button>

		<button
			onclick={onTogglePinMode}
			class="p-2 {pinMode ? 'text-primary-400' : 'text-surface-300'} hover:text-surface-50/100 transition-colors"
			aria-label="Toggle pin mode"		>
			<MapPin size={24} />
		</button>

		<button
			onclick={onResetView}
			class="p-2 text-surface-300 hover:text-surface-50/100 transition-colors"
			aria-label="Reset view"
		>
			<RefreshCw size={24} />
		</button>

		<button
			onclick={() => onToggleFavorite(image.id)}
			class="p-2 {image.isFavorite ? 'text-primary-500' : 'text-surface-300'} hover:text-surface-50/100 transition-colors"
			aria-label={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
		>
			<Heart size={24} fill={image.isFavorite ? 'currentColor' : 'none'} />
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
			<Sun size={14} class="text-surface-600 shrink-0" />
			<input
				type="range"
				min="20"
				max="200"
				step="5"
				value={brightness}
				oninput={(e) => onBrightnessChange(Number((e.target as HTMLInputElement).value))}
				class="w-20 h-1 appearance-none bg-surface-300/20 rounded-full accent-surface-50/60 cursor-pointer"
				aria-label="Brightness"
			/>
		</div>

		<div class="px-3 py-1 bg-surface-500/5 border border-surface-300/10 rounded-full text-surface-500 text-xs truncate max-w-[120px]">
			{image.name}
		</div>
	</div>
</div>
