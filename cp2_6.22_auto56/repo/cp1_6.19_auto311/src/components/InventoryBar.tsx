import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '../gameStore';
import { playSound } from '../utils/sound';
import type { ItemType, DoorColor } from '../types';
import { cn } from '../lib/utils';

const itemIcons: Record<ItemType, string> = {
  'key-red': '🔴',
  'key-blue': '🔵',
  'key-green': '🟢',
  'rune-1': '🔮',
  'rune-2': '✨',
};

const itemInfo: Record<ItemType, { name: string; description: string }> = {
  'key-red': { name: '红色钥匙', description: '用于打开红色的门' },
  'key-blue': { name: '蓝色钥匙', description: '用于打开蓝色的门' },
  'key-green': { name: '绿色钥匙', description: '用于打开绿色的门' },
  'rune-1': { name: '符文石·日', description: '将两块符文石拖到祭坛合成' },
  'rune-2': { name: '符文石·月', description: '将两块符文石拖到祭坛合成' },
};

const keyToDoorColor: Record<string, DoorColor> = {
  'key-red': 'red',
  'key-blue': 'blue',
  'key-green': 'green',
};

interface HoveredItem {
  type: ItemType;
  x: number;
  y: number;
}

export default function InventoryBar() {
  const inventory = useGameStore((state) => state.inventory);
  const draggingItem = useGameStore((state) => state.draggingItem);
  const dragPosition = useGameStore((state) => state.dragPosition);
  const altarVisible = useGameStore((state) => state.altarVisible);
  const unlockedDoors = useGameStore((state) => state.unlockedDoors);
  const doors = useGameStore((state) => state.doors);

  const setDraggingItem = useGameStore((state) => state.setDraggingItem);
  const setDragPosition = useGameStore((state) => state.setDragPosition);
  const unlockDoor = useGameStore((state) => state.unlockDoor);
  const synthesizeRune = useGameStore((state) => state.synthesizeRune);

  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);
  const [dragRotation, setDragRotation] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationId: number;
    if (draggingItem) {
      const animate = () => {
        setDragRotation((prev) => (prev + 2) % 360);
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    } else {
      setDragRotation(0);
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [draggingItem]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, itemType: ItemType) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDraggingItem(itemType, { x: e.clientX, y: e.clientY });
    },
    [setDraggingItem]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingItem) return;
      setDragPosition({ x: e.clientX, y: e.clientY });
    },
    [draggingItem, setDragPosition]
  );

  const handlePointerUp = useCallback(() => {
    if (!draggingItem || !dragPosition) {
      setDraggingItem(null);
      return;
    }

    let success = false;

    if (draggingItem.startsWith('key-')) {
      const doorColor = keyToDoorColor[draggingItem];
      if (doorColor && !unlockedDoors.includes(doorColor)) {
        const door = doors.find((d) => d.color === doorColor);
        if (door) {
          const doorElement = document.querySelector(`[data-door="${doorColor}"]`);
          if (doorElement) {
            const rect = doorElement.getBoundingClientRect();
            if (
              dragPosition.x >= rect.left &&
              dragPosition.x <= rect.right &&
              dragPosition.y >= rect.top &&
              dragPosition.y <= rect.bottom
            ) {
              success = unlockDoor(doorColor, draggingItem);
            }
          }
        }
      }
    } else if (draggingItem.startsWith('rune-') && altarVisible) {
      const altarElement = document.querySelector('[data-altar="true"]');
      if (altarElement) {
        const rect = altarElement.getBoundingClientRect();
        if (
          dragPosition.x >= rect.left &&
          dragPosition.x <= rect.right &&
          dragPosition.y >= rect.top &&
          dragPosition.y <= rect.bottom
        ) {
          success = synthesizeRune();
        }
      }
    }

    if (!success && draggingItem) {
      playSound('error');
    }

    setDraggingItem(null);
    setDragPosition(null);
  }, [draggingItem, dragPosition, unlockedDoors, doors, altarVisible, unlockDoor, synthesizeRune, setDraggingItem, setDragPosition]);

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent, itemType: ItemType) => {
      if (draggingItem) return;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setHoveredItem({
        type: itemType,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    [draggingItem]
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredItem(null);
  }, []);

  return (
    <>
      <div
        ref={barRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 glass-panel',
          'flex items-center justify-center gap-4 px-6 py-4',
          'border-t border-b-0 rounded-none rounded-t-xl',
          'min-h-[100px]'
        )}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {inventory.length === 0 ? (
          <p className="text-gray-400 text-lg font-medium tracking-wide">
            Collect items to use them...
          </p>
        ) : (
          <div className="flex items-center gap-4">
            {inventory.map((itemType, index) => {
              const isDragging = draggingItem === itemType;
              return (
                <div
                  key={`${itemType}-${index}`}
                  className={cn(
                    'item-hover relative flex items-center justify-center',
                    'w-14 h-14 rounded-xl glass-panel',
                    'text-3xl select-none',
                    isDragging && 'opacity-0 pointer-events-none'
                  )}
                  style={{
                    transition: 'all 0.2s ease-out',
                  }}
                  onPointerDown={(e) => handlePointerDown(e, itemType)}
                  onPointerEnter={(e) => handlePointerEnter(e, itemType)}
                  onPointerLeave={handlePointerLeave}
                >
                  <span className="drop-shadow-lg">{itemIcons[itemType]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hoveredItem && (
        <div
          className="fixed z-50 pointer-events-none glass-panel px-4 py-3 rounded-lg"
          style={{
            left: hoveredItem.x,
            top: hoveredItem.y - 16,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-white font-semibold text-sm mb-1">
            {itemInfo[hoveredItem.type].name}
          </p>
          <p className="text-gray-300 text-xs">
            {itemInfo[hoveredItem.type].description}
          </p>
        </div>
      )}

      {draggingItem && dragPosition && (
        <div
          className="fixed z-[1000] pointer-events-none flex items-center justify-center"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            transform: `translate(-50%, -50%) rotate(${dragRotation}deg)`,
          }}
        >
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl"
            style={{
              background: 'rgba(15, 52, 96, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
            }}
          >
            {itemIcons[draggingItem]}
          </div>
        </div>
      )}
    </>
  );
}
