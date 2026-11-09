import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CropSelection, AspectRatioPreset } from '../types';
import { 
  Crop, 
  Maximize2, 
  RotateCcw, 
  Check, 
  X, 
  Move,
  Sliders,
  Scissors
} from 'lucide-react';

interface SelectionOverlayProps {
  mode: 'full' | 'selected';
  onModeChange: (mode: 'full' | 'selected') => void;
  isCropping: boolean;
  onStartCropping: () => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  selection: CropSelection;
  onSelectionChange: (selection: CropSelection) => void;
  imageWidth: number;
  imageHeight: number;
  imageDisplayRect: { left: number; top: number; width: number; height: number };
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  mode,
  onModeChange,
  isCropping,
  onStartCropping,
  onApplyCrop,
  onCancelCrop,
  selection,
  onSelectionChange,
  imageWidth,
  imageHeight,
  imageDisplayRect,
}) => {
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
  } | null>(null);

  // Aspect ratio proportions map
  const getAspectRatioValue = (preset: AspectRatioPreset): number | null => {
    switch (preset) {
      case '1:1': return 1;
      case '4:3': return 4 / 3;
      case '16:9': return 16 / 9;
      case '9:16': return 9 / 16;
      default: return null;
    }
  };

  const handlePresetSelect = (preset: AspectRatioPreset) => {
    const ratio = getAspectRatioValue(preset);
    let newW = selection.width;
    let newH = selection.height;

    if (ratio !== null) {
      newW = selection.width;
      newH = Math.round(newW / ratio);
      if (newH > imageHeight) {
        newH = imageHeight;
        newW = Math.round(newH * ratio);
      }
    }

    onSelectionChange({
      ...selection,
      aspectRatio: preset,
      width: Math.min(newW, imageWidth),
      height: Math.min(newH, imageHeight),
      x: Math.min(selection.x, imageWidth - newW),
      y: Math.min(selection.y, imageHeight - newH),
    });
  };

  const handlePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setActiveHandle(handle);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: selection.x,
      initY: selection.y,
      initW: selection.width,
      initH: selection.height,
    };
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!activeHandle || !dragStartRef.current) return;
    e.stopPropagation();

    const scaleX = imageWidth / Math.max(1, imageDisplayRect.width);
    const scaleY = imageHeight / Math.max(1, imageDisplayRect.height);

    const deltaX = (e.clientX - dragStartRef.current.startX) * scaleX;
    const deltaY = (e.clientY - dragStartRef.current.startY) * scaleY;

    const { initX, initY, initW, initH } = dragStartRef.current;
    let newX = initX;
    let newY = initY;
    let newW = initW;
    let newH = initH;

    const ratio = getAspectRatioValue(selection.aspectRatio);

    if (activeHandle === 'move') {
      newX = Math.max(0, Math.min(imageWidth - initW, initX + deltaX));
      newY = Math.max(0, Math.min(imageHeight - initH, initY + deltaY));
    } else {
      // Resize handles
      if (activeHandle.includes('e')) {
        newW = Math.max(40, Math.min(imageWidth - initX, initW + deltaX));
        if (ratio) newH = newW / ratio;
      }
      if (activeHandle.includes('s')) {
        newH = Math.max(40, Math.min(imageHeight - initY, initH + deltaY));
        if (ratio) newW = newH * ratio;
      }
      if (activeHandle.includes('w')) {
        const potentialW = Math.max(40, initW - deltaX);
        const actualDeltaW = initW - potentialW;
        newX = Math.max(0, initX + actualDeltaW);
        newW = initW - (newX - initX);
        if (ratio) newH = newW / ratio;
      }
      if (activeHandle.includes('n')) {
        const potentialH = Math.max(40, initH - deltaY);
        const actualDeltaH = initH - potentialH;
        newY = Math.max(0, initY + actualDeltaH);
        newH = initH - (newY - initY);
        if (ratio) newW = newH * ratio;
      }

      // Constrain inside image boundaries
      if (newX + newW > imageWidth) newW = imageWidth - newX;
      if (newY + newH > imageHeight) newH = imageHeight - newY;
    }

    onSelectionChange({
      ...selection,
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH),
    });
  }, [activeHandle, imageWidth, imageHeight, imageDisplayRect, selection, onSelectionChange]);

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
      setActiveHandle(null);
      dragStartRef.current = null;
    }
  };

  const handleResetSelection = () => {
    onSelectionChange({
      ...selection,
      x: Math.round(imageWidth * 0.1),
      y: Math.round(imageHeight * 0.1),
      width: Math.round(imageWidth * 0.8),
      height: Math.round(imageHeight * 0.8),
    });
  };

  // Convert natural selection coordinates to display coordinates inside the preview
  const displayScaleX = imageDisplayRect.width / Math.max(1, imageWidth);
  const displayScaleY = imageDisplayRect.height / Math.max(1, imageHeight);

  const rectLeft = imageDisplayRect.left + selection.x * displayScaleX;
  const rectTop = imageDisplayRect.top + selection.y * displayScaleY;
  const rectWidth = selection.width * displayScaleX;
  const rectHeight = selection.height * displayScaleY;

  return (
    <div className="flex flex-col gap-4">
      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
        <button
          onClick={() => onModeChange('full')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
            mode === 'full' && !isCropping
              ? 'bg-zinc-800 text-sky-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Full Image</span>
        </button>

        <button
          onClick={() => {
            if (mode !== 'selected' || !isCropping) {
              onModeChange('selected');
              onStartCropping();
            }
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
            mode === 'selected' || isCropping
              ? 'bg-zinc-800 text-sky-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>Selected Area</span>
        </button>
      </div>

      {/* When Cropper is Active: Controls & Done Button */}
      {isCropping ? (
        <div className="space-y-4 p-3 bg-zinc-950/80 border border-sky-500/30 rounded-lg">
          {/* Header & Primary "Done" action */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-sky-400" />
              Adjusting Crop Box
            </span>
            <button
              onClick={handleResetSelection}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
              title="Reset crop box"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Primary Done / Apply Button */}
          <button
            onClick={onApplyCrop}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Done - Apply Selection</span>
          </button>

          {/* Aspect Ratio Presets */}
          <div>
            <div className="text-[11px] text-zinc-400 mb-1.5">Aspect Ratio Presets</div>
            <div className="grid grid-cols-5 gap-1.5">
              {(['free', '1:1', '4:3', '16:9', '9:16'] as AspectRatioPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={`py-1.5 px-1 text-[11px] font-mono rounded-md border text-center transition-all cursor-pointer ${
                    selection.aspectRatio === preset
                      ? 'border-sky-500 bg-sky-950/60 text-sky-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {preset === 'free' ? 'Free' : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Precise Dimension Inputs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Width (px)</label>
              <input
                type="number"
                min={32}
                max={imageWidth}
                value={selection.width}
                onChange={(e) => {
                  const val = Math.max(32, Math.min(imageWidth - selection.x, Number(e.target.value) || 32));
                  onSelectionChange({ ...selection, width: val });
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Height (px)</label>
              <input
                type="number"
                min={32}
                max={imageHeight}
                value={selection.height}
                onChange={(e) => {
                  const val = Math.max(32, Math.min(imageHeight - selection.y, Number(e.target.value) || 32));
                  onSelectionChange({ ...selection, height: val });
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Coordinates Inputs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Offset X</label>
              <input
                type="number"
                min={0}
                max={imageWidth - selection.width}
                value={selection.x}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(imageWidth - selection.width, Number(e.target.value) || 0));
                  onSelectionChange({ ...selection, x: val });
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Offset Y</label>
              <input
                type="number"
                min={0}
                max={imageHeight - selection.height}
                value={selection.y}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(imageHeight - selection.height, Number(e.target.value) || 0));
                  onSelectionChange({ ...selection, y: val });
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Secondary Cancel button */}
          <button
            onClick={onCancelCrop}
            className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-medium transition-colors border border-zinc-800 cursor-pointer"
          >
            Cancel Cropping
          </button>
        </div>
      ) : mode === 'selected' ? (
        /* When Crop has been applied */
        <div className="space-y-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Selected Area Applied
            </span>
            <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded">
              {selection.width} × {selection.height} px
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            The studio is currently animating this selected region. You can tweak motion effects in the Motion tab or re-adjust the crop area below.
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={onStartCropping}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Adjust Crop / Change Area</span>
            </button>

            <button
              onClick={() => onModeChange('full')}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Revert to Full Image</span>
            </button>
          </div>
        </div>
      ) : (
        /* When in Full Image mode */
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-zinc-200">
            Full Image Animation Active
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Animations apply to the entire image dimensions ({imageWidth} × {imageHeight} px). Click below to crop and animate only a specific portion.
          </p>
          <button
            onClick={() => {
              onModeChange('selected');
              onStartCropping();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Select Region to Animate</span>
          </button>
        </div>
      )}

      {/* Interactive Canvas Drag Overlay (Rendered directly in viewport when cropper is active) */}
      {isCropping && imageDisplayRect.width > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-30"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Dimmed Scrim Outside Selection */}
          <div
            style={{
              position: 'absolute',
              left: `${rectLeft}px`,
              top: `${rectTop}px`,
              width: `${rectWidth}px`,
              height: `${rectHeight}px`,
            }}
            className="border-2 border-sky-400 pointer-events-auto shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] cursor-move select-none"
            onPointerDown={(e) => handlePointerDown(e, 'move')}
          >
            {/* Top Toolbar attached directly to crop box */}
            <div className="absolute -top-11 left-0 flex items-center gap-1.5 bg-zinc-950/95 border border-zinc-700/80 p-1 rounded-lg shadow-xl pointer-events-auto">
              <span className="text-[10px] font-mono text-zinc-300 px-1.5">
                {selection.width} × {selection.height}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyCrop();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
                title="Apply selection and start animating"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetSelection();
                }}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Reset selection area"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelCrop();
                }}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Cancel cropping"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inner Grid Crosshairs */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
              <div className="border-r border-b border-sky-300" />
              <div className="border-r border-b border-sky-300" />
              <div className="border-b border-sky-300" />
              <div className="border-r border-b border-sky-300" />
              <div className="border-r border-b border-sky-300" />
              <div className="border-b border-sky-300" />
              <div className="border-r border-sky-300" />
              <div className="border-r border-sky-300" />
              <div />
            </div>

            {/* Center Move Indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <Move className="w-6 h-6 text-white" />
            </div>

            {/* 8 Resize Handles */}
            <div
              className="absolute -top-2 -left-2 w-4 h-4 bg-sky-400 border-2 border-zinc-950 rounded-sm cursor-nwse-resize"
              onPointerDown={(e) => handlePointerDown(e, 'nw')}
            />
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-400 border-2 border-zinc-950 rounded-sm cursor-ns-resize"
              onPointerDown={(e) => handlePointerDown(e, 'n')}
            />
            <div
              className="absolute -top-2 -right-2 w-4 h-4 bg-sky-400 border-2 border-zinc-950 rounded-sm cursor-nesw-resize"
              onPointerDown={(e) => handlePointerDown(e, 'ne')}
            />
            <div
              className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-sky-400 border-2 border-zinc-950 rounded-sm cursor-ew-resize"
              onPointerDown={(e) => handlePointerDown(e, 'e')}
            />
            <div
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-sky-400 border-2 border-zinc-950 rounded-sm cursor-nwse-resize"
              onPointerDown={(e) => handlePointerDown(e, 'se')}
            />
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-400 border-2 border-zinc-950 rounded-sm cursor-ns-resize"
              onPointerDown={(e) => handlePointerDown(e, 's')}
            />
            <div
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-sky-400 border-2 border-zinc-950 rounded-sm cursor-nesw-resize"
              onPointerDown={(e) => handlePointerDown(e, 'sw')}
            />
            <div
              className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-sky-400 border-2 border-zinc-950 rounded-sm cursor-ew-resize"
              onPointerDown={(e) => handlePointerDown(e, 'w')}
            />
          </div>
        </div>
      )}
    </div>
  );
};
