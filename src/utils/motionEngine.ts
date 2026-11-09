import { AnimationSettings, FrameTransform, EasingType } from '../types';

export function applyEasing(t: number, easing: EasingType): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear':
      return clamped;
    case 'ease_in':
      return clamped * clamped * clamped;
    case 'ease_out':
      return 1 - Math.pow(1 - clamped, 3);
    case 'ease_in_out':
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
    case 'elastic': {
      if (clamped === 0) return 0;
      if (clamped === 1) return 1;
      const c4 = (2 * Math.PI) / 3;
      return -Math.pow(2, 10 * clamped - 10) * Math.sin((clamped * 10 - 10.75) * c4);
    }
    default:
      return clamped;
  }
}

/**
 * Computes normalized cycle progress [0, 1] considering direction ('normal', 'reverse', 'alternate')
 */
export function computeCycleProgress(
  normalizedTime: number, // 0 to 1 in full cycle
  direction: 'normal' | 'reverse' | 'alternate'
): number {
  const t = Math.max(0, Math.min(1, normalizedTime));
  if (direction === 'reverse') {
    return 1 - t;
  }
  if (direction === 'alternate') {
    // Ping-pong: 0 -> 1 -> 0
    return t < 0.5 ? t * 2 : (1 - t) * 2;
  }
  return t;
}

/**
 * Evaluates frame transform (scale, translateX, translateY, rotation, opacity)
 * at any normalized progress time [0, 1].
 */
export function calculateTransform(
  progress: number, // 0 to 1
  settings: AnimationSettings,
  viewportWidth: number,
  viewportHeight: number
): FrameTransform {
  // Apply direction mapping
  const dirProgress = computeCycleProgress(progress, settings.direction);
  // Apply easing
  const eased = applyEasing(dirProgress, settings.easing);
  
  const intensityFactor = Math.max(0, settings.intensity) / 100;
  const maxPanX = viewportWidth * 0.25 * intensityFactor;
  const maxPanY = viewportHeight * 0.25 * intensityFactor;

  let scale = 1.0;
  let translateX = 0;
  let translateY = 0;
  let rotation = 0;
  let opacity = 1.0;

  switch (settings.preset) {
    case 'zoom_in': {
      const minS = settings.scaleMin;
      const maxS = settings.scaleMin + (settings.scaleMax - settings.scaleMin) * intensityFactor;
      scale = minS + (maxS - minS) * eased;
      break;
    }
    case 'zoom_out': {
      const minS = settings.scaleMin;
      const maxS = settings.scaleMin + (settings.scaleMax - settings.scaleMin) * intensityFactor;
      scale = maxS - (maxS - minS) * eased;
      break;
    }
    case 'pan_left': {
      // Moves left: starts at +offset, ends at -offset
      translateX = maxPanX * (1 - 2 * eased);
      break;
    }
    case 'pan_right': {
      // Moves right: starts at -offset, ends at +offset
      translateX = -maxPanX * (1 - 2 * eased);
      break;
    }
    case 'pan_up': {
      // Moves up: starts at +offset, ends at -offset
      translateY = maxPanY * (1 - 2 * eased);
      break;
    }
    case 'pan_down': {
      // Moves down: starts at -offset, ends at +offset
      translateY = -maxPanY * (1 - 2 * eased);
      break;
    }
    case 'fade': {
      // Smooth fade oscillation
      const minOpacity = 1.0 - (0.8 * intensityFactor);
      const sineWave = Math.sin(progress * Math.PI * 2);
      opacity = minOpacity + (1.0 - minOpacity) * (0.5 + 0.5 * sineWave);
      break;
    }
    case 'rotate': {
      const totalDeg = settings.rotationDeg * intensityFactor;
      rotation = totalDeg * eased;
      break;
    }
    case 'pulse': {
      // Pulsing scale expansion and contraction
      const pulseAmp = 0.25 * intensityFactor;
      const sineWave = Math.sin(progress * Math.PI * 2);
      scale = 1.0 + pulseAmp * Math.abs(sineWave);
      break;
    }
    case 'bounce': {
      // Elastic bounce vertical oscillation
      const bounceHeight = maxPanY * 1.5;
      const cycles = 2;
      const wave = Math.abs(Math.cos(progress * Math.PI * cycles));
      translateY = -bounceHeight * wave * (1 - progress * 0.3);
      scale = 1.0 + (0.08 * (1 - wave) * intensityFactor); // squash at bottom
      break;
    }
    case 'shake': {
      // Camera shake / tremor
      const shakeFreq = 16;
      const shakeAmpX = (viewportWidth * 0.04) * intensityFactor;
      const shakeAmpY = (viewportHeight * 0.04) * intensityFactor;
      const phase = progress * Math.PI * 2 * shakeFreq;
      translateX = Math.sin(phase) * shakeAmpX * (1 - progress * 0.2);
      translateY = Math.cos(phase * 1.3) * shakeAmpY * (1 - progress * 0.2);
      rotation = Math.sin(phase * 0.7) * (3 * intensityFactor);
      break;
    }
    case 'ken_burns': {
      // Documentary pan + slow zoom
      const minS = 1.0;
      const maxS = 1.0 + 0.25 * intensityFactor;
      scale = minS + (maxS - minS) * eased;
      translateX = (maxPanX * 0.8) * (2 * eased - 1);
      translateY = (maxPanY * 0.5) * (1 - 2 * eased);
      break;
    }
    case 'custom': {
      const km = settings.customMotion;
      scale = km.startScale + (km.endScale - km.startScale) * eased;
      translateX = ((km.startOffsetX + (km.endOffsetX - km.startOffsetX) * eased) / 100) * viewportWidth;
      translateY = ((km.startOffsetY + (km.endOffsetY - km.startOffsetY) * eased) / 100) * viewportHeight;
      rotation = km.startRotation + (km.endRotation - km.startRotation) * eased;
      opacity = km.startOpacity + (km.endOpacity - km.startOpacity) * eased;
      break;
    }
  }

  return {
    scale,
    translateX,
    translateY,
    rotation,
    opacity: Math.max(0, Math.min(1, opacity)),
  };
}

/**
 * Calculates total frames based on duration (seconds) and FPS.
 */
export function calculateTotalFrames(duration: number, fps: number): number {
  const safeDuration = Math.max(0.2, Math.min(10, duration));
  const safeFps = Math.max(5, Math.min(30, fps));
  return Math.round(safeDuration * safeFps);
}
