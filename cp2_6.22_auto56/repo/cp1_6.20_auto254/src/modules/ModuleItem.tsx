import { useEffect, useRef, useState, useCallback } from 'react';
import { Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStickerByType } from '@/utils/stickers';
import type { JournalModule } from '@/store/useJournalStore';

type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

interface ModuleItemProps {
  module: JournalModule;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<JournalModule>) => void;
  onDelete?: () => void;
}

const HANDLE_SIZE = 12;

const RESIZE_HANDLES: Array<{
  position: ResizeHandle;
  style: React.CSSProperties;
  cursor: string;
}> = [
  { position: 'nw', style: { top: -6, left: -6 }, cursor: 'nwse-resize' },
  { position: 'n', style: { top: -6, left: '50%', marginLeft: -6 }, cursor: 'ns-resize' },
  { position: 'ne', style: { top: -6, right: -6 }, cursor: 'nesw-resize' },
  { position: 'e', style: { top: '50%', right: -6, marginTop: -6 }, cursor: 'ew-resize' },
  { position: 'se', style: { bottom: -6, right: -6 }, cursor: 'nwse-resize' },
  { position: 's', style: { bottom: -6, left: '50%', marginLeft: -6 }, cursor: 'ns-resize' },
  { position: 'sw', style: { bottom: -6, left: -6 }, cursor: 'nesw-resize' },
  { position: 'w', style: { top: '50%', left: -6, marginTop: -6 }, cursor: 'ew-resize' },
];

