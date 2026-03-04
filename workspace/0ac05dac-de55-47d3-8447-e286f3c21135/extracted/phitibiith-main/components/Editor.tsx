import React, { useState, useRef, useEffect } from 'react';
import { Download, Sparkles, X, Plus, Image as ImageIcon, Trash2, Move, ZoomIn, ZoomOut, RotateCw, RotateCcw, Palette, Type, MousePointer2, Film, PlayCircle, Wand2 } from 'lucide-react';
import { Button, IconButton } from './UI';
import { TemplateType, TemplateConfig, Sticker, FilterType } from '../types';
import { generateAiSticker } from '../services/geminiService';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

interface EditorProps {
    photos: string[];
    onReset: () => void;
}

// HIGH RESOLUTION TEMPLATES - Consistent spacing (80-100px margins)
const TEMPLATES: Record<TemplateType, TemplateConfig> = {
    strip: {
        id: 'strip',
        name: 'Classic',
        width: 600,
        height: 1800,
        defaultBackgroundColor: '#fff0f5',
        photoSlots: [
            { x: 80, y: 80, w: 440, h: 440 },
            { x: 80, y: 600, w: 440, h: 440 },
            { x: 80, y: 1120, w: 440, h: 440 },
        ]
    },
    y2k: {
        id: 'y2k',
        name: 'Y2K Wave',
        width: 800,
        height: 2000,
        defaultBackgroundColor: '#fdf6e3',
        photoSlots: [
            { x: 100, y: 120, w: 600, h: 420 },
            { x: 100, y: 620, w: 600, h: 420 },
            { x: 100, y: 1120, w: 600, h: 420 },
        ]
    },
    grid: {
        id: 'grid',
        name: '2x2 Grid',
        width: 1200,
        height: 1600,
        defaultBackgroundColor: '#ffffff',
        photoSlots: [
            { x: 80, y: 80, w: 500, h: 660 },
            { x: 620, y: 80, w: 500, h: 660 },
            { x: 80, y: 800, w: 500, h: 660 },
            { x: 620, y: 800, w: 500, h: 660 },
        ]
    },
    film: {
        id: 'film',
        name: 'Cinema',
        width: 600,
        height: 1800,
        defaultBackgroundColor: '#000000',
        photoSlots: [
            { x: 100, y: 80, w: 400, h: 300 },
            { x: 100, y: 440, w: 400, h: 300 },
            { x: 100, y: 800, w: 400, h: 300 },
            { x: 100, y: 1160, w: 400, h: 300 },
        ]
    },
    modern: {
        id: 'modern',
        name: 'Modern',
        width: 1200,
        height: 1200,
        defaultBackgroundColor: '#1a1a1a',
        photoSlots: [
            { x: 80, y: 80, w: 640, h: 1040 },
            { x: 780, y: 80, w: 340, h: 500 },
            { x: 780, y: 620, w: 340, h: 500 },
        ]
    },
    retro: {
        id: 'retro',
        name: 'Polaroid',
        width: 1200,
        height: 1200,
        defaultBackgroundColor: '#fdf6e3',
        photoSlots: [
            { x: 80, y: 80, w: 480, h: 480, rotate: -2 },
            { x: 640, y: 80, w: 480, h: 480, rotate: 2 },
            { x: 80, y: 640, w: 480, h: 480, rotate: 1 },
            { x: 640, y: 640, w: 480, h: 480, rotate: -1 },
        ]
    },
    wide: {
        id: 'wide',
        name: 'Memphis Wide',
        width: 1800,
        height: 800,
        defaultBackgroundColor: '#FF6B9D',
        photoSlots: [
            { x: 80, y: 80, w: 520, h: 640 },
            { x: 640, y: 80, w: 520, h: 640 },
            { x: 1200, y: 80, w: 520, h: 640 },
        ]
    },
    scatter: {
        id: 'scatter',
        name: 'Pop Scatter',
        width: 1200,
        height: 1200,
        defaultBackgroundColor: '#4ECDC4',
        photoSlots: [
            { x: 100, y: 100, w: 440, h: 440, rotate: -10 },
            { x: 620, y: 80, w: 480, h: 480, rotate: 8 },
            { x: 80, y: 600, w: 480, h: 480, rotate: 5 },
            { x: 600, y: 620, w: 500, h: 500, rotate: -5 },
        ]
    },
    comic: {
        id: 'comic',
        name: 'Comic Pop',
        width: 1200,
        height: 1600,
        defaultBackgroundColor: '#FFE66D',
        photoSlots: [
            { x: 80, y: 80, w: 1040, h: 440 },
            { x: 80, y: 580, w: 500, h: 440 },
            { x: 620, y: 580, w: 500, h: 440 },
            { x: 80, y: 1080, w: 1040, h: 440 },
        ]
    },
    floral: {
        id: 'floral',
        name: 'Floral Dream',
        width: 1200,
        height: 1800,
        defaultBackgroundColor: '#FFF5F7',
        photoSlots: [
            { x: 100, y: 100, w: 1000, h: 600 },
            { x: 100, y: 780, w: 460, h: 800 },
            { x: 640, y: 780, w: 460, h: 800 },
        ]
    },
    cyber: {
        id: 'cyber',
        name: 'Neon Punk',
        width: 1200,
        height: 1200,
        defaultBackgroundColor: '#1A1A2E',
        photoSlots: [
            { x: 80, y: 80, w: 500, h: 500 },
            { x: 620, y: 80, w: 500, h: 500 },
            { x: 80, y: 620, w: 500, h: 500 },
            { x: 620, y: 620, w: 500, h: 500 },
        ]
    }
};

