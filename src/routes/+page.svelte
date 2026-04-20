<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { viewFilter } from '$lib/utils/view-filter.svelte';
	import GalleryCard from '$lib/components/GalleryCard.svelte';
	import UploadModal from '$lib/components/UploadModal.svelte';
	import type { GalleryImage } from '$lib/types/gallery';

	let galleryService: import('$lib/services/gallery.svelte').GalleryService | null = $state(null);
	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);
	let showUploadModal = $state(false);
	let loadError = $state('');

	let filteredImages = $derived.by(() => {
		if (!galleryService) return [];
		let images = galleryService.images;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			images = images.filter((img) => img.name.toLowerCase().includes(query));
		}

		if (selectedCategory) {
			images = images.filter((img) => img.category === selectedCategory);
		}

		return [...images].sort((a, b) => b.createdAt - a.createdAt);
	});

	onMount(async () => {
		try {
			const { getGalleryService } = await import('$lib/services/gallery.svelte');
			galleryService = getGalleryService();
		} catch (err) {
			console.error('[kartoPhenos] Failed to load gallery service:', err);
			loadError = err instanceof Error ? err.message : 'Failed to load gallery';
		}
	});

	function handleImageClick(image: GalleryImage) {
		goto(`/viewer/${image.id}`);
	}

	function handleUploadClick() {
		showUploadModal = true;
	}
</script>

<svelte:head>
	<title>kartoPhenos</title>
</svelte:head>

{#if loadError}
	<div class="min-h-screen bg-black flex items-center justify-center p-4">
		<div class="text-center">
			<p class="text-red-400 mb-4 text-sm">{loadError}</p>
			<button
				onclick={() => window.location.reload()}
				class="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
			>
				Reload
			</button>
		</div>
	</div>
{:else if !galleryService}
	<div class="min-h-screen bg-black flex items-center justify-center">
		<p class="text-white/50 animate-pulse">Loading gallery...</p>
	</div>
{:else}
	<div class="min-h-screen bg-black">
		<!-- Top Navigation -->
		<nav
			class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10"
		>
			<div class="flex items-center justify-between px-4 py-3">
				<h1 class="text-lg font-bold text-white/90 tracking-tight">kartoPhenos</h1>
				<div class="flex items-center gap-1">
					{#each [ 
						{ id: 'original' as const, label: 'Normal', color: '#fff' },
						{ id: 'red' as const, label: 'Rouge', color: '#e74c3c' },
						{ id: 'inverted' as const, label: 'Inversé', color: '#333' },
						{ id: 'nightvision' as const, label: 'Night', color: '#2ecc71' }
					] as f}
						<button
							onclick={() => viewFilter.set(f.id)}
							class="w-6 h-6 rounded-full transition-all {viewFilter.active === f.id
								? 'ring-2 ring-white/80 scale-110'
								: 'opacity-40 hover:opacity-70'}"
							style="background-color: {f.color};"
							aria-label={f.label}
							title={f.label}
						></button>
					{/each}
				</div>
			</div>
		</nav>

		<!-- Main Content -->
		<main class="pt-16 pb-24 px-4">
			<!-- Search Bar -->
			<div class="max-w-2xl mx-auto mb-6">
				<div class="relative">
					<input
						type="text"
						placeholder="Search..."
						bind:value={searchQuery}
						class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
					/>
				</div>
			</div>

			<!-- Category Tabs -->
			{#if galleryService.categories.length > 0}
				<div class="max-w-2xl mx-auto mb-6 overflow-x-auto">
					<div class="flex gap-2 pb-2">
						<button
							onclick={() => (selectedCategory = null)}
							class="px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors {selectedCategory === null
								? 'bg-red-500/20 text-red-400 border border-red-500/50'
								: 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'}"
						>
							All
						</button>
						{#each galleryService.categories as cat}
							<button
								onclick={() => (selectedCategory = cat)}
								class="px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors {selectedCategory === cat
									? 'bg-red-500/20 text-red-400 border border-red-500/50'
									: 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'}"
							>
								{cat}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Image Grid -->
			{#if filteredImages.length > 0}
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
					{#each filteredImages as image (image.id)}
						<GalleryCard
							{image}
							onclick={() => handleImageClick(image)}
						/>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center py-20 text-center">
					<div class="w-20 h-20 mb-4 rounded-full bg-white/5 flex items-center justify-center">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-white/30">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<h2 class="text-xl font-bold text-white/70 mb-2">No images yet</h2>
					<p class="text-white/40 mb-6 max-w-md">
						{searchQuery || selectedCategory
							? 'No images match your search.'
							: 'Start by uploading your first photo or PDF.'}
					</p>
					{#if !searchQuery && !selectedCategory}
						<button
							onclick={handleUploadClick}
							class="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
						>
							Upload your first image
						</button>
					{/if}
				</div>
			{/if}
		</main>

		<!-- Upload FAB -->
		<button
			onclick={handleUploadClick}
			class="fixed bottom-6 right-6 w-14 h-14 bg-red-500/30 border border-red-500/50 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/50 active:scale-95 transition-all z-40 shadow-lg"
			aria-label="Upload"
		>
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
		</button>

		<!-- Upload Modal -->
		{#if showUploadModal}
			<UploadModal onclose={() => (showUploadModal = false)} />
		{/if}
	</div>
{/if}
