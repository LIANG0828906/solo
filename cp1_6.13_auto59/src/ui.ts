import {
  GameState,
  CoreColor,
  getState,
  placeCore,
  triggerChain,
  setSelectedColor,
  setHoverCell,
  restartLevel,
  startGame,
  getCoreColors,
  getCoreHex,
} from './game';
import confetti from 'canvas-confetti';

const GRID_SIZE = 6;
const COLORS = getCoreColors();
const HEX = getCoreHex();

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let uiContainer: HTMLDivElement;
let stepDisplay: HTMLDivElement;
let colorButtons: Record<CoreColor, HTMLButtonElement> = {} as any;
let progressBars: Record<CoreColor, HTMLDivElement> = {} as any;
let victoryPanel: HTMLDivElement | null = null;
let defeatPanel: HTMLDivElement | null = null;
let state: GameState;
let animFrameId: number = 0;
let lastTime: number = 0;
let victoryFireworksFired = false;

export function initUI(canvasEl: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  canvas = canvasEl;
  ctx = context;

  const app = document.getElementById('app')!;

  uiContainer = document.createElement('div');
  uiContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;display:flex;flex-direction:column;align-items:center;';

  createTopBar();
  createBottomBar();

  app.appendChild(uiContainer);

  setupCanvasEvents();

  state = getState();
}

function createTopBar() {
  const topBar = document.createElement('div');
  topBar.style.cssText = 'width:100%;padding:12px 24px;display:flex;justify-content:center;align-items:center;gap:24px;pointer-events:none;margin-top:8px;';

  const stepLabel = document.createElement('div');
  stepLabel.style.cssText = 'color:rgba(255,255,255,0.6);font-size:14px;letter-spacing:1px;text-transform:uppercase;';
  stepLabel.textContent = '剩余步数';

  stepDisplay = document.createElement('div');
  stepDisplay.style.cssText = `
    color: #ffd700;
    font-size: 36px;
    font-weight: bold;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 10px rgba(255,215,0,0.5);
    min-width: 50px;
    text-align: center;
    overflow: hidden;
    height: 44px;
    line-height: 44px;
    position: relative;
  `;
  stepDisplay.textContent = '8';

  const stepContainer = document.createElement('div');
  stepContainer.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
  stepContainer.appendChild(stepLabel);
  stepContainer.appendChild(stepDisplay);

  const coreInfo = document.createElement('div');
  coreInfo.style.cssText = 'display:flex;gap:16px;align-items:center;';

  for (const color of ['red', 'blue', 'green'] as CoreColor[]) {
    const barContainer = document.createElement('div');
    barContainer.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;';

    const barLabel = document.createElement('div');
    barLabel.style.cssText = `color:${COLORS[color].main};font-size:11px;letter-spacing:0.5px;`;
    barLabel.textContent = color === 'red' ? '红' : color === 'blue' ? '蓝' : '绿';

    const barOuter = document.createElement('div');
    barOuter.style.cssText = `
      width: 80px; height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
    `;

    const barInner = document.createElement('div');
    barInner.style.cssText = `
      width: 100%; height: 100%;
      background: linear-gradient(90deg, ${COLORS[color].dark}, ${COLORS[color].main});
      border-radius: 4px;
      transition: width 0.3s ease;
    `;
    progressBars[color] = barInner;

    barOuter.appendChild(barInner);
    barContainer.appendChild(barLabel);
    barContainer.appendChild(barOuter);
    coreInfo.appendChild(barContainer);
  }

  topBar.appendChild(stepContainer);
  topBar.appendChild(coreInfo);
  uiContainer.appendChild(topBar);
}

function createBottomBar() {
  const bottomBar = document.createElement('div');
  bottomBar.style.cssText = `
    position: absolute;
    bottom: 24px;
    display: flex;
    gap: 20px;
    pointer-events: auto;
  `;

  for (const color of ['red', 'blue', 'green'] as CoreColor[]) {
    const btn = document.createElement('button');
    btn.style.cssText = `
      width: 56px; height: 56px;
      border-radius: 50%;
      border: 3px solid ${COLORS[color].main};
      background: radial-gradient(circle at 35% 35%, ${COLORS[color].light}, ${COLORS[color].dark});
      cursor: pointer;
      outline: none;
      transition: box-shadow 0.3s, transform 0.3s;
      box-shadow: 0 0 0 0 ${COLORS[color].glow};
      position: relative;
    `;

    btn.addEventListener('click', () => {
      setSelectedColor(color);
      updateColorButtons();
    });

    btn.addEventListener('mouseenter', () => {
      if (getState().selectedColor !== color) {
        btn.style.transform = 'scale(1.05)';
      }
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = getState().selectedColor === color ? 'scale(1.1)' : 'scale(1)';
    });

    colorButtons[color] = btn;
    bottomBar.appendChild(btn);
  }

  uiContainer.appendChild(bottomBar);
  updateColorButtons();
}

