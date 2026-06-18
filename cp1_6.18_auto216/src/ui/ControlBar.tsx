import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { BUILDING_SCHEMES } from '@/data/buildingModel';
import type { SchemeType } from '@/data/buildingModel';
import { getSunCSSColor } from '@/analytics/solarSim';

const SCHEME_BUTTONS: Array<{ key: SchemeType; label: string; icon: string }> = [
  { key: 'box', label: '方盒式', icon: '▦' },
  { key: 'streamline', label: '流线式', icon: '〰' },
  { key: 'terraced', label: '阶梯式', icon: '▤' },
];

const VIEW_BUTTONS: Array<{ key: 'default' | 'top' | 'side'; label: string; icon: string }> = [
  { key: 'default', label: '透视', icon: '◈' },
  { key: 'top', label: '俯视', icon: '⬒' },
  { key: 'side', label: '侧视', icon: '◧' },
];

function formatHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return pad(hh) + ':' + pad(mm);
}

export function ControlBar() {
  const currentHour = useAppStore((s) => s.currentHour);
  const setCurrentHour = useAppStore((s) => s.setCurrentHour);
  const currentScheme = useAppStore((s) => s.currentScheme);
  const switchScheme = useAppStore((s) => s.switchScheme);
  const isTransitioning = useAppStore((s) => s.isTransitioning);
  const cameraPreset = useAppStore((s) => s.cameraPreset);
  const setCameraPreset = useAppStore((s) => s.setCameraPreset);
  const schemeCount = BUILDING_SCHEMES[currentScheme].buildings.length;
  const [mobile, setMobile] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const sunColor = getSunCSSColor(currentHour);
  const sliderPct = ((currentHour - 8) / 10) * 100;
  const sliderBg = 'linear-gradient(to right, ' + sunColor + ' 0%, ' + sunColor + ' ' + sliderPct + '%, rgba(255,255,255,0.1) ' + sliderPct + '%, rgba(255,255,255,0.1) 100%)';
  const sunBg = 'radial-gradient(circle, ' + sunColor + '70, transparent 70%)';
  const sunSmallBg = 'radial-gradient(circle, ' + sunColor + '60, transparent 70%)';

  const common: React.CSSProperties = {
    position: 'fixed',
    zIndex: 40,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    background: 'rgba(18, 22, 38, 0.82)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 -4px 32px rgba(0,0,0,0.4)',
    color: '#E0E0E0',
  };

  if (mobile) {
    return (
      <div style={{
        ...common,
        bottom: 0, left: 0, right: 0,
        borderRadius: '18px 18px 0 0',
        padding: '12px 14px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: sunSmallBg,
            color: sunColor, fontSize: 18,
          }}>
            {'☀'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#7A8AAC' }}>时间</span>
              <span style={{ fontSize: 13, color: sunColor, fontFamily: 'monospace', fontWeight: 600 }}>
                {formatHour(currentHour)}
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={18}
              step={0.1}
              value={currentHour}
              onChange={(e) => setCurrentHour(parseFloat(e.target.value))}
              style={{
                width: '100%', height: 4,
                WebkitAppearance: 'none', appearance: 'none',
                borderRadius: 2, outline: 'none',
                background: sliderBg,
                marginTop: 6,
              }}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{
            display: 'flex',
            gap: 4,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10, padding: 3,
          }}>
            {VIEW_BUTTONS.map((v) => (
              <button
                key={v.key}
                onClick={() => setCameraPreset(v.key)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: 'pointer',
                  border: 'none',
                  color: cameraPreset === v.key ? '#FFFFFF' : '#7A8AAC',
                  background: cameraPreset === v.key ? '#4A6FA5' : 'transparent',
                  transition: 'all 0.2s',
                  fontWeight: cameraPreset === v.key ? 600 : 400,
                }}
                title={v.label}
              >
                {v.icon + ' ' + v.label}
              </button>
            ))}
          </div>
          <div style={{
            display: 'flex', gap: 4,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10, padding: 3,
          }}>
            {SCHEME_BUTTONS.map((s) => (
              <button
                key={s.key}
                disabled={isTransitioning}
                onClick={() => switchScheme(s.key)}
                style={{
                  flex: 1, padding: '7px 0',
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: isTransitioning ? 'not-allowed' : 'pointer',
                  border: 'none',
                  color: currentScheme === s.key ? '#FFFFFF' : '#7A8AAC',
                  background: currentScheme === s.key ? '#4A6FA5' : 'transparent',
                  opacity: isTransitioning ? 0.6 : 1,
                  transition: 'all 0.2s',
                  fontWeight: currentScheme === s.key ? 600 : 400,
                }}
                title={s.label + '（' + BUILDING_SCHEMES[s.key].buildings.length + '幢建筑）'}
              >
                {s.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...common,
      bottom: 20, left: '50%', transform: 'translateX(-50%)',
      borderRadius: 18,
      padding: '14px 22px 16px',
      width: 'min(92vw, 880px)',
      display: 'flex', alignItems: 'flex-start',
      gap: 20,
    }}>
      <div style={{
        flex: '0 0 auto',
        minWidth: 260,
        paddingRight: 20,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: sunBg,
            color: sunColor, fontSize: 20,
            boxShadow: '0 0 20px ' + sunColor + '40',
          }}>
            {'☀'}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#7A8AAC', letterSpacing: 0.5 }}>模拟时间</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: sunColor, letterSpacing: 1 }}>
              {formatHour(currentHour)}
            </div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="range"
            min={8}
            max={18}
            step={0.1}
            value={currentHour}
            onChange={(e) => setCurrentHour(parseFloat(e.target.value))}
            style={{
              width: '100%', height: 4,
              WebkitAppearance: 'none', appearance: 'none',
              borderRadius: 2, outline: 'none',
              background: sliderBg,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {[8, 10, 12, 14, 16, 18].map((t) => (
              <span key={t} style={{
                fontSize: 9,
                color: Math.abs(currentHour - t) < 0.3 ? sunColor : '#5A6A8A',
                fontFamily: 'monospace',
                transition: 'color 0.2s',
              }}>
                {t + ':00'}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: '0 0 auto', paddingRight: 20, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 11, color: '#7A8AAC', letterSpacing: 0.5, marginBottom: 8 }}>建筑方案</div>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12, padding: 4,
          gap: 2,
        }}>
          {SCHEME_BUTTONS.map((s) => (
            <button
              key={s.key}
              onClick={() => switchScheme(s.key)}
              disabled={isTransitioning}
              style={{
                padding: '10px 16px',
                borderRadius: 9,
                cursor: isTransitioning ? 'progress' : 'pointer',
                border: 'none',
                color: currentScheme === s.key ? '#FFFFFF' : '#A0AEC0',
                background: currentScheme === s.key
                  ? 'linear-gradient(135deg, #4A6FA5, #5A7FB5)'
                  : 'transparent',
                fontSize: 12,
                fontWeight: currentScheme === s.key ? 600 : 500,
                boxShadow: currentScheme === s.key ? '0 2px 10px rgba(74,111,165,0.4)' : 'none',
                opacity: isTransitioning ? 0.6 : 1,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget;
                if (!isTransitioning && currentScheme !== s.key) {
                  btn.style.background = 'rgba(74,111,165,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget;
                if (currentScheme !== s.key) {
                  btn.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              <span>{s.label}</span>
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 8,
                background: currentScheme === s.key ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                fontFamily: 'monospace',
              }}>
                {BUILDING_SCHEMES[s.key].buildings.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: '0 0 auto' }}>
        <div style={{ fontSize: 11, color: '#7A8AAC', letterSpacing: 0.5, marginBottom: 8 }}>视角切换</div>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12, padding: 4, gap: 2,
        }}>
          {VIEW_BUTTONS.map((v) => (
            <button
              key={v.key}
              onClick={() => setCameraPreset(v.key)}
              style={{
                padding: '10px 14px',
                borderRadius: 9,
                cursor: 'pointer',
                border: 'none',
                color: cameraPreset === v.key ? '#FFFFFF' : '#A0AEC0',
                background: cameraPreset === v.key
                  ? 'linear-gradient(135deg, #4A6FA5, #5A7FB5)'
                  : 'transparent',
                fontSize: 12,
                fontWeight: cameraPreset === v.key ? 600 : 500,
                boxShadow: cameraPreset === v.key ? '0 2px 10px rgba(74,111,165,0.4)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget;
                if (cameraPreset !== v.key) {
                  btn.style.background = 'rgba(74,111,165,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget;
                if (cameraPreset !== v.key) {
                  btn.style.background = 'transparent';
                }
              }}
              title={v.label}
            >
              <span style={{ fontSize: 14 }}>{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1, textAlign: 'right', alignSelf: 'center',
        paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, color: '#7A8AAC', marginBottom: 4 }}>当前方案</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', letterSpacing: 0.5 }}>
          {BUILDING_SCHEMES[currentScheme].name}
        </div>
        <div style={{ fontSize: 10, color: '#5A6A8A', fontFamily: 'monospace', marginTop: 2 }}>
          {schemeCount + ' 幢建筑 · 20×20 网格'}
        </div>
      </div>
    </div>
  );
}
