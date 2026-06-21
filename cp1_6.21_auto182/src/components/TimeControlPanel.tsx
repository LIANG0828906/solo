import { useContext, useEffect, useRef, useState } from 'react';
import { TimeContext } from '../context/TimeContext';
import { formatTime, getTimeOfDayLabel, PRESET_CARDS } from '../utils/lightCalculator';
import { Save } from 'lucide-react';

interface PresetCardState {
  id: string;
  scale: number;
}

export function TimeControlPanel() {
  const ctx = useContext(TimeContext);
  const [animatingCard, setAnimatingCard] = useState<PresetCardState | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!ctx) return null;

  const { time, setTime, savePreset, presets, applyPreset } = ctx;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTime(value);
  };

  const animateToTime = (targetTime: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = time;
    const diff = targetTime - startTime;
    const duration = 500;
    const startTimestamp = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentTime = startTime + diff * eased;
      setTime(currentTime);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handlePresetClick = (presetTime: number, label: string) => {
    setAnimatingCard({ id: label, scale: 1.05 });
    animateToTime(presetTime);
    setTimeout(() => {
      setAnimatingCard((prev) => (prev && prev.id === label ? { ...prev, scale: 1 } : prev));
    }, 150);
    setTimeout(() => {
      setAnimatingCard(null);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const currentLabel = getTimeOfDayLabel(time);
  const isPresetSelected = (presetTime: number) => Math.abs(time - presetTime) < 0.5;

  const sliderPercent = (time / 24) * 100;

  return (
    <div
      style={{
        width: 340,
        height: '100vh',
        background: 'linear-gradient(180deg, #111827 0%, #1F2937 100%)',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        padding: 20,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        zIndex: 10
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1
            style={{
              color: '#E2E8F0',
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 0.5,
              margin: 0
            }}
          >
            光影城境
          </h1>
          <p
            style={{
              color: '#94A3B8',
              fontSize: 12,
              marginTop: 4,
              letterSpacing: 0.5
            }}
          >
            3D城市光影演示工具
          </p>
        </div>
        <button
          onClick={() => void savePreset()}
          title="保存当前预设"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            flexShrink: 0,
            marginLeft: 8
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(15deg)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(0deg)';
          }}
        >
          <Save size={18} color="#FFFFFF" strokeWidth={2} />
        </button>
      </div>

      <div
        style={{
          backgroundColor: '#1E293B',
          border: '1px solid #374151',
          borderRadius: 12,
          padding: '16px 16px',
          margin: '8px 0'
        }}
      >
        <div style={{ marginBottom: 12, textAlign: 'center' }}>
          <div
            style={{
              color: '#E2E8F0',
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 2,
              fontFamily: 'monospace'
            }}
          >
            {formatTime(time)}
          </div>
          <div
            style={{
              color: '#3B82F6',
              fontSize: 16,
              fontWeight: 500,
              marginTop: 4,
              letterSpacing: 0.5
            }}
          >
            {currentLabel}
          </div>
        </div>

        <div
          ref={sliderRef}
          style={{
            position: 'relative',
            height: 32,
            margin: '8px 8px',
            display: 'flex',
            alignItems: 'center'
          }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #FDE68A 0%, #F97316 35%, #87CEEB 50%, #F97316 65%, #1F2937 100%)',
              opacity: 0.6
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: `${sliderPercent}%`,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #FDE68A, #F97316)',
              transition: isDragging ? 'none' : 'width 0.1s linear'
            }}
          />
          <input
            type="range"
            min={0}
            max={24}
            step={0.1}
            value={time}
            onChange={handleSliderChange}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              width: '100%',
              height: 32,
              margin: 0,
              padding: 0,
              opacity: 0,
              cursor: 'pointer',
              zIndex: 2
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `calc(${sliderPercent}% - 8px)`,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(59, 130, 246, 0.3)',
              transition: isDragging ? 'none' : 'left 0.1s linear',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 8px', marginTop: 4 }}>
          {[0, 6, 12, 18, 24].map((t) => (
            <span
              key={t}
              style={{
                color: '#64748B',
                fontSize: 10,
                letterSpacing: 0.5
              }}
            >
              {String(t).padStart(2, '0')}:00
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#1E293B',
          border: '1px solid #374151',
          borderRadius: 12,
          padding: '16px 16px',
          margin: '8px 0'
        }}
      >
        <div
          style={{
            color: '#94A3B8',
            fontSize: 12,
            marginBottom: 12,
            letterSpacing: 0.5
          }}
        >
          快速时段
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8
          }}
        >
          {PRESET_CARDS.map((preset) => {
            const selected = isPresetSelected(preset.time);
            const isAnimating = animatingCard?.id === preset.label;
            const scale = isAnimating ? (animatingCard?.scale ?? 1) : 1;
            return (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset.time, preset.label)}
                style={{
                  width: 80,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: selected ? '#3B82F6' : '#374151',
                  color: '#E2E8F0',
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: 0.5,
                  transition: 'background-color 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: `scale(${scale})`,
                  boxShadow: selected ? '0 2px 12px rgba(59, 130, 246, 0.4)' : 'none',
                  fontWeight: selected ? 600 : 400,
                  justifySelf: 'center'
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {presets.length > 0 && (
        <div
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #374151',
            borderRadius: 12,
            padding: '16px 16px',
            margin: '8px 0'
          }}
        >
          <div
            style={{
              color: '#94A3B8',
              fontSize: 12,
              marginBottom: 12,
              letterSpacing: 0.5
            }}
          >
            已保存预设 ({presets.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {presets.slice(0, 8).map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: isPresetSelected(preset.time) ? 'rgba(59, 130, 246, 0.2)' : '#0F172A',
                  border: `1px solid ${isPresetSelected(preset.time) ? '#3B82F6' : '#374151'}`,
                  color: '#E2E8F0',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  letterSpacing: 0.5,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = isPresetSelected(preset.time)
                    ? 'rgba(59, 130, 246, 0.2)'
                    : '#0F172A';
                }}
              >
                <span style={{ fontFamily: 'monospace' }}>{formatTime(preset.time)}</span>
                <span style={{ color: '#94A3B8', fontSize: 11 }}>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 20,
          right: 20,
          color: '#475569',
          fontSize: 11,
          textAlign: 'center',
          letterSpacing: 0.5
        }}
      >
        拖拽滑块或点击时段切换光影效果
      </div>
    </div>
  );
}
