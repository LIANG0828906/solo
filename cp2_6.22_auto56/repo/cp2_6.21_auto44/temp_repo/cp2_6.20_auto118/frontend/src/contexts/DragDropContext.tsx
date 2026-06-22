import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { Recipe } from '../types';

interface DragDropContextType {
  isDragging: boolean;
  draggedRecipe: Recipe | null;
  dragPosition: { x: number; y: number };
  overSlotKey: string | null;
  startDrag: (recipe: Recipe, clientX: number, clientY: number) => void;
  updateDragPosition: (clientX: number, clientY: number) => void;
  endDrag: (clientX: number, clientY: number) => void;
  registerSlot: (key: string, element: HTMLElement, date: string, mealType: string) => void;
  unregisterSlot: (key: string) => void;
  onDrop: ((date: string, mealType: string, recipeId: string) => void) | null;
  setOnDrop: (handler: (date: string, mealType: string, recipeId: string) => void) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

interface SlotInfo {
  element: HTMLElement;
  date: string;
  mealType: string;
}

export const DragDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [overSlotKey, setOverSlotKey] = useState<string | null>(null);
  const [onDrop, setOnDrop] = useState<((date: string, mealType: string, recipeId: string) => void) | null>(null);
  
  const slotsRef = useRef<Map<string, SlotInfo>>(new Map());
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);

  const registerSlot = useCallback((key: string, element: HTMLElement, date: string, mealType: string) => {
    slotsRef.current.set(key, { element, date, mealType });
  }, []);

  const unregisterSlot = useCallback((key: string) => {
    slotsRef.current.delete(key);
  }, []);

  const findSlotAtPoint = useCallback((clientX: number, clientY: number): SlotInfo | null => {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;
    
    let current: HTMLElement | null = element as HTMLElement;
    while (current) {
      for (const [key, slot] of slotsRef.current.entries()) {
        if (slot.element === current) {
          return slot;
        }
      }
      current = current.parentElement;
    }
    return null;
  }, []);

  const createGhostElement = useCallback((recipe: Recipe) => {
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
    }

    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    
    const recipeEl = document.createElement('div');
    recipeEl.className = 'draggable-recipe';
    
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'draggable-recipe-image-wrapper';
    
    if (recipe.imageUrl) {
      const img = document.createElement('img');
      img.src = recipe.imageUrl;
      img.alt = recipe.title;
      img.className = 'draggable-recipe-image';
      imgWrapper.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'draggable-recipe-placeholder';
      imgWrapper.appendChild(placeholder);
    }
    
    const titleEl = document.createElement('div');
    titleEl.className = 'draggable-recipe-title';
    titleEl.textContent = recipe.title;
    
    recipeEl.appendChild(imgWrapper);
    recipeEl.appendChild(titleEl);
    ghost.appendChild(recipeEl);
    
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  }, []);

  const updateGhostPosition = useCallback((clientX: number, clientY: number) => {
    if (ghostRef.current) {
      ghostRef.current.style.left = `${clientX}px`;
      ghostRef.current.style.top = `${clientY}px`;
    }
  }, []);

  const removeGhostElement = useCallback(() => {
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
  }, []);

  const startDrag = useCallback((recipe: Recipe, clientX: number, clientY: number) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    setDraggedRecipe(recipe);
    setIsDragging(true);
    setDragPosition({ x: clientX, y: clientY });
    
    createGhostElement(recipe);
    updateGhostPosition(clientX, clientY);
    
    const slot = findSlotAtPoint(clientX, clientY);
    setOverSlotKey(slot ? `${slot.date}-${slot.mealType}` : null);
  }, [createGhostElement, updateGhostPosition, findSlotAtPoint]);

  const updateDragPosition = useCallback((clientX: number, clientY: number) => {
    pendingPositionRef.current = { x: clientX, y: clientY };
    
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null;
        
        const pos = pendingPositionRef.current;
        if (pos) {
          setDragPosition(pos);
          updateGhostPosition(pos.x, pos.y);
          
          const slot = findSlotAtPoint(pos.x, pos.y);
          const slotKey = slot ? `${slot.date}-${slot.mealType}` : null;
          setOverSlotKey((prev) => (prev !== slotKey ? slotKey : prev));
        }
      });
    }
  }, [updateGhostPosition, findSlotAtPoint]);

  const endDrag = useCallback((clientX: number, clientY: number) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    pendingPositionRef.current = null;
    
    const slot = findSlotAtPoint(clientX, clientY);
    
    if (slot && draggedRecipe && onDrop) {
      onDrop(slot.date, slot.mealType, draggedRecipe.id);
    }
    
    removeGhostElement();
    setIsDragging(false);
    setDraggedRecipe(null);
    setOverSlotKey(null);
  }, [findSlotAtPoint, draggedRecipe, onDrop, removeGhostElement]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      removeGhostElement();
    };
  }, [removeGhostElement]);

  return (
    <DragDropContext.Provider
      value={{
        isDragging,
        draggedRecipe,
        dragPosition,
        overSlotKey,
        startDrag,
        updateDragPosition,
        endDrag,
        registerSlot,
        unregisterSlot,
        onDrop,
        setOnDrop,
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
};

export const useDragDrop = (): DragDropContextType => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};
