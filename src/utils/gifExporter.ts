import gifenc from 'gifenc';
import { AnimationSettings, CropSelection, ExportSettings, FrameItem } from '../types';
import { calculateTotalFrames, calculateTransform } from './motionEngine';
import { renderFrameToCanvas } from './renderFrame';

const { GIFEncoder, quantize, applyPalette } = gifenc;

export interface ExportGIFOptions {
  image: HTMLImageElement;
  mode: 'full' | 'selected';
  selection: CropSelection;
  animation: AnimationSettings;
  exportSettings: ExportSettings;
  customFrames?: FrameItem[];
  signal?: AbortSignal;
  onProgress?: (progress: {
    phase: 'rendering' | 'quantizing' | 'encoding' | 'complete' | 'cancelled' | 'error';
    currentFrame: number;
    totalFrames: number;
    percent: number;
  }) => void;
}

export interface ExportResult {
  blob: Blob;
  url: string;
  sizeBytes: number;
  width: number;
  height: number;
  frameCount: number;
  durationSeconds: number;
}

export async function exportGIF(options: ExportGIFOptions): Promise<ExportResult> {
  const {
    image,
    mode,
    selection,
    animation,
    exportSettings,
    customFrames,
    signal,
    onProgress,
  } = options;

  const width = Math.max(32, Math.min(1920, Math.round(exportSettings.width)));
  const height = Math.max(32, Math.min(1920, Math.round(exportSettings.height)));
  const fps = Math.max(5, Math.min(30, exportSettings.fps));
  const maxColors = Math.max(16, Math.min(256, exportSettings.maxColors || 256));
  const transparent = Boolean(exportSettings.transparent);
  const loopCount = exportSettings.loopCount ?? 0;

  // Total frames determination
  const totalFrames = customFrames && customFrames.length > 0
    ? customFrames.length
    : calculateTotalFrames(animation.duration, fps);

  const delayMs = Math.round(1000 / fps);

  // Initialize offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context creation failed.');
  }

  const gif = GIFEncoder();

  // Process frames sequentially with yielding to prevent UI freezing
  for (let i = 0; i < totalFrames; i++) {
    // Check if cancelled
    if (signal?.aborted) {
      onProgress?.({
        phase: 'cancelled',
        currentFrame: i,
        totalFrames,
        percent: Math.round((i / totalFrames) * 100),
      });
      throw new Error('Export cancelled by user.');
    }

    const progressRatio = totalFrames > 1 ? i / (totalFrames - 1) : 0;

    // Report rendering phase
    const renderPercent = Math.round((i / totalFrames) * 60);
    onProgress?.({
      phase: 'rendering',
      currentFrame: i + 1,
      totalFrames,
      percent: renderPercent,
    });

    // Determine transform
    let transform;
    let frameDelay = delayMs;

    if (customFrames && customFrames[i]) {
      const custom = customFrames[i];
      if (custom.customTransform) {
        transform = custom.customTransform;
      } else {
        transform = calculateTransform(custom.progress, animation, width, height);
      }
      if (custom.delayMs > 0) {
        frameDelay = custom.delayMs;
      }
    } else {
      transform = calculateTransform(progressRatio, animation, width, height);
    }

    // Render frame to canvas
    renderFrameToCanvas(ctx, {
      image,
      mode,
      selection,
      transform,
      targetWidth: width,
      targetHeight: height,
      transparent,
      backgroundColor: transparent ? undefined : '#09090b',
    });

    // Extract image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const rgba = imageData.data;

    // Report quantizing phase
    const quantizePercent = Math.round(60 + (i / totalFrames) * 30);
    onProgress?.({
      phase: 'quantizing',
      currentFrame: i + 1,
      totalFrames,
      percent: quantizePercent,
    });

    // Quantize palette
    const format = transparent ? 'rgba4444' : 'rgb565';
    const palette = quantize(rgba, maxColors, { format });
    const index = applyPalette(rgba, palette, format);

    // Frame write options
    const writeOptions: {
      palette: number[][];
      delay: number;
      repeat?: number;
      transparent?: boolean;
      transparentIndex?: number;
    } = {
      palette,
      delay: frameDelay,
    };

    if (i === 0) {
      writeOptions.repeat = loopCount; // 0 = infinite, 1 = once
    }

    if (transparent) {
      writeOptions.transparent = true;
      // Find or assign transparent index
      writeOptions.transparentIndex = 0;
    }

    gif.writeFrame(index, width, height, writeOptions);

    // Yield control to main thread periodically so browser doesn't stutter
    if (i % 2 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Encoding completion
  onProgress?.({
    phase: 'encoding',
    currentFrame: totalFrames,
    totalFrames,
    percent: 95,
  });

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);

  onProgress?.({
    phase: 'complete',
    currentFrame: totalFrames,
    totalFrames,
    percent: 100,
  });

  return {
    blob,
    url,
    sizeBytes: blob.size,
    width,
    height,
    frameCount: totalFrames,
    durationSeconds: (totalFrames * delayMs) / 1000,
  };
}

/**
 * Estimates GIF file size in bytes based on resolution, frames, and palette size.
 */
export function estimateGIFSize(
  width: number,
  height: number,
  frameCount: number,
  colors: number
): { bytes: number; formatted: string } {
  // Typical compressed LZW compression yields approx 0.35 to 0.65 bytes per pixel per frame
  const colorFactor = colors <= 64 ? 0.3 : colors <= 128 ? 0.42 : 0.55;
  const estimatedBytes = Math.round(width * height * frameCount * colorFactor * 0.45);
  
  if (estimatedBytes < 1024) {
    return { bytes: estimatedBytes, formatted: `${estimatedBytes} B` };
  } else if (estimatedBytes < 1024 * 1024) {
    return { bytes: estimatedBytes, formatted: `${(estimatedBytes / 1024).toFixed(1)} KB` };
  } else {
    return { bytes: estimatedBytes, formatted: `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB` };
  }
}
