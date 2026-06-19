import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ElixirPanel,
  TopStatusBar,
  MonsterCard,
  BattleArena,
  ChainProductBar,
  GameOverlay,
} from './uiComponents';
import { generateMonster, type Monster } from './monsterSystem';
import {
  applyMonsterAttack,
  createInitialPlayerState,
  isPlayerDefeated,
  simulateCombat,
  type CombatResult,
  type PlayerState,
} from './combatSimulator';
import type { ElementType } from './elixirSystem';
import type { ChainProduct } from './elixirSystem';

type GamePhase =
  | 'selecting'
  | 'animating'
  | 'monster_turn'
  | 'wave_cleared'
  | 'victory'
  | 'defeat';

const TOTAL_WAVES = 5;
const MAX_TIME = 30;
const PLAYER_MAX_HP = 100;
const MIN_SLOTS = 3;
const MAX_SLOTS = 5;

type ChainHistoryItem = {
  product: ChainProduct;
  damage: number;
  weakness: number;
};

const App: React.FC = () => {
  const [wave, setWave] = useState<number>(1);
  const [turn, setTurn] = useState<number>(1);
  const [monster, setMonster] = useState<Monster>(() => generateMonster(1));
  const [player, setPlayer] = useState<PlayerState>(() => createInitialPlayerState(PLAYER_MAX_HP));
  const [phase, setPhase] = useState<GamePhase>('selecting');
  const [timeLeft, setTimeLeft] = useState<number>(MAX_TIME);
  const [selectedSequence, setSelectedSequence] = useState<ElementType[]>([]);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [animatingStep, setAnimatingStep] = useState<number | null>(null);
  const [monsterShaking, setMonsterShaking] = useState<boolean>(false);
  const [monsterFlash, setMonsterFlash] = useState<boolean>(false);
  const [chainHistory, setChainHistory] = useState<ChainHistoryItem[]>([]);
  const [overlayPhase, setOverlayPhase] = useState<'wave_cleared' | 'victory' | 'defeat' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(MAX_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const triggerShakeAndFlash = useCallback(() => {
    setMonsterShaking(true);
    setMonsterFlash(true);
    setTimeout(() => setMonsterShaking(false), 500);
    setTimeout(() => setMonsterFlash(false), 500);
  }, []);

  const executeSequence = useCallback((sequence: ElementType[]) => {
    const result = simulateCombat(sequence, monster);
    setCombatResult(result);
    setPhase('animating');

    const newHistory: ChainHistoryItem[] = [];
    for (const step of result.steps) {
      if (step.output) {
        newHistory.push({
          product: step.output,
          damage: step.finalDamage,
          weakness: step.weaknessHit.length,
        });
      }
    }
    if (newHistory.length > 0) {
      setChainHistory((prev) => [...prev, ...newHistory]);
    }

    if (result.steps.length === 0) {
      setAnimatingStep(null);
      setMonster(result.monsterAfter);
      if (result.monsterDefeated) {
        handleWaveCleared();
      } else {
        handleMonsterTurn(result.monsterAfter);
      }
      return;
    }

    setAnimatingStep(0);
  }, [monster]);

  const onArenaStepDone = useCallback(() => {
    setCombatResult((prevResult) => {
      if (!prevResult) return prevResult;
      const currentIdx = animatingStep;
      if (currentIdx === null) return prevResult;

      triggerShakeAndFlash();

      const step = prevResult.steps[currentIdx];
      const newMonster = applyStepDamage(monster, step.finalDamage);
      setMonster(newMonster);

      const next = currentIdx + 1;
      if (next < prevResult.steps.length) {
        setTimeout(() => setAnimatingStep(next), 400);
        return prevResult;
      }

      setTimeout(() => {
        setAnimatingStep(null);
        if (isMonsterDead(newMonster)) {
          handleWaveCleared();
        } else {
          handleMonsterTurn(newMonster);
        }
      }, 800);
      return prevResult;
    });
  }, [animatingStep, monster, triggerShakeAndFlash]);

  const applyStepDamage = (m: Monster, dmg: number): Monster => {
    return { ...m, currentHp: Math.max(0, m.currentHp - dmg) };
  };

  const isMonsterDead = (m: Monster): boolean => m.currentHp <= 0;

  const handleWaveCleared = useCallback(() => {
    setPhase('wave_cleared');
    if (wave >= TOTAL_WAVES) {
      setOverlayPhase('victory');
    } else {
      setOverlayPhase('wave_cleared');
    }
  }, [wave]);

  const handleMonsterTurn = useCallback((currentMonster: Monster) => {
    setPhase('monster_turn');
    setTimeout(() => {
      setPlayer((prev) => {
        const after = applyMonsterAttack(prev, currentMonster);
        if (isPlayerDefeated(after)) {
          setPhase('defeat');
          setOverlayPhase('defeat');
          return after;
        }
        setTurn((t) => t + 1);
        setSelectedSequence([]);
        setCombatResult(null);
        setPhase('selecting');
        startTimer();
        return after;
      });
    }, 1100);
  }, [startTimer]);

  const handleSelectElixir = useCallback((el: ElementType) => {
    setSelectedSequence((prev) => {
      if (prev.length >= MAX_SLOTS) return prev;
      return [...prev, el];
    });
  }, []);

  const handleRemoveAt = useCallback((idx: number) => {
    setSelectedSequence((prev) => {
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    setSelectedSequence([]);
  }, []);

  const handleConfirm = useCallback(() => {
    if (phase !== 'selecting') return;
    if (selectedSequence.length < MIN_SLOTS) return;
    clearTimer();
    executeSequence(selectedSequence);
  }, [phase, selectedSequence, clearTimer, executeSequence]);

  useEffect(() => {
    if (phase !== 'selecting') return;
    if (timeLeft > 0) return;
    if (selectedSequence.length >= MIN_SLOTS) {
      executeSequence(selectedSequence);
    } else {
      handleClear();
      handleMonsterTurn(monster);
    }
  }, [timeLeft, phase, selectedSequence, executeSequence, handleClear, handleMonsterTurn, monster]);

  const handleWaveContinue = useCallback(() => {
    if (wave >= TOTAL_WAVES) {
      setOverlayPhase(null);
      return;
    }
    const nextWave = wave + 1;
    setWave(nextWave);
    setTurn(1);
    setMonster(generateMonster(nextWave));
    setSelectedSequence([]);
    setCombatResult(null);
    setAnimatingStep(null);
    setPhase('selecting');
    setOverlayPhase(null);
    startTimer();
  }, [wave, startTimer]);

  const handleRestart = useCallback(() => {
    setWave(1);
    setTurn(1);
    setMonster(generateMonster(1));
    setPlayer(createInitialPlayerState(PLAYER_MAX_HP));
    setPhase('selecting');
    setOverlayPhase(null);
    setSelectedSequence([]);
    setCombatResult(null);
    setAnimatingStep(null);
    setChainHistory([]);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimer();
  }, [startTimer]);

  const gameStyles = useMemo<React.CSSProperties>(() => ({
    minHeight: '100vh',
    backgroundColor: '#2E1A0F',
    color: '#F3E5D5',
    fontFamily:
      "'Georgia', 'Times New Roman', 'Hiragino Sans GB', 'Microsoft YaHei', serif",
    display: 'flex',
    flexDirection: 'column',
  }), []);

  const bodyStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
    gap: 16,
    alignItems: 'center',
  };

  const mainRow: React.CSSProperties = {
    display: 'flex',
    gap: 20,
    alignItems: 'stretch',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1500,
    flexWrap: 'wrap',
  };

  const monsterColumn: React.CSSProperties = {
    width: 220,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    flexShrink: 0,
  };

  return (
    <div style={gameStyles}>
      <TopStatusBar
        wave={wave}
        totalWaves={TOTAL_WAVES}
        turn={turn}
        timeLeft={timeLeft}
        maxTime={MAX_TIME}
        playerHp={player.currentHp}
        playerMaxHp={player.maxHp}
      />

      <div style={bodyStyles}>
        <div style={mainRow}>
          <ElixirPanel
            selectedSequence={selectedSequence}
            minSlots={MIN_SLOTS}
            maxSlots={MAX_SLOTS}
            disabled={phase !== 'selecting'}
            onSelect={handleSelectElixir}
            onRemoveAt={handleRemoveAt}
            onConfirm={handleConfirm}
            onClear={handleClear}
          />

          <BattleArena
            animatingStep={animatingStep}
            combatResult={combatResult}
            monster={monster}
            onAllStepsDone={onArenaStepDone}
          />

          <div style={monsterColumn}>
            <MonsterCard
              monster={monster}
              isShaking={monsterShaking}
              isFlashWhite={monsterFlash}
            />
            <div
              style={{
                fontSize: 12,
                padding: 10,
                borderRadius: 10,
                backgroundColor: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,215,150,0.12)',
                lineHeight: 1.7,
                color: '#D7B899',
              }}
            >
              <div style={{ color: '#FFD54F', fontWeight: 800, marginBottom: 4 }}>📖 合成提示</div>
              🔥+❄️ → 蒸汽💨<br />
              💨+⚡ → 雷暴云⛈️<br />
              🔥+💚 → 炼狱🌋<br />
              ❄️+💚 → 暴风雪🌨️<br />
              ⚡+💚 → 等离子🔮<br />
              💚+🌑 → 虚空🕳️
            </div>
          </div>
        </div>

        <ChainProductBar history={chainHistory} />
      </div>

      <GameOverlay
        phase={overlayPhase}
        wave={wave}
        totalWaves={TOTAL_WAVES}
        onContinue={handleWaveContinue}
        onRestart={handleRestart}
      />

      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; min-height: 100vh; }
        body { background-color: #2E1A0F; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,215,150,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,215,150,0.5); }

        @media (max-width: 1024px) {
          .main-row { flex-direction: column !important; align-items: center !important; }
          .elixir-panel { width: 100% !important; max-width: 900px; }
          .elixir-grid { grid-template-columns: repeat(5, 1fr) !important; justify-content: center !important; }
          .monster-column { width: 100% !important; max-width: 900px; flex-direction: row !important; flex-wrap: wrap; }
        }
        @media (max-width: 768px) {
          .battle-arena { width: 100% !important; height: 420px !important; max-height: none !important; }
          .chain-bar-wrapper { width: 100% !important; }
          .top-bar { flex-direction: column; gap: 12px; padding: 12px; }
          .timer-wrapper { order: -1; }
          body { padding: 12px !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
