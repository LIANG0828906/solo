import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PetInstance, RARITY_COLORS, RARITY_LABELS } from '@/data/petData';
import { useUserStore } from '@/stores/userStore';
import { simulateBattle, generateOpponentPet, BattleResult } from '@/engine/battleEngine';
import BattleCanvas from '@/components/BattleCanvas';

export default function Battle() {
  const location = useLocation();
  const navigate = useNavigate();
  const pets = useUserStore((s) => s.pets);
  const addPoints = useUserStore((s) => s.addPoints);

  const petUid = (location.state as { petUid?: string })?.petUid;
  const myPet = useMemo(() => pets.find((p) => p.uid === petUid) ?? pets[0], [pets, petUid]);

  const [opponentPet] = useState<PetInstance>(() => (myPet ? generateOpponentPet(myPet) : null as unknown as PetInstance));
  const [battleResult] = useState<BattleResult | null>(() =>
    myPet ? simulateBattle(myPet, opponentPet) : null
  );
  const [battleDone, setBattleDone] = useState(false);

  useEffect(() => {
    if (battleDone && battleResult) {
      addPoints(battleResult.rewardPoints);
    }
  }, [battleDone, battleResult, addPoints]);

  if (!myPet || !opponentPet || !battleResult) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        没有选择宠物，请返回展柜选择
      </div>
    );
  }

  const myColor = RARITY_COLORS[myPet.rarity];
  const oppColor = RARITY_COLORS[opponentPet.rarity];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#121212',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#aaa',
            padding: '6px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ← 返回
        </button>
        <span
          style={{
            color: '#e0e0e0',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 18,
            fontWeight: 700,
            textShadow: '0 0 8px rgba(240,147,251,0.4)',
          }}
        >
          ⚔️ 对战
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            width: 220,
            padding: 20,
            background: '#2D2D44',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <PetCard pet={myPet} color={myColor} label="我的宠物" />
        </div>

        <div style={{ flex: 1 }}>
          <BattleCanvas
            myPet={myPet}
            opponentPet={opponentPet}
            result={battleResult}
            onFinish={() => {
              setBattleDone(true);
              setTimeout(() => navigate('/'), 0);
            }}
          />
        </div>

        <div
          style={{
            width: 220,
            padding: 20,
            background: '#1E1E2E',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <PetCard pet={opponentPet} color={oppColor} label="对手宠物" />
        </div>
      </div>
    </div>
  );
}

function PetCard({ pet, color, label }: { pet: PetInstance; color: string; label: string }) {
  return (
    <div style={{ textAlign: 'center', color: '#fff' }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{label}</div>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: color,
          margin: '0 auto 8px',
          boxShadow: `0 0 16px ${color}66`,
        }}
      />
      <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Orbitron, sans-serif' }}>
        {pet.name}
      </div>
      <span
        style={{
          display: 'inline-block',
          marginTop: 4,
          padding: '2px 10px',
          borderRadius: 8,
          fontSize: 11,
          background: `${color}22`,
          color,
          border: `1px solid ${color}44`,
        }}
      >
        {RARITY_LABELS[pet.rarity]}
      </span>
      <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>⚔️ 战力: {pet.power}</div>
    </div>
  );
}
