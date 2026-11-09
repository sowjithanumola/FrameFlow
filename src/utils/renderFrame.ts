import { CropSelection, FrameTransform } from '../types';

export interface RenderFrameOptions {
  image: HTMLImageElement;
  mode: 'full' | 'selected';
  selection: CropSelection;
  transform: FrameTransform;
  targetWidth: number;
  targetHeight: number;
  transparent?: boolean;
  backgroundColor?: string;
}

/**
 * Renders an animated frame onto a 2D rendering context.
 */
export function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  options: RenderFrameOptions
): void {
  const {
    image,
    mode,
    selection,
    transform,
    targetWidth,
    targetHeight,
    transparent = false,
    backgroundColor = '#09090b',
  } = options;

  // Clear context
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  if (!transparent && backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.save();

  // Set alpha
  ctx.globalAlpha = transform.opacity;

  // Setup transform origin at canvas center
  const centerX = targetWidth / 2;
  const centerY = targetHeight / 2;

  ctx.translate(centerX + transform.translateX, centerY + transform.translateY);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(transform.scale, transform.scale);

  // Enable high-quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (mode === 'selected' && selection.active) {
    // Crop region from source image
    const sourceX = selection.x;
    const sourceY = selection.y;
    const sourceW = selection.width;
    const sourceH = selection.height;

    // Calculate fitted dimensions preserving selection aspect ratio
    const selectionAspect = sourceW / Math.max(1, sourceH);
    const targetAspect = targetWidth / Math.max(1, targetHeight);

    let drawW: number;
    let drawH: number;

    if (selectionAspect > targetAspect) {
      drawW = targetWidth;
      drawH = targetWidth / selectionAspect;
    } else {
      drawH = targetHeight;
      drawW = targetHeight * selectionAspect;
    }

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );
  } else {
    // Full image rendering
    const imgAspect = image.naturalWidth / Math.max(1, image.naturalHeight);
    const targetAspect = targetWidth / Math.max(1, targetHeight);

    let drawW: number;
    let drawH: number;

    if (imgAspect > targetAspect) {
      drawW = targetWidth;
      drawH = targetWidth / imgAspect;
    } else {
      drawH = targetHeight;
      drawW = targetHeight * imgAspect;
    }

    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
  }

  ctx.restore();
}
