import { useCallback, useRef, useState } from 'react';

interface DragState {
  isDragging: boolean;
  dragItemId: string | null;
  dragStartIndex: number;
  dragOverIndex: number;
}

export function useDragDrop(
  items: { id: string }[],
  onReorder: (startIndex: number, endIndex: number) => void
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragItemId: null,
    dragStartIndex: -1,
    dragOverIndex: -1,
  });
  
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    const index = items.findIndex(item => item.id === itemId);
    setDragState({
      isDragging: true,
      dragItemId: itemId,
      dragStartIndex: index,
      dragOverIndex: index,
    });
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
    
    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      const dragImage = document.createElement('div');
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.width = `${rect.width}px`;
      dragImage.style.height = `${rect.height}px`;
      dragImage.style.background = 'rgba(26, 39, 68, 0.1)';
      dragImage.style.borderRadius = '8px';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, e.clientX - rect.left, e.clientY - rect.top);
      dragImageRef.current = dragImage;
    }
  }, [items]);

  const handleDragEnd = useCallback(() => {
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
    setDragState({
      isDragging: false,
      dragItemId: null,
      dragStartIndex: -1,
      dragOverIndex: -1,
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const overIndex = items.findIndex(item => item.id === itemId);
    setDragState(prev => ({
      ...prev,
      dragOverIndex: overIndex,
    }));
  }, [items]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    const startIndex = items.findIndex(item => item.id === itemId);
    const endIndex = items.findIndex(item => item.id === dragState.dragOverIndex !== -1 
      ? items[dragState.dragOverIndex]?.id 
      : itemId);
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex !== endIndex) {
      onReorder(startIndex, endIndex);
    }
    
    handleDragEnd();
  }, [items, dragState.dragOverIndex, onReorder, handleDragEnd]);

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}
