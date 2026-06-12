import type { PixelTemplate, CharacterColors, LayerVisibility } from '@/types/character';
import { generateColorVariants, hexToRgb } from './colorUtils';

const PIXEL_VALUE_MAP: Record<number, keyof ReturnType<typeof generateColorVariants>> = {
  1: 'base',
  2: 'light',
  3: 'dark',
  4: 'shadow',
  5: 'light',
};

export function drawTemplateToContext(
  ctx: CanvasRenderingContext2D,
  template: PixelTemplate,
  baseColor: string,
  offsetX: number = 0,
  offsetY: number = 0,
  scale: number = 1,
  opacity: number = 1,
) {
  const variants = generateColorVariants(baseColor);
  const globalAlpha = ctx.globalAlpha;
  ctx.globalAlpha = opacity;

  for (let y = 0; y < template.height; y++) {
    for (let x = 0; x < template.width; x++) {
      const pixelValue = template.data[y][x];
      if (pixelValue === 0) continue;

      const variantKey = PIXEL_VALUE_MAP[pixelValue] || 'base';
      const colorHex = variants[variantKey];
      const { r, g, b } = hexToRgb(colorHex);

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(
        offsetX + x * scale,
        offsetY + y * scale,
        scale,
        scale,
      );
    }
  }

  ctx.globalAlpha = globalAlpha;
}

export interface RenderCharacterParams {
  ctx: CanvasRenderingContext2D;
  bodyTemplate: PixelTemplate;
  hairTemplate: PixelTemplate;
  clothesTemplate: PixelTemplate;
  weaponTemplate: PixelTemplate;
  accessoryTemplate: PixelTemplate;
  colors: CharacterColors;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  visibility?: LayerVisibility;
}

export function renderCharacter({
  ctx,
  bodyTemplate,
  hairTemplate,
  clothesTemplate,
  weaponTemplate,
  accessoryTemplate,
  colors,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  visibility = { body: 1, clothes: 1, weapon: 1, hair: 1, accessory: 1 },
}: RenderCharacterParams) {
  if (visibility.body > 0) {
    drawTemplateToContext(ctx, bodyTemplate, colors.skin, offsetX, offsetY, scale, visibility.body);
  }

  if (visibility.clothes > 0) {
    drawTemplateToContext(ctx, clothesTemplate, colors.clothes, offsetX, offsetY, scale, visibility.clothes);
  }

  if (visibility.hair > 0) {
    drawTemplateToContext(ctx, hairTemplate, colors.hair, offsetX, offsetY, scale, visibility.hair);
  }

  if (visibility.weapon > 0) {
    drawTemplateToContext(ctx, weaponTemplate, colors.weapon, offsetX, offsetY, scale, visibility.weapon);
  }

  if (visibility.accessory > 0) {
    drawTemplateToContext(ctx, accessoryTemplate, colors.accessory, offsetX, offsetY, scale, visibility.accessory);
  }
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
}

export function drawGlowEffect(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  glowColor: string = 'rgba(233, 69, 96, 0.25)',
) {
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, Math.max(radiusX, radiusY),
  );
  gradient.addColorStop(0, glowColor);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderToImageData(
  bodyTemplate: PixelTemplate,
  hairTemplate: PixelTemplate,
  clothesTemplate: PixelTemplate,
  weaponTemplate: PixelTemplate,
  accessoryTemplate: PixelTemplate,
  colors: CharacterColors,
  targetSize: number,
): ImageData {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = targetSize;
  offCanvas.height = targetSize;
  const offCtx = offCanvas.getContext('2d')!;
  offCtx.imageSmoothingEnabled = false;

  const scale = Math.floor(Math.min(
    targetSize / bodyTemplate.width,
    targetSize / bodyTemplate.height,
  ));
  const scaledW = bodyTemplate.width * scale;
  const scaledH = bodyTemplate.height * scale;
  const offsetX = Math.floor((targetSize - scaledW) / 2);
  const offsetY = Math.floor((targetSize - scaledH) / 2);

  renderCharacter({
    ctx: offCtx,
    bodyTemplate,
    hairTemplate,
    clothesTemplate,
    weaponTemplate,
    accessoryTemplate,
    colors,
    scale,
    offsetX,
    offsetY,
  });

  return offCtx.getImageData(0, 0, targetSize, targetSize);
}
