const STORAGE_KEY = 'kartophenos-brightness';
const DEFAULT = 100;
const MIN = 20;
const MAX = 100;

function getStored(): number {
	if (typeof window === 'undefined') return DEFAULT;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		const val = parseInt(stored, 10);
		if (!isNaN(val) && val >= MIN && val <= MAX) return val;
	}
	return DEFAULT;
}

let value = $state<number>(typeof window !== 'undefined' ? getStored() : DEFAULT);

export const brightnessStore = {
	get value() { return value; },
	get MIN() { return MIN; },
	get MAX() { return MAX; },
	set(v: number) {
		value = Math.max(MIN, Math.min(MAX, v));
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, String(value));
		}
	}
};
