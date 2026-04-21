export type ViewFilter = 'original' | 'red' | 'nightvision';

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
		// invert: white→black, black→white. Then hue-rotate shifts the new white to red.
		css: 'invert(1) hue-rotate(-30deg) brightness(0.85)',
		dot: '#e74c3c'
	},
	{
		id: 'nightvision',
		label: 'Night',
		// invert: white→black, black→white. hue-rotate(80deg) shifts the new white to green.
		css: 'invert(1) hue-rotate(80deg) brightness(0.85)',
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
			nightvision: 'kartoPhenos-night'
		};
		return map[active];
	},
	set,
	cycle
};