// Extended Filters - organized by category
const FILTERS: { id: string; name: string; css: string; category: string }[] = [
    // Basic
    { id: 'normal', name: 'Normal', css: 'none', category: 'Basic' },
    { id: 'grayscale', name: 'B&W', css: 'grayscale(100%) contrast(1.1)', category: 'Basic' },
    { id: 'sepia', name: 'Sepia', css: 'sepia(80%) contrast(1.1)', category: 'Basic' },

    // Vibrant
    { id: 'vivid', name: 'Vivid', css: 'saturate(1.5) contrast(1.1)', category: 'Vibrant' },
    { id: 'pop', name: 'Pop', css: 'saturate(1.8) contrast(1.2) brightness(1.05)', category: 'Vibrant' },
    { id: 'neon', name: 'Neon', css: 'saturate(2) contrast(1.3) brightness(1.1)', category: 'Vibrant' },
    { id: 'punch', name: 'Punch', css: 'saturate(1.6) contrast(1.25)', category: 'Vibrant' },

    // Retro
    { id: 'vintage', name: 'Vintage', css: 'sepia(40%) contrast(1.2) brightness(0.9) saturate(0.8)', category: 'Retro' },
    { id: 'retro', name: 'Retro', css: 'sepia(30%) saturate(1.2) contrast(1.1) brightness(0.95)', category: 'Retro' },
    { id: 'film', name: 'Film', css: 'sepia(20%) contrast(1.15) saturate(0.9) brightness(0.95)', category: 'Retro' },
    { id: 'kodak', name: 'Kodak', css: 'sepia(15%) saturate(1.3) contrast(1.05) brightness(1.02)', category: 'Retro' },
    { id: 'polaroid', name: 'Polaroid', css: 'sepia(25%) contrast(1.1) brightness(1.05) saturate(1.1)', category: 'Retro' },

    // Mood
    { id: 'dreamy', name: 'Dreamy', css: 'blur(0.3px) saturate(1.2) brightness(1.1)', category: 'Mood' },
    { id: 'soft', name: 'Soft', css: 'blur(0.2px) brightness(1.05) contrast(0.95)', category: 'Mood' },
    { id: 'fade', name: 'Fade', css: 'contrast(0.9) brightness(1.1) saturate(0.85)', category: 'Mood' },
    { id: 'haze', name: 'Haze', css: 'brightness(1.08) contrast(0.92) saturate(0.9)', category: 'Mood' },

    // Warm & Cool
    { id: 'warm', name: 'Warm', css: 'sepia(25%) saturate(1.15) brightness(1.02)', category: 'Tone' },
    { id: 'golden', name: 'Golden', css: 'sepia(35%) saturate(1.2) brightness(1.05)', category: 'Tone' },
    { id: 'cool', name: 'Cool', css: 'saturate(1.1) hue-rotate(15deg) brightness(1.02)', category: 'Tone' },
    { id: 'arctic', name: 'Arctic', css: 'saturate(0.9) hue-rotate(20deg) brightness(1.05)', category: 'Tone' },

    // Cinematic
    { id: 'cinema', name: 'Cinema', css: 'contrast(1.2) saturate(0.85) brightness(0.95)', category: 'Cinema' },
    { id: 'noir', name: 'Noir', css: 'grayscale(100%) contrast(1.3) brightness(0.9)', category: 'Cinema' },
    { id: 'drama', name: 'Drama', css: 'contrast(1.25) saturate(0.9) brightness(0.92)', category: 'Cinema' },
    { id: 'moody', name: 'Moody', css: 'contrast(1.15) brightness(0.88) saturate(0.95)', category: 'Cinema' },

    // Kawaii
    { id: 'kawaii', name: 'Kawaii', css: 'saturate(1.3) brightness(1.08) contrast(0.95)', category: 'Cute' },
    { id: 'peach', name: 'Peach', css: 'sepia(20%) saturate(1.25) brightness(1.05)', category: 'Cute' },
    { id: 'pastel', name: 'Pastel', css: 'saturate(0.85) brightness(1.1) contrast(0.9)', category: 'Cute' },
    { id: 'cherry', name: 'Cherry', css: 'saturate(1.4) sepia(10%) brightness(1.02)', category: 'Cute' },
];

const PRESET_STICKERS = [
    // Cute & Aesthetic
    '🎀', '💖', '🧸', '🌸', '🩰', '🦢', '🍰', '🍓', '🍒', '💌', '🍡', '🍭', '🐰', '🐾', '🥛', '🧁', '🍬', '🍼', '🦄', '🌈',
    '🐱', '🐶', '🐭', '🦊', '🐻', '🐼', '🐹', '🦒', '🦋', '🐝', '🐞', '🌻', '🌷', '🌵', '🍑', '🍋', '🥞', '🥐', '🍦', '🍩',
    // Cool / Y2K / Retro
    '⛓️', '🧷', '💿', '🦋', '🔥', '👽', '💀', '🩹', '🎸', '🔌', '🧿', '🧬', '🖤', '👾', '🕷️', '🕸️', '🎧', '📼', '📱', '📟',
    '🛸', '🪐', '🎸', '🎮', '🕹️', '🛹', '🎱', '🎲', '🃏', '🎤', '🎬', '🎹', '🎷', '🎺', '🎸', '🥁', '🎭', '🎨', '🖌️', '🖍️',
    // Sparkles & Vibe
    '✨', '🌟', '💫', '⚡', '🌙', '☁️', '🫧', '💎', '😎', '🍦', '🍕', '🐶', '🐱', '💊', '☮️', '☯️', '🍄', '🌵', '🌺', '🍹',
    '🍀', '🌿', '🐚', '🌊', '☀️', '⭐', '🎈', '🎉', '🎊', '🎁', '💌', '💍', '💄', '👗', '👜', '👠', '👑', '💄', '💅', '💆'
];

const BG_PALETTES = {
    Pastel: ['#FFF0F5', '#E6E6FA', '#F0F8FF', '#F5F5DC', '#FFE5EC', '#E0FFFF', '#FDF6E3'],
    Dark: ['#1A1A1A', '#2D3436', '#000000', '#2C3E50', '#1E272E'],
    Vivid: ['#FF69B4', '#FFB7B2', '#87CEEB', '#FFCC00', '#00D1FF', '#00D1FF'],
    Classic: ['#FFFFFF', '#F8F8F8', '#EEEEEE', '#DCDCDC']
};

const PATTERNS = [
    { id: 'none', name: 'Solid', icon: '⬜' },
    { id: 'dots', name: 'Polka', icon: '•' },
    { id: 'grid', name: 'Grid', icon: '曲' },
    { id: 'waves', name: 'Waves', icon: '〰' },
    { id: 'hearts', name: 'Love', icon: '♥' },
    { id: 'stars', name: 'Spark', icon: '★' },
    { id: 'stripes', name: 'Lines', icon: '≡' },
    { id: 'diamonds', name: 'Gem', icon: '◈' },
    { id: 'zigzag', name: 'ZigZag', icon: '∿' },
    { id: 'glitter', name: 'Glitter', icon: '✨' },
    { id: 'checker', name: 'Check', icon: '🏁' },
    { id: 'retro', name: 'Vapor', icon: '💾' },
    { id: 'bubbles', name: 'Bubble', icon: '🫧' },
    { id: 'confetti', name: 'Party', icon: '🎊' }
];

type EditorTab = 'layout' | 'design' | 'stickers';

