import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Copy, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  Layers
} from 'lucide-react';
import { FrameItem } from '../types';

interface TimelineProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentFrameIndex: number;
  totalFrames: number;
  onSeekFrame: (index: number) => void;
  frames: FrameItem[];
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  onMoveFrame: (fromIndex: number, toIndex: number) => void;
  onUpdateFrameDelay: (index: number, delayMs: number) => void;
  duration: number;
  fps: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  isPlaying,
  onTogglePlay,
  currentFrameIndex,
  totalFrames,
  onSeekFrame,
  frames,
  onDuplicateFrame,
  onDeleteFrame,
  onMoveFrame,
  onUpdateFrameDelay,
  duration,
  fps,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [editingDelayIndex, setEditingDelayIndex] = useState<number | null>(null);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeEl = container.children[currentFrameIndex] as HTMLElement;
      if (activeEl) {
        const offsetLeft = activeEl.offsetLeft;
        const width = activeEl.clientWidth;
        if (
          offsetLeft < container.scrollLeft ||
          offsetLeft + width > container.scrollLeft + container.clientWidth
        ) {
          container.scrollTo({
            left: offsetLeft - container.clientWidth / 2 + width / 2,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [currentFrameIndex]);

  const currentTimeSeconds = fps > 0 ? (currentFrameIndex / fps).toFixed(2) : '0.00';
  const totalTimeSeconds = duration.toFixed(2);

  return (
    <div className="bg-zinc-900 border-t border-zinc-800 p-3 select-none flex flex-col gap-2 shrink-0">
      {/* Top Scrubber & Controls Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeekFrame(Math.max(0, currentFrameIndex - 1))}
            title="Previous Frame ([)"
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="p-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold transition-all shadow-sm cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => onSeekFrame(Math.min(totalFrames - 1, currentFrameIndex + 1))}
            title="Next Frame (])"
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Time & Frame Counter */}
          <div className="ml-3 flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-zinc-100 font-semibold">{currentTimeSeconds}s</span>
            <span className="text-zinc-600">/</span>
            <span>{totalTimeSeconds}s</span>
            <span className="text-zinc-700">|</span>
            <span className="text-sky-400 font-semibold">F{currentFrameIndex + 1}</span>
            <span className="text-zinc-600">/</span>
            <span>{totalFrames}</span>
          </div>
        </div>

        {/* Global FPS / Duration Info Badge */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            {fps} FPS
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            {frames.length || totalFrames} Frames
          </span>
        </div>
      </div>

      {/* Scrub Range Bar */}
      <div className="relative w-full flex items-center py-1">
        <input
          type="range"
          min="0"
          max={Math.max(0, totalFrames - 1)}
          value={currentFrameIndex}
          onChange={(e) => onSeekFrame(parseInt(e.target.value, 10))}
          className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Filmstrip Frame Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-thin"
        style={{ minHeight: '82px' }}
      >
        {frames.map((frame, idx) => {
          const isActive = idx === currentFrameIndex;
          return (
            <div
              key={frame.id || idx}
              onClick={() => onSeekFrame(idx)}
              className={`group relative shrink-0 w-16 h-20 rounded-md border text-center flex flex-col justify-between overflow-hidden cursor-pointer transition-all ${
                isActive
                  ? 'border-sky-400 bg-zinc-800 ring-2 ring-sky-500/30'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              {/* Frame Thumbnail or Preview Pattern */}
              <div className="w-full h-12 bg-zinc-900 overflow-hidden relative flex items-center justify-center">
                {frame.thumbnailUrl ? (
                  <img
                    src={frame.thumbnailUrl}
                    alt={`Frame ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800/60 flex items-center justify-center text-[10px] font-mono text-zinc-500">
                    #{idx + 1}
                  </div>
                )}

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateFrame(idx);
                    }}
                    title="Duplicate frame"
                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {frames.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFrame(idx);
                      }}
                      title="Delete frame"
                      className="p-1 rounded bg-zinc-800 hover:bg-red-500/40 text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Frame Info & Reorder Controls */}
              <div className="h-7 px-1 flex items-center justify-between text-[10px] font-mono bg-zinc-900 border-t border-zinc-800/80">
                <span className={isActive ? 'text-sky-300 font-semibold' : 'text-zinc-400'}>
                  {idx + 1}
                </span>

                {/* Delay badge */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingDelayIndex(editingDelayIndex === idx ? null : idx);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  title="Click to change delay"
                >
                  {frame.delayMs}ms
                </div>

                {/* Reorder Buttons */}
                <div className="flex items-center">
                  <button
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveFrame(idx, idx - 1);
                    }}
                    className="p-0.5 hover:text-white disabled:opacity-20"
                    title="Move earlier"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    disabled={idx === frames.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveFrame(idx, idx + 1);
                    }}
                    className="p-0.5 hover:text-white disabled:opacity-20"
                    title="Move later"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Inline Delay Edit Popover */}
              {editingDelayIndex === idx && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-8 left-0 right-0 bg-zinc-950 border border-zinc-700 p-1 rounded shadow-lg z-20"
                >
                  <div className="text-[9px] text-zinc-400 mb-0.5">Delay (ms)</div>
                  <input
                    type="number"
                    min={20}
                    max={2000}
                    step={10}
                    value={frame.delayMs}
                    onChange={(e) => onUpdateFrameDelay(idx, parseInt(e.target.value, 10) || 66)}
                    onBlur={() => setEditingDelayIndex(null)}
                    autoFocus
                    className="w-full bg-zinc-900 text-zinc-100 text-xs px-1 py-0.5 rounded border border-zinc-800 text-center font-mono"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
