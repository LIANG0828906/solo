import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Route, RotateCcw, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { FlagData, FLAG_COLORS } from '../types';
import { FlagItem } from './FlagItem';

interface ControlPanelProps {
  flags: FlagData[];
  selectedFlags: string[];
  onSelectFlag: (id: string) => void;
  onRemoveFlag: (id: string) => void;
  onGeneratePath: () => void;
  onReset: () => void;
}

export function ControlPanel({
  flags,
  selectedFlags,
  onSelectFlag,
  onRemoveFlag,
  onGeneratePath,
  onReset,
}: ControlPanelProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const panelContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(201, 169, 110, 0.3)',
          background: 'linear-gradient(180deg, rgba(30,30,60,0.9) 0%, rgba(30,30,60,0.85) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Flag style={{ color: '#c9a96e' }} size={24} />
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: '#c9a96e',
              letterSpacing: 2,
            }}
          >
            演兵场控制台
          </h1>
        </div>
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: 12,
            color: 'rgba(236, 240, 241, 0.5)',
          }}
        >
          点击沙盘放置战旗 · 选中两旗生成路径
        </p>
      </div>

      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(201, 169, 110, 0.2)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'rgba(236, 240, 241, 0.5)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          军旗色谱
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FLAG_COLORS.map((color) => (
            <div
              key={color}
              title={color}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid rgba(201, 169, 110, 0.5)',
                boxShadow: `0 0 8px ${color}40`,
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: 'rgba(236, 240, 241, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            战旗列表
          </span>
          <span
            style={{
              fontSize: 12,
              color: '#c9a96e',
              fontWeight: 500,
            }}
          >
            {flags.length}/15
          </span>
        </div>

        {flags.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(236, 240, 241, 0.3)',
            }}
          >
            <MapPin size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 14 }}>点击沙盘放置战旗</p>
            <p style={{ margin: '4px 0 0 0', fontSize: 12 }}>开始你的战术推演</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {flags.map((flag) => (
              <FlagItem
                key={flag.id}
                flag={flag}
                isSelected={selectedFlags.includes(flag.id)}
                onSelect={onSelectFlag}
                onRemove={onRemoveFlag}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(201, 169, 110, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: 'linear-gradient(0deg, rgba(30,30,60,0.9) 0%, rgba(30,30,60,0.85) 100%)',
        }}
      >
        <motion.button
          onClick={onGeneratePath}
          disabled={selectedFlags.length !== 2}
          whileHover={selectedFlags.length === 2 ? { scale: 1.02 } : {}}
          whileTap={selectedFlags.length === 2 ? { scale: 0.98 } : {}}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor:
              selectedFlags.length === 2 ? '#b87333' : 'rgba(184, 115, 51, 0.3)',
            color: selectedFlags.length === 2 ? '#fff' : 'rgba(255,255,255,0.5)',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: selectedFlags.length === 2 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
            boxShadow:
              selectedFlags.length === 2
                ? '0 4px 12px rgba(184, 115, 51, 0.4)'
                : 'none',
          }}
        >
          <Route size={18} />
          {selectedFlags.length === 2
            ? `生成行军路径 (${selectedFlags.length}/2)`
            : `选择战旗生成路径 (${selectedFlags.length}/2)`}
        </motion.button>

        <motion.button
          onClick={onReset}
          disabled={flags.length === 0}
          whileHover={flags.length > 0 ? { scale: 1.02 } : {}}
          whileTap={flags.length > 0 ? { scale: 0.98 } : {}}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor:
              flags.length > 0 ? 'rgba(231, 76, 60, 0.2)' : 'rgba(231, 76, 60, 0.1)',
            color: flags.length > 0 ? '#e74c3c' : 'rgba(231, 76, 60, 0.3)',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: flags.length > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          <RotateCcw size={16} />
          重置沙盘
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <>
      <motion.div
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          left: 20,
          top: 20,
          bottom: 20,
          width: 280,
          backgroundColor: 'rgba(30, 30, 60, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 12,
          border: '2px solid #c9a96e',
          boxShadow: `
            0 0 0 1px rgba(201, 169, 110, 0.3),
            0 8px 32px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          overflow: 'hidden',
          zIndex: 100,
        }}
        className="desktop-panel"
      >
        {panelContent}
      </motion.div>

      <div className="mobile-panel" style={{ display: 'none' }}>
        <motion.div
          initial={false}
          animate={{ y: isMobileOpen ? 0 : 'calc(100% - 60px)' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: '70vh',
            backgroundColor: 'rgba(30, 30, 60, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px 16px 0 0',
            borderTop: '2px solid #c9a96e',
            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(201, 169, 110, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Flag style={{ color: '#c9a96e' }} size={20} />
              <span style={{ color: '#c9a96e', fontWeight: 600 }}>
                演兵场控制台 ({flags.length}/15)
              </span>
            </div>
            {isMobileOpen ? (
              <ChevronDown style={{ color: '#c9a96e' }} />
            ) : (
              <ChevronUp style={{ color: '#c9a96e' }} />
            )}
          </div>
          {isMobileOpen && <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 60px)' }}>{panelContent}</div>}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-panel {
            display: none !important;
          }
          .mobile-panel {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