export const Editor: React.FC<EditorProps> = ({ photos, onReset }) => {
    const [activeTemplate, setActiveTemplate] = useState<TemplateType>('y2k');
    const [activeFilter, setActiveFilter] = useState<FilterType>('normal');
    const [activeTab, setActiveTab] = useState<EditorTab>('layout');
    const [bgColor, setBgColor] = useState<string>('#ffffff');
    const [showDate, setShowDate] = useState(true);
    const [bgPattern, setBgPattern] = useState<string>('none');

    // Customization
    const [cornerRadius, setCornerRadius] = useState(10);
    const [framePadding, setFramePadding] = useState(20);
    const [shadowStrength, setShadowStrength] = useState(15);

    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

    // AI
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedStickers, setGeneratedStickers] = useState<string[]>([]);

    // GIF
    const [isRecording, setIsRecording] = useState(false);
    const [gifUrl, setGifUrl] = useState<string | null>(null);

    const [canvasZoom, setCanvasZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

    // Photo position adjustments within frames
    const [photoOffsets, setPhotoOffsets] = useState<{ [key: number]: { x: number; y: number } }>({});
    const [selectedPhotoSlot, setSelectedPhotoSlot] = useState<number | null>(null);
    const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const staticCanvasRef = useRef<HTMLCanvasElement | null>(null); // Cache for expensive rendering
    const isStaticDirty = useRef(true);
    const photoCache = useRef<Map<string, HTMLImageElement>>(new Map());
    const stickerCache = useRef<Map<string, HTMLImageElement>>(new Map());
    const currentTemplate = TEMPLATES[activeTemplate];

    // Mobile detection and optimization
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const useGrain = !isMobile; // Disable grain on mobile for better performance

    // Initialize bg color when template changes
    useEffect(() => {
        setBgColor(currentTemplate.defaultBackgroundColor);
        // Add default decor stickers for Y2K template if empty
        if (activeTemplate === 'y2k' && stickers.length === 0) {
            setStickers([
                { id: 'def-1', url: '🧸', x: 150, y: 1750, scale: 2.5, rotation: -15 },
                { id: 'def-2', url: '✨', x: 700, y: 100, scale: 2, rotation: 0 },
                { id: 'def-3', url: '⛓️', x: 100, y: 100, scale: 2, rotation: 45 },
            ]);
        }
    }, [activeTemplate]);

    // --- DRAWING FUNCTIONS ---

    // Procedural Wavy Checkerboard
    const drawWavyCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number, color1: string, color2: string) => {
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, width, height);

        const tileSize = 80;
        ctx.fillStyle = color2; // Black usually

        for (let y = 0; y < height; y += 10) {
            const rowPhase = (y / 150) * Math.PI * 2; // Wavy vertical
            for (let x = 0; x < width; x += tileSize) {
                // Distort X based on sine of Y
                const xOffset = Math.sin(y * 0.01) * 30;

                // Simple checker logic
                const colIndex = Math.floor(x / tileSize);
                const rowIndex = Math.floor(y / tileSize);

                // Draw warped rects is hard, let's draw strips
            }
        }

        // Simpler approach: Standard warped checkerboard
        // We will draw many small rects
        const cols = Math.ceil(width / tileSize) + 2;
        const rows = Math.ceil(height / tileSize);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r + c) % 2 === 1) {
                    const x = c * tileSize - 50;
                    const y = r * tileSize;

                    // Wavy distortion
                    const wave = Math.sin(y * 0.005) * 60; // Amplitude 60

                    ctx.beginPath();
                    // Top left
                    ctx.moveTo(x + wave, y);
                    // Top right
                    ctx.lineTo(x + tileSize + wave, y);
                    // Bottom right (wave shifts slightly)
                    const waveBottom = Math.sin((y + tileSize) * 0.005) * 60;
                    ctx.lineTo(x + tileSize + waveBottom, y + tileSize);
                    // Bottom left
                    ctx.lineTo(x + waveBottom, y + tileSize);
                    ctx.fill();
                }
            }
        }
    };

    const drawFilmStripHoles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = "#ffffff";
        const holeW = 30;
        const holeH = 20;
        const gap = 30;

        // Left side holes
        for (let y = 20; y < height; y += (holeH + gap)) {
            ctx.fillRect(15, y, holeW, holeH);
            ctx.fillRect(width - 15 - holeW, y, holeW, holeH);
        }
    };

    const drawHalftone = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        for (let x = 0; x < width; x += 15) {
            for (let y = 0; y < height; y += 15) {
                const radius = Math.random() * 3 + 1;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    };

    const drawGrain = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 15;
            data[i] += noise;
            data[i + 1] += noise;
            data[i + 2] += noise;
        }
        ctx.putImageData(imageData, 0, 0);
    };

    // ===== OPTIMIZED 2-STAGE RENDERING SYSTEM =====
    // Stage 1: Draw STATIC content to offscreen canvas (backgrounds, photos, filters)
    const drawStaticContent = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // Pattern (simplified for mobile)
        if (bgPattern !== 'none') {
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            if (bgColor === '#000000' || bgColor === '#1A1A1A') ctx.fillStyle = "rgba(255,255,255,0.2)";

            if (bgPattern === 'dots') {
                for (let x = 0; x < width; x += 30) for (let y = 0; y < height; y += 30) {
                    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
                }
            } else if (bgPattern === 'grid') {
                ctx.strokeStyle = ctx.fillStyle as string; ctx.lineWidth = 1;
                for (let x = 0; x < width; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
                for (let y = 0; y < height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
            } else {
                // Simplified patterns for performance
                ctx.font = "20px Arial";
                const char = bgPattern === 'hearts' ? '♥' : (bgPattern === 'stars' ? '✦' : '•');
                for (let x = 0; x < width; x += 60) for (let y = 0; y < height; y += 60) ctx.fillText(char, x, y);
            }
            ctx.restore();
        }

        // Template-specific backgrounds (simplified)
        if (activeTemplate === 'y2k') {
            drawWavyCheckerboard(ctx, width, height, bgColor, '#000000');
        } else if (activeTemplate === 'film') {
            drawFilmStripHoles(ctx, width, height);
        } else if (activeTemplate === 'cyber') {
            ctx.save();
            ctx.strokeStyle = '#FF00FF'; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
            for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
            for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 2);
            ctx.restore();
        }

        // Photos with filters (CACHED - expensive operation)
        const filter = FILTERS.find(f => f.id === activeFilter);
        ctx.filter = filter ? filter.css : 'none';

        const slots = currentTemplate.photoSlots;
        photos.forEach((photoUrl, index) => {
            if (index >= slots.length) return;
            if (photoCache.current.has(photoUrl)) {
                drawPhotoInSlot(ctx, photoCache.current.get(photoUrl)!, slots[index], index);
            } else {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = photoUrl;
                img.onload = () => {
                    photoCache.current.set(photoUrl, img);
                    isStaticDirty.current = true; // Mark for re-render
                };
            }
        });

        ctx.filter = 'none';

        // Date stamp
        if (showDate) {
            ctx.font = "bold 28px 'Courier New', monospace";
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4;
            ctx.textAlign = "right";
            ctx.fillText(new Date().toLocaleDateString(), width - 40, height - 30);
            ctx.shadowColor = "transparent";
        }

        // Optional grain (disabled on mobile)
        if (useGrain) {
            drawGrain(ctx, width, height);
        }
    };

    // Stage 2: Draw DYNAMIC content (stickers) on main canvas
    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Update canvas size if needed
        if (canvas.width !== currentTemplate.width || canvas.height !== currentTemplate.height) {
            canvas.width = currentTemplate.width;
            canvas.height = currentTemplate.height;
            isStaticDirty.current = true;
        }

        // Create static canvas if needed
        if (!staticCanvasRef.current) {
            staticCanvasRef.current = document.createElement('canvas');
            isStaticDirty.current = true;
        }

        const sCanvas = staticCanvasRef.current;

        // Re-draw static content ONLY when dirty
        if (isStaticDirty.current || sCanvas.width !== canvas.width) {
            sCanvas.width = canvas.width;
            sCanvas.height = canvas.height;
            const sCtx = sCanvas.getContext('2d', { alpha: false });
            if (sCtx) {
                drawStaticContent(sCtx, canvas.width, canvas.height);
                isStaticDirty.current = false;
            }
        }

        // Draw cached static content (FAST!)
        ctx.drawImage(sCanvas, 0, 0);

        // Draw stickers (only dynamic part)
        stickers.forEach((sticker) => {
            ctx.save();
            ctx.translate(sticker.x, sticker.y);
            ctx.rotate((sticker.rotation * Math.PI) / 180);
            ctx.scale(sticker.scale, sticker.scale);

            // Selection indicator
            if (sticker.id === selectedStickerId) {
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 4]);
                ctx.strokeRect(-55, -55, 110, 110);
                ctx.setLineDash([]);
            }

            // Draw sticker
            if (sticker.url.startsWith('data:') || sticker.url.startsWith('http')) {
                if (stickerCache.current.has(sticker.url)) {
                    ctx.drawImage(stickerCache.current.get(sticker.url)!, -50, -50, 100, 100);
                } else {
                    const sImg = new Image();
                    sImg.crossOrigin = "anonymous";
                    sImg.src = sticker.url;
                    sImg.onload = () => {
                        stickerCache.current.set(sticker.url, sImg);
                        renderCanvas(); // Re-render when loaded
                    };
                }
            } else {
                // Emoji
                ctx.font = "70px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.shadowColor = "rgba(0,0,0,0.2)";
                ctx.shadowBlur = 8;
                ctx.fillText(sticker.url, 0, 0);
            }
            ctx.restore();
        });

        // Branding
        if (activeTemplate === 'strip') {
            ctx.font = "bold 36px Quicksand, sans-serif";
            ctx.fillStyle = "#ff69b4";
            ctx.textAlign = "center";
            ctx.fillText("KawaiiBooth AI ✨", canvas.width / 2, canvas.height - 70);
        }
    };

    const drawPhotoInSlot = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, slot: any, slotIndex: number) => {
        ctx.save();

        if (slot.rotate) {
            const cx = slot.x + slot.w / 2;
            const cy = slot.y + slot.h / 2;
            ctx.translate(cx, cy);
            ctx.rotate((slot.rotate * Math.PI) / 180);
            ctx.translate(-cx, -cy);
        }

        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = shadowStrength;
        ctx.shadowOffsetX = shadowStrength / 3;
        ctx.shadowOffsetY = shadowStrength / 3;

        ctx.fillStyle = "white";
        ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
        ctx.shadowColor = "transparent";

        const padding = framePadding;
        const ix = slot.x + padding;
        const iy = slot.y + padding;
        const iw = slot.w - (padding * 2);
        const ih = slot.h - (padding * 2);

        // Highlight selected photo slot
        if (selectedPhotoSlot === slotIndex) {
            ctx.strokeStyle = "#FF6B9D";
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(slot.x - 4, slot.y - 4, slot.w + 8, slot.h + 8);
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        const bottomCrop = slot.rotate ? 80 : 0;

        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(ix, iy, iw, ih - bottomCrop, cornerRadius);
        } else {
            ctx.rect(ix, iy, iw, ih - bottomCrop);
        }
        ctx.clip();

        const ratio = Math.max(iw / img.width, (ih) / img.height);
        const baseShift_x = (img.width * ratio - iw) / 2;
        const baseShift_y = (img.height * ratio - ih) / 2;

        // Apply user offset
        const offset = photoOffsets[slotIndex] || { x: 0, y: 0 };
        const finalX = ix - baseShift_x + offset.x;
        const finalY = iy - baseShift_y + offset.y;

        ctx.drawImage(img,
            0, 0, img.width, img.height,
            finalX, finalY, img.width * ratio, img.height * ratio
        );

        ctx.restore();
    };

    // Smart render triggers - ONLY when something changes
    useEffect(() => {
        isStaticDirty.current = true;
        renderCanvas();
    }, [activeTemplate, photos, activeFilter, bgColor, bgPattern, showDate, cornerRadius, framePadding, shadowStrength, photoOffsets, selectedPhotoSlot]);

    useEffect(() => {
        renderCanvas(); // Stickers don't need static re-render
    }, [stickers, selectedStickerId]);

    useEffect(() => {
        // Initial render
        renderCanvas();
    }, []);


    // --- INTERACTION HANDLERS (Drag & Drop) ---

    const getCanvasCoordinates = (e: React.PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        // Account for canvasZoom and panOffset
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    // --- GESTURE HANDLERS ---
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            setLastTouchDist(dist);
            setIsPanning(false);
        } else if (e.touches.length === 1 && !selectedStickerId) {
            setIsPanning(true);
            setLastPanPos({ x: e.touches[0].pageX, y: e.touches[0].pageY });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDist !== null) {
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            const delta = dist / lastTouchDist;
            setCanvasZoom(prev => Math.min(Math.max(prev * delta, 0.5), 4));
            setLastTouchDist(dist);
        } else if (e.touches.length === 1 && isPanning) {
            const dx = e.touches[0].pageX - lastPanPos.x;
            const dy = e.touches[0].pageY - lastPanPos.y;
            setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastPanPos({ x: e.touches[0].pageX, y: e.touches[0].pageY });
        }
    };

    const handleTouchEnd = () => {
        setLastTouchDist(null);
        setIsPanning(false);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        const { x, y } = getCanvasCoordinates(e);

        // Check collision (reverse order)
        let clickedId = null;
        for (let i = stickers.length - 1; i >= 0; i--) {
            const s = stickers[i];
            // Enhanced Hitbox (30% larger for mobile)
            const radius = 65 * s.scale;
            const dist = Math.sqrt(Math.pow(x - s.x, 2) + Math.pow(y - s.y, 2));
            if (dist < radius) {
                clickedId = s.id;
                break;
            }
        }

        if (clickedId) {
            setSelectedStickerId(clickedId);
            setIsDragging(true);
            const s = stickers.find(st => st.id === clickedId);
            if (s) {
                setDragOffset({ x: x - s.x, y: y - s.y });
            }
            // Prevent scrolling on touch
            e.currentTarget.setPointerCapture(e.pointerId);
        } else {
            setSelectedStickerId(null);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !selectedStickerId) return;

        const { x, y } = getCanvasCoordinates(e);

        // Snap to center logic
        let nx = x - dragOffset.x;
        let ny = y - dragOffset.y;

        const centerX = currentTemplate.width / 2;
        const centerY = currentTemplate.height / 2;

        if (Math.abs(nx - centerX) < 30) nx = centerX;
        if (Math.abs(ny - centerY) < 30) ny = centerY;

        setStickers(prev => prev.map(s =>
            s.id === selectedStickerId ? { ...s, x: nx, y: ny } : s
        ));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);

        // Double tap to reset zoom/pan
        const now = Date.now();
        if (now - (e.currentTarget as any).lastClick < 300) {
            setCanvasZoom(1);
            setPanOffset({ x: 0, y: 0 });
        }
        (e.currentTarget as any).lastClick = now;
    };

    // --- ACTIONS ---

    const handleAddSticker = (content: string, isAi: boolean = false) => {
        const newSticker: Sticker = {
            id: Date.now().toString(),
            url: content,
            x: currentTemplate.width / 2,
            y: currentTemplate.height / 2,
            scale: 2.0, // Bigger default for high res
            rotation: (Math.random() - 0.5) * 30, // Random tilt
            isAiGenerated: isAi
        };
        setStickers([...stickers, newSticker]);
        setSelectedStickerId(newSticker.id);
    };

    const updateSticker = (id: string, updates: Partial<Sticker>) => {
        setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const handleGenerateAiSticker = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const stickerData = await generateAiSticker(aiPrompt);
            setGeneratedStickers(prev => [stickerData, ...prev]);
            handleAddSticker(stickerData, true);
            setAiPrompt('');
        } catch (e) {
            alert('Failed to generate sticker. Try again!');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        // Clear all selections before download
        setSelectedStickerId(null);
        setSelectedPhotoSlot(null);

        // Wait for state to update and render
        setTimeout(() => {
            renderCanvas();

            setTimeout(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;

                // Create Ultra HD canvas for export
                const exportCanvas = document.createElement('canvas');
                const scale = 2; // 2x scale for Ultra HD
                exportCanvas.width = canvas.width * scale;
                exportCanvas.height = canvas.height * scale;

                const exportCtx = exportCanvas.getContext('2d', {
                    alpha: false
                });

                if (exportCtx) {
                    // Enable image smoothing for crisp edges
                    exportCtx.imageSmoothingEnabled = true;
                    exportCtx.imageSmoothingQuality = 'high';

                    // Fill white background
                    exportCtx.fillStyle = '#ffffff';
                    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

                    // Scale and draw
                    exportCtx.scale(scale, scale);
                    exportCtx.drawImage(canvas, 0, 0);

                    // Use toBlob for proper file download
                    exportCanvas.toBlob((blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.download = `PhityBiith-${Date.now()}.png`;
                            link.href = url;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }
                    }, 'image/png', 1.0);
                } else {
                    // Fallback
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.download = `PhityBiith-${Date.now()}.png`;
                            link.href = url;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }
                    }, 'image/png', 1.0);
                }
            }, 50);
        }, 100);
    };

    const handleGifDownload = async () => {
        setIsRecording(true);

        try {
            const gifCanvas = document.createElement('canvas');
            // Optimized GIF - 480px for faster rendering
            const gifSize = 480;
            gifCanvas.width = gifSize;
            gifCanvas.height = gifSize;
            const ctx = gifCanvas.getContext('2d', {
                willReadFrequently: true,
                alpha: false
            });
            if (!ctx) {
                setIsRecording(false);
                return;
            }

            // Disable image smoothing for faster rendering
            ctx.imageSmoothingEnabled = false;

            const encoder = new GIFEncoder();

            // Load photos
            const loadedImages: HTMLImageElement[] = [];
            for (const photoUrl of photos) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = photoUrl;
                await new Promise<void>((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
                if (img.complete && img.naturalWidth > 0) {
                    loadedImages.push(img);
                }
            }

            if (loadedImages.length === 0) {
                alert('No photos to create GIF!');
                setIsRecording(false);
                return;
            }

            // Memphis color palette
            const memphisColors = {
                pink: '#FF6B9D',
                teal: '#4ECDC4',
                yellow: '#FFE66D',
                purple: '#9B5DE5',
                black: '#1A1A1A',
                white: '#FFFFFF',
                bgPink: '#FFF0F5'
            };

            // Faster GIF settings
            const framesPerPhoto = 6;  // Reduced from 12
            const transitionFrames = 3; // Reduced from 6

            // Draw Memphis-style frame with bold design (simplified for speed)
            const drawMemphisFrame = (photoIdx: number, anim: number) => {
                const colors = [memphisColors.pink, memphisColors.teal, memphisColors.purple, memphisColors.yellow];
                const accentColor = colors[photoIdx % colors.length];

                // Background - soft pink
                ctx.fillStyle = memphisColors.bgPink;
                ctx.fillRect(0, 0, gifSize, gifSize);

                // Simplified decorations for speed
                ctx.save();

                // Yellow triangle top-left
                ctx.fillStyle = memphisColors.yellow;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(80, 0);
                ctx.lineTo(0, 80);
                ctx.closePath();
                ctx.fill();

                // Teal circle bottom-right
                ctx.fillStyle = memphisColors.teal;
                ctx.beginPath();
                ctx.arc(gifSize - 40, gifSize - 40, 35, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                // Main card - offset shadow (Memphis signature) - scaled for 720px
                const cardX = 50, cardY = 70;
                const cardW = gifSize - 100, cardH = gifSize - 140;

                // Black offset shadow (thicker)
                ctx.fillStyle = memphisColors.black;
                ctx.beginPath();
                ctx.roundRect(cardX + 8, cardY + 8, cardW, cardH, 0);
                ctx.fill();

                // White card
                ctx.fillStyle = memphisColors.white;
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, 0);
                ctx.fill();

                // Bold black border (thicker)
                ctx.strokeStyle = memphisColors.black;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, 0);
                ctx.stroke();

                // Accent color bar at top (taller)
                ctx.fillStyle = accentColor;
                ctx.fillRect(cardX, cardY, cardW, 12);

                // Accent color bar at bottom (taller)
                ctx.fillStyle = accentColor;
                ctx.fillRect(cardX, cardY + cardH - 56, cardW, 56);

                return { x: cardX, y: cardY, w: cardW, h: cardH };
            };

            // Draw photo in Memphis frame (scaled for 720px)
            const drawPhoto = (img: HTMLImageElement, card: { x: number, y: number, w: number, h: number }, alpha = 1) => {
                const photoX = card.x + 12;
                const photoY = card.y + 24;
                const photoW = card.w - 24;
                const photoH = card.h - 88;

                ctx.save();
                ctx.globalAlpha = alpha;

                // Photo border
                ctx.strokeStyle = memphisColors.black;
                ctx.lineWidth = 3;
                ctx.strokeRect(photoX - 2, photoY - 2, photoW + 4, photoH + 4);

                ctx.beginPath();
                ctx.rect(photoX, photoY, photoW, photoH);
                ctx.clip();

                // Cover fit
                const imgRatio = img.width / img.height;
                const frameRatio = photoW / photoH;
                let dw, dh;
                if (imgRatio > frameRatio) {
                    dh = photoH;
                    dw = dh * imgRatio;
                } else {
                    dw = photoW;
                    dh = dw / imgRatio;
                }
                const dx = photoX + (photoW - dw) / 2;
                const dy = photoY + (photoH - dh) / 2;
                ctx.drawImage(img, dx, dy, dw, dh);
                ctx.restore();
            };

            // Draw Memphis-style caption (scaled for 720px)
            const drawCaption = (photoIdx: number, card: { x: number, y: number, w: number, h: number }) => {
                ctx.font = 'bold 22px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = memphisColors.white;
                ctx.fillText('PhityBiith ✨', card.x + card.w / 2, card.y + card.h - 22);
                ctx.textAlign = 'left';
            };

            // Draw photo counter with Memphis style (scaled for 720px)
            const drawCounter = (current: number, total: number) => {
                const dotSize = 14;
                const gap = 24;
                const startX = gifSize / 2 - ((total - 1) * gap) / 2;
                const y = gifSize - 18;

                for (let i = 0; i < total; i++) {
                    const x = startX + i * gap;

                    // Black shadow
                    ctx.fillStyle = memphisColors.black;
                    ctx.beginPath();
                    ctx.arc(x + 3, y + 3, dotSize / 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Colored dot
                    ctx.fillStyle = i === current ? memphisColors.pink : memphisColors.white;
                    ctx.beginPath();
                    ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Border
                    ctx.strokeStyle = memphisColors.black;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            };

            // === INTRO (2 frames - faster) ===
            for (let f = 0; f < 2; f++) {
                const phase = (f / 2) * Math.PI;
                const scale = 0.9 + (f / 2) * 0.1;

                ctx.fillStyle = memphisColors.bgPink;
                ctx.fillRect(0, 0, gifSize, gifSize);

                ctx.save();
                ctx.translate(gifSize / 2, gifSize / 2);
                ctx.scale(scale, scale);
                ctx.translate(-gifSize / 2, -gifSize / 2);

                const card = drawMemphisFrame(0, phase);

                // Ready text 
                ctx.font = 'bold 32px Arial, sans-serif';
                ctx.textAlign = 'center';

                ctx.fillStyle = memphisColors.black;
                ctx.fillText('📸 READY?', card.x + card.w / 2 + 3, card.y + card.h / 2 + 3);

                ctx.fillStyle = memphisColors.pink;
                ctx.fillText('📸 READY?', card.x + card.w / 2, card.y + card.h / 2);
                ctx.textAlign = 'left';
                ctx.restore();

                const data = ctx.getImageData(0, 0, gifSize, gifSize);
                const palette = quantize(data.data, 256);
                const index = applyPalette(data.data, palette);
                encoder.writeFrame(index, gifSize, gifSize, { palette, delay: 80 });
            }

            // === PHOTO SLIDESHOW ===
            for (let i = 0; i < loadedImages.length; i++) {
                const img = loadedImages[i];

                for (let f = 0; f < framesPerPhoto; f++) {
                    const phase = (f / framesPerPhoto) * Math.PI * 2;
                    const card = drawMemphisFrame(i, phase);
                    drawPhoto(img, card, 1);
                    drawCaption(i, card);
                    drawCounter(i, loadedImages.length);

                    const data = ctx.getImageData(0, 0, gifSize, gifSize);
                    const palette = quantize(data.data, 256);
                    const index = applyPalette(data.data, palette);
                    encoder.writeFrame(index, gifSize, gifSize, { palette, delay: 100 });
                }

                // Transition
                if (loadedImages.length > 1) {
                    const nextImg = loadedImages[(i + 1) % loadedImages.length];
                    for (let t = 0; t < transitionFrames; t++) {
                        const prog = t / transitionFrames;
                        const eased = prog * prog * (3 - 2 * prog);
                        const phase = prog * Math.PI;

                        const card = drawMemphisFrame(i, phase);
                        drawPhoto(img, card, 1 - eased);
                        drawPhoto(nextImg, card, eased);
                        drawCounter(i, loadedImages.length);

                        const data = ctx.getImageData(0, 0, gifSize, gifSize);
                        const palette = quantize(data.data, 256);
                        const index = applyPalette(data.data, palette);
                        encoder.writeFrame(index, gifSize, gifSize, { palette, delay: 60 });
                    }
                }
            }

            // === OUTRO (2 frames - faster) ===
            const outroTexts = ['THANKS! 💖', '- FIN -'];
            for (let f = 0; f < 2; f++) {
                const phase = (f / 2) * Math.PI * 2;
                const card = drawMemphisFrame(f, phase);

                ctx.font = 'bold 28px Arial, sans-serif';
                ctx.textAlign = 'center';

                ctx.fillStyle = memphisColors.black;
                ctx.fillText(outroTexts[f], card.x + card.w / 2 + 2, card.y + card.h / 2 + 2);

                const colors = [memphisColors.pink, memphisColors.teal];
                ctx.fillStyle = colors[f % colors.length];
                ctx.fillText(outroTexts[f], card.x + card.w / 2, card.y + card.h / 2);
                ctx.textAlign = 'left';

                const data = ctx.getImageData(0, 0, gifSize, gifSize);
                const palette = quantize(data.data, 256);
                const index = applyPalette(data.data, palette);
                encoder.writeFrame(index, gifSize, gifSize, { palette, delay: 100 });
            }

            encoder.finish();
            const buffer = encoder.bytesView();
            const blob = new Blob([buffer], { type: 'image/gif' });
            setGifUrl(URL.createObjectURL(blob));

        } catch (err) {
            console.error("GIF Error", err);
            alert("Failed to create GIF.");
        } finally {
            setIsRecording(false);
        }
    };

    const deleteSelectedSticker = () => {
        if (selectedStickerId) {
            setStickers(prev => prev.filter(s => s.id !== selectedStickerId));
            setSelectedStickerId(null);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full max-w-[1600px] mx-auto p-2 md:p-4 lg:h-[calc(100vh-100px)] overflow-y-auto lg:overflow-visible">

            {/* LEFT: Preview - Memphis Card Style */}
            <div className="relative w-full lg:flex-1 lg:max-h-[calc(100vh-120px)]">
                {/* Card Shadow */}
                <div className="absolute inset-0 bg-[#4ECDC4] rounded-3xl transform translate-x-2 translate-y-2 hidden lg:block" />

                <div className="relative w-full h-full flex flex-col items-center bg-white p-4 rounded-3xl border-4 border-gray-900 overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between w-full mb-3 items-center z-10 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#FF6B9D] rounded-xl flex items-center justify-center border-2 border-gray-900">
                                <MousePointer2 size={14} className="text-white" />
                            </div>
                            <span className="text-sm font-black text-gray-800 hidden sm:block">Ketuk stiker untuk mengedit</span>
                        </div>
                        <div className="bg-[#9B5DE5] px-3 py-1 rounded-full text-xs font-black border-2 border-gray-900 text-white">
                            {currentTemplate.width}×{currentTemplate.height}
                        </div>
                    </div>

                    {/* Canvas Container - Fixed for desktop */}
                    <div
                        className="relative w-full flex-1 flex items-center justify-center p-3 bg-[#FFF0F5] rounded-2xl border-3 border-dashed border-[#FF6B9D]/40 overflow-auto"
                        style={{ minHeight: '300px', maxHeight: 'calc(100vh - 220px)' }}
                    >
                        <canvas
                            ref={canvasRef}
                            className="max-w-full h-auto object-contain border-4 border-gray-900 rounded-lg bg-white shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
                            style={{
                                touchAction: 'none',
                                maxHeight: 'calc(100vh - 260px)'
                            }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                        />
                    </div>

                    {/* Floating Sticker Controls - Memphis Style */}
                    {selectedStickerId && (
                        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white border-3 border-gray-900 p-3 rounded-2xl flex items-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${isDragging ? 'opacity-30' : 'opacity-100'} transition-opacity`}>
                            {(() => {
                                const s = stickers.find(st => st.id === selectedStickerId);
                                if (!s) return null;
                                return (
                                    <>
                                        <IconButton size="sm" variant="secondary" icon={<ZoomOut size={18} />} onClick={() => updateSticker(selectedStickerId, { scale: Math.max(0.5, s.scale * 0.85) })} />
                                        <IconButton size="sm" variant="secondary" icon={<ZoomIn size={18} />} onClick={() => updateSticker(selectedStickerId, { scale: Math.min(10, s.scale * 1.15) })} />
                                        <div className="w-px h-6 bg-gray-300" />
                                        <IconButton size="sm" variant="secondary" icon={<RotateCcw size={18} />} onClick={() => updateSticker(selectedStickerId, { rotation: s.rotation - 15 })} />
                                        <IconButton size="sm" variant="secondary" icon={<RotateCw size={18} />} onClick={() => updateSticker(selectedStickerId, { rotation: s.rotation + 15 })} />
                                        <div className="w-px h-6 bg-gray-300" />
                                        <IconButton size="sm" variant="danger" icon={<Trash2 size={18} />} onClick={deleteSelectedSticker} />
                                        <button onClick={() => setSelectedStickerId(null)} className="ml-1 p-1.5 hover:bg-gray-100 rounded-full text-gray-600 border-2 border-gray-900">
                                            <X size={14} />
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Tool Panel - Memphis Card Style */}
            <div className="relative w-full lg:w-[380px]">
                {/* Card Shadow */}
                <div className="absolute inset-0 bg-[#FF6B9D] rounded-3xl transform translate-x-2 translate-y-2 hidden lg:block" />

                <div className="relative w-full bg-white rounded-3xl border-4 border-gray-900 flex flex-col overflow-hidden lg:max-h-full">
                    {/* Mobile Handle */}
                    <div className="lg:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2 shrink-0" />

                    {/* Tab Navigation - Memphis Style */}
                    <div className="flex p-3 gap-2 bg-[#FFF0F5] border-b-4 border-gray-900">
                        {[
                            { id: 'layout', icon: <ImageIcon size={18} />, label: 'Layout' },
                            { id: 'filters', icon: <Wand2 size={18} />, label: 'Filters' },
                            { id: 'design', icon: <Palette size={18} />, label: 'Design' },
                            { id: 'stickers', icon: <Sparkles size={18} />, label: 'Stickers' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-black transition-all border-3 ${activeTab === tab.id
                                    ? 'bg-white text-gray-900 border-gray-900 shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
                                    : 'bg-transparent text-gray-600 border-transparent hover:bg-white/50'
                                    }`}
                            >
                                {tab.icon}
                                <span className="text-[9px] uppercase tracking-tight">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">

                        {activeTab === 'layout' && (
                            <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-3 h-3 bg-[#4ECDC4] rounded-full border-2 border-gray-900" />
                                    Choose Frame
                                </h3>
                                <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
                                    {(Object.keys(TEMPLATES) as TemplateType[]).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setActiveTemplate(t)}
                                            className={`group relative overflow-hidden p-3 rounded-2xl border-3 transition-all active:scale-95 ${activeTemplate === t
                                                ? 'border-gray-900 bg-[#4ECDC4] shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
                                                : 'border-gray-200 hover:border-gray-900 bg-white'
                                                }`}
                                        >
                                            <div className={`w-full aspect-[3/4] mb-2 rounded-lg ${activeTemplate === t ? 'bg-white' : 'bg-gray-100'} flex items-center justify-center overflow-hidden border-2 border-gray-900`}>
                                                <ImageIcon size={20} className={activeTemplate === t ? 'text-[#4ECDC4]' : 'text-gray-300'} />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase block text-center ${activeTemplate === t ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {TEMPLATES[t].name}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Photo Position Adjustment */}
                                <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-200">
                                    <h3 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-3 h-3 bg-[#FF6B9D] rounded-full border-2 border-gray-900" />
                                        Adjust Photo Position
                                    </h3>

                                    {/* Photo Slot Selection */}
                                    <div className="mb-4">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Select Photo</span>
                                        <div className="grid grid-cols-4 gap-2">
                                            {currentTemplate.photoSlots.slice(0, photos.length).map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedPhotoSlot(selectedPhotoSlot === idx ? null : idx)}
                                                    className={`p-2 rounded-xl border-2 text-sm font-bold transition-all ${selectedPhotoSlot === idx
                                                        ? 'bg-[#FF6B9D] text-white border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                        }`}
                                                >
                                                    #{idx + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Position Controls */}
                                    {selectedPhotoSlot !== null && (
                                        <div className="space-y-3 animate-in fade-in">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setPhotoOffsets(prev => ({
                                                        ...prev,
                                                        [selectedPhotoSlot]: {
                                                            x: (prev[selectedPhotoSlot]?.x || 0),
                                                            y: (prev[selectedPhotoSlot]?.y || 0) - 20
                                                        }
                                                    }))}
                                                    className="p-2 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                                >
                                                    ▲
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setPhotoOffsets(prev => ({
                                                        ...prev,
                                                        [selectedPhotoSlot]: {
                                                            x: (prev[selectedPhotoSlot]?.x || 0) - 20,
                                                            y: (prev[selectedPhotoSlot]?.y || 0)
                                                        }
                                                    }))}
                                                    className="p-2 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                                >
                                                    ◀
                                                </button>
                                                <button
                                                    onClick={() => setPhotoOffsets(prev => ({
                                                        ...prev,
                                                        [selectedPhotoSlot]: { x: 0, y: 0 }
                                                    }))}
                                                    className="px-4 py-2 bg-[#4ECDC4] text-white text-xs font-bold border-2 border-gray-900 rounded-lg hover:brightness-110 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={() => setPhotoOffsets(prev => ({
                                                        ...prev,
                                                        [selectedPhotoSlot]: {
                                                            x: (prev[selectedPhotoSlot]?.x || 0) + 20,
                                                            y: (prev[selectedPhotoSlot]?.y || 0)
                                                        }
                                                    }))}
                                                    className="p-2 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                                >
                                                    ▶
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setPhotoOffsets(prev => ({
                                                        ...prev,
                                                        [selectedPhotoSlot]: {
                                                            x: (prev[selectedPhotoSlot]?.x || 0),
                                                            y: (prev[selectedPhotoSlot]?.y || 0) + 20
                                                        }
                                                    }))}
                                                    className="p-2 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 text-center">
                                                Offset: X={photoOffsets[selectedPhotoSlot]?.x || 0}, Y={photoOffsets[selectedPhotoSlot]?.y || 0}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {activeTab === 'filters' && (
                            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
                                <h3 className="text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-3 h-3 bg-[#9B5DE5] rounded-full border-2 border-gray-900" />
                                    Photo Filters
                                </h3>

                                {/* Filter Categories */}
                                {['Basic', 'Vibrant', 'Retro', 'Mood', 'Tone', 'Cinema', 'Cute'].map(category => {
                                    const categoryFilters = FILTERS.filter(f => f.category === category);
                                    if (categoryFilters.length === 0) return null;

                                    return (
                                        <div key={category} className="space-y-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{category}</span>
                                            <div className="grid grid-cols-4 gap-2">
                                                {categoryFilters.map(f => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => setActiveFilter(f.id as any)}
                                                        className={`relative p-2.5 rounded-xl transition-all border-3 ${activeFilter === f.id
                                                            ? 'bg-[#9B5DE5] border-gray-900 text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
                                                            : 'bg-gray-50 border-transparent text-gray-600 hover:bg-white hover:border-gray-200'
                                                            }`}
                                                    >
                                                        <div
                                                            className={`w-full aspect-square rounded-lg mb-1.5 border-2 ${activeFilter === f.id ? 'border-white' : 'border-gray-200'} overflow-hidden`}
                                                            style={{
                                                                background: `linear-gradient(135deg, #FF6B9D 0%, #4ECDC4 50%, #FFE66D 100%)`,
                                                                filter: f.css
                                                            }}
                                                        />
                                                        <span className="text-[8px] font-black uppercase block text-center truncate">
                                                            {f.name}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Active Filter Indicator */}
                                <div className="mt-4 p-3 bg-gradient-to-r from-[#9B5DE5]/10 to-[#FF6B9D]/10 rounded-2xl border-2 border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-500 uppercase">Current Filter</span>
                                        <span className="text-sm font-black text-[#9B5DE5]">
                                            {FILTERS.find(f => f.id === activeFilter)?.name || 'Normal'}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'design' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Color Aesthetics */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Aesthetics</h3>
                                    <div className="space-y-4">
                                        {Object.entries(BG_PALETTES).map(([name, colors]) => (
                                            <div key={name} className="space-y-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase">{name}</span>
                                                <div className="flex gap-2 flex-wrap">
                                                    {colors.map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => setBgColor(c)}
                                                            className={`w-10 h-10 lg:w-8 lg:h-8 rounded-xl border-2 transition-all hover:scale-110 active:scale-90 ${bgColor === c ? 'border-gray-900 ring-4 ring-pink-100 scale-110 shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'border-white shadow-md'}`}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                            <div className="relative">
                                                <input
                                                    type="color"
                                                    value={bgColor}
                                                    onChange={(e) => setBgColor(e.target.value)}
                                                    className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer shadow-lg border-2 border-gray-900"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2 text-xs font-bold font-mono uppercase text-gray-600 focus:ring-2 focus:ring-pink-200 focus:border-gray-900"
                                                placeholder="#HEX"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Pattern Selection */}
                                <section className="space-y-3 pt-6 border-t border-gray-100">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Texture</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {PATTERNS.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setBgPattern(p.id)}
                                                className={`flex flex-col items-center gap-1 py-4 rounded-2xl transition-all border-3 ${bgPattern === p.id ? 'bg-[#FF6B9D] border-gray-900 text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-white hover:border-gray-200'}`}
                                            >
                                                <span className="text-2xl">{p.icon}</span>
                                                <span className="text-[8px] font-black uppercase tracking-tighter">{p.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Fine Tuning */}
                                <section className="space-y-5 pt-6 border-t border-gray-100">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Fine Tuning</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Roundness', val: cornerRadius, set: setCornerRadius, max: 150 },
                                            { label: 'Spacing', val: framePadding, set: setFramePadding, max: 60 },
                                            { label: 'Shadow', val: shadowStrength, set: setShadowStrength, max: 80 }
                                        ].map(item => (
                                            <div key={item.label} className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase">
                                                    <span>{item.label}</span>
                                                    <span className="text-[#FF6B9D]">{item.val}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max={item.max} value={item.val}
                                                    onChange={(e) => item.set(parseInt(e.target.value))}
                                                    className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#FF6B9D]"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'stickers' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* AI Magic */}
                                <section className="space-y-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">AI Magic</h3>
                                    <div className="flex gap-2 p-2 bg-pink-50/50 rounded-[1.5rem] border border-pink-100">
                                        <input
                                            type="text"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="E.g. cute bow"
                                            className="flex-1 bg-white px-4 py-2 rounded-[1rem] border-none text-xs font-bold focus:ring-2 focus:ring-pink-300"
                                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiSticker()}
                                        />
                                        <button
                                            onClick={handleGenerateAiSticker}
                                            disabled={isGenerating || !aiPrompt}
                                            className="w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-[1rem] disabled:opacity-50"
                                        >
                                            {isGenerating ? '...' : <Sparkles size={16} />}
                                        </button>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Quick Add ⚡</h3>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
                                        {['✨', '💖', '🎀', '🦋', '⛓️', '🔥', '💎', '🌸', '🧸', '☁️'].map(e => (
                                            <button
                                                key={e}
                                                onClick={() => handleAddSticker(e)}
                                                className="text-3xl bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:scale-110 active:scale-90 transition-all shrink-0"
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sticker Library</h3>
                                    <div className="grid grid-cols-6 lg:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-[1.5rem] overflow-y-auto max-h-[200px] lg:max-h-[350px] scrollbar-thin border border-gray-100">
                                        {PRESET_STICKERS.map((emoji, i) => (
                                            <button
                                                key={`${emoji}-${i}`}
                                                onClick={() => handleAddSticker(emoji)}
                                                className="text-2xl lg:text-3xl hover:scale-125 transition-all p-2 hover:bg-white rounded-xl active:scale-90 flex items-center justify-center"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-3 pt-4 border-t border-gray-100">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Vibe</h3>
                                    <div className="flex gap-2 flex-wrap">
                                        {FILTERS.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => setActiveFilter(f.id)}
                                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${activeFilter === f.id ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-pink-200'
                                                    }`}
                                            >
                                                {f.name}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setShowDate(!showDate)}
                                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${showDate ? 'bg-pink-100 text-pink-600 border-pink-200' : 'bg-white text-gray-400 border-gray-100'}`}
                                        >
                                            Date
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions - Memphis Style */}
                    <div className="p-4 bg-[#FFF0F5] flex gap-3 border-t-4 border-gray-900">
                        <Button onClick={onReset} variant="secondary" className="!p-3">
                            <RotateCcw size={18} />
                        </Button>
                        <div className="flex-1 flex gap-2">
                            <Button
                                onClick={handleGifDownload}
                                disabled={isRecording}
                                variant="teal"
                                className="flex-1"
                                icon={isRecording ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Film size={18} />}
                            >
                                GIF
                            </Button>
                            <Button
                                onClick={handleDownload}
                                variant="primary"
                                className="flex-[1.5]"
                                icon={<Download size={18} />}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* GIF Download Modal - Memphis Style */}
            {gifUrl && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-auto"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99999,
                        margin: 0,
                        padding: '16px'
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setGifUrl(null); }}
                >
                    <div
                        className="relative w-full mx-auto my-auto"
                        style={{ maxWidth: '420px' }}
                    >
                        {/* Shadow */}
                        <div
                            className="absolute bg-[#4ECDC4] rounded-3xl"
                            style={{
                                top: '12px',
                                left: '12px',
                                right: '-12px',
                                bottom: '-12px',
                                zIndex: 0
                            }}
                        />

                        <div
                            className="relative bg-white rounded-3xl border-4 border-gray-900"
                            style={{ padding: '24px', zIndex: 1 }}
                        >
                            <button
                                onClick={() => setGifUrl(null)}
                                className="absolute w-10 h-10 bg-[#FF6B9D] text-white rounded-full flex items-center justify-center border-3 border-gray-900 hover:scale-110 transition-transform"
                                style={{ top: '12px', right: '12px', zIndex: 10 }}
                            >
                                <X size={20} />
                            </button>

                            <h3
                                className="font-black text-center text-gray-900"
                                style={{ fontSize: '24px', marginBottom: '20px' }}
                            >
                                Your GIF is Ready! 🎉
                            </h3>

                            <div
                                className="bg-[#FFF0F5] rounded-2xl overflow-hidden border-4 border-gray-900 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                                style={{ marginBottom: '20px' }}
                            >
                                <img
                                    src={gifUrl}
                                    alt="Generated GIF Preview"
                                    onLoad={(e) => {
                                        // Ensure image is visible after load
                                        (e.target as HTMLImageElement).style.opacity = '1';
                                    }}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        display: 'block',
                                        minHeight: '200px',
                                        maxHeight: '350px',
                                        objectFit: 'contain',
                                        backgroundColor: '#FFF0F5',
                                        opacity: 1
                                    }}
                                />
                            </div>

                            <a
                                href={gifUrl}
                                download={`PhityBiith-${Date.now()}.gif`}
                                className="flex justify-center items-center gap-3 bg-[#FF6B9D] text-white rounded-xl font-black border-3 border-gray-900 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                                style={{
                                    padding: '14px 20px',
                                    fontSize: '16px',
                                    textDecoration: 'none'
                                }}
                            >
                                <Download size={20} /> Download GIF
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};