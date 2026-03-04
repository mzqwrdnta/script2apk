import React, { useState } from 'react';
import { CameraCapture } from '../components/CameraCapture';
import { Editor } from '../components/Editor';
import { AppState } from '../types';
import { Heart, Camera, Check } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('start');
  const [photos, setPhotos] = useState<string[]>([]);

  // 4 photos is standard for grids and strips
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
    <div className="min-h-screen bg-pink-50 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-gradient-to-tr from-pink-500 to-purple-500 p-2 rounded-xl text-white shadow-lg shadow-pink-200">
              <Heart size={20} fill="currentColor" />
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-800">
              Phity<span className="text-pink-500">Biith</span> 
            </h1>
          </div>
          
          <div className="flex gap-2 md:gap-6 text-xs md:text-sm font-bold tracking-wide">
             <Step active={appState === 'start' || appState === 'capture'} step={1} label="Snap" />
             <div className="h-px w-4 md:w-8 bg-gray-300 self-center"></div>
             <Step active={appState === 'editing'} step={2} label="Edit" />
             <div className="h-px w-4 md:w-8 bg-gray-300 self-center"></div>
             <Step active={false} step={3} label="Print" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 py-6 md:py-8 flex flex-col items-center">
        
        {/* Intro Screen */}
        {appState === 'start' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in duration-700 w-full max-w-4xl">
            
            <div className="relative group cursor-pointer" onClick={() => setAppState('capture')}>
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white p-4 rounded-[2rem] shadow-xl rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="grid grid-cols-2 gap-2 w-64 md:w-80 h-48 md:h-64 bg-gray-100 rounded-xl overflow-hidden">
                      <img src="https://picsum.photos/300/300?random=1" className="w-full h-full object-cover" alt="sample"/>
                      <img src="https://picsum.photos/300/300?random=2" className="w-full h-full object-cover" alt="sample"/>
                      <img src="https://picsum.photos/300/300?random=3" className="w-full h-full object-cover" alt="sample"/>
                      <img src="https://picsum.photos/300/300?random=4" className="w-full h-full object-cover" alt="sample"/>
                  </div>
              </div>
            </div>
            
            <div className="max-w-xl space-y-6">
                <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
                    Professional <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Photo Booth</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Create studio-quality photo strips, grids, and retro prints instantly. Enhanced with AI stickers and professional filters.
                </p>
                <button 
                    onClick={() => setAppState('capture')}
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gray-900 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:bg-gray-800 hover:scale-105"
                >
                    <Camera className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Start Photo Session
                </button>
            </div>

            <div className="flex gap-8 text-sm text-gray-400 font-medium pt-8">
                <span className="flex items-center gap-1"><Check size={16} className="text-green-500"/> High Resolution</span>
                <span className="flex items-center gap-1"><Check size={16} className="text-green-500"/> AI Stickers</span>
                <span className="flex items-center gap-1"><Check size={16} className="text-green-500"/> Instant Download</span>
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
      <footer className="text-center py-6 text-gray-400 text-xs md:text-sm bg-white border-t border-gray-100">
        <p>© {new Date().getFullYear()} PhityBiith. Powered by IT'S.</p>
      </footer>
    </div>
  );
};

const Step = ({ active, step, label }: { active: boolean, step: number, label: string }) => (
    <div className={`flex items-center gap-2 ${active ? 'text-pink-600' : 'text-gray-400'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${active ? 'border-pink-600 bg-pink-50' : 'border-gray-300'}`}>
            {step}
        </div>
        <span className="hidden md:inline">{label}</span>
    </div>
)

export default App;