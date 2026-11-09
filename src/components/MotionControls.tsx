import React from 'react';
import { 
  AnimationPreset, 
  AnimationSettings, 
  DirectionType, 
  EasingType, 
  LoopMode 
} from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  Sun, 
  RotateCw, 
  Heart, 
  Activity, 
  Vibrate, 
  Compass, 
  SlidersHorizontal,
  Repeat,
  Repeat1,
  Shuffle
} from 'lucide-react';

interface MotionControlsProps {
  settings: AnimationSettings;
  onChange: (settings: AnimationSettings) => void;
}

interface PresetOption {
  id: AnimationPreset;
  label: string;
  icon: React.ReactNode;
}

const PRESET_OPTIONS: PresetOption[] = [
  { id: 'zoom_in', label: 'Zoom In', icon: <ZoomIn className="w-4 h-4" /> },
  { id: 'zoom_out', label: 'Zoom Out', icon: <ZoomOut className="w-4 h-4" /> },
  { id: 'pan_left', label: 'Pan Left', icon: <ArrowLeft className="w-4 h-4" /> },
  { id: 'pan_right', label: 'Pan Right', icon: <ArrowRight className="w-4 h-4" /> },
  { id: 'pan_up', label: 'Pan Up', icon: <ArrowUp className="w-4 h-4" /> },
  { id: 'pan_down', label: 'Pan Down', icon: <ArrowDown className="w-4 h-4" /> },
  { id: 'fade', label: 'Fade', icon: <Sun className="w-4 h-4" /> },
  { id: 'rotate', label: 'Rotate', icon: <RotateCw className="w-4 h-4" /> },
  { id: 'pulse', label: 'Pulse', icon: <Heart className="w-4 h-4" /> },
  { id: 'bounce', label: 'Bounce', icon: <Activity className="w-4 h-4" /> },
  { id: 'shake', label: 'Shake', icon: <Vibrate className="w-4 h-4" /> },
  { id: 'ken_burns', label: 'Ken Burns', icon: <Compass className="w-4 h-4" /> },
  { id: 'custom', label: 'Custom Motion', icon: <SlidersHorizontal className="w-4 h-4" /> },
];

