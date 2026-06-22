import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnvParamsStore } from '../store/envParamsStore';
import { ENV_RANGES, ENV_LABELS, ENV_UNITS, calculatePhotosyntheticEfficiency } from '../core/envParams';
import type { EnvParams } from '../core/types';
import { useLogStore } from '../store/logStore';

const PARAM_KEYS: Array<keyof EnvParams> = [
  'light', 'water', 'temperature', 'ph', 'nitrogen', 'phosphorus', 'potassium',
];

const PARAM_ICONS: Record<keyof EnvParams, string> = {
  light: '☀',
  water: '💧',
  temperature: '🌡',
  ph: '🧪',
  nitrogen: 'N',
  phosphorus: 'P',
  potassium: 'K',
};

const PARAM_GROUPS = [
  { title: '基础环境', keys: ['light', 'water', 'temperature', 'ph'] as const },
  { title: '土壤营养 (NPK)', keys: ['nitrogen', 'phosphorus', 'potassium'] as const },
];

interface SliderProps {
  paramKey: keyof EnvParams;
  value: number;
  onChange: (v: number) => void;
  onChangeCommit?: (v: number, prev: number) => void;
}

function formatValue(key: keyof EnvParams, v: number): string {
  if (key === 'ph') return v.toFixed(1);
  if (key === 'temperature') return v.toFixed(1);
  return Math.round(v).toString();
}

function EnvSlider({ paramKey, value, onChange, onChangeCommit }: SliderProps) {
  const range = ENV_RANGES[paramKey];
  const prevRef = useRef(value);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = ((value - range.min) / (range.max - range.min)) * 100;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromEvent(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      setDragging(false);
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
      updateFromEvent(e);
      const final = value;
      if (onChangeCommit) onChangeCommit(final, prevRef.current);
      prevRef.current = final;
    }
  };

  const updateFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let t = (e.clientX - rect.left) / rect.width;
    t = Math.max(0, Math.min(1, t));
    const raw = range.min + t * (range.max - range.min);
    const stepped = Math.round(raw / range.step) * range.step;
    onChange(parseFloat(stepped.toFixed(3)));
  };

  const getFillColor = () => {
    if (paramKey === 'light') {
      if (value < 20) return '#FDD835';
      if (value > 80) return '#BF360C';
      return '#FFD54F';
    }
    if (paramKey === 'water') {
      if (value < 30) return '#FF7043';
      if (value > 80) return '#26C6DA';
      return '#42A5F5';
    }
    if (paramKey === 'ph') {
      if (value < 5.0) return '#AB47BC';
      if (value > 7.5) return '#FFA726';
      return '#81C784';
    }
    if (paramKey === 'temperature') {
      if (value < 10) return '#4FC3F7';
      if (value > 32) return '#EF5350';
      return '#66BB6A';
    }
    return '#8D6E63';
  };

  return (
    <div className="env-slider-row" style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#E0E0E0', fontSize: 13, fontWeight: 500,
        }}>
          <span style={{ fontSize: 14 }}>{PARAM_ICONS[paramKey]}</span>
          {ENV_LABELS[paramKey]}
        </span>
        <span style={{
          color: '#ffffff', fontSize: 13, fontFamily: 'monospace',
          background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 4,
        }}>
          {formatValue(paramKey, value)}{ENV_UNITS[paramKey]}
        </span>
      </div>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative', width: '100%', height: 20,
          display: 'flex', alignItems: 'center', cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute', left: 0, height: 4, width: `${pct}%`, borderRadius: 2,
          background: getFillColor(),
          boxShadow: `0 0 6px ${getFillColor()}66`,
          transition: dragging ? 'none' : 'width 0.15s ease, background 0.3s',
        }} />
        <motion.div
          animate={{ x: pct - 50, scale: dragging ? 1.25 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          style={{
            position: 'absolute', left: `${pct}%`, top: '50%',
            width: 14, height: 14, marginLeft: -7, marginTop: -7,
            borderRadius: '50%',
            background: '#ffffff',
            border: `2px solid ${getFillColor()}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        />
      </div>
    </div>
  );
}

export function EnvControls() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const params = useEnvParamsStore((s) => s.params);
  const prev = useEnvParamsStore((s) => s.prevParams);
  const setParam = useEnvParamsStore((s) => s.setParam);
  const resetEnv = useEnvParamsStore((s) => s.reset);
  const addLog = useLogStore((s) => s.addLog);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const efficiency = Math.round(calculatePhotosyntheticEfficiency(params) * 100);

  const handleChangeCommit = (key: keyof EnvParams, _final: number, old: number) => {
    const cur = params[key];
    if (Math.abs(cur - old) < 0.001) return;
    const eff = Math.round(calculatePhotosyntheticEfficiency(params) * 100);
    const prevEff = Math.round(calculatePhotosyntheticEfficiency({ ...params, [key]: old }) * 100);
    const diff = eff - prevEff;
    const effStr = diff === 0 ? '' :
      `，光合效率${diff > 0 ? '提升' : '降低'}${Math.abs(diff)}%`;
    addLog(
      'env',
      `${ENV_LABELS[key]}从${formatValue(key, old)}${ENV_UNITS[key]}改为${formatValue(key, cur)}${ENV_UNITS[key]}${effStr}`,
      { key, old, new: cur }
    );
  };

  const content = (
    <>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
      }}>
        <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
          🌿 环境控制
        </div>
        <button
          onClick={resetEnv}
          style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', color: '#BDBDBD',
            padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          重置
        </button>
      </div>

      <div style={{
        padding: '8px 10px', borderRadius: 6, marginBottom: 14,
        background: 'rgba(124, 179, 66, 0.1)',
        border: '1px solid rgba(124, 179, 66, 0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C5E1A5', fontSize: 12 }}>
          <span>光合效率</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{efficiency}%</span>
        </div>
        <div style={{
          marginTop: 4, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${efficiency}%`,
            background: 'linear-gradient(90deg, #8BC34A, #CDDC39)',
            borderRadius: 2,
          }} />
        </div>
      </div>

      {PARAM_GROUPS.map((g) => (
        <div key={g.title} style={{ marginBottom: 10 }}>
          <div style={{
            color: '#90A4AE', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
          }}>{g.title}</div>
          {g.keys.map((k) => (
            <EnvSlider
              key={k}
              paramKey={k}
              value={params[k]}
              onChange={(v) => setParam(k, v)}
              onChangeCommit={(f, p) => handleChangeCommit(k, f, p)}
            />
          ))}
        </div>
      ))}
    </>
  );

  if (isMobile) {
    return (
      <>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed', top: 56, left: 12, zIndex: 40,
            width: 40, height: 40, borderRadius: '50%',
            background: '#333333', color: '#fff', border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)', cursor: 'pointer',
            fontSize: 18,
          }}
        >
          🌿
        </motion.button>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 100,
              }}
              onClick={() => setMobileOpen(false)}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  width: '85%', maxWidth: 360,
                  background: '#333333', padding: 20, overflowY: 'auto',
                  borderTopRightRadius: 8, borderBottomRightRadius: 8,
                }}
              >
                {content}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <AnimatePresence initial={false}>
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 48 : 280, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed', top: 52, left: 12, bottom: 12,
          background: 'rgba(51, 51, 51, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: 8, padding: collapsed ? 8 : 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          overflow: 'hidden', zIndex: 30,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', top: 8, right: collapsed ? 'auto' : 8,
            left: collapsed ? 8 : 'auto',
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: 'none',
            color: '#fff', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {collapsed ? '🌿' : '◀'}
        </motion.button>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ paddingTop: 36 }}
          >
            {content}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
