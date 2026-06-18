import React, { useEffect, useState, useCallback } from 'react';
import PetSelect from './components/PetSelect';
import BattleArena from './components/BattleArena';
import type { Pet, PlayerState } from './types';
import {
  createAllPets,
  initPlayerState,
  savePlayerState,
  loadPlayerState,
  resetGameData,
  feedPet,
} from './gameEngine';

type Screen = 'select' | 'manage' | 'battle';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('select');
  const [playerState, setPlayerState] = useState<PlayerState>(() => initPlayerState());
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);

  useEffect(() => {
    const saved = loadPlayerState();
    if (saved) {
      setPlayerState(saved);
      if (saved.teamIndices.length > 0) {
        setSelectedIndices(saved.teamIndices);
      }
    } else {
      const fresh: PlayerState = {
        pets: createAllPets(),
        teamIndices: [],
        feedCount: 0,
        feedDate: new Date().toISOString().split('T')[0],
      };
      setPlayerState(fresh);
    }
  }, []);

  useEffect(() => {
    savePlayerState(playerState);
  }, [playerState]);

  const handleSelect = useCallback(
    (index: number) => {
      setSelectedIndices((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index);
        }
        if (prev.length >= 3) return prev;
        return [...prev, index];
      });
    },
    []
  );

  const handleConfirmTeam = useCallback(() => {
    if (selectedIndices.length === 0) return;
    setPlayerState((prev) => ({ ...prev, teamIndices: [...selectedIndices] }));
    setCurrentPetIndex(selectedIndices[0]);
    setScreen('manage');
  }, [selectedIndices]);

  const handleStartBattle = useCallback(() => {
    if (playerState.teamIndices.length === 0) return;
    setScreen('battle');
  }, [playerState.teamIndices]);

  const handleBackToManage = useCallback(() => {
    setScreen('manage');
  }, []);

  const handleBattleEnd = useCallback(
    (winner: 'player' | 'enemy', updatedTeam: Pet[]) => {
      setPlayerState((prev) => {
        const newPets = [...prev.pets];
        updatedTeam.forEach((battlePet) => {
          const idx = newPets.findIndex((p) => p.id === battlePet.id);
          if (idx !== -1) {
            newPets[idx] = battlePet;
          }
        });
        return { ...prev, pets: newPets };
      });
      setScreen('manage');
    },
    []
  );

  const handleFeed = useCallback(() => {
    const pet = playerState.pets[currentPetIndex];
    if (!pet) return;
    const result = feedPet(pet, playerState.feedCount, playerState.feedDate);
    if (!result.success) {
      return;
    }
    setPlayerState((prev) => {
      const newPets = [...prev.pets];
      newPets[currentPetIndex] = result.pet;
      return {
        ...prev,
        pets: newPets,
        feedCount: result.newFeedCount,
        feedDate: result.newFeedDate,
      };
    });
  }, [currentPetIndex, playerState]);

  const handleReset = useCallback(() => {
    resetGameData();
    window.location.reload();
  }, []);

  const remainingFeeds = (() => {
    const today = new Date().toISOString().split('T')[0];
    return playerState.feedDate === today ? Math.max(0, 5 - playerState.feedCount) : 5;
  })();

  return (
    <>
      {screen === 'select' && (
        <PetSelect
          pets={playerState.pets}
          selectedIndices={selectedIndices}
          onSelect={handleSelect}
          onConfirm={handleConfirmTeam}
        />
      )}

      {screen === 'manage' && (
        <ManageScreen
          playerState={playerState}
          currentPetIndex={currentPetIndex}
          setCurrentPetIndex={setCurrentPetIndex}
          onStartBattle={handleStartBattle}
          onFeed={handleFeed}
          remainingFeeds={remainingFeeds}
          onShowReset={() => setShowResetModal(true)}
          onBackToSelect={() => setScreen('select')}
        />
      )}

      {screen === 'battle' && (
        <BattleArena
          playerTeam={playerState.teamIndices.map((i) => playerState.pets[i]).filter(Boolean)}
          onBattleEnd={handleBattleEnd}
          onFlee={handleBackToManage}
        />
      )}

      {showResetModal && (
        <ResetModal
          onCancel={() => setShowResetModal(false)}
          onConfirm={handleReset}
        />
      )}
    </>
  );
};

