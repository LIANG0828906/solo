import React, { useState, useEffect, useRef } from 'react';
import { roomManager } from '../roomManager';
import { gameEngine } from '../gameEngine';

interface Props {
  isDrawer: boolean;
  wordLength: number;
  revealedLetters: boolean[];
  wrongGuesses: number;
  hintsUsed: number;
  wordCategory?: string;
  guessHistory?: { guess: string; playerId: string; playerNickname?: string; isCorrect?: boolean }[];
  onNewGuess?: () => void;
}

const GuessingPanel: React.FC<Props> = ({
  isDrawer,
  wordLength,
  revealedLetters,
  wrongGuesses,
  hintsUsed,
  guessHistory = []
}) => {
  const [guess, setGuess] = useState('');
  const [hintCooldown, setHintCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintCooldownRef = useRef(0);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDrawer) {
      focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [isDrawer]);

  useEffect(() => {
    const unsub = gameEngine.on((type, data) => {
      if (type === 'hint_cooldown') {
        setHintCooldown(data.cooldown);
        hintCooldownRef.current = data.cooldown;
      }
      if (type === 'round_start') {
        setHintCooldown(0);
        hintCooldownRef.current = 0;
        setGuess('');
      }
    });
    return () => {
      unsub();
    };
  }, []);

  const submitGuess = () => {
    if (!guess.trim() || isDrawer) return;
    roomManager.submitGuess(guess.trim());
    setGuess('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitGuess();
  };

  const handleHint = () => {
    if (hintCooldownRef.current > 0 || isDrawer) return;
    setHintCooldown(10);
    hintCooldownRef.current = 10;
    roomManager.requestHint();
    gameEngine.resetHintCooldown();
  };

  const hintReady = hintCooldown <= 0;
  const circumference = 2 * Math.PI * 21;
  const progressPct = Math.max(0, Math.min(100, (hintCooldown / 10) * 100));
  const dashOffset = circumference * (1 - progressPct / 100);

  const displayChars: React.ReactNode[] = [];
  for (let i = 0; i < wordLength; i++) {
    const revealed = revealedLetters[i];
    displayChars.push(
      <div
        key={i}
        style={{
          width: 36,
          height: 44,
          borderRadius: 8,
          background: revealed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${revealed ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-color)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
          color: revealed ? '#10b981' : '#fff',
          transition: 'all 0.3s ease'
        }}
      >
        {revealed ? (
          <span className="fade-in">{typeof revealed === 'string' ? revealed : '?'}</span>
        ) : (
          '_'
        )}
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%'
      }}
    >
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#e94560' }}>🎯</span>
          {isDrawer ? '你是画手' : '猜猜这是什么'}
        </h3>

        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '14px',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 12,
            marginBottom: 12
          }}
        >
          {displayChars.length > 0 ? (
            displayChars
          ) : (
            <span style={{ color: '#a0aec0', fontSize: 14 }}>等待回合开始...</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: 20,
                opacity: i < wrongGuesses ? 1 : 0.15,
                transition: 'all 0.3s ease',
                transform: i < wrongGuesses ? 'scale(1)' : 'scale(0.8)'
              }}
            >
              ❌
            </span>
          ))}
          <span style={{ marginLeft: 8, fontSize: 13, color: '#a0aec0', alignSelf: 'center' }}>
            {wrongGuesses}/5 次错误
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#a0aec0' }}>
          已用提示: <strong style={{ color: '#f59e0b' }}>{hintsUsed}</strong>
        </div>
      </div>

      {!isDrawer && (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={inputRef}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的猜测..."
              className="input-field"
              style={{ paddingRight: 80 }}
              disabled={wordLength === 0}
            />
            <button
              onClick={submitGuess}
              className="btn btn-primary"
              style={{
                position: 'absolute',
                right: 4,
                top: 4,
                bottom: 4,
                padding: '6px 16px',
                fontSize: 14
              }}
              disabled={!guess.trim() || wordLength === 0}
            >
              提交
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={handleHint}
              title={`获取字母提示${hintCooldown > 0 ? ` (${Math.ceil(hintCooldown)}秒后可用)` : ''}`}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: hintReady ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.05)',
                border: hintReady ? '2px solid #fbbf24' : '1px solid var(--border-color)',
                color: hintReady ? '#fff' : '#a0aec0',
                cursor: hintReady ? 'pointer' : 'not-allowed',
                fontSize: 20,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: hintReady ? '0 0 15px rgba(245, 158, 11, 0.5)' : 'none',
                animation: hintReady ? 'pulseGlow 1.5s ease-in-out infinite' : 'none'
              }}
              disabled={!hintReady}
            >
              💡
            </button>
            {hintCooldown > 0 && (
              <>
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 48,
                    height: 48,
                    transform: 'rotate(-90deg)',
                    pointerEvents: 'none'
                  }}
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="21"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="21"
                    fill="none"
                    stroke="rgba(245, 158, 11, 0.8)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#fbbf24',
                    pointerEvents: 'none'
                  }}
                >
                  {Math.ceil(hintCooldown)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isDrawer && (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: 'rgba(233, 69, 96, 0.1)',
            border: '1px solid rgba(233, 69, 96, 0.2)',
            textAlign: 'center',
            fontSize: 14,
            color: '#ff9fb0'
          }}
        >
          🎨 请在画板上画出词牌内容，帮助队友猜出答案！
        </div>
      )}

      {guessHistory.length > 0 && (
        <div
          style={{
            marginTop: 'auto',
            padding: 12,
            borderRadius: 12,
            background: 'rgba(0,0,0,0.25)',
            maxHeight: 150,
            overflowY: 'auto'
          }}
        >
          <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 8, fontWeight: 600 }}>
            💬 猜测记录
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {guessHistory.slice(-8).reverse().map((g, idx) => (
              <div
                key={idx}
                className="fade-in"
                style={{
                  fontSize: 13,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ color: '#a0aec0' }}>{g.playerNickname || '队友'}</span>
                <span style={{ color: g.isCorrect ? '#10b981' : '#ff8098', fontWeight: 600 }}>
                  {g.guess}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuessingPanel;
