<script lang="ts">
	import { onMount } from 'svelte';
	import { generatePin, PIN_COLORS } from '$lib/services/upload';
	import { wakeLockStore } from '$lib/utils/wake-lock.svelte';
	import { viewFilter } from '$lib/utils/view-filter.svelte';
	import PinModal from './PinModal.svelte';
	import ViewerToolbar from './ViewerToolbar.svelte';
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

	let panX = $state(0);
	let panY = $state(0);
	let zoom = $state(1);
	let rotation = $state(0);
	let brightness = $state(100);

	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);

	let touches = $state(new Map<number, { x: number; y: number }>());
	let initialPinchDistance = $state(0);
	let initialZoom = $state(1);
	let initialRotation = $state(0);
	let initialAngle = $state(0);

	let pinMode = $state(false);
	let pickingPinColor = $state(false);
	let selectedPinColor = $state('#e74c3c');
	let editingPin = $state<Pin | null>(null);
	let showPinOptions = $state(false);
	let pinLabel = $state('');


	let isToolbarVisible = $state(true);
	let toolbarTimeout: ReturnType<typeof setTimeout> | null = null;
	let lastDoubleTap = $state(0);
	let lastDoubleClick = $state(0);

	let containerWidth = $state(0);
	let containerHeight = $state(0);

	let imageFilter = $derived(
		[brightness !== 100 ? `brightness(${brightness / 100})` : '', viewFilter.css]
			.filter(Boolean)
			.join(' ')
	);

	// Compute the displayed image size (natural size * zoom)
	let displayWidth = $derived(image.width * zoom);
	let displayHeight = $derived(image.height * zoom);

	function resetView() {
		panX = 0;
		panY = 0;
		zoom = 1;
		rotation = 0;
		brightness = 100;
	}

	function fitImageToViewport() {
		if (!image) return;
		const ar = image.width / image.height;
		const car = containerWidth / containerHeight;
		zoom = ar > car ? (containerWidth * 0.9) / image.width : (containerHeight * 0.9) / image.height;
		panX = 0;
		panY = 0;
		rotation = 0;
	}

	function displayToolbar() {
		isToolbarVisible = true;
		if (toolbarTimeout) clearTimeout(toolbarTimeout);
		toolbarTimeout = setTimeout(() => (isToolbarVisible = false), 3000);
	}

	// --- Pin position computation ---
	// Pins store coordinates as ratios (0-1) relative to the image natural dimensions.
	// To render: ratio * naturalSize * zoom gives offset in the transformed space,
	// then we add panX/panY for the viewport offset.

	function pinScreenX(pin: Pin): number {
		return panX + pin.x * displayWidth;
	}

	function pinScreenY(pin: Pin): number {
		return panY + pin.y * displayHeight;
	}

	// --- Touch gestures ---

	function getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
		return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
	}

	function getAngle(a: { x: number; y: number }, b: { x: number; y: number }): number {
		return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
	}

	function handleTouchStart(event: TouchEvent) {
		displayToolbar();
		event.preventDefault();
		for (const t of event.changedTouches) {
			touches.set(t.identifier, { x: t.clientX, y: t.clientY });
		}
		if (touches.size === 2) {
			const [t1, t2] = Array.from(touches.values());
			initialPinchDistance = getDistance(t1, t2);
			initialZoom = zoom;
			initialRotation = rotation;
			initialAngle = getAngle(t1, t2);
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
		for (const t of event.changedTouches) {
			if (touches.has(t.identifier)) touches.set(t.identifier, { x: t.clientX, y: t.clientY });
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
			zoom = Math.max(0.5, Math.min(5, initialZoom * (getDistance(t1, t2) / initialPinchDistance)));
			// Rotation: compare current angle to initial angle, snap to 90°
			const currentAngle = getAngle(t1, t2);
			const angleDelta = currentAngle - initialAngle;
			rotation = initialRotation + Math.round(angleDelta / 90) * 90;
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		for (const t of event.changedTouches) touches.delete(t.identifier);
	}

	// --- Mouse gestures ---

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
		zoom = Math.max(0.5, Math.min(5, zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
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

	// --- Pin handling ---

	function handleContainerClick(event: MouseEvent) {
		if (!pinMode) return;

		const rect = containerElement.getBoundingClientRect();
		// Click position relative to container
		const clickX = event.clientX - rect.left;
		const clickY = event.clientY - rect.top;

		// Convert to image-relative position:
		// The image is centered in the container via flex, offset by pan
		const imgCenterX = rect.width / 2 + panX;
		const imgCenterY = rect.height / 2 + panY;
		const imgLeft = imgCenterX - displayWidth / 2;
		const imgTop = imgCenterY - displayHeight / 2;

		// Position relative to image, in pixels
		const relX = clickX - imgLeft;
		const relY = clickY - imgTop;

		// Convert to ratio (0-1)
		const ratioX = relX / displayWidth;
		const ratioY = relY / displayHeight;

		// Only place pin if click is within image bounds
		if (ratioX < 0 || ratioX > 1 || ratioY < 0 || ratioY > 1) return;

		const pin = generatePin(ratioX, ratioY, '', selectedPinColor);
		onAddPin(image.id, pin);
		pinMode = false;
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
		onUpdatePin(image.id, editingPin.id, { label: pinLabel, color: selectedPinColor });
		showPinOptions = false;
		editingPin = null;
	}

	function handlePinDelete() {
		if (!editingPin) return;
		onRemovePin(image.id, editingPin.id);
		showPinOptions = false;
		editingPin = null;
	}

	// --- Lifecycle ---

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
			if (toolbarTimeout) clearTimeout(toolbarTimeout);
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
	class="fixed inset-0 bg-surface-950 overflow-hidden touch-none {pinMode ? 'cursor-crosshair' : ''}"
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
	<!-- Image -->
	<div
		class="absolute inset-0 flex items-center justify-center"
		style="transform: translate({panX}px, {panY}px) scale({zoom}) rotate({rotation}deg); transition: transform 0.1s ease-out;"
	>
		<img
			src={image.dataUrl}
			alt={image.name}
			class="max-w-none select-none"
			style="filter: {imageFilter};"
		/>
	</div>

	<!-- Pins -->
	{#each image.pins as pin (pin.id)}
		<button
			class="absolute cursor-pointer group"
			style="left: {pinScreenX(pin)}px; top: {pinScreenY(pin)}px; transform: translate(-50%, -50%) rotate({rotation}deg); transform-origin: center;"
			onclick={(e) => handlePinClick(pin, e)}
			aria-label="Pin{pin.label ? ': ' + pin.label : ''}"
		>
			<div class="relative">
				<div
					class="w-4 h-4 rounded-full border-2 border-black/30 shadow-lg"
					style="background-color: {pin.color};"
				></div>
				{#if pin.label}
					<div
						class="absolute left-full top-1/2 -translate-y-1/2 ml-1 px-2 py-1 bg-surface-950/80 text-surface-50 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
					>
						{pin.label}
					</div>
				{/if}
			</div>
		</button>
	{/each}

	<!-- Toolbar -->
	<ViewerToolbar
		{image}
		{pinMode}
		{brightness}
		visible={isToolbarVisible}
		onBack={onBack}
		onTogglePinMode={() => {
			if (pinMode) {
				pinMode = false;
			} else {
				pickingPinColor = true;
			}
		}}
		onResetView={resetView}
		onToggleFavorite={onToggleFavorite}
		onBrightnessChange={(v) => (brightness = v)}
	/>

	<!-- Pin Color Picker (shown when pin button clicked) -->
	{#if pickingPinColor}
		<div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-surface-950/90 backdrop-blur-sm border border-surface-300/10 rounded-full px-4 py-2 flex items-center gap-3">
			{#each PIN_COLORS as c}
				<button
					onclick={() => {
						selectedPinColor = c.value;
						pickingPinColor = false;
						pinMode = true;
					}}
					class="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 {selectedPinColor === c.value ? 'border-surface-300' : 'border-transparent'}"
					style="background-color: {c.value};"
					title={c.name}
					aria-label={c.name}
				></button>
			{/each}
			<button
				onclick={() => (pickingPinColor = false)}
				class="text-surface-500 hover:text-surface-50/80 text-xs ml-1"
				aria-label="Cancel"
			>
				✕
			</button>
		</div>
	{/if}

	<!-- Pin Edit Modal -->
	{#if showPinOptions && editingPin}
		<PinModal
			label={pinLabel}
			color={selectedPinColor}
			onlabelchange={(v) => (pinLabel = v)}
			oncolorchange={(v) => (selectedPinColor = v)}
			onsubmit={handlePinUpdate}
			ondelete={handlePinDelete}
			oncancel={() => {
				showPinOptions = false;
				editingPin = null;
			}}
		/>
	{/if}
</div>
