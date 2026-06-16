import { v4 as uuidv4 } from 'uuid';
import type { SpriteFrame, Selection } from '@/types';
import { getImageDataFromImage } from './canvasUtils';

export function createFrame(
  imageData: ImageData,
  name: string,
  duration: number = 0.1
): SpriteFrame {
  return {
    id: uuidv4(),
    name,
    imageData,
    width: imageData.width,
    height: imageData.height,
    duration,
  };
}

export function cutFramesFromSpriteSheet(
  image: HTMLImageElement,
  selection: Selection
): SpriteFrame[] {
  const frames: SpriteFrame[] = [];
  const { x, y, width: frameWidth, height: frameHeight } = selection;

  if (frameWidth <= 0 || frameHeight <= 0) {
    return frames;
  }

  const cols = Math.floor((image.width - x) / frameWidth);
  const rows = Math.floor((image.height - y) / frameHeight);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = x + col * frameWidth;
      const sy = y + row * frameHeight;
      const imageData = getImageDataFromImage(image, sx, sy, frameWidth, frameHeight);
      const frameIndex = row * cols + col;
      const frameName = `Frame ${String(frameIndex + 1).padStart(2, '0')}`;
      frames.push(createFrame(imageData, frameName));
    }
  }

  return frames;
}

export function duplicateFrame(frame: SpriteFrame): SpriteFrame {
  const newImageData = new ImageData(
    new Uint8ClampedArray(frame.imageData.data),
    frame.imageData.width,
    frame.imageData.height
  );
  return {
    ...frame,
    id: uuidv4(),
    name: `${frame.name} (copy)`,
    imageData: newImageData,
  };
}

export function createBlankFrame(
  width: number = 32,
  height: number = 32
): SpriteFrame {
  const imageData = new ImageData(width, height);
  return createFrame(imageData, 'Blank Frame');
}

export function getMaxFrameSize(frames: SpriteFrame[]): { width: number; height: number } {
  let maxWidth = 0;
  let maxHeight = 0;
  for (const frame of frames) {
    maxWidth = Math.max(maxWidth, frame.width);
    maxHeight = Math.max(maxHeight, frame.height);
  }
  return { width: maxWidth, height: maxHeight };
}
