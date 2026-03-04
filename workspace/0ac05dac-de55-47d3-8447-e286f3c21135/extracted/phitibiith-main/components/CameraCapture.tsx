import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Sparkles, Zap, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCaptureComplete: (photos: string[]) => void;
  requiredPhotos: number;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCaptureComplete, requiredPhotos }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameraInfo, setCameraInfo] = useState<string>('Initializing...');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Initialize Camera with ULTRA HIGH RESOLUTION (8K Support)
  useEffect(() => {
    const startCamera = async () => {
      try {
        // Stop existing stream first
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const resolutions = [
          { width: 7680, height: 4320, name: '8K Ultra HD' },
          { width: 4096, height: 2160, name: '4K Cinema' },
          { width: 3840, height: 2160, name: '4K UHD' },
          { width: 2560, height: 1440, name: '2K QHD' },
          { width: 1920, height: 1080, name: 'Full HD' },
          { width: 1280, height: 720, name: 'HD' },
        ];

        let mediaStream: MediaStream | null = null;
        let selectedRes = 'HD';

        for (const res of resolutions) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: facingMode,
                width: { ideal: res.width, min: 1280 },
                height: { ideal: res.height, min: 720 },
                frameRate: { ideal: 30, max: 60 },
              },
              audio: false
            });
            selectedRes = res.name;
            break;
          } catch (e) {
            continue;
          }
        }

        if (!mediaStream) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
          });
          selectedRes = 'Auto';
        }

        setStream(mediaStream);
        setCameraInfo(`📷 ${selectedRes}`);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;

          videoRef.current.onloadedmetadata = () => {
            const v = videoRef.current!;
            const actualRes = `${v.videoWidth}x${v.videoHeight}`;
            setCameraInfo(`📷 ${actualRes}`);
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please allow permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]); // Re-run when facingMode changes

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d', { alpha: false });

    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Only mirror for front camera
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Noise reduction and enhancement
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luminance < 50) {
          const boost = 1.1;
          data[i] = Math.min(255, r * boost);
          data[i + 1] = Math.min(255, g * boost);
          data[i + 2] = Math.min(255, b * boost);
        }

        const factor = 1.05;
        const intercept = 128 * (1 - factor);
        data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
      }

      ctx.putImageData(imageData, 0, 0);

      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL('image/png');
      } catch (e) {
        dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      }

      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);

      setCapturedPhotos(prev => {
        const newPhotos = [...prev, dataUrl];
        if (newPhotos.length >= requiredPhotos) {
          setTimeout(() => onCaptureComplete(newPhotos), 800);
        }
        return newPhotos;
      });
    }
  }, [requiredPhotos, onCaptureComplete, facingMode]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      takePhoto();
      if (capturedPhotos.length < requiredPhotos - 1) {
        setCountdown(null);
        setTimeout(() => setCountdown(3), 1500);
      } else {
        setCountdown(null);
      }
    }
  }, [countdown, capturedPhotos.length, requiredPhotos, takePhoto]);

  const startSession = () => {
    setCapturedPhotos([]);
    setCountdown(3);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
        {/* Error Card - Memphis Style */}
        <div className="relative">
          <div className="absolute inset-0 bg-gray-900 rounded-3xl transform translate-x-2 translate-y-2" />
          <div className="relative bg-white p-8 rounded-3xl border-4 border-gray-900">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-xl font-black text-[#FF6B9D] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#4ECDC4] text-white font-black rounded-full border-3 border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Camera Container - Memphis Card Style */}
      <div className="relative w-full mb-6">
        {/* Card Shadow */}
        <div className="absolute inset-0 bg-[#FF6B9D] rounded-3xl transform translate-x-3 translate-y-3" />

        {/* Main Camera Card */}
        <div className="relative bg-white p-4 rounded-3xl border-4 border-gray-900 overflow-hidden">
          {/* Camera Header */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FF6B9D] rounded-full border-2 border-gray-900 animate-pulse" />
              <span className="font-black text-sm">CAMERA</span>
            </div>
            <div className="flex gap-2">
              {/* Switch Camera Button */}
              <button
                onClick={switchCamera}
                disabled={countdown !== null}
                className="bg-[#FFE66D] hover:bg-[#FFD43B] disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded-full text-xs font-black border-2 border-gray-900 text-gray-900 flex items-center gap-1 transition-all active:scale-95 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                title={facingMode === 'user' ? 'Switch to Back Camera' : 'Switch to Front Camera'}
              >
                <RefreshCw size={12} />
                {facingMode === 'user' ? 'Front' : 'Back'}
              </button>

              {/* Resolution Badge */}
              <div className="bg-[#4ECDC4] px-3 py-1 rounded-full text-xs font-black border-2 border-gray-900 text-white flex items-center gap-1">
                <Zap size={12} /> {cameraInfo}
              </div>
              <div className="bg-[#9B5DE5] px-3 py-1 rounded-full text-xs font-black border-2 border-gray-900 text-white">
                ● LIVE
              </div>
            </div>
          </div>

          {/* Video Feed */}
          <div className="relative aspect-[4/3] md:aspect-video bg-gray-900 rounded-2xl overflow-hidden border-4 border-gray-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Flash Overlay */}
            {isFlashing && <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300" />}

            {/* Countdown Overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/30">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#FF6B9D] rounded-full transform scale-110 animate-ping opacity-50" />
                  <span className="relative text-[100px] md:text-[150px] font-black text-white drop-shadow-2xl leading-none">
                    {countdown}
                  </span>
                </div>
              </div>
            )}

            {/* Quality Indicator */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2 py-1 rounded-lg border border-white/20">
              <span className="text-[10px] font-black text-green-400">● HD QUALITY</span>
            </div>

            {/* Corner Decorations */}
            <div className="absolute top-3 right-3">
              <Sparkles className="text-[#FF6B9D] w-6 h-6" />
            </div>
            <div className="absolute bottom-3 right-3">
              <Sparkles className="text-[#4ECDC4] w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls Container - Memphis Style */}
      <div className="flex flex-col items-center space-y-4 w-full px-4">

        {/* Progress Indicators - Colorful */}
        <div className="flex gap-3 mb-2">
          {Array.from({ length: requiredPhotos }).map((_, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-3 border-gray-900 transition-all duration-300 ${i < capturedPhotos.length
                ? 'bg-[#4ECDC4] text-white scale-110 shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
                : 'bg-white text-gray-400'
                }`}
            >
              {i < capturedPhotos.length ? '✓' : i + 1}
            </div>
          ))}
        </div>

        {capturedPhotos.length === 0 && countdown === null ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gray-900 rounded-full transform translate-x-1 translate-y-1" />
            <button
              onClick={startSession}
              className="relative flex items-center justify-center gap-2 px-8 py-4 text-lg font-black text-white bg-[#FF6B9D] rounded-full border-3 border-gray-900 hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
            >
              <Camera className="w-6 h-6" />
              Start Photo Session
            </button>
          </div>
        ) : (
          <div className="text-center h-16 flex items-center justify-center">
            {countdown !== null ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#FF6B9D] rounded-full animate-pulse" />
                <p className="text-2xl font-black text-gray-800">Get Ready!</p>
                <div className="w-3 h-3 bg-[#FF6B9D] rounded-full animate-pulse" />
              </div>
            ) : (
              <p className="text-xl font-black text-[#4ECDC4]">Processing... ✨</p>
            )}
          </div>
        )}

        {/* Status Message Card */}
        <div className="bg-white px-6 py-3 rounded-full border-3 border-gray-900 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
          <p className="text-gray-700 text-sm font-bold">
            {countdown === null && capturedPhotos.length === 0
              ? "✨ Ultra HD Mode - Best quality photos!"
              : `📸 Taking photo ${capturedPhotos.length + 1} of ${requiredPhotos}`
            }
          </p>
        </div>
      </div>
    </div>
  );
};