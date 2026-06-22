import { useState } from 'react';
import { Copy, Check, Save, Download, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { getContrastColor } from '@/utils/colorUtils';
import type { Color } from '@/types';

type PaletteTypeKey = 'extracted' | 'monochromatic' | 'complementary' | 'triadic';

const paletteLabels: Record<PaletteTypeKey, string> = {
  extracted: '提取色',
  monochromatic: '单色系',
  complementary: '互补色',
  triadic: '三角色',
};

export default function PalettePanel() {
  const palettes = useAppStore((s) => s.palettes);
  const activePaletteType = useAppStore((s) => s.activePaletteType);
  const setActivePaletteType = useAppStore((s) => s.setActivePaletteType);
  const savePalette = useAppStore((s) => s.savePalette);
  const setExportModalOpen = useAppStore((s) => s.setExportModalOpen);
  const setExportPalette = useAppStore((s) => s.setExportPalette);

  const { isDark, toggleTheme } = useTheme();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const colors = palettes[activePaletteType];

  const handleCopyColor = async (color: Color, index: number) => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      console.error('Failed to copy');
    }
  };

  const handleSave = () => {
    if (colors.length === 0) return;
    const nameInput = prompt('请输入配色方案名称：', `我的配色 ${paletteLabels[activePaletteType]}`);
    if (!nameInput) return;
    const tagsInput = prompt('请输入标签（用逗号分隔）：', '');
    const tags = tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [];
    savePalette(nameInput, tags);
  };

  const handleExport = () => {
    if (colors.length === 0) return;
    setExportPalette({
      id: 'temp',
      name: `导出 - ${paletteLabels[activePaletteType]}`,
      colors,
      type: activePaletteType,
      tags: [],
      createdAt: Date.now(),
    });
    setExportModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow)] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">配色方案</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title={isDark ? '切换浅色模式' : '切换深色模式'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={handleSave}
            disabled={colors.length === 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              colors.length === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-[var(--brand-color)] text-white hover:opacity-90'
            )}
          >
            <Save size={16} />
            保存
          </button>
          <button
            onClick={handleExport}
            disabled={colors.length === 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
              colors.length === 0
                ? 'border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                : 'border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
            )}
          >
            <Download size={16} />
            导出
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-6 py-3 border-b border-[var(--border-color)]">
        {(Object.keys(paletteLabels) as PaletteTypeKey[]).map((type) => (
          <button
            key={type}
            onClick={() => setActivePaletteType(type)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activePaletteType === type
                ? 'bg-[var(--brand-color)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
            )}
          >
            {paletteLabels[type]}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {colors.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center mb-4">
              <span className="text-4xl">🎨</span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">
              上传图片后将自动提取颜色<br />并生成多种配色方案
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex rounded-xl overflow-hidden h-40 shadow-sm">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="flex-1 relative group cursor-pointer"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleCopyColor(color, index)}
                >
                  <div
                    className={cn(
                      'absolute inset-0 flex items-end justify-center pb-3 transition-opacity',
                      copiedIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}
                  >
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        color: getContrastColor(color.hex),
                      }}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check size={12} />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          {color.hex.toUpperCase()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-primary)]"
                >
                  <div
                    className="w-12 h-12 rounded-lg shadow-sm flex-shrink-0 border border-[var(--border-color)]"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                        {color.hex.toUpperCase()}
                      </span>
                      {color.frequency > 0 && (
                        <span className="text-xs text-[var(--text-secondary)]">
                          {Math.round(color.frequency * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] font-mono">
                      RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b}) · HSL({color.hsl.h}°,{' '}
                      {color.hsl.s}%, {color.hsl.l}%)
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyColor(color, index)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
