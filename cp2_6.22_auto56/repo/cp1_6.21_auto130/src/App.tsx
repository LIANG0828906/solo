import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PokemonData, POKEMON_CATALOG, createPokemon, Position } from './types';
import { calculateDamage, buildLogEntry, formatLogMessage, isAdjacent } from './BattleEngine';
import { Board } from './Board';
import { CharacterSelector } from './CharacterSelector';
import { saveBattleRecord } from './api';

type GamePhase = 'select' | 'move' | 'battle' | 'result';

interface TypewriterState {
  fullText: string;
  displayed: string;
  done: boolean;
}

export const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('select');
  const [playerPokemon, setPlayerPokemon] = useState<PokemonData | null>(null);
  const [aiPokemon, setAiPokemon] = useState<PokemonData | null>(null);
  const [playerPos, setPlayerPos] = useState<Position>({ row: 7, col: 0 });
  const [aiPos, setAiPos] = useState<Position>({ row: 0, col: 7 });
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [typewriter, setTypewriter] = useState<TypewriterState>({ fullText: '', displayed: '', done: true });
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [battleRound, setBattleRound] = useState(0);
  const [isBattleAnimating, setIsBattleAnimating] = useState(false);
  const twRef = useRef<number | null>(null);
  const charIndexRef = useRef(0);

  const handleSelect = useCallback((pokemon: PokemonData) => {
    setPlayerPokemon(pokemon);
    const remaining = POKEMON_CATALOG.filter(p => p.id !== pokemon.id);
    const aiChoice = remaining[Math.floor(Math.random() * remaining.length)];
    setAiPokemon(createPokemon(aiChoice));
    setPhase('move');
  }, []);

  const handleMove = useCallback((newPos: Position) => {
    if (!playerPokemon || !aiPokemon) return;
    setPlayerPos(newPos);
    if (isAdjacent(newPos.row, newPos.col, aiPos.row, aiPos.col)) {
      setPhase('battle');
      setIsPlayerTurn(true);
      setBattleLogs([]);
      setBattleRound(0);
    }
  }, [playerPokemon, aiPokemon, aiPos]);

  const typewrite = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      charIndexRef.current = 0;
      setTypewriter({ fullText: text, displayed: '', done: false });

      const tick = () => {
        charIndexRef.current += 1;
        const idx = charIndexRef.current;
        setTypewriter(prev => ({
          ...prev,
          displayed: prev.fullText.slice(0, idx),
          done: idx >= prev.fullText.length,
        }));
        if (idx < text.length) {
          twRef.current = requestAnimationFrame(() => {
            setTimeout(tick, 50);
          });
        } else {
          resolve();
        }
      };
      twRef.current = requestAnimationFrame(() => {
        setTimeout(tick, 50);
      });
    });
  }, []);

  const executeAttack = useCallback(async (
    attacker: PokemonData,
    defender: PokemonData,
    skillIndex: number,
    isPlayer: boolean
  ) => {
    if (!playerPokemon || !aiPokemon) return;
    const skill = attacker.skills[skillIndex];
    const result = calculateDamage(attacker, defender, skill);
    const log = buildLogEntry(attacker.name, skill.name, result, defender.name, result.remainingHp, defender.maxHp);
    const message = formatLogMessage(log);

    setIsBattleAnimating(true);
    await typewrite(message);

    if (isPlayer) {
      const newAi = { ...aiPokemon, hp: result.remainingHp };
      setAiPokemon(newAi);
      if (result.remainingHp <= 0) {
        setWinner('player');
        setPhase('result');
        saveBattleRecord({
          playerPokemon: playerPokemon.name,
          aiPokemon: aiPokemon.name,
          winner: 'player',
          rounds: battleRound + 1,
        });
        setIsBattleAnimating(false);
        return;
      }
      setIsPlayerTurn(false);
      setTimeout(() => {
        const aiSkillIdx = Math.floor(Math.random() * newAi.skills.length);
        executeAttack(newAi, playerPokemon, aiSkillIdx, false);
      }, 800);
    } else {
      const newPlayer = { ...playerPokemon, hp: result.remainingHp };
      setPlayerPokemon(newPlayer);
      if (result.remainingHp <= 0) {
        setWinner('ai');
        setPhase('result');
        saveBattleRecord({
          playerPokemon: playerPokemon.name,
          aiPokemon: aiPokemon.name,
          winner: 'ai',
          rounds: battleRound + 1,
        });
        setIsBattleAnimating(false);
        return;
      }
      setIsPlayerTurn(true);
      setBattleRound(r => r + 1);
    }
    setIsBattleAnimating(false);
  }, [playerPokemon, aiPokemon, battleRound, typewrite]);

  const handleSkillClick = useCallback((skillIndex: number) => {
    if (!isPlayerTurn || isBattleAnimating || !playerPokemon || !aiPokemon) return;
    executeAttack(playerPokemon, aiPokemon, skillIndex, true);
  }, [isPlayerTurn, isBattleAnimating, playerPokemon, aiPokemon, executeAttack]);

  const handleRestart = useCallback(() => {
    setPhase('select');
    setPlayerPokemon(null);
    setAiPokemon(null);
    setPlayerPos({ row: 7, col: 0 });
    setAiPos({ row: 0, col: 7 });
    setBattleLogs([]);
    setTypewriter({ fullText: '', displayed: '', done: true });
    setIsPlayerTurn(true);
    setWinner(null);
    setBattleRound(0);
    setIsBattleAnimating(false);
  }, []);

  useEffect(() => {
    return () => {
      if (twRef.current) cancelAnimationFrame(twRef.current);
    };
  }, []);

  if (phase === 'select') {
    return <CharacterSelector onSelect={handleSelect} />;
  }

  if (phase === 'result') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        color: '#E2E8F0',
        fontFamily: '"Press Start 2P", monospace',
      }}>
        <div style={{
          fontSize: '28px',
          marginBottom: '20px',
          color: winner === 'player' ? '#22C55E' : '#EF4444',
          textShadow: `0 0 20px ${winner === 'player' ? '#22C55E' : '#EF4444'}`,
        }}>
          {winner === 'player' ? '胜利！' : '失败！'}
        </div>
        <div style={{ fontSize: '14px', marginBottom: '30px', color: '#94A3B8' }}>
          战斗回合数: {battleRound + 1}
        </div>
        <button
          onClick={handleRestart}
          style={{
            padding: '12px 32px',
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            background: '#6366F1',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.filter = 'brightness(1.2)';
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.filter = 'brightness(1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          再来一局
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F172A',
      position: 'relative',
      fontFamily: '"Press Start 2P", monospace',
      padding: '10px',
    }}>
      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
        <span style={{ color: playerPokemon?.color || '#FF6B6B', fontSize: '12px', marginRight: '20px' }}>
          {playerPokemon?.name} HP:{playerPokemon?.hp}/{playerPokemon?.maxHp}
        </span>
        <span style={{ color: '#6366F1', fontSize: '12px', margin: '0 10px' }}>VS</span>
        <span style={{ color: aiPokemon?.color || '#42A5F5', fontSize: '12px', marginLeft: '20px' }}>
          {aiPokemon?.name} HP:{aiPokemon?.hp}/{aiPokemon?.maxHp}
        </span>
      </div>

      <Board
        playerPos={playerPos}
        aiPos={aiPos}
        playerPokemon={playerPokemon!}
        aiPokemon={aiPokemon!}
        onMove={handleMove}
        isMovePhase={phase === 'move'}
      />

      {phase === 'battle' && playerPokemon && aiPokemon && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          minHeight: '240px',
          background: '#0D1117',
          border: '2px solid #30363D',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          animation: 'battleWindowIn 0.5s ease-out',
          zIndex: 100,
        }}>
          <style>{`
            @keyframes battleWindowIn {
              0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
              100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
          `}</style>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <BattleHpBar name={playerPokemon.name} hp={playerPokemon.hp} maxHp={playerPokemon.maxHp} color={playerPokemon.color} />
            <span style={{ color: '#6366F1', fontSize: '10px', alignSelf: 'center' }}>VS</span>
            <BattleHpBar name={aiPokemon.name} hp={aiPokemon.hp} maxHp={aiPokemon.maxHp} color={aiPokemon.color} />
          </div>

          <div style={{
            flex: 1,
            background: '#161B22',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '12px',
            minHeight: '80px',
            maxHeight: '120px',
            overflowY: 'auto',
          }}>
            <div style={{ fontSize: '14px', color: '#E2E8F0', fontFamily: '"Press Start 2P", monospace', lineHeight: '1.8' }}>
              {typewriter.displayed || (isPlayerTurn ? '选择一个技能！' : 'AI思考中...')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {playerPokemon.skills.map((skill, idx) => (
              <button
                key={skill.name}
                onClick={() => handleSkillClick(idx)}
                disabled={!isPlayerTurn || isBattleAnimating}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  fontSize: '9px',
                  fontFamily: '"Press Start 2P", monospace',
                  background: isPlayerTurn && !isBattleAnimating ? '#6366F1' : '#334155',
                  color: '#E2E8F0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isPlayerTurn && !isBattleAnimating ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  lineHeight: '1.6',
                }}
                onMouseEnter={e => {
                  if (isPlayerTurn && !isBattleAnimating) {
                    e.currentTarget.style.filter = 'brightness(1.2)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.filter = 'brightness(1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {skill.name}<br/>命中{Math.round(skill.hitRate * 100)}%
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const BattleHpBar: React.FC<{ name: string; hp: number; maxHp: number; color: string }> = ({ name, hp, maxHp, color }) => {
  const pct = (hp / maxHp) * 100;
  const barColor = pct > 60 ? '#22C55E' : pct > 30 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color, marginBottom: '4px' }}>{name}</div>
      <div style={{
        width: '100%',
        height: '10px',
        background: '#1E293B',
        borderRadius: '5px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: barColor,
          borderRadius: '5px',
          transition: 'width 0.3s, background-color 0.3s',
        }} />
      </div>
      <div style={{
        fontSize: '9px',
        color: '#E2E8F0',
        marginTop: '2px',
        animation: hp !== maxHp ? 'hpBounce 0.3s ease' : 'none',
      }}>
        {hp}/{maxHp}
      </div>
      <style>{`
        @keyframes hpBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default App;
