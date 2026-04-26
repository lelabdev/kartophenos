import { setContext, getContext } from 'svelte';

type StyleMode = 'normal' | 'brutalist';

const STYLE_KEY = Symbol('style');

function createStyle() {
	let mode = $state<StyleMode>('normal');
	let htmlEl = $derived.by(() => document.documentElement);

	$effect(() => {
		if (mode === 'brutalist') {
			htmlEl.dataset.theme = 'kartoPhenos-brutalist';
		} else {
			htmlEl.dataset.theme = 'kartoPhenos';
		}
	});

	return {
		get mode(): StyleMode {
			return mode;
		},
		setMode(newMode: StyleMode) {
			mode = newMode;
		},
		toggle() {
			mode = mode === 'brutalist' ? 'normal' : 'brutalist';
		}
	};
}

type Style = ReturnType<typeof createStyle>;

export function setStyle() {
	return setContext(STYLE_KEY, createStyle());
}

export function getStyle() {
	return getContext<Style>(STYLE_KEY);
}