// ---------------- ManageScreen ----------------

interface ManageScreenProps {
  playerState: PlayerState;
  currentPetIndex: number;
  setCurrentPetIndex: (i: number) => void;
  onStartBattle: () => void;
  onFeed: () => void;
  remainingFeeds: number;
  onShowReset: () => void;
  onBackToSelect: () => void;
}

const ManageScreen: React.FC<ManageScreenProps> = ({
  playerState,
  currentPetIndex,
  setCurrentPetIndex,
  onStartBattle,
  onFeed,
  remainingFeeds,
  onShowReset,
  onBackToSelect,
}) => {
  const pet = playerState.pets[currentPetIndex];
  if (!pet) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 30% 20%, #16213e50 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, #0f346050 0%, transparent 50%),
          linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #16213e 100%)
        `,
        fontFamily: 'Nunito, sans-serif',
        color: '#e0e1dd',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <h1
          style={{
            fontFamily: 'Cinzel, serif',
            fontWeight: 900,
            fontSize: '36px',
            background: 'linear-gradient(135deg, #ffd700, #f0a500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '3px',
            margin: 0,
          }}
        >
          宠物管理
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBackToSelect}
            style={{
              background: 'linear-gradient(135deg, #1f4068, #16213e)',
              color: '#e0e1dd',
              border: '1px solid #e0e1dd30',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '14px',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ← 重新选队
          </button>
          <button
            onClick={onShowReset}
            style={{
              background: 'linear-gradient(135deg, #5a1a1a, #1a1a2e)',
              color: '#ff9a9a',
              border: '1px solid #ff6b6b40',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '14px',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            重置进度
          </button>
        </div>
      </div>

      {/* Team selector */}
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          gap: '16px',
          marginBottom: '32px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {playerState.teamIndices.map((petIdx, slot) => {
          const p = playerState.pets[petIdx];
          if (!p) return null;
          const selected = petIdx === currentPetIndex;
          return (
            <div
              key={p.id}
              onClick={() => setCurrentPetIndex(petIdx)}
              style={{
                background: `linear-gradient(180deg, #1f406860, #1b1c20)`,
                borderRadius: '16px',
                border: selected ? '2px solid #ffd700' : '2px solid #e0e1dd20',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                width: '110px',
                transition: 'all 0.25s ease',
                boxShadow: selected ? '0 0 16px #ffd70040' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <PetMini element={p.element} />
              <span style={{ fontSize: '12px', fontWeight: 700 }}>{p.name}</span>
              <span style={{ fontSize: '11px', color: '#a0a0b0' }}>LV.{p.level}</span>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: '#0d1117',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(p.currentHp / p.maxHp) * 100}%`,
                    height: '100%',
                    background: '#e63946',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '10px', color: '#a0a0b0' }}>
                {p.currentHp}/{p.maxHp}
              </span>
              <div style={{ fontSize: '10px', color: '#a0a0b0' }}>槽位 {slot + 1}</div>
            </div>
          );
        })}
      </div>

      {/* Pet detail card */}
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          background: `
            linear-gradient(180deg, #1f406840 0%, #1b1c20 100%)
          `,
          borderRadius: '24px',
          border: '2px solid #e0e1dd15',
          padding: '32px',
          display: 'grid',
          gridTemplateColumns: '200px 1fr auto',
          gap: '32px',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <PetBig element={pet.element} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '28px' }}>
              {pet.name}
            </h2>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                background: `linear-gradient(90deg, ${elementColor(pet.element)}40, ${elementColor(pet.element)}20)`,
                border: `1px solid ${elementColor(pet.element)}80`,
                color: elementColor(pet.element),
              }}
            >
              {elementName(pet.element)} · LV.{pet.level}
            </span>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', color: '#a0a0b0', marginBottom: '4px' }}>
              EXP: {pet.exp} / {(pet.level) * 50 + 100}
            </div>
            <div
              style={{
                height: '8px',
                background: '#0d1117',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #ffffff10',
              }}
            >
              <div
                style={{
                  width: `${(pet.exp / ((pet.level) * 50 + 100)) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 8px #6366f180',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px' }}>
            <StatRow label="HP" value={pet.currentHp} max={pet.maxHp} color="#e63946" />
            <StatRow label="攻击" value={pet.attack} max={30} color="#fb8500" />
            <StatRow label="防御" value={pet.defense} max={30} color="#457b9d" />
            <StatRow label="速度" value={pet.speed} max={30} color="#2d6a4f" />
            <StatRow label="怒气" value={pet.rage} max={100} color="#ffd700" />
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '13px', color: '#a0a0b0', marginBottom: '8px', letterSpacing: '1px' }}>
              已解锁技能：
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {pet.skills.map((s, i) => (
                <div
                  key={s.name}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${skillColor(i)}30, ${skillColor(i)}10)`,
                    border: `1px solid ${skillColor(i)}60`,
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {s.name}
                  <span style={{ marginLeft: '6px', color: '#a0a0b0', fontSize: '11px' }}>
                    ×{s.coefficient}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            onClick={onFeed}
            disabled={remainingFeeds === 0 || pet.currentHp >= pet.maxHp}
            style={{
              background:
                remainingFeeds > 0 && pet.currentHp < pet.maxHp
                  ? 'linear-gradient(135deg, #06d6a0, #06a37e)'
                  : '#1b1c20',
              color: remainingFeeds > 0 && pet.currentHp < pet.maxHp ? '#fff' : '#555',
              border:
                remainingFeeds > 0 && pet.currentHp < pet.maxHp
                  ? '1px solid #06d6a080'
                  : '1px solid #333',
              borderRadius: '14px',
              padding: '14px 24px',
              fontSize: '14px',
              fontWeight: 800,
              fontFamily: 'Nunito, sans-serif',
              cursor:
                remainingFeeds > 0 && pet.currentHp < pet.maxHp ? 'pointer' : 'not-allowed',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (remainingFeeds > 0 && pet.currentHp < pet.maxHp) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px #06d6a040';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🍖 喂食 +25%HP
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              剩余 {remainingFeeds}/5 次
            </div>
          </button>

          <button
            onClick={onStartBattle}
            disabled={playerState.teamIndices.length === 0 || pet.currentHp <= 0}
            style={{
              background:
                playerState.teamIndices.length > 0 && pet.currentHp > 0
                  ? 'linear-gradient(135deg, #ffd70030, #0f3460, #16213e, #ffd70020)'
                  : '#1b1c20',
              color:
                playerState.teamIndices.length > 0 && pet.currentHp > 0 ? '#ffd700' : '#555',
              border:
                playerState.teamIndices.length > 0 && pet.currentHp > 0
                  ? '2px solid #ffd70060'
                  : '2px solid #333',
              borderRadius: '14px',
              padding: '18px 32px',
              fontSize: '16px',
              fontWeight: 800,
              fontFamily: 'Nunito, sans-serif',
              cursor:
                playerState.teamIndices.length > 0 && pet.currentHp > 0 ? 'pointer' : 'not-allowed',
              letterSpacing: '2px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              animation:
                playerState.teamIndices.length > 0 && pet.currentHp > 0
                  ? 'battleBtnGlow 2s ease-in-out infinite'
                  : 'none',
            }}
            onMouseEnter={(e) => {
              if (playerState.teamIndices.length > 0 && pet.currentHp > 0) {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 10px 28px #ffd70040';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ⚔ 开始战斗
          </button>
        </div>
      </div>

      <style>{`
        @keyframes battleBtnGlow {
          0%, 100% { box-shadow: 0 0 8px #ffd70030; }
          50% { box-shadow: 0 0 20px #ffd70070; }
        }
      `}</style>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: number; max: number; color: string }> = ({
  label,
  value,
  max,
  color,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '6px 0',
    }}
  >
    <span style={{ width: '48px', fontSize: '13px', color: '#a0a0b0', fontWeight: 700 }}>
      {label}
    </span>
    <div
      style={{
        flex: 1,
        height: '10px',
        background: '#0d1117',
        borderRadius: '5px',
        overflow: 'hidden',
        border: '1px solid #ffffff10',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}90, ${color})`,
          borderRadius: '5px',
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 6px ${color}80`,
        }}
      />
    </div>
    <span style={{ width: '72px', textAlign: 'right', fontSize: '13px', fontWeight: 800 }}>
      {value}{label === 'HP' ? `/${max}` : ''}
    </span>
  </div>
);

const skillColor = (i: number) => ['#fb8500', '#7209b7', '#4361ee', '#06d6a0'][i % 4];

const elementColor = (el: string) => {
  const map: Record<string, string> = {
    fire: '#e63946',
    water: '#457b9d',
    grass: '#2d6a4f',
    electric: '#ffb703',
    wind: '#a8dadc',
    earth: '#bc6c25',
  };
  return map[el] || '#fff';
};

const elementName = (el: string) => {
  const map: Record<string, string> = {
    fire: '火系',
    water: '水系',
    grass: '草系',
    electric: '电系',
    wind: '风系',
    earth: '土系',
  };
  return map[el] || '未知';
};

import type { ElementType } from './types';

const PetMini: React.FC<{ element: ElementType }> = ({ element }) => {
  const color = elementColor(element);
  return (
    <div
      style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 40% 35%, ${color}ee 0%, ${color}88 100%)`,
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 12px ${color}60`,
      }}
    >
      <svg width="36" height="36" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="45" fill={color} opacity="0.4" />
      </svg>
    </div>
  );
};

const PetBig: React.FC<{ element: ElementType }> = ({ element }) => {
  const color = elementColor(element);
  const scopeId = React.useId().replace(/:/g, '');
  const className = `pet-big-breath-${scopeId}`;
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '180px',
        height: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}60 0%, transparent 65%)`,
          filter: 'blur(10px)',
        }}
      />
      <div
        style={{
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${color}ee 0%, ${color}66 60%, ${color}44 100%)`,
          border: `3px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          boxShadow: `inset 0 0 30px ${color}80, 0 0 30px ${color}50`,
        }}
      >
        <svg width="100" height="100" viewBox="0 0 120 120">
          <circle cx="50" cy="55" r="5" fill="#ffffffcc" />
          <circle cx="70" cy="55" r="5" fill="#ffffffcc" />
          <circle cx="51" cy="55" r="2.5" fill="#1a1a2e" />
          <circle cx="71" cy="55" r="2.5" fill="#1a1a2e" />
        </svg>
      </div>
      <style>{`
        @keyframes petBigBreath-${scopeId} {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.15); }
        }
        .${className} { animation: petBigBreath-${scopeId} 2.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// ---------------- ResetModal ----------------

interface ResetModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const ResetModal: React.FC<ResetModalProps> = ({ onCancel, onConfirm }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00000080',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          width: '400px',
          maxWidth: '90vw',
          padding: '24px',
          background: 'linear-gradient(180deg, #16213e, #0d1b2a)',
          borderRadius: '12px',
          border: '1px solid #e0e1dd20',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          fontFamily: 'Nunito, sans-serif',
          color: '#e0e1dd',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px',
            fontFamily: 'Cinzel, serif',
            fontSize: '22px',
            color: '#ffd700',
            letterSpacing: '2px',
          }}
        >
          ⚠ 重置进度
        </h3>
        <p style={{ margin: '0 0 24px', fontSize: '15px', lineHeight: 1.6, color: '#c0c0c0' }}>
          确定要重置所有进度吗？你的宠物和战斗记录将会被删除。
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: '#1b1c20',
              color: '#e0e1dd',
              border: '1px solid #e0e1dd25',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2b30')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1b1c20')}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #e63946, #8b2c3c)',
              color: '#fff',
              border: '1px solid #e6394680',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px #e6394640';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            确定重置
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
