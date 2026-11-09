import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AnimationSettings, 
  CropSelection, 
  ExportSettings, 
  FrameItem, 
  ProjectState 
} from './types';
import { calculateTotalFrames, calculateTransform } from './utils/motionEngine';
import { exportGIF, ExportResult } from './utils/gifExporter';
import { getInitialSampleImages, SampleImage } from './utils/sampleImages';
import { renderFrameToCanvas } from './utils/renderFrame';

import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { PreviewCanvas } from './components/PreviewCanvas';
import { SelectionOverlay } from './components/SelectionOverlay';
import { MotionControls } from './components/MotionControls';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { LegalModals } from './components/LegalModals';

import { Sliders, Crop, Film } from 'lucide-react';

const DEFAULT_ANIMATION: AnimationSettings = {
  preset: 'zoom_in',
  duration: 2.0,
  fps: 15,
  speed: 1.0,
  intensity: 60,
  scaleMin: 1.0,
  scaleMax: 1.35,
  rotationDeg: 360,
  direction: 'normal',
  loopMode: 'loop',
  easing: 'ease_in_out',
  customMotion: {
    startScale: 1.0,
    endScale: 1.3,
    startOffsetX: 0,
    endOffsetX: 0,
    startOffsetY: 0,
    endOffsetY: 0,
    startRotation: 0,
    endRotation: 0,
    startOpacity: 1.0,
    endOpacity: 1.0,
  },
};

const DEFAULT_EXPORT: ExportSettings = {
  width: 640,
  height: 426,
  fps: 15,
  maxColors: 256,
  dither: true,
  transparent: false,
  loopCount: 0,
  preserveAspectRatio: true,
};

