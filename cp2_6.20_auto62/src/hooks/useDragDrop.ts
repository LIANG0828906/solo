import { useRef, useCallback, useEffect } from 'react';

interface DragState {
  isDragging: boolean;
  data: unknown;
  startX: number;
  startY: number;
}

export function useDragDrop<T>(
  onDrop: (data: T, x: number, y: number) => void,
  onDragOver?: (x: number, y: number) => void
) {
  const dragState = useRef<DragState>({
    isDragging: false,
    data: null,
    startX: 0,
    startY: 0,
  });

  const handleDragStart = useCallback((e: React.DragEvent, data: T) => {
    dragState.current = {
      isDragging: true,
      data,
      startX: e.clientX,
      startY: e.clientY,
    };
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (onDragOver) {
        onDragOver(e.clientX, e.clientY);
      }
    },
    [onDragOver]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const rawData = e.dataTransfer.getData('text/plain');
        if (rawData) {
          const data = JSON.parse(rawData) as T;
          onDrop(data, e.clientX, e.clientY);
        }
      } catch {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          for (const file of Array.from(e.dataTransfer.files)) {
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = () => {
                onDrop({ type: 'image', src: reader.result as string } as unknown as T, e.clientX, e.clientY);
              };
              reader.readAsDataURL(file);
            }
          }
        }
      }
    },
    [onDrop]
  );

  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  return { handleDragStart, handleDragOver, handleDrop };
}
