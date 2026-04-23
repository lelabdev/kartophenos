<script lang="ts">
	import { onMount } from 'svelte';
	import { Sun } from 'lucide-svelte';
	import { brightnessStore } from '$lib/utils/brightness.svelte';

	let drawerOpen = $state(false);

	function toggle() {
		drawerOpen = !drawerOpen;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && drawerOpen) {
			drawerOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});
</script>

<!-- Toggle button — always visible, right edge -->
<button
	onclick={toggle}
	class="fixed right-0 top-1/2 -translate-y-1/2 z-50 w-8 h-14
	       bg-surface-800/80 border border-surface-300/20 border-r-0
	       rounded-l-lg flex items-center justify-center
	       text-surface-50 hover:bg-surface-700/80 active:scale-95
	       transition-all touch-manipulation"
	aria-label="Brightness"
	title="Brightness"
>
	<Sun size={16} />
</button>

<!-- Drawer overlay -->
{#if drawerOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40 bg-black/30"
		onclick={() => (drawerOpen = false)}
	></div>
{/if}

<!-- Drawer panel -->
<div
	class="fixed right-0 top-0 bottom-0 z-50 w-12
	       bg-surface-900/95 backdrop-blur-sm border-l border-surface-300/15
	       flex flex-col items-center pt-6 pb-6 gap-4
	       transition-transform duration-200 ease-out
	       {drawerOpen ? 'translate-x-0' : 'translate-x-full'}"
>
	<!-- Label -->
	<span class="text-surface-100 text-[10px] font-medium tracking-wider uppercase select-none">
		{brightnessStore.value}%
	</span>

	<!-- Vertical slider -->
	<div class="flex-1 flex items-center justify-center px-2 w-full relative">
		<!-- Track -->
		<div class="relative w-1.5 h-full bg-surface-600/50 rounded-full">
			<!-- Fill -->
			<div
				class="absolute bottom-0 left-0 right-0 bg-surface-100/60 rounded-full transition-all"
				style="height: {((brightnessStore.value - brightnessStore.MIN) / (brightnessStore.MAX - brightnessStore.MIN)) * 100}%;"
			></div>
		</div>

		<!-- Touch target (invisible, large) -->
		<input
			type="range"
			min={brightnessStore.MIN}
			max={brightnessStore.MAX}
			value={brightnessStore.value}
			oninput={(e) => brightnessStore.set(parseInt((e.target as HTMLInputElement).value, 10))}
			class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
			orient="vertical"
			style="writing-mode: vertical-lr; direction: rtl;"
			aria-label="Brightness level"
		/>
	</div>

	<!-- Sun icon bottom -->
	<Sun size={14} class="text-surface-200" />
</div>
