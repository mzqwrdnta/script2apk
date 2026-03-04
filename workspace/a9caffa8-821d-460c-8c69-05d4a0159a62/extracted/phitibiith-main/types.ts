
export type AppState = 'start' | 'capture' | 'editing';

export type TemplateType = 'strip' | 'y2k' | 'grid' | 'film' | 'modern' | 'retro' | 'wide' | 'scatter' | 'comic' | 'floral' | 'cyber';
export type FilterType = 'normal' | 'grayscale' | 'sepia' | 'vivid' | 'vintage' | 'dreamy';

export interface PhotoSlot {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
}

export interface TemplateConfig {
  id: TemplateType;
  name: string;
  width: number;
  height: number;
  defaultBackgroundColor: string;
  photoSlots: PhotoSlot[];
  overlayImage?: string; // For internal overlays if needed
}

export interface FrameConfig {
  id: string;
  name: string;
  url: string; // URL or Base64 of the PNG
}

export interface Sticker {
  id: string;
  url: string; // Emoji char or Image URL
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isAiGenerated?: boolean;
}

export interface TextObject {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
  isBold: boolean;
  shadow?: boolean;
}
