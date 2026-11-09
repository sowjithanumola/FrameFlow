import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Clipboard, Shield } from 'lucide-react';
import { SampleImage } from '../utils/sampleImages';

interface UploadZoneProps {
  onImageSelected: (dataUrl: string, name: string) => void;
  sampleImages: SampleImage[];
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onImageSelected,
  sampleImages,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpe?g|png|webp|bmp)$/i)) {
      alert('Please upload a JPG, JPEG, PNG, WEBP, or BMP image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onImageSelected(result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full">
      {/* Drop Target */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-8 md:p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center relative overflow-hidden group ${
          isDragging
            ? 'border-sky-400 bg-sky-950/20 shadow-lg'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.bmp,image/jpeg,image/png,image/webp,image/bmp"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-1">
          Upload Image to Animate
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
          Drag and drop your file here, click to browse, or paste directly from your clipboard
        </p>

        {/* Action Button & Supported Formats */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 transition-colors shadow-sm cursor-pointer"
          >
            Select Image from Device
          </button>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-400 font-mono">
            <span>JPG</span>
            <span aria-hidden="true">·</span>
            <span>JPEG</span>
            <span aria-hidden="true">·</span>
            <span>PNG</span>
            <span aria-hidden="true">·</span>
            <span>WEBP</span>
            <span aria-hidden="true">·</span>
            <span>BMP</span>
          </div>
        </div>

        {/* Local Processing Guarantee Badge */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Client-Side. Images never leave your device.</span>
        </div>
      </div>

      {/* Quick Start Presets Section */}
      <div className="w-full mt-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Instant Test Presets
          </span>
          <span className="text-[11px] text-zinc-400">
            Click any preset to begin instantly
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {sampleImages.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onImageSelected(sample.dataUrl, sample.title)}
              className="group relative rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 p-2 text-left transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="w-full h-20 rounded-md overflow-hidden bg-zinc-950 mb-1.5 border border-zinc-800">
                <img
                  src={sample.dataUrl}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="text-[11px] font-medium text-zinc-200 group-hover:text-sky-300 truncate">
                {sample.title}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {sample.category}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
