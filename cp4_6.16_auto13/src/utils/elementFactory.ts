import { v4 as uuid } from 'uuid';
import type { TextElement, ImageElement, CanvasElement } from '@/types';

export function createTextElement(partial?: Partial<TextElement>): TextElement {
  return {
    id: uuid(),
    type: 'text',
    x: 200,
    y: 400,
    width: 680,
    height: 120,
    zIndex: 1,
    rotation: 0,
    opacity: 1,
    content: '双击编辑文字',
    fontFamily: 'Playfair Display',
    fontSize: 56,
    fontWeight: 600,
    colorKey: 'primary',
    lineHeight: 1.4,
    letterSpacing: 2,
    textAlign: 'center',
    ...partial,
  };
}

export function createImageElement(src: string, partial?: Partial<ImageElement>): ImageElement {
  return {
    id: uuid(),
    type: 'image',
    x: 240,
    y: 500,
    width: 600,
    height: 600,
    zIndex: 1,
    rotation: 0,
    opacity: 1,
    src,
    objectFit: 'cover',
    borderRadius: 0,
    ...partial,
  };
}

export function cloneElement(el: CanvasElement): CanvasElement {
  return {
    ...el,
    id: uuid(),
  } as CanvasElement;
}