export const MotionControls: React.FC<MotionControlsProps> = ({ settings, onChange }) => {
  const update = (partial: Partial<AnimationSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const updateCustom = (partial: Partial<AnimationSettings['customMotion']>) => {
    onChange({
      ...settings,
      customMotion: { ...settings.customMotion, ...partial },
    });
  };

  return (
    <div className="space-y-5">
      {/* Animation Presets Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Motion Preset
          </label>
          <span className="text-[11px] text-zinc-400 font-mono capitalize">
            {settings.preset.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {PRESET_OPTIONS.map((item) => {
            const isSelected = settings.preset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => update({ preset: item.id })}
                className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-950/40 text-sky-300 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className={`${isSelected ? 'text-sky-400' : 'text-zinc-400'}`}>
                  {item.icon}
                </div>
                <span className="text-[11px] font-medium leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Timing Parameters */}
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Timing & Cadence
        </label>

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Duration</span>
            <span className="font-mono text-zinc-200">{settings.duration.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="10.0"
            step="0.1"
            value={settings.duration}
            onChange={(e) => update({ duration: parseFloat(e.target.value) })}
            className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* FPS */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Frame Rate (FPS)</span>
            <span className="font-mono text-zinc-200">{settings.fps} fps</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={settings.fps}
            onChange={(e) => update({ fps: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Speed */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Playback Speed</span>
            <span className="font-mono text-zinc-200">{settings.speed.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min="0.25"
            max="3.0"
            step="0.05"
            value={settings.speed}
            onChange={(e) => update({ speed: parseFloat(e.target.value) })}
            className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Intensity */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Motion Intensity</span>
            <span className="font-mono text-zinc-200">{settings.intensity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={settings.intensity}
            onChange={(e) => update({ intensity: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Scale & Rotation Ranges */}
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Scale & Rotation Range
        </label>

        {/* Scale Min / Max */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Min Scale</span>
              <span className="font-mono text-zinc-200">{settings.scaleMin.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={settings.scaleMin}
              onChange={(e) => update({ scaleMin: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Max Scale</span>
              <span className="font-mono text-zinc-200">{settings.scaleMax.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.05"
              value={settings.scaleMax}
              onChange={(e) => update({ scaleMax: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Rotation Degrees */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Rotation Angle</span>
            <span className="font-mono text-zinc-200">{settings.rotationDeg}°</span>
          </div>
          <input
            type="range"
            min="-360"
            max="360"
            step="15"
            value={settings.rotationDeg}
            onChange={(e) => update({ rotationDeg: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Direction & Looping */}
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Looping & Playback Behavior
        </label>

        {/* Direction Segmented Control */}
        <div>
          <div className="text-[11px] text-zinc-400 mb-1.5">Cycle Direction</div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            {(['normal', 'reverse', 'alternate'] as DirectionType[]).map((dir) => (
              <button
                key={dir}
                onClick={() => update({ direction: dir })}
                className={`py-1 px-2 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${
                  settings.direction === dir
                    ? 'bg-zinc-800 text-sky-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {dir === 'alternate' ? 'Ping-Pong' : dir}
              </button>
            ))}
          </div>
        </div>

        {/* Looping Mode */}
        <div>
          <div className="text-[11px] text-zinc-400 mb-1.5">Loop Mode</div>
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            <button
              onClick={() => update({ loopMode: 'loop' })}
              className={`flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                settings.loopMode === 'loop'
                  ? 'bg-zinc-800 text-sky-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Infinite Loop</span>
            </button>
            <button
              onClick={() => update({ loopMode: 'once' })}
              className={`flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                settings.loopMode === 'once'
                  ? 'bg-zinc-800 text-sky-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Repeat1 className="w-3.5 h-3.5" />
              <span>Play Once</span>
            </button>
          </div>
        </div>

        {/* Easing Function */}
        <div>
          <div className="text-[11px] text-zinc-400 mb-1.5">Interpolation Easing</div>
          <div className="grid grid-cols-3 gap-1">
            {(['linear', 'ease_in', 'ease_out', 'ease_in_out', 'elastic'] as EasingType[]).map((e) => (
              <button
                key={e}
                onClick={() => update({ easing: e })}
                className={`py-1 px-2 text-[11px] font-mono rounded-md border text-center transition-all cursor-pointer ${
                  settings.easing === e
                    ? 'border-sky-500 bg-sky-950/40 text-sky-300'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {e.replace(/_/g, '-')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Keyframes Editor (Revealed when Custom Motion is selected) */}
      {settings.preset === 'custom' && (
        <div className="space-y-3 pt-3 border-t border-sky-900/50 bg-sky-950/10 p-3 rounded-lg border border-sky-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Custom Keyframe Motion
            </span>
            <span className="text-[10px] text-zinc-400">
              Start → End Parameters
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Start / End Scale */}
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>Start Scale</span>
                <span className="font-mono text-zinc-200">{settings.customMotion.startScale.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={settings.customMotion.startScale}
                onChange={(e) => updateCustom({ startScale: parseFloat(e.target.value) })}
                className="w-full accent-sky-500 h-1 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>End Scale</span>
                <span className="font-mono text-zinc-200">{settings.customMotion.endScale.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={settings.customMotion.endScale}
                onChange={(e) => updateCustom({ endScale: parseFloat(e.target.value) })}
                className="w-full accent-sky-500 h-1 bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            {/* Start / End Offset X */}
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>Start Offset X</span>
                <span className="font-mono text-zinc-200">{settings.customMotion.startOffsetX}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={settings.customMotion.startOffsetX}
                onChange={(e) => updateCustom({ startOffsetX: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500 h-1 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>End Offset X</span>
                <span className="font-mono text-zinc-200">{settings.customMotion.endOffsetX}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={settings.customMotion.endOffsetX}
                onChange={(e) => updateCustom({ endOffsetX: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500 h-1 bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            {/* Start / End Offset Y */}
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>Start Offset Y</span>
                <span className="font-mono text-zinc-200">{settings.customMotion.startOffsetY}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={settings.customMotion.startOffsetY}
                onChange={(e) => updateCustom({ startOffsetY: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500 h-1 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>End Offset Y</span>
                <span className="font-mono text-zinc-200">{settings.customMotion.endOffsetY}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={settings.customMotion.endOffsetY}
                onChange={(e) => updateCustom({ endOffsetY: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500 h-1 bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            {/* Start / End Rotation */}
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>Start Angle</span>
                <span className="font-mono text-zinc-200">{settings.customMotion.startRotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={settings.customMotion.startRotation}
                onChange={(e) => updateCustom({ startRotation: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500 h-1 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>End Angle</span>
                <span className="font-mono text-zinc-200">{settings.customMotion.endRotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={settings.customMotion.endRotation}
                onChange={(e) => updateCustom({ endRotation: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500 h-1 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
