import { v4 as uuidv4 } from 'uuid';
import type { DialogBox } from '../types';

const MOCK_TEXTS = [
  '我会成为火影！',
  '这个力量...超越极限！',
  '不要放弃！',
  '终于见面了...',
  '一起走吧！',
  '这就是我的忍道！',
  '你准备好了吗？',
  '绝对不原谅！',
];

export function detectDialogBoxes(
  imageWidth: number,
  imageHeight: number
): DialogBox[] {
  const count = 3 + Math.floor(Math.random() * 4);
  const boxes: DialogBox[] = [];

  for (let i = 0; i < count; i++) {
    const boxWidth = Math.max(80, imageWidth * (0.12 + Math.random() * 0.18));
    const boxHeight = Math.max(40, imageHeight * (0.08 + Math.random() * 0.14));
    const x = Math.random() * (imageWidth - boxWidth);
    const y = Math.random() * (imageHeight - boxHeight);

    const fontFamily = '"Noto Sans SC", sans-serif';
    const fontSize = 16;
    const textX = x + boxWidth / 2;
    const textY = y + boxHeight / 2;

    boxes.push({
      id: uuidv4(),
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(boxWidth),
      height: Math.round(boxHeight),
      originalText: MOCK_TEXTS[i % MOCK_TEXTS.length],
      translatedText: '',
      fontFamily,
      fontSize,
      fontColor: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 1,
      textX: Math.round(textX),
      textY: Math.round(textY),
    });
  }

  return boxes;
}
