import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { GameState, Resources, CREATURE_CONFIG } from './types';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

function createInitialState(playerName: string): GameState {
  const resources: Resources = {
    coins: 50,
    firePepper: 0,
    iceRadish: 0,
    windWheat: 0,
    flameEgg: 0,
    frostWool: 0,
    thunderShard: 0,
    seeds: 5,
  };
  return {
    resources,
    crops: [],
    creatures: [],
    monsters: [],
    towers: [],
    fenceUpgradeLevel: 0,
    activeEvent: null,
    eventEndTime: 0,
    acidRainEndTime: 0,
    lastAutoSaveTime: Date.now(),
    playerName,
    gameOver: false,
  };
}

async function tryLoadGame(playerName: string): Promise<GameState | null> {
  try {
    const res = await fetch('/api/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName }),
    });
    const data = await res.json();
    if (data.success && data.data && data.data.state) {
      return data.data.state;
    }
  } catch (e) {
    console.log('无可用存档，开始新游戏');
  }
  return null;
}

function showNamePrompt(): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      inset: 0;
      background: linear-gradient(180deg, rgba(26,71,42,0.95), rgba(45,90,63,0.95));
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: 'Comic Sans MS', 'Microsoft YaHei', cursive;
    `;
    const panel = document.createElement('div');
    panel.style.cssText = `
      background: #faf0e6;
      padding: 48px 56px;
      border-radius: 24px;
      border: 6px solid #8b6914;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      text-align: center;
      max-width: 420px;
    `;
    const title = document.createElement('h1');
    title.textContent = '🌾 奇幻农场 🌾';
    title.style.cssText = 'margin: 0 0 12px; color: #5c4033; font-size: 36px;';
    const subtitle = document.createElement('p');
    subtitle.textContent = '欢迎来到魔法世界的农场经营之旅！';
    subtitle.style.cssText = 'margin: 0 0 32px; color: #8b6914; font-size: 16px;';
    const label = document.createElement('label');
    label.textContent = '请输入你的名字：';
    label.style.cssText = 'display: block; margin-bottom: 12px; color: #5c4033; font-size: 18px; font-weight: bold;';
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 12;
    input.placeholder = '例如：魔法师小明';
    input.style.cssText = `
      width: 260px;
      padding: 14px 18px;
      font-size: 18px;
      border: 4px solid #8b6914;
      border-radius: 12px;
      font-family: inherit;
      box-sizing: border-box;
      outline: none;
      color: #5c4033;
      background: #fff;
    `;
    input.addEventListener('focus', () => {
      input.style.borderColor = '#d4a76a';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '#8b6914';
    });
    const btn = document.createElement('button');
    btn.textContent = '🚀 开始冒险';
    btn.style.cssText = `
      margin-top: 28px;
      padding: 14px 48px;
      font-size: 20px;
      font-weight: bold;
      color: white;
      background: linear-gradient(180deg, #88cc44, #448822);
      border: 4px solid #448822;
      border-radius: 16px;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 6px 0 #226611;
      transition: all 0.1s;
    `;
    const submit = () => {
      const name = input.value.trim() || '匿名农夫';
      container.remove();
      resolve(name);
    };
    btn.addEventListener('click', submit);
    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'translateY(4px)';
      btn.style.boxShadow = '0 2px 0 #226611';
    });
    btn.addEventListener('mouseup', () => {
      btn.style.transform = '';
      btn.style.boxShadow = '0 6px 0 #226611';
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(label);
    panel.appendChild(input);
    panel.appendChild(btn);
    container.appendChild(panel);
    document.body.appendChild(container);
    setTimeout(() => input.focus(), 100);
  });
}

async function bootstrap() {
  const playerName = await showNamePrompt();
  const savedState = await tryLoadGame(playerName);
  const gameState = savedState || createInitialState(playerName);

  if (!savedState) {
    gameState.resources.seeds = 5;
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#2d5a3f',
    scale: {
      mode: Phaser.Scale.ScaleModes.NONE,
      autoCenter: Phaser.Scale.Center.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    scene: [GameScene],
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
  };

  const game = new Phaser.Game(config);
  game.scene.start('GameScene', { state: gameState });

  const resizeGame = () => {
    const container = document.getElementById('game-container');
    const canvas = document.querySelector('#game-container canvas');
    if (!container || !canvas) return;
    const containerWidth = Math.max(800, container.clientWidth);
    const containerHeight = container.clientHeight;
    const scaleX = containerWidth / GAME_WIDTH;
    const scaleY = containerHeight / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    const canvasEl = canvas as HTMLCanvasElement;
    canvasEl.style.transform = `scale(${scale})`;
    canvasEl.style.transformOrigin = 'center center';
    const scaledWidth = GAME_WIDTH * scale;
    const scaledHeight = GAME_HEIGHT * scale;
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;
    canvasEl.style.marginLeft = `${offsetX}px`;
    canvasEl.style.marginTop = `${offsetY}px`;
  };

  window.addEventListener('resize', resizeGame);
  setTimeout(resizeGame, 100);
}

bootstrap();
