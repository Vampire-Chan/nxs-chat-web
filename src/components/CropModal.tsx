import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface Props {
  image: string;
  aspect: number;
  onCropComplete: (croppedAreaPixels: any) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const CropModal = ({ image, aspect, onCropComplete, onClose, onConfirm }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setCropZoom] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col">
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-discord-sidebar">
         <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-nexus-blue rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Image Calibration Mode</span>
         </div>
         <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={20} />
         </button>
      </div>

      <div className="flex-1 relative bg-black">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={(_, pixels) => onCropComplete(pixels)}
          onZoomChange={setCropZoom}
          classes={{
            containerClassName: "bg-black",
            mediaClassName: "opacity-80"
          }}
        />
      </div>

      <div className="p-8 bg-discord-sidebar border-t border-gray-800 flex flex-col items-center">
         <div className="w-full max-w-xs mb-8">
            <input 
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setCropZoom(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-nexus-blue"
            />
            <div className="flex justify-between mt-2 font-mono text-[8px] text-gray-600 uppercase tracking-widest">
               <span>Zoom_Min</span>
               <span>Zoom_Max</span>
            </div>
         </div>

         <button 
           onClick={onConfirm}
           className="bg-nexus-gradient text-white px-16 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
         >
           <Check size={18} />
           <span>Confirm Matrix Crop</span>
         </button>
      </div>
    </div>
  );
};
