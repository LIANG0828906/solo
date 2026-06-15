import { useState, useCallback, useRef, useEffect } from 'react';
import type { Tool, PlacedTool, ToolType } from '@/types';
import { useGameStore } from '@/store/useGameStore';

interface DragHandlers {
  onDragStart: (e: React.DragEvent<HTMLElement>, tool: Tool) => void;
  onDragEnd: (e: React.DragEvent<HTMLElement>) => void;
}

interface DropHandlers {
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
}

interface UseDragDropReturn {
  dragHandlers: DragHandlers;
  dropHandlers: DropHandlers;
  isDragging: boolean;
  draggedTool: Tool | null;
  isDragOver: boolean;
  validateTools: (placedTypes: ToolType[], requiredTypes: ToolType[]) => boolean;
}

export const useDragDrop = (): UseDragDropReturn => {
  const [draggedTool, setDraggedTool] = useState<Tool | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    isDragging,
    setIsDragging,
    addPlacedTool,
    currentOrder,
    placedTools,
    updateToolQuantity,
  } = useGameStore();

  const dragImageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!dragImageRef.current) {
      const dragImage = document.createElement('div');
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-9999px';
      dragImage.style.left = '-9999px';
      dragImage.style.width = '60px';
      dragImage.style.height = '60px';
      dragImage.style.borderRadius = '50%';
      dragImage.style.background =
        'radial-gradient(circle, rgba(192, 57, 43, 0.6) 0%, rgba(192, 57, 43, 0) 70%)';
      dragImage.style.boxShadow =
        '0 0 20px rgba(192, 57, 43, 0.8), 0 0 40px rgba(192, 57, 43, 0.4)';
      dragImage.style.pointerEvents = 'none';
      document.body.appendChild(dragImage);
      dragImageRef.current = dragImage;
    }

    return () => {
      if (dragImageRef.current) {
        document.body.removeChild(dragImageRef.current);
        dragImageRef.current = null;
      }
    };
  }, []);

  const validateTools = useCallback(
    (placedTypes: ToolType[], requiredTypes: ToolType[]): boolean => {
      if (placedTypes.length !== requiredTypes.length) return false;

      const sortedPlaced = [...placedTypes].sort();
      const sortedRequired = [...requiredTypes].sort();

      return sortedPlaced.every(
        (type, index) => type === sortedRequired[index]
      );
    },
    []
  );

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLElement>, tool: Tool) => {
      if (tool.quantity <= 0) {
        e.preventDefault();
        return;
      }

      setDraggedTool(tool);
      setIsDragging(true);

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(tool));

      if (dragImageRef.current) {
        e.dataTransfer.setDragImage(dragImageRef.current, 30, 30);
      }

      const target = e.currentTarget;
      target.style.opacity = '0.5';
      target.style.transform = 'scale(0.95)';
    },
    [setIsDragging]
  );

  const onDragEnd = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      setDraggedTool(null);
      setIsDragging(false);
      setIsDragOver(false);

      const target = e.currentTarget;
      target.style.opacity = '1';
      target.style.transform = 'scale(1)';

      if (e.dataTransfer) {
        e.dataTransfer.clearData();
      }
    },
    [setIsDragging]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      setIsDragOver(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      setDraggedTool(null);
      setIsDragging(false);

      try {
        const toolData = e.dataTransfer.getData('application/json');
        if (!toolData) return;

        const tool: Tool = JSON.parse(toolData);

        if (tool.quantity <= 0) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const alreadyPlaced = placedTools.some((t) => t.type === tool.type);
        if (alreadyPlaced) return;

        const placedTool: PlacedTool = {
          id: `placed-${tool.type}-${Date.now()}`,
          type: tool.type,
          position: { x, y },
        };

        addPlacedTool(placedTool);
        updateToolQuantity(tool.type, -1);
      } catch (error) {
        console.error('Drop error:', error);
      }
    },
    [
      placedTools,
      currentOrder,
      addPlacedTool,
      updateToolQuantity,
      setIsDragging,
    ]
  );

  const dragHandlers: DragHandlers = {
    onDragStart,
    onDragEnd,
  };

  const dropHandlers: DropHandlers = {
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
  };

  return {
    dragHandlers,
    dropHandlers,
    isDragging,
    draggedTool,
    isDragOver,
    validateTools,
  };
};