function updateColorButtons() {
  const st = getState();
  for (const color of ['red', 'blue', 'green'] as CoreColor[]) {
    const btn = colorButtons[color];
    if (st.selectedColor === color) {
      btn.style.boxShadow = `0 0 20px ${COLORS[color].glow}, 0 0 40px ${COLORS[color].glow}`;
      btn.style.transform = 'scale(1.1)';
      btn.style.animation = 'breathe 2s ease-in-out infinite';
    } else {
      btn.style.boxShadow = '0 0 0 0 rgba(0,0,0,0)';
      btn.style.transform = 'scale(1)';
      btn.style.animation = '';
    }
  }

  if (!document.getElementById('breatheStyle')) {
    const style = document.createElement('style');
    style.id = 'breatheStyle';
    style.textContent = `
      @keyframes breathe {
        0%, 100% { box-shadow: 0 0 20px ${COLORS[st.selectedColor].glow}; transform: scale(1.1); }
        50% { box-shadow: 0 0 30px ${COLORS[st.selectedColor].glow}, 0 0 50px ${COLORS[st.selectedColor].glow}; transform: scale(1.13); }
      }
    `;
    document.head.appendChild(style);
  }
}

function setupCanvasEvents() {
  canvas.addEventListener('mousemove', (e) => {
    const { row, col } = getGridPos(e);
    setHoverCell(row, col);
  });

  canvas.addEventListener('mouseleave', () => {
    setHoverCell(null, null);
  });

  canvas.addEventListener('click', (e) => {
    const st = getState();
    if (st.gameOver) return;
    const { row, col } = getGridPos(e);

    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

    const existing = st.grid[row][col];
    if (existing && existing.placed && !existing.exploding) {
      triggerChain(row, col);
    } else if (!existing) {
      placeCore(row, col);
    }
  });
}

function getGridPos(e: MouseEvent): { row: number; col: number } {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const minDim = Math.min(canvas.width, canvas.height * 0.7);
  const cellSize = minDim / (GRID_SIZE + 1);
  const boardX = (canvas.width - cellSize * GRID_SIZE) / 2;
  const boardY = canvas.height * 0.15;

  const col = Math.floor((mx - boardX) / cellSize);
  const row = Math.floor((my - boardY) / cellSize);

  return { row, col };
}

export function updateUI(dt: number) {
  state = getState();

  updateStepDisplay();
  updateProgressBars();
  checkVictory();
  checkDefeat();
}

function updateStepDisplay() {
  const displayVal = state.stepCounterDisplay;
  const actualVal = state.remainingSteps;

  if (displayVal !== actualVal) {
    stepDisplay.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    stepDisplay.style.transform = 'translateY(-10px)';
    stepDisplay.style.opacity = '0';

    setTimeout(() => {
      stepDisplay.textContent = String(actualVal);
      stepDisplay.style.transform = 'translateY(10px)';

      requestAnimationFrame(() => {
        stepDisplay.style.transform = 'translateY(0)';
        stepDisplay.style.opacity = '1';
      });
    }, 100);
  } else {
    stepDisplay.textContent = String(actualVal);
  }
}

function updateProgressBars() {
  for (const color of ['red', 'blue', 'green'] as CoreColor[]) {
    const total = state.totalCores[color];
    const remaining = state.coresRemaining[color];
    const placed = total - remaining;

    let onBoard = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (state.grid[r][c] && state.grid[r][c]!.color === color) {
          onBoard++;
        }
      }
    }

    const eliminated = total - remaining - onBoard;
    const pct = total > 0 ? (eliminated / total) * 100 : 100;
    progressBars[color].style.width = `${pct}%`;
  }
}

