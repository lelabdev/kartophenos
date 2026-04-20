<script lang="ts">
	import { onMount } from 'svelte';
	import { themeStore } from '$lib/utils/theme.svelte';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		themeStore.init();
	});
</script>

<div class="min-h-screen bg-black">
	{@render children()}
</div>
