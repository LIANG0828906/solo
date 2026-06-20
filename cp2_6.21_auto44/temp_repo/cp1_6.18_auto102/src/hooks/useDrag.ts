import { useCallback } from 'react';

interface UseDragOptions {
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function useDrag(data: Record<string, string>, options: UseDragOptions = {}) {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/json', JSON.stringify(data));
      e.dataTransfer.effectAllowed = 'move';
      const target = e.currentTarget as HTMLElement;
      target.style.opacity = '0.8';
      target.style.transform = 'scale(0.95)';
      options.onDragStart?.(e);
    },
    [data, options]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.opacity = '';
      target.style.transform = '';
      options.onDragEnd?.(e);
    },
    [options]
  );

  return {
    draggable: true as const,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  };
}
