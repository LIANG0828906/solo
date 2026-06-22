import { useBouquetStore } from '@/modules/store/useBouquetStore';
import { WRAPPING_OPTIONS, RIBBON_OPTIONS } from '@/data/flowers';
import type { WrappingStyle, RibbonColor } from '@/types';

export default function WrappingPicker() {
  const wrappingStyle = useBouquetStore((s) => s.wrappingStyle);
  const ribbonColor = useBouquetStore((s) => s.ribbonColor);
  const setWrappingStyle = useBouquetStore((s) => s.setWrappingStyle);
  const setRibbonColor = useBouquetStore((s) => s.setRibbonColor);

  return (
    <div className="space-y-5">
      <h3
        className="text-lg font-semibold"
        style={{ fontFamily: 'Georgia, serif', color: '#2E4A2E' }}
      >
        🎁 包装定制
      </h3>

      <div className="space-y-2">
        <label
          className="text-sm font-medium block"
          style={{ color: '#5A5A4A' }}
        >
          包装纸
        </label>
        <div className="flex gap-2 flex-wrap">
          {WRAPPING_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setWrappingStyle(opt.id as WrappingStyle)}
              className="relative group transition-all duration-200 ease-in-out"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${opt.color}, ${opt.secondaryColor})`,
                border:
                  wrappingStyle === opt.id
                    ? '3px solid #D4AF37'
                    : '2px solid #E0E0D0',
                boxShadow:
                  wrappingStyle === opt.id
                    ? '0 2px 8px rgba(212,175,55,0.3)'
                    : '0 1px 2px rgba(0,0,0,0.08)',
                transform: wrappingStyle === opt.id ? 'scale(1.08)' : 'scale(1)',
              }}
              title={opt.name}
            >
              {wrappingStyle === opt.id && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: '#D4AF37' }}
                >
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#8B8B7A' }}>
          已选: {WRAPPING_OPTIONS.find((o) => o.id === wrappingStyle)?.name}
        </p>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium block"
          style={{ color: '#5A5A4A' }}
        >
          丝带
        </label>
        <div className="flex gap-2 flex-wrap">
          {RIBBON_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRibbonColor(opt.id as RibbonColor)}
              className="relative group transition-all duration-200 ease-in-out"
              style={{
                width: '52px',
                height: '36px',
                borderRadius: '8px',
                background: `linear-gradient(90deg, ${opt.color}, ${opt.color}CC)`,
                border:
                  ribbonColor === opt.id
                    ? '3px solid #D4AF37'
                    : '2px solid #E0E0D0',
                boxShadow:
                  ribbonColor === opt.id
                    ? '0 2px 8px rgba(212,175,55,0.3)'
                    : '0 1px 2px rgba(0,0,0,0.08)',
                transform: ribbonColor === opt.id ? 'scale(1.08)' : 'scale(1)',
              }}
              title={opt.name}
            >
              {ribbonColor === opt.id && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: '#D4AF37' }}
                >
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#8B8B7A' }}>
          已选: {RIBBON_OPTIONS.find((o) => o.id === ribbonColor)?.name}
        </p>
      </div>
    </div>
  );
}
