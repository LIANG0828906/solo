import { useRef } from 'react';
import {
  Type,
  Image,
  Bookmark,
  BookmarkPlus,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STICKER_LIST, getStickerByType } from '@/utils/stickers';
import type { StickerType } from '@/types';

export type BackgroundType = 'lines' | 'dots' | 'grid' | 'none';

interface ModulePanelProps {
  onAddText: () => void;
  onAddImage: (file: File) => void;
  onAddSticker: (stickerType: StickerType) => void;
  background: BackgroundType;
  onBackgroundChange: (bg: BackgroundType) => void;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  className?: string;
}

const BACKGROUND_OPTIONS: Array<{ type: BackgroundType; label: string }> = [
  { type: 'lines', label: '横线' },
  { type: 'dots', label: '点阵' },
  { type: 'grid', label: '方格' },
  { type: 'none', label: '空白' },
];

export default function ModulePanel({
  onAddText,
  onAddImage,
  onAddSticker,
  background,
  onBackgroundChange,
  bookmarked,
  onToggleBookmark,
  className,
}: ModulePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStickerClick = (stickerType: StickerType) => {
    onAddSticker(stickerType);
  };

  return (
    <aside
      className={cn(
        'flex w-60 flex-col gap-4 rounded-lg bg-[#FFF8E1] p-4 shadow-md',
        className
      )}
    >
      <section>
        <h3 className="mb-3 text-sm font-bold text-[#5D4E37]">添加模块</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAddText}
            className="flex flex-col items-center gap-1 rounded-lg bg-[#81C784] px-3 py-3 text-white shadow-sm transition-all hover:bg-[#66BB6A] active:scale-95"
          >
            <Type className="h-5 w-5" />
            <span className="text-xs">文本框</span>
          </button>
          <button
            type="button"
            onClick={handleImageClick}
            className="flex flex-col items-center gap-1 rounded-lg bg-[#81C784] px-3 py-3 text-white shadow-sm transition-all hover:bg-[#66BB6A] active:scale-95"
          >
            <Image className="h-5 w-5" />
            <span className="text-xs">图片框</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-1 text-sm font-bold text-[#5D4E37]">
          <StickyNote className="h-4 w-4" />
          贴纸
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {STICKER_LIST.map((sticker) => {
            const data = getStickerByType(sticker.type);
            return (
              <button
                key={sticker.type}
                type="button"
                onClick={() => handleStickerClick(sticker.type)}
                className="flex aspect-square items-center justify-center rounded-md border border-[#E8DCC8] bg-white p-1 transition-all hover:border-[#81C784] hover:shadow-sm active:scale-95"
                title={sticker.name}
              >
                <div
                  className="h-full w-full"
                  dangerouslySetInnerHTML={{ __html: data?.svg ?? '' }}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold text-[#5D4E37]">背景</h3>
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUND_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => onBackgroundChange(opt.type)}
              className={cn(
                'rounded-md px-2 py-2 text-xs transition-all',
                background === opt.type
                  ? 'bg-[#81C784] text-white shadow-sm'
                  : 'bg-white text-[#5D4E37] border border-[#E8DCC8] hover:border-[#81C784]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold text-[#5D4E37]">书签</h3>
        <button
          type="button"
          onClick={onToggleBookmark}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm shadow-sm transition-all active:scale-95',
            bookmarked
              ? 'bg-[#E57373] text-white hover:bg-[#EF5350]'
              : 'bg-[#81C784] text-white hover:bg-[#66BB6A]'
          )}
        >
          {bookmarked ? (
            <>
              <Bookmark className="h-4 w-4 fill-current" />
              取消书签
            </>
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4" />
              添加书签
            </>
          )}
        </button>
      </section>
    </aside>
  );
}
