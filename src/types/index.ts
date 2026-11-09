export type AnimationPreset = 
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'pan_up'
  | 'pan_down'
  | 'fade'
  | 'rotate'
  | 'pulse'
  | 'bounce'
  | 'shake'
  | 'ken_burns'
  | 'custom';

export type EasingType = 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'elastic';

export type DirectionType = 'normal' | 'reverse' | 'alternate';

export type LoopMode = 'loop' | 'once';

export type AspectRatioPreset = 'free' | '1:1' | '4:3' | '16:9' | '9:16';

export interface CustomKeyframes {
  startScale: number;
  endScale: number;
  startOffsetX: number; // in percent (-50 to 50)
  endOffsetX: number;
  startOffsetY: number;
  endOffsetY: number;
  startRotation: number; // degrees
  endRotation: number;
  startOpacity: number; // 0 to 1
  endOpacity: number;
}

export interface AnimationSettings {
  preset: AnimationPreset;
  duration: number; // seconds (0.5 to 10)
  fps: number; // frames per second (5 to 30)
  speed: number; // speed multiplier (0.25 to 3)
  intensity: number; // 0 to 100
  scaleMin: number; // default 1.0
  scaleMax: number; // default 1.35
  rotationDeg: number; // -360 to +360
  direction: DirectionType;
  loopMode: LoopMode;
  easing: EasingType;
  customMotion: CustomKeyframes;
}

export interface CropSelection {
  active: boolean;
  x: number; // normalized 0 to 1 or pixels relative to natural size
  y: number;
  width: number;
  height: number;
  aspectRatio: AspectRatioPreset;
}

export interface FrameItem {
  id: string;
  index: number;
  delayMs: number;
  progress: number; // 0 to 1 normalized in cycle
  thumbnailUrl?: string;
  customTransform?: {
    scale: number;
    translateX: number;
    translateY: number;
    rotation: number;
    opacity: number;
  };
}

export interface ExportSettings {
  width: number;
  height: number;
  fps: number;
  maxColors: number; // 32, 64, 128, 256
  dither: boolean;
  transparent: boolean;
  loopCount: number; // 0 for infinite, 1 for once
  preserveAspectRatio: boolean;
}

export interface ProjectState {
  id: string;
  name: string;
  lastModified: number;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  mode: 'full' | 'selected';
  selection: CropSelection;
  animation: AnimationSettings;
  exportSettings: ExportSettings;
  customFrames?: FrameItem[];
}

export interface FrameTransform {
  scale: number;
  translateX: number; // in pixels relative to preview/export width
  translateY: number; // in pixels relative to preview/export height
  rotation: number; // degrees
  opacity: number; // 0 to 1
}

export interface ExportProgress {
  isExporting: boolean;
  currentFrame: number;
  totalFrames: number;
  phase: 'rendering' | 'quantizing' | 'encoding' | 'complete' | 'cancelled' | 'error';
  percent: number;
  errorMessage?: string;
  gifBlob?: Blob;
  gifUrl?: string;
  fileSizeBytes?: number;
}
