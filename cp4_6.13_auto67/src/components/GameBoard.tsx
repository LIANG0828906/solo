import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameLogic } from '../logic/GameLogic';
import type { Monster, Chest, Trap } from '../logic/GameLogic';

interface DamageText {
  id: number;
  x: number;
  y: number;
}

interface CoinAnim {
  id: number;
  startX: number;
  startY: number;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  @keyframes damageFlash {
    0%, 100% { box-shadow: inset 0 0 0 0 rgba(255, 0, 0, 0); }
    25%, 75% { box-shadow: inset 0 0 30px 10px rgba(255, 0, 0, 0.7); }
    50% { box-shadow: inset 0 0 50px 15px rgba(255, 0, 0, 0.9); }
  }

  @keyframes floatUp {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-40px) scale(1.2); }
  }

  @keyframes messageFade {
    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-5px); }
  }

  @keyframes chestBounce {
    0% { transform: scale(1); }
    30% { transform: scale(1.2) translateY(-5px); }
    50% { transform: scale(1.1) translateY(-3px); }
    70% { transform: scale(1.15) translateY(-4px); }
    100% { transform: scale(1) translateY(0); }
  }

  @keyframes coinFly {
    0% { opacity: 1; transform: translate(0, 0) scale(1); }
    100% { opacity: 0; transform: translate(var(--coin-dx), var(--coin-dy)) scale(0.3); }
  }

  @keyframes exitGlow {
    0%, 100% { box-shadow: 0 0 10px 2px #ffd700, inset 0 0 10px rgba(255, 215, 0, 0.5); }
    50% { box-shadow: 0 0 20px 5px #ffd700, inset 0 0 15px rgba(255, 215, 0, 0.8); }
  }

  @keyframes slimeBounce {
    0%, 100% { transform: scaleY(1) scaleX(1) translateY(0); }
    50% { transform: scaleY(0.8) scaleX(1.1) translateY(2px); }
  }

  @keyframes skeletonBob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }

  @keyframes trapFlicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes playerIdle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-1px); }
  }

  .game-board-container {
    font-family: 'Press Start 2P', monospace;
    min-height: 100vh;
    width: 100%;
    background: linear-gradient(180deg, #0f0c29 0%, #302b63 100%);
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  .game-title {
    font-size: 24px;
    color: #FFD700;
    text-shadow: 3px 3px 0 #8B4513, 6px 6px 0 rgba(0, 0, 0, 0.3);
    margin-bottom: 16px;
    text-align: center;
    font-family: 'Press Start 2P', monospace;
  }

  .scoreboard {
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(0, 0, 0, 0.7);
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 10px;
    line-height: 2;
    z-index: 100;
    border: 2px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(4px);
  }

  .score-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .score-item:last-child {
    margin-bottom: 0;
  }

  .score-label {
    color: #a0a0a0;
    font-size: 8px;
  }

  .score-value {
    color: #FFD700;
    font-size: 12px;
  }

  .score-value.floor {
    color: #87CEEB;
  }

  .hp-hearts {
    display: flex;
    gap: 4px;
  }

  .heart {
    color: #FF6B6B;
    font-size: 14px;
    text-shadow: 1px 1px 0 #8B0000;
  }

  .heart.empty {
    color: #333;
    text-shadow: none;
  }

  .maze-grid {
    position: relative;
    width: 100%;
    max-width: 384px;
    aspect-ratio: 1 / 1;
    display: grid;
    border: 4px solid #4a4a6a;
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(0, 0, 0, 0.4);
    background: #1a1a2e;
    overflow: hidden;
  }

  .maze-cell {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed rgba(180, 180, 200, 0.25);
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
  }

  .wall-cell {
    width: 100%;
    height: 100%;
    background: #3a3a4a;
    background-image: 
      linear-gradient(45deg, #2a2a3a 25%, transparent 25%),
      linear-gradient(-45deg, #2a2a3a 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #2a2a3a 75%),
      linear-gradient(-45deg, transparent 75%, #2a2a3a 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
  }

  .floor-cell {
    width: 100%;
    height: 100%;
    background: #2d2d3a;
    background-image: 
      radial-gradient(circle at 20% 30%, #3a3a4a 1px, transparent 1px),
      radial-gradient(circle at 70% 60%, #252530 1px, transparent 1px),
      radial-gradient(circle at 40% 80%, #3a3a4a 1px, transparent 1px);
    background-size: 12px 12px, 14px 14px, 10px 10px;
  }

  .message-bar {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 10px;
    text-align: center;
    max-width: 90%;
    z-index: 100;
    border: 2px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    white-space: nowrap;
    backdrop-filter: blur(4px);
    font-family: 'Press Start 2P', monospace;
  }

  .message-bar.visible {
    animation: messageFade 1.7s ease-out forwards;
  }

  .pixel-button {
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    padding: 12px 24px;
    background: #FFD700;
    color: #1a1a2e;
    border: 4px solid #B8860B;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 8px;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
    box-shadow: 0 4px 0 #8B6914, 0 6px 10px rgba(0, 0, 0, 0.3);
    text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.3);
  }

  .pixel-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #8B6914, 0 8px 14px rgba(0, 0, 0, 0.35);
  }

  .pixel-button:active {
    transform: scale(0.95);
    box-shadow: 0 2px 0 #8B6914, 0 3px 6px rgba(0, 0, 0, 0.3);
  }

  .pixel-button.win {
    background: #32CD32;
    border-color: #228B22;
    color: #fff;
    box-shadow: 0 4px 0 #1a6b1a, 0 6px 10px rgba(0, 0, 0, 0.3);
  }

  .pixel-button.win:hover {
    box-shadow: 0 6px 0 #1a6b1a, 0 8px 14px rgba(0, 0, 0, 0.35);
  }

  .pixel-button.win:active {
    box-shadow: 0 2px 0 #1a6b1a, 0 3px 6px rgba(0, 0, 0, 0.3);
  }

  .hint-text {
    margin-top: 12px;
    font-size: 8px;
    color: #888;
    text-align: center;
    font-family: 'Press Start 2P', monospace;
  }

  .dpad-container {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .dpad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 6px;
    width: 160px;
    height: 160px;
  }

  .dpad-button {
    background: linear-gradient(180deg, #4a4a5a 0%, #3a3a4a 100%);
    border: 3px solid #5a5a7a;
    border-radius: 8px;
    color: #fff;
    font-size: 22px;
    cursor: pointer;
    font-family: 'Press Start 2P', monospace;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
    box-shadow: 0 3px 0 #2a2a3a, 0 4px 8px rgba(0, 0, 0, 0.3);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .dpad-button:hover {
    background: linear-gradient(180deg, #5a5a6a 0%, #4a4a5a 100%);
  }

  .dpad-button:active {
    transform: scale(0.92);
    box-shadow: 0 1px 0 #2a2a3a, 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .dpad-button.up {
    grid-column: 2;
    grid-row: 1;
  }

  .dpad-button.left {
    grid-column: 1;
    grid-row: 2;
  }

  .dpad-button.right {
    grid-column: 3;
    grid-row: 2;
  }

  .dpad-button.down {
    grid-column: 2;
    grid-row: 3;
  }

  .next-floor-button {
    background: linear-gradient(180deg, #FFD700 0%, #DAA520 100%);
    border: 3px solid #B8860B;
    border-radius: 8px;
    color: #1a1a2e;
    font-size: 10px;
    cursor: pointer;
    font-family: 'Press Start 2P', monospace;
    padding: 10px 20px;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
    box-shadow: 0 3px 0 #8B6914, 0 4px 8px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }

  .next-floor-button:hover {
    background: linear-gradient(180deg, #FFE44D 0%, #FFD700 100%);
  }

  .next-floor-button:active {
    transform: scale(0.95);
    box-shadow: 0 1px 0 #8B6914, 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    .game-board-container {
      padding: 12px;
    }

    .game-title {
      font-size: 18px;
      margin-bottom: 12px;
    }

    .scoreboard {
      position: relative;
      top: auto;
      left: auto;
      width: 96%;
      max-width: 384px;
      display: flex;
      justify-content: space-around;
      padding: 10px 12px;
      font-size: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .score-item {
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-bottom: 0;
    }

    .maze-grid {
      width: 96%;
      max-width: none;
    }

    .message-bar {
      font-size: 8px;
      padding: 8px 16px;
      bottom: 16px;
    }

    .pixel-button {
      font-size: 10px;
      padding: 10px 20px;
    }

    .dpad {
      width: 140px;
      height: 140px;
    }

    .dpad-button {
      font-size: 18px;
    }
  }

  @media (max-width: 480px) {
    .scoreboard {
      font-size: 7px;
    }

    .game-title {
      font-size: 14px;
    }

    .dpad {
      width: 130px;
      height: 130px;
    }
  }
`;

function injectStyles() {
  const styleId = 'gameboard-styles';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = styles;
  document.head.appendChild(style);
}

function PlayerCell() {
  return (
    <div style={{
      width: '32px',
      height: '32px',
      position: 'relative',
      animation: 'playerIdle 0.8s ease-in-out infinite',
    }}>
      <div style={{
        position: 'absolute',
        width: '16px',
        height: '6px',
        background: '#8B4513',
        left: '8px',
        top: '2px',
        borderRadius: '2px 2px 0 0',
      }} />
      <div style={{
        position: 'absolute',
        width: '12px',
        height: '8px',
        background: '#FFDAB9',
        left: '10px',
        top: '8px',
        borderRadius: '1px',
      }} />
      <div style={{
        position: 'absolute',
        width: '2px',
        height: '2px',
        background: '#000',
        left: '13px',
        top: '10px',
        boxShadow: '4px 0 0 #000',
      }} />
      <div style={{
        position: 'absolute',
        width: '14px',
        height: '10px',
        background: '#4169E1',
        left: '9px',
        top: '16px',
        borderRadius: '1px',
      }} />
      <div style={{
        position: 'absolute',
        width: '5px',
        height: '6px',
        background: '#4169E1',
        left: '9px',
        top: '24px',
      }} />
      <div style={{
        position: 'absolute',
        width: '5px',
        height: '6px',
        background: '#4169E1',
        left: '18px',
        top: '24px',
      }} />
    </div>
  );
}

function MonsterCell({ monster }: { monster: Monster }) {
  if (monster.type === 'slime') {
    return (
      <div style={{
        width: '32px',
        height: '32px',
        position: 'relative',
        animation: 'slimeBounce 0.6s ease-in-out infinite',
      }}>
        <div style={{
          position: 'absolute',
          width: '22px',
          height: '16px',
          background: '#32CD32',
          left: '5px',
          top: '14px',
          borderRadius: '50% 50% 30% 30%',
        }} />
        <div style={{
          position: 'absolute',
          width: '18px',
          height: '10px',
          background: '#32CD32',
          left: '7px',
          top: '10px',
          borderRadius: '50% 50% 0 0',
        }} />
        <div style={{
          position: 'absolute',
          width: '3px',
          height: '4px',
          background: '#fff',
          left: '11px',
          top: '14px',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          width: '3px',
          height: '4px',
          background: '#fff',
          left: '18px',
          top: '14px',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          width: '2px',
          height: '2px',
          background: '#000',
          left: '12px',
          top: '15px',
        }} />
        <div style={{
          position: 'absolute',
          width: '2px',
          height: '2px',
          background: '#000',
