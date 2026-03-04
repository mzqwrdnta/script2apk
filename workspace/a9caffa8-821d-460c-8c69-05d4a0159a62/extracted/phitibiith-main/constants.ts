
import { TemplateConfig, TemplateType, FilterType, FrameConfig } from './types';

// Expanded Sticker Collection
export const STICKER_CATEGORIES = {
  'Kawaii': ['🎀', '💖', '🧸', '🌸', '🩰', '🦢', '🍰', '🍓', '🍒', '💌', '🍡', '🍭', '🐰', '🐾', '🥛', '🧁', '🍬', '🍼', '🦄', '🌈', '👼', '👙', '👛', '💅', '👘', '🎠'],
  'Y2K': ['⛓️', '🧷', '💿', '🦋', '🔥', '👽', '💀', '🩹', '🎸', '🔌', '🧿', '🧬', '🦠', '🖤', '👾', '🕷️', '🕸️', '🎧', '📼', '📱', '🕹️', '📟', '🛹', '👟', '💍', '🕶️'],
  'Sparkle': ['✨', '🌟', '💫', '⚡', '🌙', '☁️', '🫧', '💎', '✴️', '❇️', '⭐', '🌌', '🎆', '🎐', '❄️', '☄️', '💫', '☀️', '🕯️', '💡', '🔦', '🎇', '🌠'],
  'Vibe': ['😎', '🌈', '🍦', '🍕', '🐶', '🐱', '🦄', '💊', '☮️', '☯️', '🍄', '🌵', '🌺', '🍹', '🏖️', '🛹', '🚲', '📷', '💣', '🧨', '🗿', '🎪', '🎭', '🎨', '🎰', '🎱'],
  'Animals': ['🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦆', '🦅', '🦉', '🐝', '🦋', '🐞', '🐌', '🦞', '🦀', '🐡', '🐙'],
  'Food': ['🍎', '🍌', '🍉', '🍇', '🍓', '🍑', '🍒', '🍍', '🥝', '🍅', '🥑', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🍜', '🍣', '🍩', '🍪', '🎂', '🍿', '🥤', '🧋'],
  'Love': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '👄', '💋', '💍', '💐', '💒'],
  'Decor': ['〰️', '➰', '➿', '✔️', '❌', '⭕', '⬛', '⬜', '🔶', '🔷', '🔺', '🔻', '♥️', '♣️', '♦️', '▪️', '▫️', '🟡', '🟣', '🟢', '💠', '⚜️', '🔱', '📛', '🔰']
};

