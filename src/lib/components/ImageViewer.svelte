<script lang="ts">
	import { onMount } from 'svelte';
	import { generatePin } from '$lib/services/upload';
	import { wakeLockStore } from '$lib/utils/wake-lock.svelte';
	import { viewFilter } from '$lib/utils/view-filter.svelte';
	import type { GalleryImage, Pin } from '$lib/types/gallery';

	interface Props {
		image: GalleryImage;
		onBack: () => void;
		onToggleFavorite: (id: string) => void;
		onAddPin: (imageId: string, pin: Pin) => void;
		onRemovePin: (imageId: string, pinId: string) => void;
		onUpdatePin: (imageId: string, pinId: string, updates: Partial<Pin>) => void;
	}

	let {
		image,
		onBack,
		onToggleFavorite,
		onAddPin,
		onRemovePin,
		onUpdatePin
	}: Props = $props();

	let containerElement: HTMLDivElement;
	let imageElement: HTMLImageElement;

	let panX = $state(0);
	let panY = $state(0);
	let zoom = $state(1);
	let rotation = $state(0);

	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);

	let touches = $state(new Map<number, { x: number; y: number }>());
	let initialPinchDistance = $state(0);
	let initialPinchCenter = $state({ x: 0, y: 0 });
	let initialZoom = $state(1);
	let initialRotation = $state(0);

	let pinMode = $state(false);
	let showPinEditor = $state(false);
	let newPinPosition = $state({ x: 0, y: 0 });
	let pinLabel = $state('');
	let selectedPinColor = $state('#e74c3c');

	let editingPin = $state<Pin | null>(null);
	let showPinOptions = $state(false);

	let isToolbarVisible = $state(true);
	let toolbarTimeout: ReturnType<typeof setTimeout> | null = null;

	let lastDoubleTap = $state(0);
	let lastDoubleClick = $state(0);

	const PIN_COLORS = [
		{ value: '#e74c3c', name: 'Red' },
		{ value: '#3498db', name: 'Blue' },
		{ value: '#2ecc71', name: 'Green' },
		{ value: '#f1c40f', name: 'Yellow' },
		{ value: '#e67e22', name: 'Orange' },
		{ value: '#9b59b6', name: 'Purple' },
		{ value: '#ffffff', name: 'White' }
	];

	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let imageLoaded = $state(false);

	function resetView() {
		panX = 0;
		panY = 0;
		zoom = 1;
		rotation = 0;
	}

	function fitImageToViewport() {
		if (!image) return;

		const imageAspectRatio = image.width / image.height;
		const containerAspectRatio = containerWidth / containerHeight;

		if (imageAspectRatio > containerAspectRatio) {
			zoom = (containerWidth * 0.9) / image.width;
		} else {
			zoom = (containerHeight * 0.9) / image.height;
		}

		panX = 0;
		panY = 0;
		rotation = 0;
	}

	function getDistance(touch1: { x: number; y: number }, touch2: { x: number; y: number }): number {
		return Math.sqrt(Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2));
	}

	function getCenter(touch1: { x: number; y: number }, touch2: { x: number; y: number }): {
		x: number;
		y: number;
	} {
		return {
			x: (touch1.x + touch2.x) / 2,
			y: (touch1.y + touch2.y) / 2
		};
	}

	function getAngle(touch1: { x: number; y: number }, touch2: { x: number; y: number }): number {
		return Math.atan2(touch2.y - touch1.y, touch2.x - touch1.x) * (180 / Math.PI);
	}

	function getTouchById(id: number) {
		return touches.get(id);
	}

	function handleTouchStart(event: TouchEvent) {
		displayToolbar();
		event.preventDefault();

		for (const touch of event.changedTouches) {
			touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
		}

		if (touches.size === 2) {
			const [t1, t2] = Array.from(touches.values());
			initialPinchDistance = getDistance(t1, t2);
			initialPinchCenter = getCenter(t1, t2);
			initialZoom = zoom;
			initialRotation = rotation;
		} else if (touches.size === 1 && !pinMode) {
			const touch = touches.values().next().value;
			if (touch) {
				dragStartX = touch.x;
				dragStartY = touch.y;

				const now = Date.now();
				if (now - lastDoubleTap < 300) {
					resetView();
					lastDoubleTap = 0;
				} else {
					lastDoubleTap = now;
				}
			}
		}
	}

	function handleTouchMove(event: TouchEvent) {
		event.preventDefault();

		for (const touch of event.changedTouches) {
			if (touches.has(touch.identifier)) {
				touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
			}
		}

		if (touches.size === 1 && !pinMode) {
			const touch = touches.values().next().value;
			if (touch) {
				panX += touch.x - dragStartX;
				panY += touch.y - dragStartY;
				dragStartX = touch.x;
				dragStartY = touch.y;
			}
		} else if (touches.size === 2) {
			const [t1, t2] = Array.from(touches.values());
			const currentDistance = getDistance(t1, t2);
			const newZoom = initialZoom * (currentDistance / initialPinchDistance);
			zoom = Math.max(0.5, Math.min(5, newZoom));

			const currentAngle = getAngle(t1, t2);
			const [it1, it2] = Array.from(touches.values()).slice(0, 2);
			const initialAngle = getAngle(it1, it2);
			let newRotation = initialRotation + (currentAngle - initialAngle);

			newRotation = Math.round(newRotation / 90) * 90;
			rotation = newRotation;
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		for (const touch of event.changedTouches) {
			touches.delete(touch.identifier);
		}
	}

	function handleMouseDown(event: MouseEvent) {
		displayToolbar();
		if (event.button !== 0) return;

		isDragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || pinMode) return;

		panX += event.clientX - dragStartX;
		panY += event.clientY - dragStartY;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleWheel(event: WheelEvent) {
		displayToolbar();
		event.preventDefault();

		const delta = event.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = zoom * delta;
		zoom = Math.max(0.5, Math.min(5, newZoom));
	}

	function handleDoubleClick() {
		const now = Date.now();
		if (now - lastDoubleClick < 300) {
			resetView();
			lastDoubleClick = 0;
		} else {
			lastDoubleClick = now;
		}
	}

	function handleContainerClick(event: MouseEvent) {
		if (!pinMode) return;

		const rect = containerElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		newPinPosition = { x, y };
		pinLabel = '';
		showPinEditor = true;
		pinMode = false;
	}

	function handlePinSubmit() {
		const pin = generatePin(newPinPosition.x, newPinPosition.y, pinLabel.trim() || '', selectedPinColor);
		onAddPin(image.id, pin);
		showPinEditor = false;
		pinLabel = '';
	}

	function handlePinClick(pin: Pin, event: MouseEvent) {
		event.stopPropagation();
		editingPin = pin;
		pinLabel = pin.label;
		selectedPinColor = pin.color;
		showPinOptions = true;
	}

	function handlePinUpdate() {
		if (!editingPin) return;
		onUpdatePin(image.id, editingPin.id, {
			label: pinLabel,
			color: selectedPinColor
		});
		showPinOptions = false;
		editingPin = null;
	}

	function handlePinDelete() {
		if (!editingPin) return;
		onRemovePin(image.id, editingPin.id);
		showPinOptions = false;
		editingPin = null;
	}

	function displayToolbar() {
		isToolbarVisible = true;
		if (toolbarTimeout) {
			clearTimeout(toolbarTimeout);
		}
		toolbarTimeout = setTimeout(() => {
			isToolbarVisible = false;
		}, 3000);
	}

	function handleResize() {
		containerWidth = window.innerWidth;
		containerHeight = window.innerHeight;
	}

	onMount(() => {
		containerWidth = window.innerWidth;
		containerHeight = window.innerHeight;
		fitImageToViewport();
		window.addEventListener('resize', handleResize);
		displayToolbar();
		wakeLockStore.request();
		return () => {
			window.removeEventListener('resize', handleResize);
			if (toolbarTimeout) {
				clearTimeout(toolbarTimeout);
			}
			wakeLockStore.release();
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={containerElement}
	class="fixed inset-0 bg-black overflow-hidden touch-none {pinMode ? 'cursor-crosshair' : ''}"
	role="application"
	aria-label="Image viewer"
	tabindex="0"
	onclick={handleContainerClick}
	onkeydown={(e) => {
		if (e.key === 'Escape') onBack();
		if (e.key === 'r') resetView();
	}}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
	onwheel={handleWheel}
	ondblclick={handleDoubleClick}
>
	<div
		class="absolute inset-0 flex items-center justify-center"
		style="transform: translate({panX}px, {panY}px) scale({zoom}) rotate({rotation}deg); transition: transform 0.1s ease-out;"
	>
		<img
			bind:this={imageElement}
			src={image.dataUrl}
			alt={image.name}
			class="max-w-none select-none"
			style="filter: {viewFilter.css};"
			onload={() => (imageLoaded = true)}
		/>
	</div>

	{#each image.pins as pin}
		<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
		<button
			class="absolute cursor-pointer group"
			style="transform: translate({panX + pin.x * zoom}px, {panY + pin.y * zoom}px) scale({zoom}) rotate({rotation}deg); transform-origin: center;"
			onclick={(e) => handlePinClick(pin, e)}
			aria-label="Pin: {pin.label}"
		>
			<div class="relative">
				<div
					class="w-4 h-4 rounded-full border-2 border-black/30 shadow-lg"
					style="background-color: {pin.color};"
				></div>
				<div
					class="absolute left-full top-1/2 -translate-y-1/2 ml-1 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
				>
					{pin.label}
				</div>
			</div>
		</button>
	{/each}

	<!-- Toolbar -->
	<div
		class="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-white/10 transition-opacity {isToolbarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
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
				onclick={() => (pinMode = !pinMode)}
				class="p-2 {pinMode ? 'text-primary-400' : 'text-white/70'} hover:text-white/100 transition-colors"
				aria-label="Toggle pin mode"
			>
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
				onclick={resetView}
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

			<div class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs truncate max-w-[120px]">
				{image.name}
			</div>
		</div>
	</div>

	<!-- Pin Editor Modal -->
	{#if showPinEditor}
		<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
			<div class="bg-zinc-900 border border-white/10 rounded-lg p-6 w-full max-w-sm">
				<h3 class="text-lg font-bold text-white/90 mb-4">Add Pin</h3>
				<input
					type="text"
					bind:value={pinLabel}
					placeholder="Enter label..."
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 mb-4"
					onkeypress={(e) => e.key === 'Enter' && handlePinSubmit()}
				/>
				<div class="flex flex-wrap gap-2 mb-4">
					{#each PIN_COLORS as color}
						<button
							onclick={() => (selectedPinColor = color.value)}
							class="w-8 h-8 rounded-full border-2 transition-all {selectedPinColor === color.value ? 'border-white scale-110' : 'border-transparent hover:border-white/50'}"
							style="background-color: {color.value};"
							title={color.name}
							aria-label={color.name}
						></button>
					{/each}
				</div>
				<div class="flex gap-2">
					<button
						onclick={handlePinSubmit}
						class="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-500/80 transition-colors"
					>
						Add Pin
					</button>
					<button
						onclick={() => {
							showPinEditor = false;
							pinMode = false;
							pinLabel = '';
						}}
						class="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Pin Options Modal -->
	{#if showPinOptions && editingPin}
		<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
			<div class="bg-zinc-900 border border-white/10 rounded-lg p-6 w-full max-w-sm">
				<h3 class="text-lg font-bold text-white/90 mb-4">Edit Pin</h3>
				<input
					type="text"
					bind:value={pinLabel}
					placeholder="Enter label..."
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 mb-4"
				/>
				<div class="flex flex-wrap gap-2 mb-4">
					{#each PIN_COLORS as color}
						<button
							onclick={() => (selectedPinColor = color.value)}
							class="w-8 h-8 rounded-full border-2 transition-all {selectedPinColor === color.value ? 'border-white scale-110' : 'border-transparent hover:border-white/50'}"
							style="background-color: {color.value};"
							title={color.name}
							aria-label={color.name}
						></button>
					{/each}
				</div>
				<div class="flex gap-2">
					<button
						onclick={handlePinUpdate}
						class="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-500/80 transition-colors"
					>
						Save
					</button>
					<button
						onclick={handlePinDelete}
						class="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
					>
						Delete
					</button>
					<button
						onclick={() => {
							showPinOptions = false;
							editingPin = null;
						}}
						class="flex-1 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
