import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModulePanel, { type BackgroundType } from './ModulePanel';
import ModuleItem from './ModuleItem';
import {
  useJournalStore,
  type JournalModule,
} from '@/store/useJournalStore';
import type { StickerType } from '@/types';
import { getStickerByType } from '@/utils/stickers';
import { compressImage } from '@/utils/imageCompress';

const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 800;

const BACKGROUND_MAP: Record<BackgroundType, string> = {
  lines: 'lines',
  dots: 'dots',
  grid: 'grid',
  none: 'none',
};

function getBackgroundStyle(
  type: BackgroundType,
  baseColor: string
): React.CSSProperties {
  switch (type) {
    case 'lines':
      return {
        backgroundColor: baseColor,
        backgroundImage:
          'repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(200, 200, 200, 0.5) 31px, rgba(200, 200, 200, 0.5) 32px)',
      };
    case 'dots':
      return {
        backgroundColor: baseColor,
        backgroundImage:
          'radial-gradient(rgba(200, 200, 200, 0.5) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      };
    case 'grid':
      return {
        backgroundColor: baseColor,
        backgroundImage:
          'linear-gradient(rgba(200, 200, 200, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.4) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      };
    case 'none':
    default:
      return { backgroundColor: baseColor };
  }
}

function getBgFromStoreValue(background: string): BackgroundType {
  if (background in BACKGROUND_MAP) {
    return background as BackgroundType;
  }
  return 'none';
}

export default function PageEditor() {
  const {
    present,
    addModule,
    updateModule,
    deleteModule,
    updatePageBackground,
    toggleBookmark,
  } = useJournalStore();

  const currentPage = present.pages.find((p) => p.id === present.currentPageId);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const background: BackgroundType = useMemo(() => {
    if (!currentPage) return 'none';
    return getBgFromStoreValue(currentPage.background);
  }, [currentPage]);

  const selectedModule = useMemo<JournalModule | null>(() => {
    if (!selectedModuleId || !currentPage) return null;
    return currentPage.modules.find((m) => m.id === selectedModuleId) ?? null;
  }, [selectedModuleId, currentPage]);

  const handleSelect = useCallback((id: string) => {
    setSelectedModuleId(id);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedModuleId(null);
    }
  }, []);

  const handleAddText = useCallback(() => {
    if (!currentPage) return;
    addModule(currentPage.id, {
      type: 'text',
      content: '在此输入文本...',
      x: 80,
      y: 100,
      width: 240,
      height: 120,
    });
  }, [currentPage, addModule]);

  const handleAddImage = useCallback(
    async (file: File) => {
      if (!currentPage) return;
      try {
        const compressedUrl = await compressImage(file);
        addModule(currentPage.id, {
          type: 'image',
          content: compressedUrl,
          x: 100,
          y: 100,
          width: 200,
          height: 200,
        });
      } catch (err) {
        console.error('图片处理失败:', err);
      }
    },
    [currentPage, addModule]
  );

  const handleAddSticker = useCallback(
    (stickerType: StickerType) => {
      if (!currentPage) return;
      const data = getStickerByType(stickerType);
      addModule(currentPage.id, {
        type: 'sticker',
        content: stickerType,
        x: 120,
        y: 120,
        width: data?.defaultWidth ?? 120,
        height: data?.defaultHeight ?? 120,
      });
    },
    [currentPage, addModule]
  );

  const handleBackgroundChange = useCallback(
    (bg: BackgroundType) => {
      if (!currentPage) return;
      updatePageBackground(currentPage.id, bg);
    },
    [currentPage, updatePageBackground]
  );

  const handleToggleBookmark = useCallback(() => {
    if (!currentPage) return;
    toggleBookmark(currentPage.id);
  }, [currentPage, toggleBookmark]);

  const handleUpdateModule = useCallback(
    (moduleId: string, updates: Partial<JournalModule>) => {
      if (!currentPage) return;
      updateModule(currentPage.id, moduleId, updates);
    },
    [currentPage, updateModule]
  );

  const handleDeleteModule = useCallback(() => {
    if (!currentPage || !selectedModuleId) return;
    deleteModule(currentPage.id, selectedModuleId);
    setSelectedModuleId(null);
  }, [currentPage, selectedModuleId, deleteModule]);

  const handleFontSizeChange = useCallback(
    (value: number) => {
      if (!selectedModuleId) return;
      handleUpdateModule(selectedModuleId, {
        fontSize: value,
      } as Partial<JournalModule>);
    },
    [selectedModuleId, handleUpdateModule]
  );

  const handleColorChange = useCallback(
    (value: string) => {
      if (!selectedModuleId) return;
      handleUpdateModule(selectedModuleId, {
        color: value,
      } as Partial<JournalModule>);
    },
    [selectedModuleId, handleUpdateModule]
  );

  const handleLineHeightChange = useCallback(
    (value: number) => {
      if (!selectedModuleId) return;
      handleUpdateModule(selectedModuleId, {
        lineHeight: value,
      } as Partial<JournalModule>);
    },
    [selectedModuleId, handleUpdateModule]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedModuleId) {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        handleDeleteModule();
      }
    },
    [selectedModuleId, handleDeleteModule]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectedFontSize =
    (selectedModule as unknown as { fontSize?: number })?.fontSize ?? 16;
  const selectedColor =
    (selectedModule as unknown as { color?: string })?.color ?? '#5D4E37';
  const selectedLineHeight =
    (selectedModule as unknown as { lineHeight?: number })?.lineHeight ?? 1.6;

  const bgStyle = getBackgroundStyle(background, '#FFFEF7');

  if (!currentPage) {
    return <div>无页面</div>;
  }

  return (
    <div className="flex h-full w-full gap-4 p-4">
      <ModulePanel
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onAddSticker={handleAddSticker}
        background={background}
        onBackgroundChange={handleBackgroundChange}
        bookmarked={currentPage.bookmarked}
        onToggleBookmark={handleToggleBookmark}
      />

      <div className="flex flex-1 items-start justify-center overflow-auto">
        <div
          ref={canvasRef}
          id={`page-${currentPage.id}`}
          className="relative overflow-hidden rounded-lg shadow-lg"
          style={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            ...bgStyle,
          }}
          onClick={handleCanvasClick}
        >
          {currentPage.bookmarked && (
            <div
              className="bookmark"
              style={{ right: 40 }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBookmark();
              }}
            />
          )}

          {currentPage.modules.map((module) => (
            <ModuleItem
              key={module.id}
              module={module}
              selected={selectedModuleId === module.id}
              onSelect={() => handleSelect(module.id)}
              onUpdate={(updates) => handleUpdateModule(module.id, updates)}
            />
          ))}
        </div>
      </div>

      <aside className="flex w-60 flex-col gap-4 rounded-lg bg-[#FFF8E1] p-4 shadow-md">
        <h3 className="text-sm font-bold text-[#5D4E37]">属性</h3>

        {selectedModule ? (
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1 text-xs text-[#8B7D6B]">类型</div>
              <div className="rounded bg-white px-2 py-1 text-sm capitalize">
                {selectedModule.type === 'text'
                  ? '文本'
                  : selectedModule.type === 'image'
                  ? '图片'
                  : selectedModule.type === 'sticker'
                  ? '贴纸'
                  : selectedModule.type}
              </div>
            </div>

            {selectedModule.type === 'text' && (
              <>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-[#8B7D6B]">
                    <span>字体大小</span>
                    <span>{selectedFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={48}
                    value={selectedFontSize}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    className="w-full accent-[#81C784]"
                  />
                </div>

                <div>
                  <div className="mb-1 text-xs text-[#8B7D6B]">颜色</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border border-[#E8DCC8] bg-white"
                    />
                    <span className="text-xs text-[#5D4E37]">{selectedColor}</span>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-[#8B7D6B]">
                    <span>行间距</span>
                    <span>{selectedLineHeight.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={selectedLineHeight}
                    onChange={(e) =>
                      handleLineHeightChange(Number(e.target.value))
                    }
                    className="w-full accent-[#81C784]"
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleDeleteModule}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm shadow-sm transition-all active:scale-95',
                'bg-[#E57373] text-white hover:bg-[#EF5350]'
              )}
            >
              <Trash2 className="h-4 w-4" />
              删除模块
            </button>
          </div>
        ) : (
          <div className="text-xs text-[#8B7D6B]">
            请选择一个模块以编辑其属性
          </div>
        )}
      </aside>
    </div>
  );
}