export default function ModuleItem({
  module,
  selected,
  onSelect,
  onUpdate,
}: ModuleItemProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<ResizeHandle | null>(null);
  const [charCount, setCharCount] = useState(module.content.length);

  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    startModuleX: 0,
    startModuleY: 0,
    currentX: 0,
    currentY: 0,
    rafId: 0,
  });

  const resizeStateRef = useRef({
    startX: 0,
    startY: 0,
    startModuleX: 0,
    startModuleY: 0,
    startWidth: 0,
    startHeight: 0,
    handle: null as ResizeHandle | null,
    currentWidth: 0,
    currentHeight: 0,
    currentX: 0,
    currentY: 0,
    rafId: 0,
  });

  const textRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyDragTransform = useCallback(() => {
    if (!elementRef.current) return;
    const { currentX, currentY } = dragStateRef.current;
    elementRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    dragStateRef.current.rafId = 0;
  }, []);

  const applyResizeTransform = useCallback(() => {
    if (!elementRef.current) return;
    const { currentX, currentY, currentWidth, currentHeight } = resizeStateRef.current;
    elementRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    elementRef.current.style.width = `${currentWidth}px`;
    elementRef.current.style.height = `${currentHeight}px`;
    resizeStateRef.current.rafId = 0;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (resizing) return;
      e.preventDefault();
      e.stopPropagation();
      onSelect();

      const state = dragStateRef.current;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.startModuleX = module.x;
      state.startModuleY = module.y;
      state.currentX = module.x;
      state.currentY = module.y;

      setDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - state.startX;
        const dy = moveEvent.clientY - state.startY;
        state.currentX = state.startModuleX + dx;
        state.currentY = state.startModuleY + dy;

        if (!state.rafId) {
          state.rafId = requestAnimationFrame(applyDragTransform);
        }
      };

      const handleMouseUp = () => {
        if (state.rafId) {
          cancelAnimationFrame(state.rafId);
          state.rafId = 0;
        }
        onUpdate({
          x: state.currentX,
          y: state.currentY,
        });
        setDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [module.x, module.y, onSelect, onUpdate, resizing, applyDragTransform]
  );

  const handleResizeStart = useCallback(
    (handle: ResizeHandle, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect();

      const state = resizeStateRef.current;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.startModuleX = module.x;
      state.startModuleY = module.y;
      state.startWidth = module.width;
      state.startHeight = module.height;
      state.handle = handle;
      state.currentWidth = module.width;
      state.currentHeight = module.height;
      state.currentX = module.x;
      state.currentY = module.y;

      setResizing(handle);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - state.startX;
        const dy = moveEvent.clientY - state.startY;

        let newWidth = state.startWidth;
        let newHeight = state.startHeight;
        let newX = state.startModuleX;
        let newY = state.startModuleY;

        const aspectRatio = state.startWidth / state.startHeight;

        switch (handle) {
          case 'se':
            newWidth = Math.max(40, state.startWidth + dx);
            newHeight = Math.max(40, state.startHeight + dy);
            if (module.type === 'image' || module.type === 'sticker') {
              newHeight = newWidth / aspectRatio;
            }
            break;
          case 'nw':
            newWidth = Math.max(40, state.startWidth - dx);
            newHeight = Math.max(40, state.startHeight - dy);
            if (module.type === 'image' || module.type === 'sticker') {
              newHeight = newWidth / aspectRatio;
              newX = state.startModuleX + (state.startWidth - newWidth);
              newY = state.startModuleY + (state.startHeight - newHeight);
            } else {
              newX = state.startModuleX + (state.startWidth - newWidth);
              newY = state.startModuleY + (state.startHeight - newHeight);
            }
            break;
          case 'ne':
            newWidth = Math.max(40, state.startWidth + dx);
            newHeight = Math.max(40, state.startHeight - dy);
            if (module.type === 'image' || module.type === 'sticker') {
              newHeight = newWidth / aspectRatio;
              newY = state.startModuleY + (state.startHeight - newHeight);
            } else {
              newY = state.startModuleY + (state.startHeight - newHeight);
            }
            break;
          case 'sw':
            newWidth = Math.max(40, state.startWidth - dx);
            newHeight = Math.max(40, state.startHeight + dy);
            if (module.type === 'image' || module.type === 'sticker') {
              newHeight = newWidth / aspectRatio;
              newX = state.startModuleX + (state.startWidth - newWidth);
            } else {
              newX = state.startModuleX + (state.startWidth - newWidth);
            }
            break;
          case 'n':
            newHeight = Math.max(40, state.startHeight - dy);
            if (module.type === 'image' || module.type === 'sticker') {
              newWidth = newHeight * aspectRatio;
              newX = state.startModuleX + (state.startWidth - newWidth) / 2;
            }
            newY = state.startModuleY + (state.startHeight - newHeight);
            break;
          case 's':
            newHeight = Math.max(40, state.startHeight + dy);
            if (module.type === 'image' || module.type === 'sticker') {
              newWidth = newHeight * aspectRatio;
              newX = state.startModuleX + (state.startWidth - newWidth) / 2;
            }
            break;
          case 'e':
            newWidth = Math.max(40, state.startWidth + dx);
            if (module.type === 'image' || module.type === 'sticker') {
              newHeight = newWidth / aspectRatio;
              newY = state.startModuleY + (state.startHeight - newHeight) / 2;
            }
            break;
          case 'w':
            newWidth = Math.max(40, state.startWidth - dx);
            if (module.type === 'image' || module.type === 'sticker') {
              newHeight = newWidth / aspectRatio;
              newY = state.startModuleY + (state.startHeight - newHeight) / 2;
            }
            newX = state.startModuleX + (state.startWidth - newWidth);
            break;
        }

        state.currentWidth = newWidth;
        state.currentHeight = newHeight;
        state.currentX = newX;
        state.currentY = newY;

        if (!state.rafId) {
          state.rafId = requestAnimationFrame(applyResizeTransform);
        }
      };

      const handleMouseUp = () => {
        if (state.rafId) {
          cancelAnimationFrame(state.rafId);
          state.rafId = 0;
        }
        onUpdate({
          x: state.currentX,
          y: state.currentY,
          width: state.currentWidth,
          height: state.currentHeight,
        });
        setResizing(null);
        state.handle = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [module, onSelect, onUpdate, applyResizeTransform]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (resizing) return;
      if (e.touches.length !== 1) return;
      e.stopPropagation();
      onSelect();

      const touch = e.touches[0];
      const state = dragStateRef.current;
      state.startX = touch.clientX;
      state.startY = touch.clientY;
      state.startModuleX = module.x;
      state.startModuleY = module.y;
      state.currentX = module.x;
      state.currentY = module.y;

      setDragging(true);

      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length !== 1) return;
        const t = moveEvent.touches[0];
        const dx = t.clientX - state.startX;
        const dy = t.clientY - state.startY;
        state.currentX = state.startModuleX + dx;
        state.currentY = state.startModuleY + dy;

        if (!state.rafId) {
          state.rafId = requestAnimationFrame(applyDragTransform);
        }
      };

      const handleTouchEnd = () => {
        if (state.rafId) {
          cancelAnimationFrame(state.rafId);
          state.rafId = 0;
        }
        onUpdate({
          x: state.currentX,
          y: state.currentY,
        });
        setDragging(false);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };

      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    },
    [module.x, module.y, onSelect, onUpdate, resizing, applyDragTransform]
  );

  const handleTextInput = useCallback(() => {
    if (textRef.current) {
      const text = textRef.current.innerText;
      setCharCount(text.length);
      onUpdate({ content: text });
    }
  }, [onUpdate]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        onUpdate({ content: url });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const dragState = dragStateRef.current;
    const resizeState = resizeStateRef.current;
    return () => {
      if (dragState.rafId) {
        cancelAnimationFrame(dragState.rafId);
      }
      if (resizeState.rafId) {
        cancelAnimationFrame(resizeState.rafId);
      }
    };
  }, []);

  const fontSize = (module as unknown as { fontSize?: number }).fontSize ?? 16;
  const color = (module as unknown as { color?: string }).color ?? '#5D4E37';
  const lineHeight = (module as unknown as { lineHeight?: number }).lineHeight ?? 1.6;

  const stickerData =
    module.type === 'sticker' ? getStickerByType(module.content as never) : null;

  const renderContent = () => {
    switch (module.type) {
      case 'text':
        return (
          <div className="relative flex h-full w-full flex-col">
            <div
              ref={textRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleTextInput}
              className="h-full w-full flex-1 overflow-auto p-2 outline-none"
              style={{
                fontSize: `${fontSize}px`,
                color,
                lineHeight,
                fontFamily: 'var(--font-hand)',
              }}
            />
            <div className="absolute bottom-1 right-2 text-[10px] text-[#8B7D6B] opacity-70">
              {charCount} 字
            </div>
          </div>
        );
      case 'image':
        return (
          <div
            className="relative h-full w-full cursor-pointer overflow-hidden rounded"
            onClick={handleImageClick}
          >
            {module.content ? (
              <img
                src={module.content}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F5F0E6] text-[#8B7D6B]">
                <Image className="h-8 w-8" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        );
      case 'sticker':
        return (
          <div
            className="h-full w-full"
            dangerouslySetInnerHTML={{ __html: stickerData?.svg ?? '' }}
          />
        );
      default:
        return <div>{module.content}</div>;
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        'absolute select-none',
        dragging && 'opacity-80',
        selected && 'z-50'
      )}
      style={{
        left: 0,
        top: 0,
        width: module.width,
        height: module.height,
        transform: `translate3d(${module.x}px, ${module.y}px, 0)`,
        willChange: dragging || resizing ? 'transform, width, height' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className={cn(
          'h-full w-full rounded',
          module.type === 'text' && 'bg-white/60',
          selected && 'ring-2 ring-dashed ring-[#2196F3]'
        )}
      >
        {renderContent()}
      </div>

      {selected &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle.position}
            className="absolute z-10 rounded-[8px] bg-white border-2 border-[#2196F3]"
            style={{
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              cursor: handle.cursor,
              ...handle.style,
            }}
            onMouseDown={(e) => handleResizeStart(handle.position, e)}
          />
        ))}
    </div>
  );
}
