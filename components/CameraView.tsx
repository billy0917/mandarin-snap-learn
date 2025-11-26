import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraViewProps {
  onCapture: (base64Image: string) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setStreamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setStreamError("無法開啟相機，請檢查權限或使用上傳功能。");
    }
  }, []);

  useEffect(() => {
    startCamera();
    
    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get Base64, remove prefix for API
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Feed */}
      <div className="flex-1 relative">
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover" 
          playsInline 
          muted 
          autoPlay
        />
        
        {/* Permission Error Overlay */}
        {streamError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20 p-6 text-center">
            <div>
              <p className="text-white text-lg mb-4">{streamError}</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold"
              >
                直接上傳照片
              </button>
            </div>
          </div>
        )}

        {/* Overlay Guides */}
        {!streamError && (
            <div className="absolute inset-0 pointer-events-none border-[30px] border-black/30">
                <div className="w-full h-full border border-white/20 relative">
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                </div>
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-32 bg-black/80 backdrop-blur-md flex items-center justify-center relative z-10 pb-4">
        {/* Gallery Upload Button */}
        <div className="absolute left-8 bottom-8">
            <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-white hover:bg-gray-700 transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
            </button>
        </div>

        {/* Capture Button */}
        <button 
          onClick={takePhoto}
          className="w-20 h-20 rounded-full border-4 border-white bg-transparent p-1 shadow-lg active:scale-95 transition-transform"
        >
            <div className="w-full h-full rounded-full bg-white"></div>
        </button>

         {/* Spacer for symmetry */}
         <div className="absolute right-8 bottom-8 w-12 h-12"></div>
      </div>
    </div>
  );
};

export default CameraView;
