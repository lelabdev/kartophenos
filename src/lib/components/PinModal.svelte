<script lang="ts">
	const PIN_COLORS = [
		{ value: '#e74c3c', name: 'Red' },
		{ value: '#3498db', name: 'Blue' },
		{ value: '#2ecc71', name: 'Green' },
		{ value: '#f1c40f', name: 'Yellow' },
		{ value: '#ffffff', name: 'White' }
	];

	interface Props {
		label: string;
		color: string;
		onlabelchange: (value: string) => void;
		oncolorchange: (value: string) => void;
		onsubmit: () => void;
		ondelete: () => void;
		oncancel: () => void;
	}

	let { label, color, onlabelchange, oncolorchange, onsubmit, ondelete, oncancel }: Props = $props();
</script>

<div class="fixed inset-0 z-50 bg-surface-950/80 backdrop-blur-sm flex items-center justify-center p-4">
	<div class="bg-surface-900 border border-surface-300/10 rounded-lg p-6 w-full max-w-sm">
		<h3 class="text-lg font-bold text-surface-100 mb-4">Edit Pin</h3>
		<input
			type="text"
			value={label}
			oninput={(e) => onlabelchange((e.target as HTMLInputElement).value)}
			placeholder="Label (optional)..."
			class="w-full px-3 py-2 bg-surface-500/5 border border-surface-300/10 rounded-lg text-surface-50 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 mb-4"
			onkeypress={(e) => e.key === 'Enter' && onsubmit()}
		/>
		<div class="flex flex-wrap gap-2 mb-4">
			{#each PIN_COLORS as c}
				<button
					onclick={() => oncolorchange(c.value)}
					class="w-8 h-8 rounded-full border-2 transition-all {color === c.value ? 'border-surface-300 scale-110' : 'border-transparent hover:border-surface-100/50'}"
					style="background-color: {c.value};"
					title={c.name}
					aria-label={c.name}
				></button>
			{/each}
		</div>
		<div class="flex gap-2">
			<button
				onclick={onsubmit}
				class="flex-1 px-4 py-2 bg-primary-500 text-surface-50 rounded-lg hover:bg-primary-500/80 transition-colors"
			>
				Save
			</button>
			<button
				onclick={ondelete}
				class="flex-1 px-4 py-2 bg-surface-400/10 text-surface-50 rounded-lg hover:bg-surface-300/20 transition-colors"
			>
				Delete
			</button>
			<button
				onclick={oncancel}
				class="flex-1 px-4 py-2 bg-surface-500/5 text-surface-50 rounded-lg hover:bg-surface-400/10 transition-colors"
			>
				Cancel
			</button>
		</div>
	</div>
</div>
