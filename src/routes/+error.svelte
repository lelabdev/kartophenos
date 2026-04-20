<script lang="ts">
	import { page } from '$app/state';

	const status = $derived(page.status);
	const message = $derived(page.error?.message);

	const errorConfig = $derived(
		status === 404
			? {
					code: '404',
					title: 'Page Not Found',
					description: "The page you're looking for doesn't exist or has been moved.",
					icon: 'search',
					action: { label: 'Go Home', href: '/' }
				}
			: {
					code: status.toString(),
					title: 'Something Went Wrong',
					description: 'An unexpected error occurred. Please try again later.',
					icon: 'alertCircle',
					action: { label: 'Retry', href: page.url.pathname }
				}
	);
</script>

<svelte:head>
	<title>{errorConfig.code} - {errorConfig.title}</title>
	<meta name="description" content={errorConfig.description} />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-black px-4 py-16">
	<div class="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12 text-center max-w-lg">
		<div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-500/10 mb-8">
			<svg
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="text-primary-500"
			>
				{#if errorConfig.icon === 'search'}
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				{:else}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				{/if}
			</svg>
		</div>

		<div class="space-y-4">
			<p class="text-8xl font-black text-primary-500/20">{errorConfig.code}</p>
			<h1 class="text-2xl sm:text-3xl font-bold text-white/90">{errorConfig.title}</h1>
			<p class="text-white/50 text-base">{errorConfig.description}</p>

			{#if status !== 404 && message}
				<div
					class="mt-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl text-left"
				>
					<p
						class="text-[10px] uppercase font-bold text-white/50 mb-1 tracking-wider"
					>
						Error Details
					</p>
					<p class="text-xs font-mono text-primary-400 break-all leading-relaxed">
						{message}
					</p>
				</div>
			{/if}
		</div>

		<div class="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
			<a
				href={errorConfig.action.href}
				class="px-8 py-3 bg-primary-500/20 text-primary-400 border border-primary-500/50 rounded-lg hover:bg-primary-500/30 transition-colors"
			>
				{errorConfig.action.label}
			</a>
			<a
				href="/"
				class="px-8 py-3 bg-white/5 text-white/70 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
			>
				Go Home
			</a>
		</div>
	</div>
</div>
