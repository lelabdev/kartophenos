<script lang="ts">
	import { getGalleryService } from '$lib/services/gallery.svelte';

	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();
	const galleryService = getGalleryService();

	let files = $state<File[]>([]);
	let category = $state('');
	let uploadProgress = $state(0);
	let isUploading = $state(false);
	let errorMessage = $state('');

	let fileInput: HTMLInputElement;
	let dropZone: HTMLElement;

	let canUpload = $derived(files.length > 0 && !isUploading);

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			files = [...files, ...Array.from(target.files)];
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dropZone?.classList.add('border-primary-500/50', 'bg-primary-500/10');
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dropZone?.classList.remove('border-primary-500/50', 'bg-primary-500/10');
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dropZone?.classList.remove('border-primary-500/50', 'bg-primary-500/10');

		if (event.dataTransfer?.files) {
			files = [...files, ...Array.from(event.dataTransfer.files)];
		}
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	async function handleUpload() {
		if (!canUpload) return;

		isUploading = true;
		uploadProgress = 0;
		errorMessage = '';

		try {
			const cat = category.trim() || 'Uncategorized';
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				console.log(`[kartoPhenos] Uploading ${file.name}...`);
				await galleryService.addImage(file, cat);
				uploadProgress = ((i + 1) / files.length) * 100;
			}

			console.log('[kartoPhenos] All uploads complete');
			onclose();
		} catch (error) {
			console.error('[kartoPhenos] Upload failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Upload failed';
		} finally {
			isUploading = false;
		}
	}

	function handleClose() {
		if (!isUploading) {
			onclose();
		}
	}

	function openFileDialog() {
		fileInput?.click();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
	role="dialog"
	aria-modal="true"
	tabindex="-1"
	onclick={handleClose}
	onkeydown={(e) => {
		if (e.key === 'Escape') handleClose();
		if (e.key === 'Enter' && canUpload) handleUpload();
	}}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="bg-black border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
		role="dialog"
		aria-label="Upload files"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
			<h2 class="text-xl font-bold text-white/90">Upload</h2>
			<button
				onclick={handleClose}
				class="p-2 text-white/50 hover:text-white/100 transition-colors"
				aria-label="Close"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 200px)">
			<!-- Error -->
			{#if errorMessage}
				<div class="mb-4 px-4 py-3 bg-primary-500/10 border border-primary-500/50 rounded-lg text-primary-400 text-sm">
					{errorMessage}
				</div>
			{/if}

			<!-- Drop Zone -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				bind:this={dropZone}
				class="relative border-2 border-dashed border-white/20 rounded-xl p-8 text-center transition-all hover:border-white/40"
				role="button"
				tabindex="0"
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
				onclick={openFileDialog}
				onkeydown={(e) => e.key === 'Enter' && openFileDialog()}
			>
				<input
					type="file"
					bind:this={fileInput}
					multiple
					accept="image/*,.pdf"
					onchange={handleFileSelect}
					class="hidden"
				/>
				<div class="flex flex-col items-center gap-3">
					<svg class="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
					<p class="text-white/40 text-sm">Tap to select images or PDFs</p>
				</div>
			</div>

			<!-- Category Input -->
			<div class="mt-6">
				<label for="category-input" class="block text-sm font-medium text-white/70 mb-2">
					Category
				</label>
				<input
					id="category-input"
					type="text"
					bind:value={category}
					placeholder="Optional — e.g., Maps, Schematics"
					class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary-500/50 transition-colors"
					disabled={isUploading}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							if (canUpload) handleUpload();
						}
					}}
				/>
			</div>

			<!-- Existing tags -->
			{#if galleryService.categories.length > 0}
				<div class="mt-3">
					<p class="text-xs text-white/40 mb-2">Existing categories</p>
					<div class="flex flex-wrap gap-2">
						{#each galleryService.categories as cat}
							<button
								type="button"
								onclick={() => (category = cat)}
								class="px-3 py-1 text-xs rounded-full transition-colors {category === cat
									? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
									: 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'}"
							>
								{cat}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- File List -->
			{#if files.length > 0}
				<div class="mt-6">
					<h3 class="text-sm font-medium text-white/70 mb-3">
						{files.length} {files.length === 1 ? 'file' : 'files'} selected
					</h3>
					<div class="space-y-2">
						{#each files as file, index}
							<div class="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
								<div class="flex items-center gap-3 flex-1 min-w-0">
									<svg class="w-5 h-5 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									<span class="text-white/70 text-sm truncate">{file.name}</span>
									<span class="text-white/30 text-xs shrink-0">{(file.size / 1024).toFixed(0)}KB</span>
								</div>
								{#if !isUploading}
									<button
										type="button"
										onclick={() => removeFile(index)}
										class="p-1 text-white/40 hover:text-primary-400 transition-colors shrink-0"
										aria-label="Remove file"
									>
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Progress -->
			{#if isUploading}
				<div class="mt-6">
					<div class="flex items-center justify-between text-sm mb-2">
						<span class="text-white/70">Processing...</span>
						<span class="text-primary-400">{Math.round(uploadProgress)}%</span>
					</div>
					<div class="h-2 bg-white/10 rounded-full overflow-hidden">
						<div class="h-full bg-primary-500/50 transition-all duration-300" style="width: {uploadProgress}%"></div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
			<button
				type="button"
				onclick={handleClose}
				class="px-4 py-2 text-white/70 hover:text-white/100 transition-colors"
				disabled={isUploading}
			>
				Cancel
			</button>
			<button
				type="button"
				onclick={handleUpload}
				class="px-6 py-2 bg-primary-500/20 text-primary-400 border border-primary-500/50 rounded-lg hover:bg-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!canUpload}
			>
				{isUploading ? 'Processing...' : 'Upload'}
			</button>
		</div>
	</div>
</div>
