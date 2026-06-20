import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash';
import { useRainStore } from '@/store/useRainStore';
import { useFloodStore } from '@/store/useFloodStore';
import { RAIN_LABELS } from '@/modules/rain-simulator/rainConfig';

function AnimatedRainfall({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Math.round(value);
    if (Math.abs(display - target) < 1) {
      setDisplay(target);
      return;
    }
    const step = target > display ? 1 : -1;
    const interval = setInterval(() => {
      setDisplay((prev) => {
        if ((step > 0 && prev >= target) || (step < 0 && prev <= target)) {
          clearInterval(interval);
          return target;
        }
        return prev + step;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [value, display]);
  return <>{display}</>;
}

export function InfoPanel() {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const rainfall = useFloodStore(
    throttle((s) => s.rainfallRate, 100, { leading: true, trailing: true }),
  );
  const avgDepth = useFloodStore(
    throttle((s) => s.avgDepth, 100, { leading: true, trailing: true }),
  );
  const highRiskCount = useFloodStore(
    throttle((s) => s.highRiskCount, 100, { leading: true, trailing: true }),
  );
  const events = useFloodStore((s) => s.events);
  const currentType = useRainStore((s) => s.currentType);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const depthColor = avgDepth > 8 ? '#FF4444' : avgDepth > 3 ? '#FFB347' : '#ffffff';
  const isDanger = avgDepth > 8;

  const panelContent = (
    <>
      <div
        style={{
          padding: '20px 20px 8px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 11,
            fontFamily: 'monospace',
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          RAINFLOW · 城市降雨模拟
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          当前雨型：
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              background: 'rgba(102,224,224,0.15)',
              color: '#66E0E0',
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          >
            {RAIN_LABELS[currentType]}
          </span>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontFamily: 'monospace',
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            当前降雨量
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: 24,
              fontFamily: 'monospace',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
            }}
          >
            <AnimatedRainfall value={rainfall} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
              mm/h
            </span>
          </div>
        </div>

        <div>
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontFamily: 'monospace',
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            平均积水深度
          </div>
          <div
            style={{
              color: depthColor,
              fontSize: 24,
              fontFamily: 'monospace',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              textShadow: isDanger ? '0 0 8px rgba(255,68,68,0.6)' : 'none',
            }}
          >
            {avgDepth.toFixed(1)}
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
              cm
            </span>
          </div>
        </div>

        <div>
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontFamily: 'monospace',
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            高风险区域
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '5px 12px',
              borderRadius: 16,
              background: highRiskCount > 0 ? '#FF3333' : 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'monospace',
              boxShadow: highRiskCount > 0 ? '0 0 10px rgba(255,51,51,0.5)' : 'none',
            }}
          >
            {highRiskCount} 处
          </span>
        </div>
      </div>

      <div
        style={{
          padding: '12px 20px 16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          maxHeight: isMobile ? 80 : 200,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 10,
            fontFamily: 'monospace',
            letterSpacing: 1.5,
            marginBottom: 6,
          }}
        >
          风险事件日志
        </div>
        {events.length === 0 && (
          <div
            style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: 11,
              fontFamily: 'monospace',
              fontStyle: 'italic',
            }}
          >
            暂无风险事件...
          </div>
        )}
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                background: e.level === 'danger'
                  ? 'rgba(255,51,51,0.15)'
                  : 'rgba(255,179,71,0.12)',
                borderLeft: `3px solid ${e.level === 'danger' ? '#FF3333' : '#FFB347'}`,
                fontSize: 11,
                fontFamily: 'monospace',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.4,
              }}
            >
              {e.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        .flood-info-panel::-webkit-scrollbar {
          width: 4px;
        }
        .flood-info-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .flood-info-panel::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }
      `}</style>
    </>
  );

  if (isMobile) {
    return (
      <>
        <motion.button
          onClick={() => setMobileOpen((v) => !v)}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed',
            bottom: mobileOpen ? 188 : 16,
            right: 16,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(10,30,50,0.9)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: 18,
            zIndex: 20,
            cursor: 'pointer',
          }}
        >
          {mobileOpen ? '▼' : '▲'}
        </motion.button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flood-info-panel"
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 180,
                background: 'rgba(10,30,50,0.92)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '16px 16px 0 0',
                zIndex: 15,
                overflow: 'hidden',
              }}
            >
              {panelContent}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div
      className="flood-info-panel"
      style={{
        position: 'fixed',
        right: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 280,
        background: 'rgba(10,30,50,0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: 10,
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {panelContent}
    </div>
  );
}
