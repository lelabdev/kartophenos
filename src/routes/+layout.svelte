<script lang="ts">
	import { onMount } from 'svelte';
	import { themeStore } from '$lib/utils/theme.svelte';
	import { viewFilter } from '$lib/utils/view-filter.svelte';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		themeStore.init();
	});
</script>

<div
	class="min-h-screen bg-black"
	data-theme={viewFilter.theme}
	data-mode="dark"
>
	{@render children()}
</div>
