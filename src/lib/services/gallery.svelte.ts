import { del, get, set, createStore } from 'idb-keyval';
import type { GalleryImage, Pin } from '$lib/types/gallery';
import {
	fileToDataUrl,
	createThumbnail,
	pdfToImage,
	isImageFile,
	isPdfFile,
	getImageDimensions,
	generateId,
	convertToGrayscale,
	isGrayscale
} from './upload';

const imagesStore = createStore('kartophenos-meta', 'images');
const fullSizeStore = createStore('kartophenos-full', 'fullsize');

// Strip Svelte 5 Proxy wrappers so IndexedDB can structuredClone the data
function toRaw<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

// Save images to IndexedDB (strips Svelte proxies)
async function saveImages(images: GalleryImage[]): Promise<void> {
	await set('images', toRaw(images), imagesStore);
}

interface GalleryServiceState {
	images: GalleryImage[];
	initialized: boolean;
}

export class GalleryService {
	private _state: GalleryServiceState = $state({
		images: [],
		initialized: false
	});

	constructor() {
		this.init();
	}

	get images(): GalleryImage[] {
		return this._state.images;
	}

	get initialized(): boolean {
		return this._state.initialized;
	}

	get categories(): string[] {
		const categories = new Set(this._state.images.map((img) => img.category));
		return Array.from(categories).sort();
	}

	get favorites(): GalleryImage[] {
		return this._state.images.filter((img) => img.isFavorite);
	}

	private async init(): Promise<void> {
		if (this._state.initialized) return;

		try {
			await this.loadAll();
			this._state.initialized = true;
		} catch (error) {
			console.error('Failed to initialize gallery service:', error);
			throw error;
		}
	}

	async loadAll(): Promise<void> {
		try {
			const images = await get<GalleryImage[]>('images', imagesStore);
			this._state.images = images || [];
		} catch (error) {
			console.error('Failed to load images:', error);
			this._state.images = [];
		}
	}

	async addImage(file: File, category: string): Promise<GalleryImage> {
		let dataUrl: string;
		let isPdf = false;
		let pdfPageCount: number | undefined;

		try {
			if (isImageFile(file)) {
				dataUrl = await fileToDataUrl(file);
			} else if (isPdfFile(file)) {
				const result = await pdfToImage(file);
				dataUrl = result.dataUrl;
				isPdf = true;
				pdfPageCount = result.pageCount;
			} else {
				throw new Error('Unsupported file type: ' + file.type);
			}

			// Auto-convert to grayscale if image has color (maps/cards look better in B&W)
			// Wrapped in try/catch so upload still works even if conversion fails
			try {
				const alreadyGray = await isGrayscale(dataUrl);
				if (!alreadyGray) {
					dataUrl = await convertToGrayscale(dataUrl);
				}
			} catch (grayError) {
				console.warn('[kartoPhenos] Grayscale conversion skipped:', grayError);
			}

			const { width, height } = await getImageDimensions(dataUrl);
			const thumbnail = await createThumbnail(dataUrl);

			const newImage: GalleryImage = {
				id: generateId(),
				name: file.name,
				category,
				dataUrl: '',
				thumbnail,
				width,
				height,
				isFavorite: false,
				isPdf,
				pdfPageCount,
				createdAt: Date.now(),
				pins: []
			};

			this._state.images = [...this._state.images, newImage];

			await set(newImage.id, dataUrl, fullSizeStore);
		await saveImages(this._state.images);

		return newImage;
	} catch (error) {
		console.error('Failed to add image:', error);
		throw error;
	}
	}

	async removeImage(id: string): Promise<void> {
		try {
			await del(id, fullSizeStore);
			this._state.images = this._state.images.filter((img) => img.id !== id);
			await saveImages(this._state.images);
		} catch (error) {
			console.error('Failed to remove image:', error);
			throw error;
		}
	}

	async toggleFavorite(id: string): Promise<void> {
		const image = this._state.images.find((img) => img.id === id);
		if (!image) {
			throw new Error('Image not found');
		}

		image.isFavorite = !image.isFavorite;
		await saveImages(this._state.images);
	}

	async updateImage(id: string, updates: Partial<GalleryImage>): Promise<void> {
		const image = this._state.images.find((img) => img.id === id);
		if (!image) {
			throw new Error('Image not found');
		}

		Object.assign(image, updates);
		await saveImages(this._state.images);
	}

	async addPin(imageId: string, pin: Pin): Promise<void> {
		const image = this._state.images.find((img) => img.id === imageId);
		if (!image) {
			throw new Error('Image not found');
		}

		image.pins = [...image.pins, pin];
		await saveImages(this._state.images);
	}

	async removePin(imageId: string, pinId: string): Promise<void> {
		const image = this._state.images.find((img) => img.id === imageId);
		if (!image) {
			throw new Error('Image not found');
		}

		image.pins = image.pins.filter((pin) => pin.id !== pinId);
		await saveImages(this._state.images);
	}

	async updatePin(imageId: string, pinId: string, updates: Partial<Pin>): Promise<void> {
		const image = this._state.images.find((img) => img.id === imageId);
		if (!image) {
			throw new Error('Image not found');
		}

		const pin = image.pins.find((p) => p.id === pinId);
		if (!pin) {
			throw new Error('Pin not found');
		}

		Object.assign(pin, updates);
		await saveImages(this._state.images);
	}

	async getFullSizeDataUrl(id: string): Promise<string> {
		const dataUrl = await get<string>(id, fullSizeStore);
		if (!dataUrl) {
			throw new Error('Image not found');
		}
		return dataUrl;
	}

	async searchImages(query: string): Promise<GalleryImage[]> {
		const lowerQuery = query.toLowerCase();
		return this._state.images.filter(
			(img) => img.name.toLowerCase().includes(lowerQuery) || img.category.toLowerCase().includes(lowerQuery)
		);
	}

	async getImagesByCategory(category: string): Promise<GalleryImage[]> {
		return this._state.images.filter((img) => img.category === category);
	}
}

let galleryServiceInstance: GalleryService | null = null;

export function getGalleryService(): GalleryService {
	if (!galleryServiceInstance) {
		galleryServiceInstance = new GalleryService();
	}
	return galleryServiceInstance;
}
