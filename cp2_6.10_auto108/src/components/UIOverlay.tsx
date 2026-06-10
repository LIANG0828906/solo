import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { RING_CONFIGS } from '../types';

const UIOverlay: React.FC = () => {
  const { selectedRing, timeAcceleration, setTimeAcceleration } = useAppStore();

  const selectedRingData = useMemo(() => {
    if (!selectedRing) return null;
    return RING_CONFIGS.find(r => r.name === selectedRing);
  }, [selectedRing]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 100
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '8px',
        padding: '16px',
        pointerEvents: 'auto',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          color: '#e6d5b8',
          fontSize: '14px',
          marginBottom: '12px',
          fontFamily: "'Noto Serif SC', 'SimSun', serif"
        }}>
          时间加速
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={timeAcceleration}
          onChange={(e) => setTimeAcceleration(parseFloat(e.target.value))}
          style={{
            width: '150px',
            height: '6px',
            background: '#3a3a4a',
            borderRadius: '3px',
            outline: 'none',
            appearance: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none'
          }}
        />
        <div style={{
          color: '#d4c5a0',
          fontSize: '12px',
          marginTop: '8px',
          textAlign: 'center',
          fontFamily: "'Noto Serif SC', 'SimSun', serif"
        }}>
          {timeAcceleration.toFixed(1)}x 倍速
        </div>
      </div>

      {selectedRingData && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.75)',
          border: `2px solid ${selectedRingData.color}`,
          borderRadius: '12px',
          padding: '20px 30px',
          pointerEvents: 'auto',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 0 30px ${selectedRingData.color}60`,
          animation: 'fadeIn 0.3s ease',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            color: selectedRingData.color,
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '10px',
            textAlign: 'center',
            fontFamily: "'Noto Serif SC', 'SimSun', serif",
            textShadow: `0 0 10px ${selectedRingData.color}`
          }}>
            {selectedRingData.name}
          </div>
          <div style={{
            color: '#e6d5b8',
            fontSize: '16px',
            textAlign: 'center',
            fontFamily: "'Noto Serif SC', 'SimSun', serif",
            lineHeight: '1.6'
          }}>
            {selectedRingData.description}
          </div>
          <div style={{
            color: '#a09080',
            fontSize: '12px',
            marginTop: '12px',
            textAlign: 'center',
            fontFamily: "'Noto Serif SC', 'SimSun', serif"
          }}>
            点击其他环圈或空白处关闭
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '8px',
        padding: '12px 16px',
        pointerEvents: 'auto',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          color: '#d4c5a0',
          fontSize: '12px',
          lineHeight: '1.8',
          fontFamily: "'Noto Serif SC', 'SimSun', serif"
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#e6d5b8' }}>
            操作说明
          </div>
          <div>🖱️ 拖拽旋转浑天仪</div>
          <div>🔍 滚轮缩放视角</div>
          <div>👆 点击环圈查看详情</div>
          <div>⭐ 点击星点查看轨迹</div>
          <div>⚡ 右上角调节时间流速</div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        pointerEvents: 'none'
      }}>
        <div style={{
          color: '#e6d5b8',
          fontSize: '28px',
          fontWeight: 'bold',
          fontFamily: "'Noto Serif SC', 'SimSun', serif",
          textShadow: '0 0 20px rgba(230, 213, 184, 0.5)',
          letterSpacing: '4px'
        }}>
          浑天仪
        </div>
        <div style={{
          color: '#a09080',
          fontSize: '14px',
          marginTop: '4px',
          fontFamily: "'Noto Serif SC', 'SimSun', serif",
          fontStyle: 'italic'
        }}>
          浑天如鸡子，地如卵中黄
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e6d5b8;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(230, 213, 184, 0.5);
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          background: #ffd700;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
          transform: scale(1.1);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e6d5b8;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(230, 213, 184, 0.5);
        }
        
        @media (max-width: 1024px) {
          div[style*="bottom: 20px"] {
            padding: 8px 12px !important;
          }
          div[style*="top: 20px"] {
            padding: 8px 12px !important;
          }
          div[style*="fontSize: 12px"] {
            fontSize: 11px !important;
          }
          div[style*="fontSize: 28px"] {
            fontSize: 22px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UIOverlay;
