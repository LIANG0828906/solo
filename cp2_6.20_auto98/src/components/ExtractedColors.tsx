import { useState } from 'react';
import { Copy, Check, Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { getContrastColor } from '@/utils/colorUtils';
import ColorCard from './ColorCard';
import type { Color } from '@/types';

export default function ExtractedColors() {
  const extractedColors = useAppStore((s) => s.extractedColors);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (color: Color, index: number) => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      console.error('Failed to copy');
    }
  };

  if (extractedColors.length === 0) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow)] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Pipette size={16} className="text-[var(--brand-color)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">提取色彩</h3>
      </div>

      <div className="grid grid-cols-5 gap-1 mb-4">
        {extractedColors.map((color, index) => (
          <div
            key={index}
            className={cn(
              'relative rounded-lg overflow-hidden transition-all',
              copiedIndex === index && 'ring-2 ring-[var(--brand-color)] ring-offset-1 ring-offset-[var(--bg-card)]'
            )}
          >
            <ColorCard
              color={color}
              size="sm"
              showHSLBar
              compact
              onClick={() => handleCopy(color, index)}
            />
            {copiedIndex === index && (
              <div className="absolute inset-0 flex items-start justify-start pointer-events-none p-1">
                <div className="w-4 h-4 rounded-full bg-[var(--brand-color)] flex items-center justify-center shadow">
                  <Check size={10} className="text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1.5 pt-1 border-t border-[var(--border-color)]">
        {extractedColors.map((color, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs py-1 rounded-md hover:bg-[var(--bg-primary)] px-1 transition-colors"
          >
            <div
              className="w-5 h-5 rounded border border-[var(--border-color)] flex-shrink-0 shadow-sm"
              style={{ backgroundColor: color.hex }}
            />
            <span className="font-mono text-[var(--text-primary)] flex-1 text-[11px]">
              {color.hex.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]/80 tabular-nums">
              H{color.hsl.h}°
            </span>
            <span
              className="text-[10px] font-semibold text-[var(--text-secondary)] tabular-nums min-w-[30px] text-right"
              style={{ color: color.hsl.l > 50 ? undefined : undefined }}
            >
              {Math.round(color.frequency * 100)}%
            </span>
            <button
              onClick={() => handleCopy(color, index)}
              className="p-1 rounded hover:bg-[var(--brand-color)]/10 text-[var(--text-secondary)] hover:text-[var(--brand-color)] transition-colors"
              title="复制HEX"
            >
              {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
