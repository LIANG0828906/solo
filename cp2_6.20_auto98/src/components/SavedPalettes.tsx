import { Trash2, Download, Palette as PaletteIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { Palette } from '@/types';

const typeLabels: Record<Palette['type'], string> = {
  extracted: '提取色',
  monochromatic: '单色系',
  complementary: '互补色',
  triadic: '三角色',
};

export default function SavedPalettes() {
  const savedPalettes = useAppStore((s) => s.savedPalettes);
  const deleteSavedPalette = useAppStore((s) => s.deleteSavedPalette);
  const setExportModalOpen = useAppStore((s) => s.setExportModalOpen);
  const setExportPalette = useAppStore((s) => s.setExportPalette);

  const handleExport = (palette: Palette) => {
    setExportPalette(palette);
    setExportModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <PaletteIcon size={18} className="text-[var(--brand-color)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">已保存方案</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)]">
            {savedPalettes.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {savedPalettes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center mb-3">
              <PaletteIcon size={28} className="text-[var(--text-secondary)]/50" />
            </div>
            <p className="text-[var(--text-secondary)] text-sm">
              还没有保存的配色方案
            </p>
            <p className="text-[var(--text-secondary)]/70 text-xs mt-1">
              点击保存按钮将当前配色方案保存到这里
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedPalettes.map((palette) => (
              <div
                key={palette.id}
                className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]/50 hover:border-[var(--border-color)] transition-colors"
              >
                <div className="flex rounded-lg overflow-hidden h-12 mb-3">
                  {palette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex-1"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                  ))}
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {palette.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {typeLabels[palette.type]} · {dayjs(palette.createdAt).format('YYYY-MM-DD')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleExport(palette)}
                      className={cn(
                        'p-1.5 rounded-md transition-colors',
                        'text-[var(--text-secondary)] hover:text-[var(--brand-color)] hover:bg-[var(--bg-card)]'
                      )}
                      title="导出"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => deleteSavedPalette(palette.id)}
                      className={cn(
                        'p-1.5 rounded-md transition-colors',
                        'text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                      )}
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {palette.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {palette.tags.slice(0, 5).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand-color)]/10 text-[var(--brand-color)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {palette.tags.length > 5 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)]">
                        +{palette.tags.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
