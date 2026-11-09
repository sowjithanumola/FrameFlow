import React, { useState } from 'react';
import { 
  Film, 
  Download, 
  Sparkles, 
  Keyboard, 
  RotateCcw, 
  ShieldCheck, 
  FileText, 
  ChevronDown 
} from 'lucide-react';
import { SampleImage } from '../utils/sampleImages';

interface HeaderProps {
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
  onOpenLegal: (tab: 'privacy') => void;
  onReset: () => void;
  onSelectSample: (sample: SampleImage) => void;
  sampleImages: SampleImage[];
  hasImage: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExport,
  onOpenShortcuts,
  onOpenLegal,
  onReset,
  onSelectSample,
  sampleImages,
  hasImage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [samplesOpen, setSamplesOpen] = useState(false);

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <Film className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
            FrameFlow
            <span className="text-xs font-normal text-zinc-400">Image to GIF Studio</span>
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation & Quick Actions */}
      <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-400">
        {hasImage && (
          <div className="flex items-center gap-1 mr-2 border-r border-zinc-800 pr-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z / Cmd+Z)"
              className="px-2.5 py-1.5 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y / Cmd+Y)"
              className="px-2.5 py-1.5 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Redo
            </button>
            <button
              onClick={onReset}
              title="Start over with new image"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        )}

        {/* Sample Images Picker */}
        <div className="relative">
          <button
            onClick={() => setSamplesOpen(!samplesOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sample Images</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {samplesOpen && (
            <div 
              className="absolute left-0 mt-2 w-56 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl py-1 z-50"
              onMouseLeave={() => setSamplesOpen(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80">
                Preset Test Images
              </div>
              {sampleImages.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample);
                    setSamplesOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="truncate">{sample.title}</span>
                  <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                    {sample.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onOpenShortcuts}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Shortcuts</span>
        </button>

        <button
          onClick={() => onOpenLegal('privacy')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy</span>
        </button>
      </nav>

      {/* Zone 3: Primary Export Action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenExport}
          disabled={!hasImage}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 transition-colors shadow-sm disabled:opacity-40 disabled:hover:bg-sky-500 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export GIF</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-sky-600 text-sky-100 rounded">
            Cmd+E
          </kbd>
        </button>
      </div>
    </header>
  );
};
