import React, { useState, useEffect, useRef } from 'react';
import { useColorStore } from '../store/colorStore';
import type { LightState, FilterState } from '../types';

interface SliderConfig {
  key: string;
  name: string;
  color: string;
  accent: string;
  min: number;
  max: number;
}

const additiveSliders: SliderConfig[] = [
  { key: 'r', name: '红 (Red)', color: '#ff4d5a', accent: '#ff4d5a', min: 0, max: 255 },
  { key: 'g', name: '绿 (Green)', color: '#4dff88', accent: '#4dff88', min: 0, max: 255 },
  { key: 'b', name: '蓝 (Blue)', color: '#4d79ff', accent: '#4d79ff', min: 0, max: 255 },
];

const subtractiveSliders: SliderConfig[] = [
  { key: 'c', name: '青 (Cyan)', color: '#00e5ff', accent: '#00e5ff', min: 0, max: 100 },
  { key: 'm', name: '品红 (Magenta)', color: '#ff4dd2', accent: '#ff4dd2', min: 0, max: 100 },
  { key: 'y', name: '黄 (Yellow)', color: '#ffe14d', accent: '#ffe14d', min: 0, max: 100 },
];

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animKey, setAnimKey] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setAnimKey((k) => k + 1);
      setDisplayValue(value);
      prevValue.current = value;
    }
  }, [value]);

  return (
    <span className="slider-value">
      <span
        key={animKey}
        className="slider-value-inner"
        style={{
          display: 'inline-block',
          animation: 'numRolldown 0.2s ease',
        }}
      >
        {displayValue}
      </span>
      <style>{`
        @keyframes numRolldown {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

function ModeTabs() {
  const mode = useColorStore((s) => s.mode);
  const setMode = useColorStore((s) => s.setMode);
  const addTabRef = useRef<HTMLButtonElement>(null);
  const subTabRef = useRef<HTMLButtonElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState<React.CSSProperties>({
    left: 0,
    width: 0,
  });

  const updateUnderline = () => {
    const active = mode === 'additive' ? addTabRef.current : subTabRef.current;
    if (!active) return;
    const parent = active.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    setUnderlineStyle({
      left: rect.left - parentRect.left + 16,
      width: rect.width - 32,
    });
  };

  useEffect(() => {
    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [mode]);

  return (
    <div className="mode-tabs">
      <button
        ref={addTabRef}
        className={`mode-tab ${mode === 'additive' ? 'active-additive' : ''}`}
        onClick={() => setMode('additive')}
      >
        加色混合 (RGB)
      </button>
      <button
        ref={subTabRef}
        className={`mode-tab ${mode === 'subtractive' ? 'active-subtractive' : ''}`}
        onClick={() => setMode('subtractive')}
      >
        减色混合 (CMY)
      </button>
      <span className="mode-tab-underline" style={underlineStyle} />
    </div>
  );
}

function TargetColorSection() {
  const mode = useColorStore((s) => s.mode);
  const targetColor = useColorStore((s) => s.targetColor);
  const suggestedMix = useColorStore((s) => s.suggestedMix);
  const setTargetColor = useColorStore((s) => s.setTargetColor);
  const applySuggestion = useColorStore((s) => s.applySuggestion);

  const [rIn, setRIn] = useState(targetColor?.r?.toString() ?? '');
  const [gIn, setGIn] = useState(targetColor?.g?.toString() ?? '');
  const [bIn, setBIn] = useState(targetColor?.b?.toString() ?? '');

  useEffect(() => {
    setRIn(targetColor?.r?.toString() ?? '');
    setGIn(targetColor?.g?.toString() ?? '');
    setBIn(targetColor?.b?.toString() ?? '');
  }, [targetColor]);

  const tryApply = (r: string, g: string, b: string) => {
    const rn = parseInt(r, 10);
    const gn = parseInt(g, 10);
    const bn = parseInt(b, 10);
    if (
      !isNaN(rn) && !isNaN(gn) && !isNaN(bn) &&
      rn >= 0 && rn <= 255 && gn >= 0 && gn <= 255 && bn >= 0 && bn <= 255
    ) {
      setTargetColor({ r: rn, g: gn, b: bn });
    } else if (r === '' && g === '' && b === '') {
      setTargetColor(null);
    }
  };

  const swatchBg = targetColor
    ? `rgb(${targetColor.r},${targetColor.g},${targetColor.b})`
    : 'rgba(255,255,255,0.05)';

  return (
    <div className="target-color-section">
      <div className="panel-title">目标色块匹配</div>
      <div className="target-input-row">
        <input
          className="target-input"
          placeholder="R"
          value={rIn}
          onChange={(e) => {
            setRIn(e.target.value);
            tryApply(e.target.value, gIn, bIn);
          }}
        />
        <input
          className="target-input"
          placeholder="G"
          value={gIn}
          onChange={(e) => {
            setGIn(e.target.value);
            tryApply(rIn, e.target.value, bIn);
          }}
        />
        <input
          className="target-input"
          placeholder="B"
          value={bIn}
          onChange={(e) => {
            setBIn(e.target.value);
            tryApply(rIn, gIn, e.target.value);
          }}
        />
      </div>
      <div className="target-preview">
        <div className="target-swatch" style={{ background: swatchBg }} />
        <div className="match-info">
          {targetColor && suggestedMix ? (
            <>
              <div>
                目标: <strong>{`(${targetColor.r},${targetColor.g},${targetColor.b})`}</strong>
              </div>
              <div>
                匹配: <strong>{`(${suggestedMix.result.r},${suggestedMix.result.g},${suggestedMix.result.b})`}</strong>
              </div>
              <div className="match-highlight">
                相似度 {suggestedMix.similarity.toFixed(1)}%
              </div>
            </>
          ) : (
            <div>输入RGB值后自动计算最佳混合方案</div>
          )}
        </div>
      </div>
      {targetColor && suggestedMix && (
        <button className="suggestion-btn" onClick={applySuggestion}>
          应用最佳参数
        </button>
      )}
    </div>
  );
}

const ControlPanel: React.FC = () => {
  const mode = useColorStore((s) => s.mode);
  const lights = useColorStore((s) => s.lights);
  const filters = useColorStore((s) => s.filters);
  const setLight = useColorStore((s) => s.setLight);
  const setFilter = useColorStore((s) => s.setFilter);
  const suggestedMix = useColorStore((s) => s.suggestedMix);

  const sliders = mode === 'additive' ? additiveSliders : subtractiveSliders;
  const stateVal = mode === 'additive' ? lights : filters;
  const setter = mode === 'additive' ? setLight : setFilter;

  const highlight: Record<string, boolean> = {};
  if (suggestedMix) {
    const p = suggestedMix.params as Record<string, number>;
    for (const cfg of sliders) {
      if (Math.abs((stateVal as Record<string, number>)[cfg.key] - p[cfg.key]) < 0.1) {
        highlight[cfg.key] = true;
      }
    }
  }

  return (
    <>
      <ModeTabs />
      <aside className="control-panel">
        <div>
          <div className="panel-title">
            {mode === 'additive' ? '光源强度调节' : '滤色片透明度'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 12 }}>
            {sliders.map((cfg) => {
              const val = (stateVal as Record<string, number>)[cfg.key];
              return (
                <div
                  key={cfg.key}
                  className="slider-group"
                  style={{
                    padding: highlight[cfg.key] ? 8 : 0,
                    margin: highlight[cfg.key] ? -8 : 0,
                    borderRadius: 10,
                    background: highlight[cfg.key]
                      ? 'linear-gradient(135deg, rgba(77,255,136,0.12), rgba(0,229,255,0.08))'
                      : 'transparent',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div className="slider-label-row">
                    <div className="slider-name">
                      <span
                        className="slider-color-dot"
                        style={{
                          background: cfg.color,
                          color: cfg.color,
                        }}
                      />
                      <span>{cfg.name}</span>
                    </div>
                    <AnimatedNumber value={Math.round(val)} />
                  </div>
                  <input
                    className="slider-track"
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    step={1}
                    value={val}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setter(cfg.key as keyof LightState & keyof FilterState, v);
                    }}
                    style={{ color: cfg.accent }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <TargetColorSection />
      </aside>
    </>
  );
};

export default ControlPanel;