export default function App() {
  // Image state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('Untitled');
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Studio modes & settings
  const [mode, setMode] = useState<'full' | 'selected'>('full');
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [selection, setSelection] = useState<CropSelection>({
    active: false,
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    aspectRatio: 'free',
  });
  const [animation, setAnimation] = useState<AnimationSettings>(DEFAULT_ANIMATION);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT);

  // Playback & timeline
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [frames, setFrames] = useState<FrameItem[]>([]);

  // Canvas bounds on screen for selection handles
  const [displayRect, setDisplayRect] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // Sidebar active tab ('motion' | 'crop')
  const [sidebarTab, setSidebarTab] = useState<'motion' | 'crop'>('motion');

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'checklist' | null>(null);

  // Sample images
  const [sampleImages, setSampleImages] = useState<SampleImage[]>([]);

  // Undo / Redo history
  const undoStackRef = useRef<Array<{ animation: AnimationSettings; selection: CropSelection; mode: 'full' | 'selected' }>>([]);
  const redoStackRef = useRef<Array<{ animation: AnimationSettings; selection: CropSelection; mode: 'full' | 'selected' }>>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Push history helper
  const pushHistory = useCallback(() => {
    undoStackRef.current.push({
      animation: JSON.parse(JSON.stringify(animation)),
      selection: { ...selection },
      mode,
    });
    if (undoStackRef.current.length > 30) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [animation, selection, mode]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const currentSnapshot = {
      animation: JSON.parse(JSON.stringify(animation)),
      selection: { ...selection },
      mode,
    };
    redoStackRef.current.push(currentSnapshot);

    const prev = undoStackRef.current.pop()!;
    setAnimation(prev.animation);
    setSelection(prev.selection);
    setMode(prev.mode);

    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
  }, [animation, selection, mode]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const currentSnapshot = {
      animation: JSON.parse(JSON.stringify(animation)),
      selection: { ...selection },
      mode,
    };
    undoStackRef.current.push(currentSnapshot);

    const next = redoStackRef.current.pop()!;
    setAnimation(next.animation);
    setSelection(next.selection);
    setMode(next.mode);

    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
  }, [animation, selection, mode]);

  // Load procedural samples & stored projects on mount
  // Load procedural samples on mount
  useEffect(() => {
    const samples = getInitialSampleImages();
    setSampleImages(samples);
  }, []);

  // Handle image loading
  const handleImageLoaded = useCallback((dataUrl: string, name: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setImageSrc(dataUrl);
      setImageName(name);

      // Initialize default selection
      const initW = Math.round(img.naturalWidth * 0.8);
      const initH = Math.round(img.naturalHeight * 0.8);
      const initX = Math.round((img.naturalWidth - initW) / 2);
      const initY = Math.round((img.naturalHeight - initH) / 2);

      const newSel: CropSelection = {
        active: false,
        x: initX,
        y: initY,
        width: initW,
        height: initH,
        aspectRatio: 'free',
      };
      setSelection(newSel);
      setMode('full');

      // Initialize export resolution
      const exportW = Math.min(800, img.naturalWidth);
      const exportH = Math.round(exportW / (img.naturalWidth / img.naturalHeight));
      setExportSettings((prev) => ({
        ...prev,
        width: exportW,
        height: exportH,
      }));

      // Reset playback
      setCurrentFrameIndex(0);
      setIsPlaying(true);
    };
    img.src = dataUrl;
  }, []);

  // Update timeline frames whenever duration, fps, or animation settings change
  const totalFrames = calculateTotalFrames(animation.duration, animation.fps);

  useEffect(() => {
    if (!imageElement) return;

    const delayMs = Math.round(1000 / animation.fps);
    const newFrames: FrameItem[] = [];

    // Thumbnail generation on small offscreen canvas for each frame
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 64;
    thumbCanvas.height = 48;
    const thumbCtx = thumbCanvas.getContext('2d');

    const w = mode === 'selected' && selection.active ? selection.width : imageElement.naturalWidth;
    const h = mode === 'selected' && selection.active ? selection.height : imageElement.naturalHeight;

    for (let i = 0; i < totalFrames; i++) {
      const progress = totalFrames > 1 ? i / (totalFrames - 1) : 0;
      let thumbUrl: string | undefined;

      if (thumbCtx) {
        const transform = calculateTransform(progress, animation, w, h);
        renderFrameToCanvas(thumbCtx, {
          image: imageElement,
          mode,
          selection,
          transform,
          targetWidth: 64,
          targetHeight: 48,
          backgroundColor: '#09090b',
        });
        thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);
      }

      newFrames.push({
        id: `frame_${i}`,
        index: i,
        delayMs,
        progress,
        thumbnailUrl: thumbUrl,
      });
    }

    setFrames(newFrames);
    if (currentFrameIndex >= totalFrames) {
      setCurrentFrameIndex(0);
    }
  }, [
    imageElement,
    mode,
    selection,
    animation.duration,
    animation.fps,
    animation.preset,
    animation.intensity,
    animation.scaleMin,
    animation.scaleMax,
    animation.rotationDeg,
    animation.direction,
    animation.easing,
    animation.customMotion,
  ]);

  // Real-time playback loop
  useEffect(() => {
    if (!isPlaying || totalFrames <= 0) return;

    const frameDelay = frames[currentFrameIndex]?.delayMs || Math.round(1000 / animation.fps);
    const effectiveDelay = Math.max(16, frameDelay / Math.max(0.1, animation.speed));

    const timer = setTimeout(() => {
      setCurrentFrameIndex((prev) => {
        if (prev >= totalFrames - 1) {
          if (animation.loopMode === 'once') {
            setIsPlaying(false);
            return prev;
          }
          return 0;
        }
        return prev + 1;
      });
    }, effectiveDelay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentFrameIndex, totalFrames, animation.fps, animation.speed, animation.loopMode, frames]);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === '[') {
        e.preventDefault();
        setCurrentFrameIndex((p) => Math.max(0, p - 1));
      } else if (e.key === ']') {
        e.preventDefault();
        setCurrentFrameIndex((p) => Math.min(totalFrames - 1, p + 1));
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (imageElement) setIsExportOpen(true);
      } else if (e.key === 'Escape') {
        setIsExportOpen(false);
        setIsShortcutsOpen(false);
        setLegalTab(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageElement, totalFrames, handleUndo, handleRedo]);

  // Frame manipulation handlers
  const handleDuplicateFrame = (index: number) => {
    pushHistory();
    const target = frames[index];
    if (!target) return;
    const duplicated: FrameItem = {
      ...target,
      id: `frame_${Date.now()}`,
    };
    const next = [...frames];
    next.splice(index + 1, 0, duplicated);
    setFrames(next);
  };

  const handleDeleteFrame = (index: number) => {
    if (frames.length <= 2) return;
    pushHistory();
    const next = frames.filter((_, i) => i !== index);
    setFrames(next);
    if (currentFrameIndex >= next.length) {
      setCurrentFrameIndex(next.length - 1);
    }
  };

  const handleMoveFrame = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= frames.length) return;
    pushHistory();
    const next = [...frames];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setFrames(next);
    setCurrentFrameIndex(toIndex);
  };

  const handleUpdateFrameDelay = (index: number, delayMs: number) => {
    const next = [...frames];
    if (next[index]) {
      next[index] = { ...next[index], delayMs };
      setFrames(next);
    }
  };

  // Settings change wrappers with undo tracking
  const handleAnimationChange = (newSettings: AnimationSettings) => {
    pushHistory();
    setAnimation(newSettings);
  };

  const handleSelectionChange = (newSelection: CropSelection) => {
    pushHistory();
    setSelection(newSelection);
  };

  const handleStartCropping = () => {
    pushHistory();
    setIsCropping(true);
    setMode('selected');
    setSidebarTab('crop');
    setIsPlaying(false);
  };

  const handleApplyCrop = () => {
    pushHistory();
    setSelection((prev) => ({ ...prev, active: true }));
    setMode('selected');
    setIsCropping(false);
    setSidebarTab('motion');
    setIsPlaying(true);
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    if (!selection.active) {
      setMode('full');
    }
    setSidebarTab('motion');
    setIsPlaying(true);
  };

  const handleModeChange = (newMode: 'full' | 'selected') => {
    pushHistory();
    setMode(newMode);
    if (newMode === 'selected') {
      setIsCropping(true);
      setSidebarTab('crop');
      setIsPlaying(false);
    } else {
      setIsCropping(false);
      setSelection((prev) => ({ ...prev, active: false }));
    }
  };

  // Reset to empty state
  const handleReset = () => {
    setImageSrc(null);
    setImageElement(null);
    setImageName('Untitled');
    setAnimation(DEFAULT_ANIMATION);
    setSelection({
      active: false,
      x: 0,
      y: 0,
      width: 600,
      height: 400,
      aspectRatio: 'free',
    });
    setMode('full');
    setFrames([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Bar Contract Header */}
      <Header
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenLegal={(tab) => setLegalTab(tab)}
        onReset={handleReset}
        onSelectSample={(sample) => handleImageLoaded(sample.dataUrl, sample.title)}
        sampleImages={sampleImages}
        hasImage={Boolean(imageElement)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Main Studio Viewport */}
      {!imageElement ? (
        /* Empty State: Upload or Pick Preset */
        <UploadZone
          onImageSelected={handleImageLoaded}
          sampleImages={sampleImages}
        />
      ) : (
        /* Populated Studio Workspace: Sidebar + Preview + Timeline */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Left Controls Sidebar */}
          <aside className="w-full md:w-80 lg:w-96 border-r border-zinc-800 bg-zinc-900/90 flex flex-col shrink-0 overflow-hidden z-20">
            {/* Sidebar Tabs */}
            <div className="flex items-center border-b border-zinc-800 p-1 bg-zinc-950/60 shrink-0">
              <button
                onClick={() => setSidebarTab('motion')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  sidebarTab === 'motion'
                    ? 'bg-zinc-800 text-sky-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Motion Settings</span>
              </button>

              <button
                onClick={() => setSidebarTab('crop')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  sidebarTab === 'crop'
                    ? 'bg-zinc-800 text-sky-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Area & Framing</span>
              </button>
            </div>

            {/* Scrollable Control Panes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sidebarTab === 'motion' ? (
                <MotionControls
                  settings={animation}
                  onChange={handleAnimationChange}
                />
              ) : (
                <SelectionOverlay
                  mode={mode}
                  onModeChange={handleModeChange}
                  isCropping={isCropping}
                  onStartCropping={handleStartCropping}
                  onApplyCrop={handleApplyCrop}
                  onCancelCrop={handleCancelCrop}
                  selection={selection}
                  onSelectionChange={handleSelectionChange}
                  imageWidth={imageElement.naturalWidth}
                  imageHeight={imageElement.naturalHeight}
                  imageDisplayRect={displayRect}
                />
              )}
            </div>
          </aside>

          {/* Center Canvas & Docked Bottom Timeline */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {/* Canvas Preview Area */}
            <PreviewCanvas
              image={imageElement}
              mode={mode}
              isCropping={isCropping}
              onStartCropping={handleStartCropping}
              onApplyCrop={handleApplyCrop}
              onSetMode={handleModeChange}
              selection={selection}
              animation={animation}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              currentFrameIndex={currentFrameIndex}
              totalFrames={totalFrames}
              frames={frames}
              onDisplayRectChange={setDisplayRect}
            />

            {/* Docked Filmstrip Timeline */}
            <Timeline
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              currentFrameIndex={currentFrameIndex}
              totalFrames={totalFrames}
              onSeekFrame={(idx) => {
                setIsPlaying(false);
                setCurrentFrameIndex(idx);
              }}
              frames={frames}
              onDuplicateFrame={handleDuplicateFrame}
              onDeleteFrame={handleDeleteFrame}
              onMoveFrame={handleMoveFrame}
              onUpdateFrameDelay={handleUpdateFrameDelay}
              duration={animation.duration}
              fps={animation.fps}
            />
          </main>
        </div>
      )}

      {/* Export Modal */}
      {imageElement && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          exportSettings={exportSettings}
          onUpdateExportSettings={setExportSettings}
          onStartExport={(signal) =>
            exportGIF({
              image: imageElement,
              mode,
              selection,
              animation,
              exportSettings,
              customFrames: frames,
              signal,
            })
          }
          sourceWidth={
            mode === 'selected' && selection.active
              ? selection.width
              : imageElement?.naturalWidth || 640
          }
          sourceHeight={
            mode === 'selected' && selection.active
              ? selection.height
              : imageElement?.naturalHeight || 426
          }
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Legal & Launch Checklist Modal */}
      <LegalModals
        isOpen={Boolean(legalTab)}
        activeTab={legalTab || 'privacy'}
        onClose={() => setLegalTab(null)}
        onTabChange={(tab) => setLegalTab(tab)}
      />
    </div>
  );
}
