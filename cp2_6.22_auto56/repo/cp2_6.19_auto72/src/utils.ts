import React from 'react';

export function createRipple(
  event: React.MouseEvent<HTMLElement>,
  setRipples: React.Dispatch<React.SetStateAction<{ x: number; y: number; size: number; id: number }[]>>
) {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  const rect = button.getBoundingClientRect();

  const rippleData = {
    x: event.clientX - rect.left - radius,
    y: event.clientY - rect.top - radius,
    size: diameter,
    id: Date.now(),
  };

  setRipples((prev) => [...prev, rippleData]);

  setTimeout(() => {
    setRipples((prev) => prev.filter((r) => r.id !== rippleData.id));
  }, 400);

  return rippleData;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function mergeRanges(ranges: { start: number; end: number }[]) {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }
  return merged;
}
