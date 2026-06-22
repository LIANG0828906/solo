import React, { useEffect } from 'react';
import { GameProvider, useGame } from './GameContext';
import GameBoard from './components/GameBoard';
import HUD from './components/HUD';

function GameInner() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    if (!state.gameStarted || state.gameWon) return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.gameStarted, state.gameWon, dispatch]);

  if (!state.gameStarted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: "'Noto Serif SC', 'Cinzel', serif",
        padding: 20,
      }}>
        <div style={{
          background: 'radial-gradient(ellipse at center, rgba(245,230,202,0.95), rgba(232,220,192,0.95))',
          border: '8px solid transparent',
          borderImage: `repeating-linear-gradient(
            45deg,
            #5c3a1e 0px,
            #5c3a1e 8px,
            #7a4f2e 8px,
            #7a4f2e 12px,
            #5c3a1e 12px,
            #5c3a1e 16px
          ) 8`,
          padding: '48px 56px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <h1 style={{
            color: '#3e2723',
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 16,
            fontFamily: "'Cinzel', serif",
            letterSpacing: 4,
          }}>
            ⚔ 迷宫冒险 ⚔
          </h1>
          <p style={{ color: '#5c3a1e', fontSize: 15, lineHeight: 1.8, marginBottom: 8 }}>
            推理解谜 · 寻找出路
          </p>
          <p style={{ color: '#7a4f2e', fontSize: 13, lineHeight: 1.8, marginBottom: 24, maxWidth: 360 }}>
            在迷宫中找到通往金色传送门的路。踩下与机关门相同符号的压力板来打开大门，收集道具帮助你前行。
          </p>
          <div style={{ color: '#8b6914', fontSize: 12, marginBottom: 24, lineHeight: 1.8 }}>
            <div>WASD / 方向键 — 移动</div>
            <div>每步消耗1点体力 · 体力为0则无法移动</div>
          </div>
          <button
            onClick={() => dispatch({ type: 'START_GAME' })}
            style={{
              background: 'linear-gradient(180deg, #8b6914, #5c3a1e)',
              color: '#f5e6ca',
              border: '2px solid #a07828',
              padding: '12px 40px',
              fontSize: 18,
              fontFamily: "'Cinzel', serif",
              cursor: 'pointer',
              borderRadius: 4,
              letterSpacing: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseOver={e => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; (e.target as HTMLElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)'; }}
            onMouseOut={e => { (e.target as HTMLElement).style.transform = 'translateY(0)'; (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; }}
          >
            开始冒险
          </button>
        </div>
      </div>
    );
  }

  if (state.gameWon) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: "'Noto Serif SC', 'Cinzel', serif",
      }}>
        <div style={{
          background: 'radial-gradient(ellipse at center, rgba(245,230,202,0.95), rgba(232,220,192,0.95))',
          border: '8px solid transparent',
          borderImage: `repeating-linear-gradient(
            45deg,
            #5c3a1e 0px,
            #5c3a1e 8px,
            #7a4f2e 8px,
            #7a4f2e 12px,
            #5c3a1e 12px,
            #5c3a1e 16px
          ) 8`,
          padding: '48px 56px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <h1 style={{ color: '#3e2723', fontSize: 32, marginBottom: 16, fontFamily: "'Cinzel', serif" }}>
            🏆 通关成功 🏆
          </h1>
          <p style={{ color: '#5c3a1e', fontSize: 16, marginBottom: 8 }}>
            用时: {Math.floor(state.elapsedTime / 60).toString().padStart(2, '0')}:{(state.elapsedTime % 60).toString().padStart(2, '0')}
          </p>
          <p style={{ color: '#7a4f2e', fontSize: 14, marginBottom: 24 }}>
            剩余体力: {state.stamina}/{state.maxStamina}
          </p>
          <button
            onClick={() => dispatch({ type: 'NEW_GAME' })}
            style={{
              background: 'linear-gradient(180deg, #8b6914, #5c3a1e)',
              color: '#f5e6ca',
              border: '2px solid #a07828',
              padding: '12px 40px',
              fontSize: 18,
              fontFamily: "'Cinzel', serif",
              cursor: 'pointer',
              borderRadius: 4,
              letterSpacing: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            再来一局
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: "'Noto Serif SC', 'Cinzel', serif",
    }}>
      <HUD />
      <div style={{
        border: '8px solid transparent',
        borderImage: `repeating-linear-gradient(
          45deg,
          #5c3a1e 0px,
          #5c3a1e 8px,
          #7a4f2e 8px,
          #7a4f2e 12px,
          #5c3a1e 12px,
          #5c3a1e 16px
        ) 8`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        background: '#2d2d2d',
        lineHeight: 0,
      }}>
        <GameBoard />
      </div>
      <div style={{
        marginTop: 12,
        color: '#8b6914',
        fontSize: 12,
        fontFamily: "'Noto Serif SC', serif",
        letterSpacing: 1,
      }}>
        WASD / 方向键移动 · 踩下同符号压力板开启机关门
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameInner />
    </GameProvider>
  );
}
