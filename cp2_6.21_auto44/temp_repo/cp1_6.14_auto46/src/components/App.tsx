import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, HUDData, Upgrades } from '../types';
import {
  initGame,
  startGameLoop,
  stopGameLoop,
  startLevel,
  resetGame,
  applyUpgrade,
  handleResize,
} from '../gameLoop';
import HUD from './HUD';

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const menuOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(5, 5, 20, 0.7)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  zIndex: 10,
};

const menuPanel: React.CSSProperties = {
  background: 'rgba(10, 15, 30, 0.85)',
  border: '1px solid rgba(127, 219, 255, 0.3)',
  borderRadius: 16,
  padding: '32px 40px',
  textAlign: 'center',
  boxShadow: '0 0 40px rgba(127, 219, 255, 0.1), inset 0 0 30px rgba(127, 219, 255, 0.03)',
  minWidth: 320,
  maxWidth: 440,
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#7fdbff',
  marginBottom: 8,
  letterSpacing: 2,
  textShadow: '0 0 20px rgba(127, 219, 255, 0.4)',
  fontFamily: '"Consolas", "Courier New", monospace',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'rgba(180, 200, 230, 0.6)',
  marginBottom: 24,
  lineHeight: 1.6,
  fontFamily: '"Consolas", "Courier New", monospace',
};

const sciBtn = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(127, 219, 255, 0.1)',
  border: '1px solid rgba(127, 219, 255, 0.4)',
  borderRadius: 8,
  color: '#7fdbff',
  fontSize: isTouchDevice ? 18 : 15,
  fontWeight: 700,
  padding: isTouchDevice ? '14px 32px' : '10px 24px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: '"Consolas", "Courier New", monospace',
  letterSpacing: 1,
  textShadow: '0 0 8px rgba(127, 219, 255, 0.3)',
  boxShadow: '0 0 12px rgba(127, 219, 255, 0.08)',
  width: '100%',
  marginBottom: 10,
  ...extra,
});

const upgradeRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid rgba(127, 219, 255, 0.1)',
  fontFamily: '"Consolas", "Courier New", monospace',
};

const upgradeName: React.CSSProperties = {
  color: '#c0d0e8',
  fontSize: 13,
  flex: 1,
  textAlign: 'left',
};

const upgradeLevel: React.CSSProperties = {
  color: '#7fdbff',
  fontSize: 12,
  width: 60,
  textAlign: 'center',
};

const upgradeBtn: React.CSSProperties = {
  background: 'rgba(127, 219, 255, 0.15)',
  border: '1px solid rgba(127, 219, 255, 0.3)',
  borderRadius: 4,
  color: '#7fdbff',
  fontSize: 13,
  fontWeight: 700,
  padding: '4px 12px',
  cursor: 'pointer',
  fontFamily: '"Consolas", "Courier New", monospace',
  marginLeft: 8,
};

const upgradeBtnDisabled: React.CSSProperties = {
  ...upgradeBtn,
  opacity: 0.3,
  cursor: 'default',
};

const UPGRADE_LABELS: Record<keyof Upgrades, string> = {
  speed: '移动速度',
  beamRange: '光束范围',
  shieldStrength: '护盾强度',
  energyCapacity: '能量容量',
};

