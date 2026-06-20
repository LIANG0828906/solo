export function getBassLevel(frame: number[]): number {
  if (frame.length === 0) return 0;
  const endIndex = Math.floor(frame.length / 3);
  let sum = 0;
  for (let i = 0; i < endIndex; i++) {
    sum += frame[i];
  }
  return sum / endIndex;
}

export function getMidLevel(frame: number[]): number {
  if (frame.length === 0) return 0;
  const startIndex = Math.floor(frame.length / 3);
  const endIndex = Math.floor((frame.length * 2) / 3);
  let sum = 0;
  for (let i = startIndex; i < endIndex; i++) {
    sum += frame[i];
  }
  return sum / (endIndex - startIndex);
}

export function getHighLevel(frame: number[]): number {
  if (frame.length === 0) return 0;
  const startIndex = Math.floor((frame.length * 2) / 3);
  let sum = 0;
  for (let i = startIndex; i < frame.length; i++) {
    sum += frame[i];
  }
  return sum / (frame.length - startIndex);
}

export function getAverageLevel(frame: number[]): number {
  if (frame.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < frame.length; i++) {
    sum += frame[i];
  }
  return sum / frame.length;
}
