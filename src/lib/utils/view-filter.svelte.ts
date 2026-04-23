export type ViewFilter = 'original' | 'red' | 'inverted' | 'nightvision';

const STORAGE_KEY = 'kartophenos-filter';

export const VIEW_FILTERS: {
	id: ViewFilter;
	label: string;
	css: string;
	dot: string;
}[] = [
	{ id: 'original', label: 'Normal', css: '', dot: '#888' },
	{
		id: 'red',
		label: 'Rouge',
		// B&W → invert (black bg, white lines) → tint red
		css: 'grayscale(1) invert(1) brightness(0.85) sepia(1) saturate(3) hue-rotate(-30deg)',
		dot: '#e74c3c'
	},
	{
		id: 'inverted',
		label: 'Inversé',
		css: 'invert(1)',
		dot: '#ddd'
	},
	{
		id: 'nightvision',
		label: 'Night',
		// B&W → invert (black bg, white lines) → tint green (night vision, muted)
		css: 'grayscale(1) invert(1) brightness(0.55) sepia(1) saturate(1.5) hue-rotate(80deg)',
		dot: '#2ecc71'
	}
];

function getStored(): ViewFilter {
	if (typeof window === 'undefined') return 'original';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && VIEW_FILTERS.some((f) => f.id === stored)) return stored as ViewFilter;
	return 'original';
}

let active = $state<ViewFilter>(typeof window !== 'undefined' ? getStored() : 'original');

function set(filter: ViewFilter) {
	active = filter;
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, filter);
	}
}

function cycle() {
	const ids = VIEW_FILTERS.map((f) => f.id);
	const next = (ids.indexOf(active) + 1) % ids.length;
	set(ids[next]!);
}

export const viewFilter = {
	get active() { return active; },
	get css() { return VIEW_FILTERS.find((f) => f.id === active)?.css ?? ''; },
	get current() { return VIEW_FILTERS.find((f) => f.id === active)!; },
	get theme() {
		const map: Record<ViewFilter, string> = {
			original: 'kartoPhenos',
			red: 'kartoPhenos-red',
			inverted: 'kartoPhenos',
			nightvision: 'kartoPhenos-night'
		};
		return map[active];
	},
	set,
	cycle
};
