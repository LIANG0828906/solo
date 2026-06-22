import React from 'react';
import { motion } from 'framer-motion';
import { useLampStore } from '../store/lampStore';

export const ControlPanel: React.FC = () => {
  const { speed, brightness, setSpeed, setBrightness } = useLampStore();

  const rotationPeriod = ((100 - speed) / 90) * 9 + 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '16px',
        background: 'linear-gradient(180deg, #f5e6cc 0%, #e8d5b0 100%)',
        borderRadius: '8px',
        border: '2px solid #8b5e3c',
        boxShadow: 'inset 0 0 30px rgba(139, 94, 60, 0.2)',
        height: '100%'
      }}
    >
      <h3
        style={{
          fontFamily: "'Ma Shan Zheng', cursive",
          color: '#5d4037',
          fontSize: '20px',
          margin: '0 0 8px 0',
          textAlign: 'center',
          borderBottom: '2px solid #8b5e3c',
          paddingBottom: '8px'
        }}
      >
        灯芯调控
      </h3>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}
        >
          <label
            style={{
              color: '#5d4037',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            气流速度
          </label>
          <span
            style={{
              color: '#e65100',
              fontSize: '12px',
              background: 'rgba(255, 183, 77, 0.3)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}
          >
            {rotationPeriod.toFixed(1)}秒/圈
          </span>
        </div>

        <div
          style={{
            position: 'relative',
            height: '40px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg width="100%" height="24" viewBox="0 0 200 24">
            <defs>
              <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#81c784" />
                <stop offset="50%" stopColor="#ffb74d" />
                <stop offset="100%" stopColor="#e64a19" />
              </linearGradient>
            </defs>
            <rect x="0" y="10" width="200" height="4" rx="2" fill="url(#speedGradient)" opacity="0.3" />
            <rect x="0" y="10" width={speed * 2} height="4" rx="2" fill="url(#speedGradient)" />
          </svg>

          <motion.div
            style={{
              position: 'absolute',
              left: `calc(${speed}% - 12px)`,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff8f00 0%, #e65100 100%)',
              border: '3px solid #fff',
              boxShadow: '0 2px 8px rgba(230, 81, 0, 0.5)',
              cursor: 'pointer',
              top: '50%',
              transform: 'translateY(-50%)'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />

          <input
            type="range"
            min="0"
            max="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
              padding: 0
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#6d4c41',
            marginTop: '4px'
          }}
        >
          <span>舒缓</span>
          <span>急促</span>
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}
        >
          <label
            style={{
              color: '#5d4037',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            光晕亮度
          </label>
          <span
            style={{
              color: '#ff6f00',
              fontSize: '12px',
              background: 'rgba(255, 183, 77, 0.3)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}
          >
            {brightness}%
          </span>
        </div>

        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            margin: '0 auto'
          }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120">
            <defs>
              <radialGradient id="knobGlow">
                <stop offset="0%" stopColor="#ffb74d" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ffb74d" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="58" fill="url(#knobGlow)" opacity={brightness / 100} />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#d7ccc8"
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#ff8f00"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(brightness / 100) * 314} 314`}
              strokeDashoffset="78.5"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 0.1s ease' }}
            />
            <circle
              cx="60"
              cy="60"
              r="40"
              fill="url(#woodGradient)"
              stroke="#5d4037"
              strokeWidth="2"
            />
            <defs>
              <radialGradient id="woodGradient">
                <stop offset="0%" stopColor="#a1887f" />
                <stop offset="50%" stopColor="#8d6e63" />
                <stop offset="100%" stopColor="#6d4c41" />
              </radialGradient>
            </defs>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = 60 + Math.cos(angle) * 42;
              const y1 = 60 + Math.sin(angle) * 42;
              const x2 = 60 + Math.cos(angle) * 46;
              const y2 = 60 + Math.sin(angle) * 46;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={i % 3 === 0 ? '#5d4037' : '#8d6e63'}
                  strokeWidth={i % 3 === 0 ? 2 : 1}
                />
              );
            })}
            <line
              x1="60"
              y1="60"
              x2={60 + Math.sin((brightness / 100) * 2 * Math.PI) * 28}
              y2={60 - Math.cos((brightness / 100) * 2 * Math.PI) * 28}
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ transition: 'all 0.1s ease' }}
            />
            <circle cx="60" cy="60" r="5" fill="#fff" />
          </svg>

          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
              padding: 0
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#6d4c41',
            marginTop: '8px'
          }}
        >
          <span>幽暗</span>
          <span>明亮</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: '12px',
          background: 'rgba(139, 94, 60, 0.1)',
          borderRadius: '6px',
          border: '1px dashed #8b5e3c'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: '#5d4037',
            textAlign: 'center',
            lineHeight: '1.6'
          }}
        >
          <div style={{ marginBottom: '4px' }}>🏮 月华轩制灯秘法</div>
          <div style={{ fontSize: '11px', color: '#6d4c41' }}>
            调气流则灯转疾缓，控亮度则光影明灭。
            画屏有序，光影无穷，此乃走马灯之妙也。
          </div>
        </div>
      </div>
    </div>
  );
};
