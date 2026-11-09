import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Unlock, 
  ExternalLink,
  Film
} from 'lucide-react';
import { ExportSettings, ExportProgress } from '../types';
import { ExportResult } from '../utils/gifExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportSettings: ExportSettings;
  onUpdateExportSettings: (settings: ExportSettings) => void;
  onStartExport: (signal: AbortSignal) => Promise<ExportResult>;
  sourceWidth: number;
  sourceHeight: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  exportSettings,
  onUpdateExportSettings,
  onStartExport,
  sourceWidth,
  sourceHeight,
}) => {
  const [progress, setProgress] = useState<ExportProgress>({
    isExporting: false,
    currentFrame: 0,
    totalFrames: 0,
    phase: 'rendering',
    percent: 0,
  });

  const [result, setResult] = useState<ExportResult | null>(null);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync initial dimensions with source if unset
  useEffect(() => {
    if (exportSettings.width === 0 || exportSettings.height === 0) {
      const defaultW = Math.min(800, sourceWidth);
      const aspect = sourceWidth / Math.max(1, sourceHeight);
      onUpdateExportSettings({
        ...exportSettings,
        width: Math.round(defaultW),
        height: Math.round(defaultW / aspect),
      });
    }
  }, [sourceWidth, sourceHeight]);

  if (!isOpen) return null;

  const handleResolutionPreset = (presetW: number) => {
    const aspect = sourceWidth / Math.max(1, sourceHeight);
    const newW = presetW;
    const newH = Math.round(newW / aspect);
    onUpdateExportSettings({
      ...exportSettings,
      width: newW,
      height: newH,
    });
  };

  const handleWidthChange = (w: number) => {
    const safeW = Math.max(32, Math.min(1920, w));
    if (exportSettings.preserveAspectRatio) {
      const aspect = sourceWidth / Math.max(1, sourceHeight);
      onUpdateExportSettings({
        ...exportSettings,
        width: safeW,
        height: Math.round(safeW / aspect),
      });
    } else {
      onUpdateExportSettings({ ...exportSettings, width: safeW });
    }
  };

  const handleHeightChange = (h: number) => {
    const safeH = Math.max(32, Math.min(1920, h));
    if (exportSettings.preserveAspectRatio) {
      const aspect = sourceWidth / Math.max(1, sourceHeight);
      onUpdateExportSettings({
        ...exportSettings,
        height: safeH,
        width: Math.round(safeH * aspect),
      });
    } else {
      onUpdateExportSettings({ ...exportSettings, height: safeH });
    }
  };

  const handleExport = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setProgress({
      isExporting: true,
      currentFrame: 0,
      totalFrames: 0,
      phase: 'rendering',
      percent: 0,
    });
    setResult(null);

    try {
      const res = await onStartExport(controller.signal);
      setResult(res);
      setProgress((prev) => ({
        ...prev,
        isExporting: false,
        phase: 'complete',
        percent: 100,
        gifBlob: res.blob,
        gifUrl: res.url,
        fileSizeBytes: res.sizeBytes,
      }));
    } catch (err: any) {
      if (controller.signal.aborted) {
        setProgress((prev) => ({
          ...prev,
          isExporting: false,
          phase: 'cancelled',
          errorMessage: 'Export was cancelled.',
        }));
      } else {
        setProgress((prev) => ({
          ...prev,
          isExporting: false,
          phase: 'error',
          errorMessage: err.message || 'Export failed.',
        }));
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `frameflow-animation-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyUrl = async () => {
    if (!result) return;
    try {
      // Convert blob to Data URL for copying
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        navigator.clipboard.writeText(base64);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };
      reader.readAsDataURL(result.blob);
    } catch {
      alert('Unable to copy to clipboard.');
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Export Animated GIF
            </h3>
          </div>
          <button
            onClick={() => {
              if (progress.isExporting) handleCancelExport();
              onClose();
            }}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-300">
          {/* If already exported and result is ready: show preview & download */}
          {result ? (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col items-center justify-center">
                <div className="max-h-64 rounded-md overflow-hidden bg-checkerboard border border-zinc-800 shadow-md">
                  <img
                    src={result.url}
                    alt="Exported GIF"
                    className="max-h-64 object-contain"
                  />
                </div>

                {/* Output Metrics */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-400">
                  <div>
                    Dimensions: <span className="text-zinc-200 font-semibold">{result.width} × {result.height}</span>
                  </div>
                  <span aria-hidden="true">·</span>
                  <div>
                    File Size: <span className="text-sky-300 font-semibold">{formatSize(result.sizeBytes)}</span>
                  </div>
                  <span aria-hidden="true">·</span>
                  <div>
                    Frames: <span className="text-zinc-200 font-semibold">{result.frameCount}</span>
                  </div>
                  <span aria-hidden="true">·</span>
                  <div>
                    Duration: <span className="text-zinc-200 font-semibold">{result.durationSeconds.toFixed(1)}s</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download GIF File</span>
                </button>

                <button
                  onClick={handleCopyUrl}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
                  title="Copy base64 data URL to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy URL'}</span>
                </button>

                <button
                  onClick={() => setResult(null)}
                  className="py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  Reconfigure
                </button>
              </div>
            </div>
          ) : progress.isExporting ? (
            /* Exporting in progress */
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 animate-spin">
                <Loader2 className="w-6 h-6" />
              </div>

              <div>
                <div className="text-sm font-semibold text-zinc-100 capitalize">
                  {progress.phase === 'rendering'
                    ? 'Rendering Animation Frames...'
                    : progress.phase === 'quantizing'
                    ? 'Quantizing Color Palette...'
                    : 'Encoding GIF Bitstream...'}
                </div>
                <div className="text-xs text-zinc-400 mt-1 font-mono">
                  {progress.currentFrame > 0 && `Frame ${progress.currentFrame} of ${progress.totalFrames} · `}
                  {progress.percent}% Completed
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-sm h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-150"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {/* Cancellation button */}
              <button
                onClick={handleCancelExport}
                className="mt-2 py-1.5 px-4 rounded-lg bg-zinc-800 hover:bg-red-500/20 hover:text-red-300 text-zinc-400 transition-colors cursor-pointer text-xs"
              >
                Cancel Export
              </button>
            </div>
          ) : (
            /* Configure Export Settings */
            <div className="space-y-4">
              {progress.errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-2 text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{progress.errorMessage}</span>
                </div>
              )}

              {/* Resolution Presets */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 uppercase tracking-wider">
                  Resolution Preset
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[320, 480, 720, 1080].map((res) => (
                    <button
                      key={res}
                      onClick={() => handleResolutionPreset(res)}
                      className={`py-1.5 px-2 rounded-md border text-center font-mono transition-all cursor-pointer ${
                        exportSettings.width === res
                          ? 'border-sky-500 bg-sky-950/40 text-sky-300'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {res}p
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Dimensions */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    min={32}
                    max={1920}
                    value={exportSettings.width}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 320)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-zinc-400">Height (px)</label>
                    <button
                      onClick={() =>
                        onUpdateExportSettings({
                          ...exportSettings,
                          preserveAspectRatio: !exportSettings.preserveAspectRatio,
                        })
                      }
                      className="text-zinc-500 hover:text-sky-400 transition-colors"
                      title={exportSettings.preserveAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                    >
                      {exportSettings.preserveAspectRatio ? (
                        <Lock className="w-3 h-3 text-sky-400" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={32}
                    max={1920}
                    value={exportSettings.height}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 240)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* FPS & Color Palette */}
              <div className="grid grid-cols-2 gap-3">
                {/* Export FPS */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Export FPS</label>
                  <select
                    value={exportSettings.fps}
                    onChange={(e) =>
                      onUpdateExportSettings({
                        ...exportSettings,
                        fps: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value={10}>10 FPS (Smallest size)</option>
                    <option value={15}>15 FPS (Balanced default)</option>
                    <option value={20}>20 FPS (Smooth)</option>
                    <option value={24}>24 FPS (Cinematic)</option>
                    <option value={30}>30 FPS (Ultra smooth)</option>
                  </select>
                </div>

                {/* Color Palette Depth */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Color Palette</label>
                  <select
                    value={exportSettings.maxColors}
                    onChange={(e) =>
                      onUpdateExportSettings({
                        ...exportSettings,
                        maxColors: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value={32}>32 Colors (Vintage / tiny)</option>
                    <option value={64}>64 Colors (Lightweight)</option>
                    <option value={128}>128 Colors (Good fidelity)</option>
                    <option value={256}>256 Colors (Maximum GIF fidelity)</option>
                  </select>
                </div>
              </div>

              {/* Looping & Transparency Switches */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Loop Count */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">GIF Looping</label>
                  <select
                    value={exportSettings.loopCount}
                    onChange={(e) =>
                      onUpdateExportSettings({
                        ...exportSettings,
                        loopCount: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value={0}>Infinite Loop (Standard)</option>
                    <option value={1}>Play Once</option>
                    <option value={2}>Play 2 Times</option>
                    <option value={3}>Play 3 Times</option>
                  </select>
                </div>

                {/* Transparency Toggle */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Transparent Background</label>
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportSettings.transparent}
                      onChange={(e) =>
                        onUpdateExportSettings({
                          ...exportSettings,
                          transparent: e.target.checked,
                        })
                      }
                      className="rounded accent-sky-500 cursor-pointer"
                    />
                    <span className="text-zinc-300">Preserve Transparency</span>
                  </label>
                </div>
              </div>

              {/* Export CTA Button */}
              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-semibold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate & Export GIF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
