import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import type { CanvasElement as CE, ColorTheme } from '@/types';
import { CanvasElement, CANVAS_W, CANVAS_H } from './CanvasElement';

export function Canvas() {
  const {
    elements,
    selectedId,
    canvasBackground,
    getCurrentTheme,
    selectElement,
    updateElement,
    updateSelectedTextContent,
    deleteSelected,
    duplicateSelected,
    addImageElement,
  } = useEditorStore();

  const [scale, setScale] = useState(0.4);
  const outerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const theme: ColorTheme = getCurrentTheme();

  const computeScale = useCallback(() => {
    const maxHeight = window.innerHeight - 80;
    const maxWidth = window.innerWidth - 72 - 380;
    const scaleByH = maxHeight / CANVAS_H;
    const scaleByW = maxWidth / CANVAS_W;
    const s = Math.min(scaleByH, scaleByW, 1);
    setScale(Math.max(s, 0.1));
  }, []);

  useEffect(() => {
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [computeScale]);

  const handleCanvasClick = useCallback(() => {
    selectElement(null);
  }, [selectElement]);

  const handleSelect = useCallback(
    (id: string) => {
      selectElement(id);
    },
    [selectElement]
  );

  const handleUpdate = useCallback(
    (id: string, patch: Partial<CE>) => {
      updateElement(id, patch);
    },
    [updateElement]
  );

  const handleTextEdit = useCallback(
    (content: string) => {
      updateSelectedTextContent(content);
    },
    [updateSelectedTextContent]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) addImageElement(src);
      };
      reader.readAsDataURL(file);
    },
    [addImageElement]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteSelected, duplicateSelected]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          handleFile(file);
          break;
        }
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('paste', handlePaste);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
    };
  }, [handleFile]);

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={outerRef}
      className="flex-1 flex items-center justify-center overflow-auto p-4"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.04) 50%, rgba(241,245,249,1) 100%)',
      }}
    >
      <div
        className="relative shadow-2xl"
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
          transformOrigin: 'center center',
          boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.25)',
        }}
      >
        <div
          id="canvas-inner-container"
          onClick={handleCanvasClick}
          className="relative overflow-hidden"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            background: canvasBackground,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {sortedElements.map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              isSelected={el.id === selectedId}
              theme={theme}
              onSelect={handleSelect}
              onUpdate={handleUpdate}
              onTextEdit={handleTextEdit}
            />
          ))}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