function checkVictory() {
  if (!state.victory || victoryFireworksFired) return;
  victoryFireworksFired = true;

  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#ff3b3b', '#3b8bff', '#3bff6b', '#ffd700'],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#ff3b3b', '#3b8bff', '#3bff6b', '#ffd700'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();

  setTimeout(() => showVictoryPanel(), 500);
}

function showVictoryPanel() {
  if (victoryPanel) return;

  victoryPanel = document.createElement('div');
  victoryPanel.style.cssText = `
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0);
    background: rgba(0,0,0,0.85);
    border: 2px solid #ffd700;
    border-radius: 16px;
    padding: 40px 60px;
    text-align: center;
    pointer-events: auto;
    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 0 40px rgba(255,215,0,0.3);
  `;

  const title = document.createElement('div');
  title.style.cssText = `
    color: #ffd700;
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 16px;
    text-shadow: 0 0 20px rgba(255,215,0,0.5);
  `;
  title.textContent = '🎉 通关成功！';

  const restartBtn = document.createElement('button');
  restartBtn.style.cssText = `
    background: linear-gradient(135deg, #ffd700, #ffaa00);
    color: #1a0a3e;
    border: none;
    border-radius: 8px;
    padding: 10px 30px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 8px;
    transition: transform 0.2s;
  `;
  restartBtn.textContent = '下一关';
  restartBtn.addEventListener('click', () => {
    removePanel(victoryPanel);
    victoryPanel = null;
    victoryFireworksFired = false;
    startGame(getState().level + 1);
  });

  const retryBtn = document.createElement('button');
  retryBtn.style.cssText = `
    background: transparent;
    color: rgba(255,255,255,0.6);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    padding: 10px 24px;
    font-size: 14px;
    cursor: pointer;
    margin-top: 8px;
    margin-left: 8px;
    transition: all 0.2s;
  `;
  retryBtn.textContent = '重玩本关';
  retryBtn.addEventListener('click', () => {
    removePanel(victoryPanel);
    victoryPanel = null;
    victoryFireworksFired = false;
    restartLevel();
  });

  victoryPanel.appendChild(title);
  victoryPanel.appendChild(restartBtn);
  victoryPanel.appendChild(retryBtn);
  uiContainer.appendChild(victoryPanel);

  requestAnimationFrame(() => {
    if (victoryPanel) {
      victoryPanel.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });
}

function checkDefeat() {
  if (!state.gameOver || state.victory) return;
  if (defeatPanel) return;
  if (state.shockwaves.length > 0 || state.fragments.length > 0) return;

  let hasCores = false;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (state.grid[r][c] !== null) {
        hasCores = true;
        break;
      }
    }
    if (hasCores) break;
  }

  if (!hasCores) return;

  setTimeout(() => showDefeatPanel(), 500);
}

function showDefeatPanel() {
  if (defeatPanel) return;

  defeatPanel = document.createElement('div');
  defeatPanel.style.cssText = `
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0);
    background: rgba(0,0,0,0.85);
    border: 2px solid #ff3b3b;
    border-radius: 16px;
    padding: 40px 60px;
    text-align: center;
    pointer-events: auto;
    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 0 40px rgba(255,59,59,0.3);
  `;

  const title = document.createElement('div');
  title.style.cssText = `
    color: #ff3b3b;
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 16px;
    text-shadow: 0 0 20px rgba(255,59,59,0.5);
  `;
  title.textContent = '💥 挑战失败';

  const desc = document.createElement('div');
  desc.style.cssText = 'color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 16px;';
  desc.textContent = '步数用尽，还有核心未消除';

  const retryBtn = document.createElement('button');
  retryBtn.style.cssText = `
    background: linear-gradient(135deg, #ff3b3b, #ff6666);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 30px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
  `;
  retryBtn.textContent = '再试一次';
  retryBtn.addEventListener('click', () => {
    removePanel(defeatPanel);
    defeatPanel = null;
    restartLevel();
  });

  defeatPanel.appendChild(title);
  defeatPanel.appendChild(desc);
  defeatPanel.appendChild(retryBtn);
  uiContainer.appendChild(defeatPanel);

  requestAnimationFrame(() => {
    if (defeatPanel) {
      defeatPanel.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });
}

function removePanel(panel: HTMLDivElement | null) {
  if (panel && panel.parentNode) {
    panel.parentNode.removeChild(panel);
  }
}
