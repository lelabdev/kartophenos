export interface GalleryImage {
	id: string;
	name: string;
	category: string;
	dataUrl: string;
	thumbnail: string;
	width: number;
	height: number;
	isFavorite: boolean;
	isPdf: boolean;
	pdfPageCount?: number;
	pdfPageIndex?: number;
	createdAt: number;
	pins: Pin[];
}

export interface Pin {
	id: string;
	x: number;
	y: number;
	label: string;
	color: string;
	createdAt: number;
}
