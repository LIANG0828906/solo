import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore, Quality } from '@/store/useAppStore';
import { colorThemes } from '@/themes/colorThemes';

export default function ControlPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    density,
    theme,
    smoothness,
    quality,
    setDensity,
    setTheme,
    setSmoothness,
    setQuality,
  } = useAppStore();

  const qualityOptions: { value: Quality; label: string }[] = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
  ];

  const themeEntries = Object.entries(colorThemes);

  const glowPulseKeyframes = `
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 8px rgba(255,255,255,0.4), 0 0 16px rgba(255,255,255,0.2); }
      50% { box-shadow: 0 0 16px rgba(255,255,255,0.7), 0 0 32px rgba(255,255,255,0.4); }
    }
  `;

  const controlWrapStyle = {
    position: 'relative' as const,
  };

  const hoverIndicatorStyle = {
    position: 'absolute' as const,
    left: 0,
    bottom: '-4px',
    height: '2px',
    width: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none' as const,
  };

  return (
    <>
      <style>{glowPulseKeyframes}</style>

      <div
        className="
          fixed top-0 left-0 rounded-lg text-white
          md:top-4 md:left-4
          w-[280px]
          right-0 h-full md:h-auto
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:translate-y-0
        "
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '20px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          zIndex: 50,
        }}
      >
        <div className="space-y-6">
          <div style={controlWrapStyle} className="group">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium opacity-90">粒子密度</label>
              <span className="text-xs opacity-70">{density}</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                height: '4px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                const indicator = e.currentTarget.parentElement?.querySelector('.hover-indicator') as HTMLElement;
                if (indicator) indicator.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const indicator = e.currentTarget.parentElement?.querySelector('.hover-indicator') as HTMLElement;
                if (indicator) indicator.style.opacity = '0';
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: white;
                cursor: pointer;
                box-shadow: 0 0 8px rgba(255,255,255,0.6);
              }
              input[type="range"]::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: white;
                cursor: pointer;
                border: none;
                box-shadow: 0 0 8px rgba(255,255,255,0.6);
              }
            `}</style>
            <div className="hover-indicator" style={hoverIndicatorStyle} />
          </div>

          <div style={controlWrapStyle} className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium opacity-90">色彩主题</label>
            </div>
            <div
              className="flex gap-2 flex-wrap"
              onMouseEnter={(e) => {
                const indicator = e.currentTarget.parentElement?.querySelector('.hover-indicator') as HTMLElement;
                if (indicator) indicator.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const indicator = e.currentTarget.parentElement?.querySelector('.hover-indicator') as HTMLElement;
                if (indicator) indicator.style.opacity = '0';
              }}
            >
              {themeEntries.map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  title={value.name}
                  className="relative transition-transform hover:scale-110"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${value.primary}, ${value.secondary}, ${value.accent})`,
                    boxShadow:
                      theme === key
                        ? `0 0 0 2px white, 0 0 12px ${value.primary}, 0 0 24px ${value.secondary}`
                        : 'none',
                    cursor: 'pointer',
                    border: 'none',
                    padding: 0,
                  }}
                />
              ))}
            </div>
            <div className="hover-indicator" style={hoverIndicatorStyle} />
          </div>

          <div style={controlWrapStyle} className="group">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium opacity-90">跟随平滑度</label>
              <span className="text-xs opacity-70">{smoothness}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={smoothness}
              onChange={(e) => setSmoothness(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                height: '4px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                const indicator = e.currentTarget.parentElement?.querySelector('.hover-indicator') as HTMLElement;
                if (indicator) indicator.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const indicator = e.currentTarget.parentElement?.querySelector('.hover-indicator') as HTMLElement;
                if (indicator) indicator.style.opacity = '0';
              }}
            />
            <div className="hover-indicator" style={hoverIndicatorStyle} />
          </div>

          <div style={controlWrapStyle} className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium opacity-90">性能质量</label>
            </div>
            <div
              className="flex gap-2"
              onMouseEnter={(e) => {
                const indicator = e.currentTarget.parentElement?.querySelector('.hover-indicator') as HTMLElement;
                if (indicator) indicator.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const indicator = e.currentTarget.parentElement?.querySelector('.hover-indicator') as HTMLElement;
                if (indicator) indicator.style.opacity = '0';
              }}
            >
              {qualityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setQuality(opt.value)}
                  className="flex-1 py-2 text-sm transition-all"
                  style={{
                    borderRadius: '9999px',
                    border: quality === opt.value ? '1px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.2)',
                    background: quality === opt.value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    cursor: 'pointer',
                    animation: quality === opt.value ? 'glowPulse 2s ease-in-out infinite' : 'none',
                    fontWeight: quality === opt.value ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="hover-indicator" style={hoverIndicatorStyle} />
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </>
  );
}
