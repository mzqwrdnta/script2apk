import React, { useState } from 'react';
import { CameraCapture } from './components/CameraCapture';
import { Editor } from './components/Editor';
import { AppState } from './types';
import { Heart, Camera, Sparkles } from 'lucide-react';

// MEMPHIS STYLE - Pink Dominant 🩷
// Primary BG: #FFF0F5 (Lavender Blush)
// Accent 1: #FF6B9D (Hot Pink)
// Accent 2: #4ECDC4 (Teal)
// Accent 3: #9B5DE5 (Purple)
// Dark: #1A1A2E (Navy)

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('start');
  const [photos, setPhotos] = useState<string[]>([]);

  const REQUIRED_PHOTOS = 4;

  const handleCaptureComplete = (capturedPhotos: string[]) => {
    setPhotos(capturedPhotos);
    setAppState('editing');
  };

  const handleReset = () => {
    setPhotos([]);
    setAppState('start');
  };

  return (
    <div className="min-h-screen bg-[#FFF0F5] font-sans text-gray-900 relative overflow-hidden">
      {/* Memphis Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top shape */}
        <svg className="absolute -top-10 -left-10 w-48 h-48 text-[#FF6B9D] opacity-30" viewBox="0 0 100 100">
          <path d="M10,50 Q25,20 40,50 T70,50 T100,50" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
        {/* Bottom circle */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#4ECDC4] rounded-full opacity-30" />
        {/* Dots pattern */}
        <div className="absolute top-20 right-20 grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-[#9B5DE5] rounded-full opacity-40" />
          ))}
        </div>
        {/* Zigzag */}
        <svg className="absolute bottom-40 left-10 w-32 h-16 text-[#FF6B9D] opacity-30" viewBox="0 0 100 30">
          <path d="M0,15 L20,5 L40,25 L60,5 L80,25 L100,15" stroke="currentColor" strokeWidth="3" fill="none" />
        </svg>
      </div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b-4 border-[#FF6B9D] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="bg-[#FF6B9D] p-2.5 rounded-2xl text-white shadow-lg transform -rotate-6 hover:rotate-0 transition-transform border-3 border-gray-900">
              <Heart size={22} fill="currentColor" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Phity<span className="text-[#FF6B9D]">Biith</span>
            </h1>
          </div>

          <div className="flex gap-2 md:gap-4 text-xs md:text-sm font-bold">
            <Step active={appState === 'start' || appState === 'capture'} step={1} label="Snap" />
            <div className="h-1 w-6 md:w-10 bg-[#4ECDC4] self-center rounded-full"></div>
            <Step active={appState === 'editing'} step={2} label="Edit" />
            <div className="h-1 w-6 md:w-10 bg-[#4ECDC4] self-center rounded-full"></div>
            <Step active={false} step={3} label="Save" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 py-6 md:py-10 flex flex-col items-center relative z-10">

        {/* Intro Screen */}
        {appState === 'start' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in duration-700 w-full max-w-4xl">

            {/* Hero Card - Memphis Style */}
            <div className="relative group cursor-pointer" onClick={() => setAppState('capture')}>
              {/* Card Shadow */}
              <div className="absolute inset-0 bg-[#FF6B9D] rounded-[2rem] transform translate-x-3 translate-y-3" />

              {/* Main Card */}
              <div className="relative bg-white p-5 rounded-[2rem] border-4 border-gray-900 hover:translate-x-1 hover:translate-y-1 transition-transform">
                <div className="grid grid-cols-2 gap-3 w-64 md:w-80 bg-[#4ECDC4] p-3 rounded-xl overflow-hidden border-2 border-gray-900">
                  <img src="https://picsum.photos/300/300?random=1" className="w-full h-24 md:h-32 object-cover rounded-lg border-2 border-gray-900" alt="sample" />
                  <img src="https://picsum.photos/300/300?random=2" className="w-full h-24 md:h-32 object-cover rounded-lg border-2 border-gray-900" alt="sample" />
                  <img src="https://picsum.photos/300/300?random=3" className="w-full h-24 md:h-32 object-cover rounded-lg border-2 border-gray-900" alt="sample" />
                  <img src="https://picsum.photos/300/300?random=4" className="w-full h-24 md:h-32 object-cover rounded-lg border-2 border-gray-900" alt="sample" />
                </div>
                {/* Decorative sticker */}
                <div className="absolute -top-4 -right-4 bg-[#9B5DE5] text-white px-3 py-1 rounded-full text-sm font-black border-2 border-gray-900 transform rotate-12">
                  ✨ NEW!
                </div>
              </div>
            </div>

            <div className="max-w-xl space-y-6">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Photo Booth
                <span className="block text-[#FF6B9D]">Made Fun! 🎉</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                Snap awesome photos, add cute stickers, and create amazing memories with friends!
              </p>

              {/* CTA Button - Memphis Style */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gray-900 rounded-full transform translate-x-1 translate-y-1" />
                <button
                  onClick={() => setAppState('capture')}
                  className="relative flex items-center justify-center gap-3 px-8 py-4 text-lg font-black text-white bg-[#FF6B9D] rounded-full border-3 border-gray-900 hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
                >
                  <Camera className="w-6 h-6" />
                  Start Photo Session
                </button>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-6">
              <FeaturePill emoji="📸" text="8K Ultra HD" color="#4ECDC4" />
              <FeaturePill emoji="✨" text="AI Stickers" color="#9B5DE5" />
              <FeaturePill emoji="🎨" text="Cute Frames" color="#FF6B9D" />
            </div>
          </div>
        )}

        {/* Capture Screen */}
        {appState === 'capture' && (
          <div className="w-full animate-in zoom-in-95 duration-500">
            <CameraCapture
              requiredPhotos={REQUIRED_PHOTOS}
              onCaptureComplete={handleCaptureComplete}
            />
          </div>
        )}

        {/* Editor Screen */}
        {appState === 'editing' && (
          <div className="w-full animate-in slide-in-from-bottom-8 duration-500">
            <Editor photos={photos} onReset={handleReset} />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-700 text-sm bg-white border-t-4 border-[#4ECDC4] font-medium relative z-10">
        <p>© {new Date().getFullYear()} PhityBiith. Powered by IT'S. ✨</p>
      </footer>
    </div>
  );
};

// Memphis-style step indicator
const Step = ({ active, step, label }: { active: boolean, step: number, label: string }) => (
  <div className={`flex items-center gap-2 ${active ? 'text-[#FF6B9D]' : 'text-gray-400'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-3 transition-all ${active
        ? 'border-gray-900 bg-[#FF6B9D] text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
        : 'border-gray-300 bg-white text-gray-400'
      }`}>
      {step}
    </div>
    <span className="hidden md:inline font-bold">{label}</span>
  </div>
);

// Feature pill component
const FeaturePill = ({ emoji, text, color }: { emoji: string, text: string, color: string }) => (
  <div
    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm border-3 border-gray-900 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-white"
    style={{ backgroundColor: color }}
  >
    <span>{emoji}</span>
    <span>{text}</span>
  </div>
);

export default App;