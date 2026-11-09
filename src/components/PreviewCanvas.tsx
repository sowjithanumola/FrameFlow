import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  AnimationSettings, 
  CropSelection, 
  FrameItem, 
  FrameTransform 
} from '../types';
import { calculateTransform } from '../utils/motionEngine';
import { renderFrameToCanvas } from '../utils/renderFrame';
import { estimateGIFSize } from '../utils/gifExporter';
import { 
  SplitSquareVertical,
  Crop,
  Check,
  Maximize2
} from 'lucide-react';

interface PreviewCanvasProps {
  image: HTMLImageElement;
  mode: 'full' | 'selected';
  isCropping: boolean;
  onStartCropping: () => void;
  onApplyCrop: () => void;
  onSetMode: (mode: 'full' | 'selected') => void;
  selection: CropSelection;
  animation: AnimationSettings;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentFrameIndex: number;
  totalFrames: number;
  frames: FrameItem[];
  onDisplayRectChange: (rect: { left: number; top: number; width: number; height: number }) => void;
}

type BgPattern = 'checker-dark' | 'checker-light' | 'black' | 'white';
type ZoomMode = 'fit' | '100' | '200';

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  image,
  mode,
  isCropping,
  onStartCropping,
  onApplyCrop,
  onSetMode,
  selection,
  animation,
  isPlaying,
  onTogglePlay,
  currentFrameIndex,
  totalFrames,
  frames,
  onDisplayRectChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bgPattern, setBgPattern] = useState<BgPattern>('checker-dark');
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonSplit, setComparisonSplit] = useState(50); // percentage 0 to 100
  const isDraggingSplitRef = useRef(false);

  // Compute transform for the current frame
  const getActiveTransform = useCallback((): FrameTransform => {
    // When actively adjusting the crop box, don't apply motion so the user can easily position it!
    if (isCropping) {
      return {
        scale: 1.0,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        opacity: 1.0,
      };
    }

    if (frames && frames[currentFrameIndex]?.customTransform) {
      return frames[currentFrameIndex].customTransform!;
    }
    const progress = totalFrames > 1 ? currentFrameIndex / (totalFrames - 1) : 0;
    const w = mode === 'selected' && selection.active ? selection.width : image.naturalWidth;
    const h = mode === 'selected' && selection.active ? selection.height : image.naturalHeight;
    return calculateTransform(progress, animation, w, h);
  }, [isCropping, frames, currentFrameIndex, totalFrames, mode, selection, image, animation]);

  // Main drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport dimensions:
    // When isCropping is true, ALWAYS show the full uncropped source image so user can crop it!
    const naturalW = isCropping || mode === 'full' || !selection.active 
      ? image.naturalWidth 
      : selection.width;
    const naturalH = isCropping || mode === 'full' || !selection.active 
      ? image.naturalHeight 
      : selection.height;

    canvas.width = naturalW;
    canvas.height = naturalH;

    const transform = getActiveTransform();

    if (isCropping) {
      // Draw static full image cleanly
      ctx.clearRect(0, 0, naturalW, naturalH);
      ctx.drawImage(image, 0, 0, naturalW, naturalH);
    } else {
      // Render animated frame
      renderFrameToCanvas(ctx, {
        image,
        mode,
        selection,
        transform,
        targetWidth: naturalW,
        targetHeight: naturalH,
        transparent: bgPattern.startsWith('checker'),
        backgroundColor: bgPattern === 'white' ? '#ffffff' : '#09090b',
      });
    }

    // If comparison split is active (only when not cropping)
    if (showComparison && !isCropping) {
      const splitPx = (comparisonSplit / 100) * naturalW;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitPx, naturalH);
      ctx.clip();

      ctx.clearRect(0, 0, splitPx, naturalH);
      if (!bgPattern.startsWith('checker')) {
        ctx.fillStyle = bgPattern === 'white' ? '#ffffff' : '#09090b';
        ctx.fillRect(0, 0, splitPx, naturalH);
      }

      if (mode === 'selected' && selection.active) {
        ctx.drawImage(
          image,
          selection.x,
          selection.y,
          selection.width,
          selection.height,
          0,
          0,
          naturalW,
          naturalH
        );
      } else {
        ctx.drawImage(image, 0, 0, naturalW, naturalH);
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(splitPx, 0);
      ctx.lineTo(splitPx, naturalH);
      ctx.stroke();

      ctx.restore();
    }
  }, [
    image,
    mode,
    isCropping,
    selection,
    animation,
    currentFrameIndex,
    totalFrames,
    frames,
    bgPattern,
    showComparison,
    comparisonSplit,
    getActiveTransform,
  ]);

  // Update container layout and notify parent of display rect for crop overlay positioning
  useEffect(() => {
    const updateRect = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      onDisplayRectChange({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [zoomMode, mode, isCropping, selection, image, onDisplayRectChange]);

  // Handle split comparison dragging
  const handleSplitPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingSplitRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleSplitPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSplitRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setComparisonSplit(pct);
  };

  const handleSplitPointerUp = (e: React.PointerEvent) => {
    if (isDraggingSplitRef.current) {
      isDraggingSplitRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Estimate file size based on resolution and fps
  const activeW = mode === 'selected' && selection.active ? selection.width : image.naturalWidth;
  const activeH = mode === 'selected' && selection.active ? selection.height : image.naturalHeight;
  const estimatedSize = estimateGIFSize(activeW, activeH, totalFrames, 256);

  // Dynamic zoom style
  let zoomClass = 'max-w-full max-h-full object-contain';
  if (zoomMode === '100') {
    zoomClass = 'w-auto h-auto max-w-none';
  } else if (zoomMode === '200') {
    zoomClass = 'w-[200%] h-auto max-w-none';
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 relative">
      {/* Top Preview Control Bar */}
      <div className="h-10 px-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400 select-none z-10 shrink-0">
        <div className="flex items-center gap-2">
          {isCropping ? (
            /* Banner when actively cropping */
            <div className="flex items-center gap-2">
              <span className="text-sky-300 font-semibold flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-sky-400" />
                Select Region on Canvas
              </span>
              <button
                onClick={onApplyCrop}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm cursor-pointer ml-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          ) : (
            <>
              {/* Background pattern options */}
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
                <button
                  onClick={() => setBgPattern('checker-dark')}
                  title="Dark checkerboard"
                  className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    bgPattern === 'checker-dark' ? 'bg-zinc-800 text-sky-400' : 'hover:text-zinc-200'
                  }`}
                >
                  Dark Grid
                </button>
                <button
                  onClick={() => setBgPattern('checker-light')}
                  title="Light checkerboard"
                  className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    bgPattern === 'checker-light' ? 'bg-zinc-800 text-sky-400' : 'hover:text-zinc-200'
                  }`}
                >
                  Light Grid
                </button>
                <button
                  onClick={() => setBgPattern('black')}
                  title="Solid black background"
                  className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    bgPattern === 'black' ? 'bg-zinc-800 text-sky-400' : 'hover:text-zinc-200'
                  }`}
                >
                  Black
                </button>
              </div>

              {/* Split Comparison Toggle */}
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
                  showComparison
                    ? 'border-sky-500 bg-sky-950/40 text-sky-300'
                    : 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Before / After</span>
              </button>

              {/* Quick Area / Crop Status Button */}
              {mode === 'selected' ? (
                <button
                  onClick={onStartCropping}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700/80 hover:border-sky-500/60 text-sky-300 text-xs transition-colors cursor-pointer"
                  title="Adjust selected crop region"
                >
                  <Crop className="w-3 h-3 text-sky-400" />
                  <span>Adjust Area ({selection.width} × {selection.height})</span>
                </button>
              ) : (
                <button
                  onClick={onStartCropping}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
                  title="Crop specific region"
                >
                  <Crop className="w-3 h-3" />
                  <span>Crop Area</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Right side: Zoom Modes & Size Estimate */}
        <div className="flex items-center gap-3">
          {/* Estimated Size */}
          {!isCropping && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
              <span>Est. Size:</span>
              <span className="text-zinc-200 font-semibold">{estimatedSize.formatted}</span>
            </div>
          )}

          {/* Zoom Buttons */}
          <div className="flex items-center gap-0.5 bg-zinc-900 p-0.5 rounded-md border border-zinc-800 font-mono text-[11px]">
            <button
              onClick={() => setZoomMode('fit')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                zoomMode === 'fit' ? 'bg-zinc-800 text-sky-400' : 'hover:text-zinc-200'
              }`}
            >
              Fit
            </button>
            <button
              onClick={() => setZoomMode('100')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                zoomMode === '100' ? 'bg-zinc-800 text-sky-400' : 'hover:text-zinc-200'
              }`}
            >
              100%
            </button>
            <button
              onClick={() => setZoomMode('200')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                zoomMode === '200' ? 'bg-zinc-800 text-sky-400' : 'hover:text-zinc-200'
              }`}
            >
              200%
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className={`flex-1 relative flex items-center justify-center p-4 overflow-auto ${
          bgPattern === 'checker-dark'
            ? 'bg-checkerboard'
            : bgPattern === 'checker-light'
            ? 'bg-checkerboard-light'
            : bgPattern === 'black'
            ? 'bg-black'
            : 'bg-white'
        }`}
      >
        <div className="relative shadow-2xl flex items-center justify-center max-w-full max-h-full">
          <canvas
            ref={canvasRef}
            className={`transition-all rounded-sm block ${zoomClass}`}
          />

          {/* Draggable curtain handle when comparison is active */}
          {showComparison && !isCropping && (
            <div
              style={{ left: `${comparisonSplit}%` }}
              onPointerDown={handleSplitPointerDown}
              onPointerMove={handleSplitPointerMove}
              onPointerUp={handleSplitPointerUp}
              className="absolute top-0 bottom-0 -translate-x-1/2 w-8 cursor-ew-resize flex items-center justify-center z-10 select-none group"
            >
              <div className="w-6 h-6 rounded-md bg-sky-500 text-zinc-950 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <SplitSquareVertical className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Bottom Dimension Info */}
      <div className="h-6 px-4 bg-zinc-900 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none shrink-0">
        <div className="flex items-center gap-3">
          <span>
            Canvas: {isCropping ? image.naturalWidth : activeW} × {isCropping ? image.naturalHeight : activeH} px
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline">
            {isCropping
              ? 'Crop Mode (Click Done when finished)'
              : mode === 'selected'
              ? 'Mode: Selected Region'
              : 'Mode: Full Image'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>FPS: {animation.fps}</span>
          <span aria-hidden="true">·</span>
          <span>Duration: {animation.duration}s</span>
        </div>
      </div>
    </div>
  );
};