const defaultHUD: HUDData = {
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  shield: 50,
  maxShield: 50,
  collectedCount: 0,
  targetCount: 10,
  level: 1,
  score: 0,
  beamActive: false,
  timeSlowActive: false,
  shieldBoostActive: false,
  upgradePoints: 0,
  upgrades: { speed: 0, beamRange: 0, shieldStrength: 0, energyCapacity: 0 },
  phase: 'menu',
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const [hudData, setHUDData] = useState<HUDData>(defaultHUD);
  const [phase, setPhase] = useState<string>('menu');
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const state = initGame(w, h, isTouchDevice);
    stateRef.current = state;

    startGameLoop(state, canvas, (data: HUDData) => {
      setHUDData(data);
      if (data.phase !== phase) {
        setPhase(data.phase);
        setAnimClass('menu-enter');
      }
    });

    const onResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      canvas.width = nw;
      canvas.height = nh;
      if (stateRef.current) handleResize(stateRef.current, nw, nh);
    };
    window.addEventListener('resize', onResize);

    const onMouseMove = (e: MouseEvent) => {
      if (stateRef.current) {
        stateRef.current.mousePos.x = e.clientX;
        stateRef.current.mousePos.y = e.clientY;
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && stateRef.current && stateRef.current.phase === 'playing') {
        stateRef.current.beamActive = true;
      }
      if (e.key === 'Escape' && stateRef.current) {
        const s = stateRef.current;
        if (s.phase === 'playing') {
          s.phase = 'paused';
          setPhase('paused');
          setAnimClass('menu-enter');
        } else if (s.phase === 'paused') {
          s.phase = 'playing';
          setPhase('playing');
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && stateRef.current) {
        stateRef.current.beamActive = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onTouchStart = (e: TouchEvent) => {
      if (!stateRef.current) return;
      const t = e.touches[0];
      stateRef.current.mousePos.x = t.clientX;
      stateRef.current.mousePos.y = t.clientY;
      if (stateRef.current.phase === 'playing') {
        stateRef.current.beamActive = true;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!stateRef.current) return;
      const t = e.touches[0];
      stateRef.current.mousePos.x = t.clientX;
      stateRef.current.mousePos.y = t.clientY;
    };
    const onTouchEnd = () => {
      if (stateRef.current) stateRef.current.beamActive = false;
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      stopGameLoop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleStart = useCallback(() => {
    if (stateRef.current) {
      resetGame(stateRef.current);
      setPhase('playing');
    }
  }, []);

  const handleResume = useCallback(() => {
    if (stateRef.current && stateRef.current.phase === 'paused') {
      stateRef.current.phase = 'playing';
      setPhase('playing');
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (stateRef.current) {
      resetGame(stateRef.current);
      setPhase('playing');
    }
  }, []);

  const handleNextLevel = useCallback(() => {
    if (stateRef.current) {
      startLevel(stateRef.current);
      setPhase('playing');
    }
  }, []);

  const handleUpgrade = useCallback((key: keyof Upgrades) => {
    if (stateRef.current) {
      applyUpgrade(stateRef.current, key);
      setHUDData({ ...hudData, upgradePoints: stateRef.current.upgradePoints, upgrades: { ...stateRef.current.upgrades } });
    }
  }, [hudData]);

  const renderMenu = () => (
    <div style={menuOverlay} className={animClass}>
      <div style={menuPanel}>
        <div style={titleStyle}>太空垃圾清理</div>
        <div style={subtitleStyle}>
          操控飞船在近地轨道清理太空碎片<br />
          鼠标控制移动 · 回车键发射牵引光束<br />
          {isTouchDevice && '触屏拖拽移动 · 触摸即发射光束'}
        </div>
        <button style={sciBtn()} onClick={handleStart}>开始任务</button>
      </div>
    </div>
  );

  const renderPaused = () => (
    <div style={menuOverlay} className={animClass}>
      <div style={menuPanel}>
        <div style={titleStyle}>暂停</div>
        <button style={sciBtn()} onClick={handleResume}>继续任务</button>
        <button style={sciBtn({ background: 'rgba(255, 68, 102, 0.1)', borderColor: 'rgba(255, 68, 102, 0.4)', color: '#ff4466' })} onClick={handleRestart}>重新开始</button>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div style={menuOverlay} className={animClass}>
      <div style={menuPanel}>
        <div style={{ ...titleStyle, color: '#ff4466', textShadow: '0 0 20px rgba(255, 68, 102, 0.4)' }}>飞船损毁</div>
        <div style={subtitleStyle}>
          关卡 {hudData.level} · 得分 {hudData.score.toLocaleString()}<br />
          清理碎片 {hudData.collectedCount} / {hudData.targetCount}
        </div>
        <button style={sciBtn()} onClick={handleRestart}>重新开始</button>
      </div>
    </div>
  );

  const renderLevelComplete = () => (
    <div style={menuOverlay} className={animClass}>
      <div style={menuPanel}>
        <div style={{ ...titleStyle, color: '#44ff88', textShadow: '0 0 20px rgba(68, 255, 136, 0.4)' }}>关卡完成</div>
        <div style={subtitleStyle}>
          关卡 {hudData.level} 完成 · 得分 {hudData.score.toLocaleString()}
        </div>
        {hudData.upgradePoints > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#ffcc44', fontSize: 13, fontWeight: 700, marginBottom: 10, fontFamily: '"Consolas", "Courier New", monospace' }}>
              可用升级点数: {hudData.upgradePoints}
            </div>
            {(Object.keys(UPGRADE_LABELS) as (keyof Upgrades)[]).map((key) => (
              <div key={key} style={upgradeRow}>
                <span style={upgradeName}>{UPGRADE_LABELS[key]}</span>
                <span style={upgradeLevel}>{'█'.repeat(hudData.upgrades[key])}{'░'.repeat(5 - hudData.upgrades[key])}</span>
                <button
                  style={hudData.upgradePoints > 0 && hudData.upgrades[key] < 5 ? upgradeBtn : upgradeBtnDisabled}
                  onClick={() => handleUpgrade(key)}
                >
                  +1
                </button>
              </div>
            ))}
          </div>
        )}
        <button style={sciBtn({ background: 'rgba(68, 255, 136, 0.1)', borderColor: 'rgba(68, 255, 136, 0.4)', color: '#44ff88' })} onClick={handleNextLevel}>
          下一关
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
      />
      <HUD data={hudData} />
      {phase === 'menu' && renderMenu()}
      {phase === 'paused' && renderPaused()}
      {phase === 'gameover' && renderGameOver()}
      {phase === 'levelcomplete' && renderLevelComplete()}
      <style>{`
        @keyframes menuEnter {
          0% { opacity: 0; transform: scale(0.85); }
          60% { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        .menu-enter {
          animation: menuEnter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        button:hover {
          background: rgba(127, 219, 255, 0.2) !important;
          box-shadow: 0 0 20px rgba(127, 219, 255, 0.15) !important;
        }
        button:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
};

export default App;
