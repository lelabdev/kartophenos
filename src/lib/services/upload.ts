import type { GalleryImage, Pin } from '$lib/types/gallery';

// Lazy-load pdfjs to avoid top-level side effects
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
	if (!pdfjsLib) {
		pdfjsLib = await import('pdfjs-dist');
		pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
			'pdfjs-dist/build/pdf.worker.min.mjs',
			import.meta.url
		).toString();
	}
	return pdfjsLib;
}

export async function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to read file as data URL'));
			}
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});
}

export async function createThumbnail(dataUrl: string, maxSize: number = 300): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			let { width, height } = img;

			if (width > height) {
				if (width > maxSize) {
					height = (height * maxSize) / width;
					width = maxSize;
				}
			} else {
				if (height > maxSize) {
					width = (width * maxSize) / height;
					height = maxSize;
				}
			}

			canvas.width = Math.max(1, Math.round(width));
			canvas.height = Math.max(1, Math.round(height));

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Failed to get canvas context'));
				return;
			}

			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			resolve(canvas.toDataURL('image/jpeg', 0.8));
		};
		img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
		img.src = dataUrl;
	});
}

export async function pdfToImage(file: File): Promise<{ dataUrl: string; pageCount: number }> {
	const pdfjs = await getPdfjs();
	const arrayBuffer = await file.arrayBuffer();
	const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
	const pageCount = pdf.numPages;

	const page = await pdf.getPage(1);
	const viewport = page.getViewport({ scale: 2.0 });
	const canvas = document.createElement('canvas');

	canvas.height = viewport.height;
	canvas.width = viewport.width;

	await page.render({
		canvas,
		viewport
	}).promise;

	const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
	return { dataUrl, pageCount };
}

export function isImageFile(file: File): boolean {
	const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
	return validTypes.includes(file.type);
}

export function isPdfFile(file: File): boolean {
	return file.type === 'application/pdf';
}

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve({ width: img.width, height: img.height });
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = dataUrl;
	});
}

	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export function generatePin(x: number, y: number, label: string, color: string = '#e74c3c'): Pin {
	return {
		id: generateId(),
		x,
		y,
		label,
		color,
		createdAt: Date.now()
	};
}
