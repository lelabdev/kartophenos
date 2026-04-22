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
	class="fixed bottom-0 left-0 right-0 z-50 bg-surface-950/90 backdrop-blur-md border-t border-surface-300/10 transition-opacity {visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
>
	<!-- Top row: actions -->
	<div class="flex items-center justify-around px-2 pt-3 pb-2">
		<button
			onclick={onBack}
			class="w-12 h-12 flex items-center justify-center rounded-xl text-surface-50 hover:bg-surface-500/10 active:scale-95 transition-all"
			aria-label="Back"
		>
			<ChevronLeft size={28} />
		</button>

		<button
			onclick={onTogglePinMode}
			class="w-12 h-12 flex items-center justify-center rounded-xl {pinMode ? 'text-primary-400 bg-primary-500/20' : 'text-surface-50'} hover:bg-surface-500/10 active:scale-95 transition-all"
			aria-label="Toggle pin mode"
		>
			<MapPin size={28} />
		</button>

		<button
			onclick={onResetView}
			class="w-12 h-12 flex items-center justify-center rounded-xl text-surface-50 hover:bg-surface-500/10 active:scale-95 transition-all"
			aria-label="Reset view"
		>
			<RefreshCw size={28} />
		</button>

		<button
			onclick={() => onToggleFavorite(image.id)}
			class="w-12 h-12 flex items-center justify-center rounded-xl {image.isFavorite ? 'text-primary-500' : 'text-surface-50'} hover:bg-surface-500/10 active:scale-95 transition-all"
			aria-label={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
		>
			<Heart size={28} fill={image.isFavorite ? 'currentColor' : 'none'} />
		</button>
	</div>

	<!-- Bottom row: filters + brightness -->
	<div class="flex items-center justify-center gap-4 px-4 pb-3 pt-1">
		<!-- View filters -->
		<div class="flex items-center gap-2">
			{#each VIEW_FILTERS as f}
				<button
					onclick={() => viewFilter.set(f.id)}
					class="w-8 h-8 rounded-full transition-all {viewFilter.active === f.id
						? 'ring-2 ring-surface-50/80 scale-110'
						: 'opacity-40 hover:opacity-70'}"
					style="background-color: {f.dot};"
					aria-label={f.label}
					title={f.label}
				></button>
			{/each}
		</div>

		<!-- Brightness -->
		<div class="flex items-center gap-2">
			<Sun size={18} class="text-surface-400 shrink-0" />
			<input
				type="range"
				min="20"
				max="200"
				step="5"
				value={brightness}
				oninput={(e) => onBrightnessChange(Number((e.target as HTMLInputElement).value))}
				class="w-24 h-1.5 appearance-none bg-surface-300/20 rounded-full accent-surface-50/60 cursor-pointer"
				aria-label="Brightness"
			/>
		</div>

		<!-- File name -->
		<div class="px-3 py-1.5 bg-surface-500/5 border border-surface-300/10 rounded-full text-surface-400 text-xs truncate max-w-[140px]">
			{image.name}
		</div>
	</div>
</div>
