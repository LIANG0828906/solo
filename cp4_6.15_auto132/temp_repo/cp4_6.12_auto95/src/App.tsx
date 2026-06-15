import React, { useEffect, useRef, useMemo } from 'react';
import { PetCanvas, PetCanvasRef } from './components/PetCanvas';
import { ControlPanel } from './components/ControlPanel';
import { AttributeBars } from './components/AttributeBars';
import { WarningBanner } from './components/WarningBanner';
import { usePetStore } from './store/petStore';
import { ATTRIBUTE_THRESHOLDS } from './types/pet';

const App: React.FC = () => {
  const {
    pet,
    battle,
    isWarning,
    startDecayLoop,
    stopDecayLoop,
    hideLevelUp,
  } = usePetStore();

  const canvasRef = useRef<PetCanvasRef>(null);

  useEffect(() => {
    startDecayLoop();
    return () => stopDecayLoop();
  }, [startDecayLoop, stopDecayLoop]);

  const warningMessages = useMemo(() => {
    const messages: string[] = [];
    if (pet.hunger < ATTRIBUTE_THRESHOLDS.warning) {
      messages.push('宠物很饿！请尽快喂食');
    }
    if (pet.mood < ATTRIBUTE_THRESHOLDS.warning) {
      messages.push('宠物心情不好！陪它玩耍吧');
    }
    if (pet.energy < ATTRIBUTE_THRESHOLDS.warning) {
      messages.push('宠物活力不足！让它休息');
    }
    return messages;
  }, [pet.hunger, pet.mood, pet.energy]);

  useEffect(() => {
    if (battle.showLevelUp && battle.levelUpTimer > 0) {
      const timer = setTimeout(() => {
        hideLevelUp();
      }, battle.levelUpTimer);
      return () => clearTimeout(timer);
    }
  }, [battle.showLevelUp, battle.levelUpTimer, hideLevelUp]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        padding: '24px 16px',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .app-layout {
            flex-direction: column !important;
          }
          .control-panel-section {
            width: 100% !important;
          }
          .canvas-section {
            width: 100% !important;
            align-items: center !important;
          }
        }
        @media (min-width: 1024px) {
          .app-container {
            max-width: 1100px;
          }
        }
      `}</style>

      <div
        className="app-container"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 800,
              color: '#ffffff',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              letterSpacing: '-0.5px',
            }}
          >
            🐲 像素宠物竞技场 ✨
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 'clamp(12px, 2vw, 14px)',
              color: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            养成你的专属宠物，与其他玩家一较高下！
          </p>
        </div>

        <WarningBanner visible={isWarning} messages={warningMessages} />

        {isWarning && (
          <div style={{ height: '12px' }} />
        )}

        <div
          className="app-layout"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '24px',
            alignItems: 'flex-start',
          }}
        >
          <div
            className="canvas-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: '1 1 60%',
              width: '60%',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              <PetCanvas
                ref={canvasRef}
                pet={pet}
                isWarning={isWarning}
                isBattle={battle.isActive}
                opponent={battle.opponent}
                battleResult={battle.result}
                showingBattleResult={battle.showingResult}
                showLevelUp={battle.showLevelUp}
              />
            </div>

            <div style={{ width: '100%', maxWidth: '360px' }}>
              <AttributeBars
                hunger={pet.hunger}
                mood={pet.mood}
                energy={pet.energy}
                intelligence={pet.intelligence}
              />
            </div>
          </div>

          <div
            className="control-panel-section"
            style={{
              flex: '1 1 40%',
              width: '40%',
              minWidth: '280px',
            }}
          >
            <ControlPanel />
          </div>
        </div>

        <div
          style={{
            marginTop: '24px',
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
          }}
        >
          <h4
            style={{
              margin: '0 0 10px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#1e293b',
            }}
          >
            📖 游戏说明
          </h4>
          <ul
            style={{
              margin: 0,
              padding: '0 0 0 20px',
              fontSize: '12px',
              color: '#475569',
              lineHeight: 1.8,
            }}
          >
            <li>
              <strong>🍞 喂食</strong>：增加饥饿度 +15，略微提升心情和活力
            </li>
            <li>
              <strong>💧 清洁</strong>：提升心情值 +10，消耗少量活力
            </li>
            <li>
              <strong>⚽ 玩耍</strong>：大幅提升心情 +18，获得 20 经验值
            </li>
            <li>
              <strong>📖 训练</strong>：提升智力 +12，获得 35 经验值
            </li>
            <li>
              <strong>⚔️ 对战</strong>：消耗活力 20，胜利获得 100 经验值并升级！
            </li>
            <li style={{ color: '#6366f1' }}>
              💡 每 30 秒属性会自动衰减，请及时照顾你的宠物哦~
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
