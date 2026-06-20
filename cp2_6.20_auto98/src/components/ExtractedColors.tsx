import { useState } from 'react';
import { Copy, Check, Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { getContrastColor } from '@/utils/colorUtils';
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
      <div className="flex items-center gap-2 mb-3">
        <Pipette size={16} className="text-[var(--brand-color)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">提取色彩</h3>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-3">
        {extractedColors.map((color, index) => (
          <button
            key={index}
            onClick={() => handleCopy(color, index)}
            className={cn(
              'aspect-square rounded-lg relative overflow-hidden transition-transform hover:scale-105',
              copiedIndex === index && 'ring-2 ring-[var(--brand-color)] ring-offset-2 ring-offset-[var(--bg-card)]'
            )}
            style={{ backgroundColor: color.hex }}
            title={`${color.hex.toUpperCase()} - ${Math.round(color.frequency * 100)}%`}
          >
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center transition-opacity',
                copiedIndex === index ? 'opacity-100' : 'opacity-0 hover:opacity-100'
              )}
            >
              {copiedIndex === index ? (
                <Check size={14} style={{ color: getContrastColor(color.hex) }} />
              ) : (
                <Copy size={14} style={{ color: getContrastColor(color.hex) }} />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {extractedColors.map((color, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs"
          >
            <div
              className="w-5 h-5 rounded border border-[var(--border-color)] flex-shrink-0"
              style={{ backgroundColor: color.hex }}
            />
            <span className="font-mono text-[var(--text-secondary)] flex-1">
              {color.hex.toUpperCase()}
            </span>
            <span className="text-[var(--text-secondary)]/70">
              {Math.round(color.frequency * 100)}%
            </span>
            <button
              onClick={() => handleCopy(color, index)}
              className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