// --- PRESET FRAMES ---
export const PRESET_FRAMES: FrameConfig[] = [
  {
    id: 'none',
    name: 'No Frame',
    url: ''
  },
  {
    id: 'cute-hearts',
    name: 'Cute Hearts',
    url: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cpattern id='heart' width='50' height='50' patternUnits='userSpaceOnUse'%3E%3Ctext x='0' y='30' font-size='20'%3E💗%3C/text%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='none' stroke='pink' stroke-width='40' /%3E%3Crect width='100%25' height='100%25' fill='url(%23heart)' opacity='0.5' pointer-events='none'/%3E%3C/svg%3E`
  },
  {
    id: 'cool-black',
    name: 'Edgy Black',
    url: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='none' stroke='black' stroke-width='50' /%3E%3Crect x='10' y='10' width='calc(100%25 - 20px)' height='calc(100%25 - 20px)' fill='none' stroke='white' stroke-width='2' stroke-dasharray='10,5'/%3E%3C/svg%3E`
  },
  {
    id: 'gradient-dream',
    name: 'Dreamy',
    url: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:rgb(255,255,0);stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:rgb(255,0,0);stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='none' stroke='url(%23grad1)' stroke-width='30' /%3E%3C/svg%3E`
  }
];

export const TEMPLATES: Record<TemplateType, TemplateConfig> = {
  strip: {
    id: 'strip',
    name: 'Classic Strip',
    width: 600,
    height: 1800,
    defaultBackgroundColor: '#ffffff',
    photoSlots: [
      { x: 50, y: 50, w: 500, h: 500 },
      { x: 50, y: 580, w: 500, h: 500 },
      { x: 50, y: 1110, w: 500, h: 500 },
    ]
  },
  y2k: {
    id: 'y2k',
    name: 'Y2K Wave',
    width: 800,
    height: 2000,
    defaultBackgroundColor: '#fdf6e3',
    photoSlots: [
      { x: 100, y: 140, w: 600, h: 450 },
      { x: 100, y: 640, w: 600, h: 450 },
      { x: 100, y: 1140, w: 600, h: 450 },
    ]
  },
  grid: {
    id: 'grid',
    name: 'HQ Square',
    width: 1200,
    height: 1200,
    defaultBackgroundColor: '#ffffff',
    photoSlots: [
      { x: 60, y: 60, w: 520, h: 520 },
      { x: 620, y: 60, w: 520, h: 520 },
      { x: 60, y: 620, w: 520, h: 520 },
      { x: 620, y: 620, w: 520, h: 520 },
    ]
  },
  film: {
    id: 'film',
    name: 'Cinema',
    width: 800,
    height: 1800,
    defaultBackgroundColor: '#000000',
    photoSlots: [
      { x: 100, y: 80, w: 600, h: 400 },
      { x: 100, y: 500, w: 600, h: 400 },
      { x: 100, y: 920, w: 600, h: 400 },
      { x: 100, y: 1340, w: 600, h: 400 },
    ]
  },
  modern: {
    id: 'modern',
    name: 'Modern Art',
    width: 1200,
    height: 1600,
    defaultBackgroundColor: '#FAFAFA',
    photoSlots: [
      { x: 60, y: 60, w: 1080, h: 720 }, // Main large photo
      { x: 60, y: 810, w: 525, h: 730 }, // Left bottom
      { x: 615, y: 810, w: 525, h: 350 }, // Right mid
      { x: 615, y: 1190, w: 525, h: 350 }, // Right bottom
    ]
  },
  retro: {
    id: 'retro',
    name: 'Instax',
    width: 1200,
    height: 1200,
    defaultBackgroundColor: '#F8F8F8',
    photoSlots: [
      { x: 80, y: 80, w: 480, h: 480, rotate: -3 },
      { x: 640, y: 80, w: 480, h: 480, rotate: 3 },
      { x: 80, y: 640, w: 480, h: 480, rotate: 2 },
      { x: 640, y: 640, w: 480, h: 480, rotate: -2 },
    ]
  },
  wide: {
    id: 'wide',
    name: 'Memphis Wide',
    width: 1800,
    height: 800,
    defaultBackgroundColor: '#FF6B9D',
    photoSlots: [
      { x: 60, y: 60, w: 540, h: 680 },
      { x: 630, y: 60, w: 540, h: 680 },
      { x: 1200, y: 60, w: 540, h: 680 },
    ]
  },
  scatter: {
    id: 'scatter',
    name: 'Pop Scatter',
    width: 1200,
    height: 1200,
    defaultBackgroundColor: '#4ECDC4',
    photoSlots: [
      { x: 80, y: 80, w: 480, h: 480, rotate: -12 },
      { x: 620, y: 50, w: 520, h: 520, rotate: 8 },
      { x: 50, y: 580, w: 520, h: 520, rotate: 6 },
      { x: 580, y: 600, w: 540, h: 540, rotate: -6 },
    ]
  },
  comic: {
    id: 'comic',
    name: 'Comic Pop',
    width: 1200,
    height: 1600,
    defaultBackgroundColor: '#FFE66D',
    photoSlots: [
      { x: 40, y: 40, w: 1120, h: 480 },
      { x: 40, y: 540, w: 550, h: 500 },
      { x: 610, y: 540, w: 550, h: 500 },
      { x: 40, y: 1060, w: 1120, h: 500 },
    ]
  },
  floral: {
    id: 'floral',
    name: 'Floral Dream',
    width: 1200,
    height: 1800,
    defaultBackgroundColor: '#FFF5F7',
    photoSlots: [
      { x: 100, y: 100, w: 1000, h: 650 },
      { x: 100, y: 800, w: 475, h: 850 },
      { x: 625, y: 800, w: 475, h: 850 },
    ]
  },
  cyber: {
    id: 'cyber',
    name: 'Neon Punk',
    width: 1200,
    height: 1200,
    defaultBackgroundColor: '#1A1A2E',
    photoSlots: [
      { x: 40, y: 40, w: 555, h: 555 },
      { x: 605, y: 40, w: 555, h: 555 },
      { x: 40, y: 605, w: 555, h: 555 },
      { x: 605, y: 605, w: 555, h: 555 },
    ]
  }
};

export const FILTERS: { id: FilterType; name: string; css: string }[] = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'grayscale', name: 'B&W', css: 'grayscale(100%) contrast(1.1)' },
  { id: 'sepia', name: 'Sepia', css: 'sepia(80%) contrast(1.1)' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(1.5) contrast(1.1)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(40%) contrast(1.2) brightness(0.9) saturate(0.8)' },
  { id: 'dreamy', name: 'Dreamy', css: 'blur(0.5px) saturate(1.2) brightness(1.1)' },
];

export const FONTS = [
  'Quicksand', 'Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Palatino Linotype', 'Lucida Console'
];
