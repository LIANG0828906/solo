import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import { BattleScene } from './scenes/BattleScene';

let socket: Socket;
let editor: CodeMirror.Editor;
let battleScene: BattleScene;
let currentRoomId = '';
let myPlayerId = '';
let isSubmitted = false;
let codingIntervalId: ReturnType<typeof setInterval> | null = null;

const lobbyEl = document.getElementById('lobby')!;
const matchingArea = document.getElementById('matching-area')!;
const nicknameInput = document.getElementById('nickname-input') as HTMLInputElement;
const btnMatch = document.getElementById('btn-match') as HTMLButtonElement;
const editorPanel = document.getElementById('editor-panel')!;
const battlePanel = document.getElementById('battle-panel')!;
const codeEditorEl = document.getElementById('code-editor')!;
const btnSubmit = document.getElementById('btn-submit') as HTMLButtonElement;
const editorStatus = document.getElementById('editor-status')!;
const challengeText = document.getElementById('challenge-text')!;
const countdownDisplay = document.getElementById('countdown-display')!;
const resultOverlay = document.getElementById('result-overlay')!;
const rankingList = document.getElementById('ranking-list')!;
const btnAgain = document.getElementById('btn-again') as HTMLButtonElement;
const perfOverlay = document.getElementById('perf-overlay')!;
const perfFps = document.getElementById('perf-fps')!;
const perfLatency = document.getElementById('perf-latency')!;

let frameCount = 0;
let lastFpsTime = performance.now();
let lastSubmitTimestamp = 0;

function initCodeMirror(): void {
  editor = CodeMirror(codeEditorEl, {
    value: '',
    mode: 'javascript',
    theme: 'monokai',
    lineNumbers: true,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    readOnly: true,
    extraKeys: {
      'Ctrl-Enter': () => submitCode(),
      'Cmd-Enter': () => submitCode(),
      Tab: (cm) => {
        if (cm.somethingSelected()) {
          cm.indentSelection('add');
        } else {
          cm.replaceSelection('  ', 'end');
        }
      },
    },
  });

  editor.setSize('100%', '100%');
}

function initPhaser(): void {
  battleScene = new BattleScene();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [battleScene],
    fps: {
      target: 60,
      forceSetTimeOut: false,
      panicMax: 120,
      deltaHistory: 10,
    },
  });

  (window as any).__phaserGame = game;
}

function initSocket(): void {
  socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    myPlayerId = socket.id!;
    console.log(`[Socket] Connected: ${myPlayerId}`);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('matched', (data: { roomId: string; players: any[] }) => {
    console.log(`[Socket] Matched! Room: ${data.roomId}, Players: ${data.players.length}`);
    currentRoomId = data.roomId;
    showBattleUI();
    battleScene.setupPlayers(data.players);
  });

  socket.on('countdown', (seconds: number) => {
    countdownDisplay.textContent = String(seconds);
    countdownDisplay.classList.add('pulse');
    battleScene.showCountdown(seconds);
  });

  socket.on('round_start', (data: { challenge: { description: string; template: string } }) => {
    console.log('[Socket] Round start:', data.challenge.description);
    challengeText.textContent = data.challenge.description;
    editor.setOption('readOnly', false);
    editor.setValue(data.challenge.template || '');
    editor.focus();
    editorStatus.textContent = '待提交';
    editorStatus.style.color = '#ff6b35';
    isSubmitted = false;
    btnSubmit.disabled = false;
    btnSubmit.textContent = '提交代码';

    startCodingCountdown();
  });

  socket.on('coding_countdown', (seconds: number) => {
    countdownDisplay.textContent = String(seconds);
    if (seconds <= 5) {
      countdownDisplay.style.color = '#ff4444';
    } else {
      countdownDisplay.style.color = '#ff6b35';
    }
    if (seconds <= 0 && !isSubmitted) {
      submitCode();
    }
  });

  socket.on('player_status', (data: { playerId: string; status: string }) => {
    if (battleScene) {
      battleScene.updatePlayerStatus(data.playerId, data.status);
    }
  });

  socket.on('code_result', (data: { passed: boolean; passedCount: number; totalCount: number; execTime: number; error?: string; latency: number }) => {
    const latency = performance.now() - lastSubmitTimestamp;
    perfLatency.textContent = `Latency: ${data.latency}ms`;
    console.log(`[Perf] Code result latency: ${data.latency}ms, Local: ${latency.toFixed(0)}ms`);

    if (data.passed) {
      editorStatus.textContent = `通过 ${data.passedCount}/${data.totalCount}`;
      editorStatus.style.color = '#4ade80';
    } else {
      editorStatus.textContent = `失败 ${data.passedCount}/${data.totalCount}`;
      editorStatus.style.color = '#ff4444';
    }
  });

  socket.on('damage', (data: { fromId: string; targetId: string; amount: number; type: string }) => {
    console.log(`[Socket] Damage: ${data.type} from ${data.fromId} to ${data.targetId} amount=${data.amount}`);
    if (data.type === 'error') {
      battleScene.applyDamage(data.fromId, data.fromId, 0, 'error');
    } else {
      battleScene.applyDamage(data.fromId, data.targetId, data.amount, data.type);
    }
  });

  socket.on('player_defeated', (data: { playerId: string; killerId: string | null }) => {
    console.log(`[Socket] Player defeated: ${data.playerId}`);
    battleScene.playerDefeated(data.playerId);
  });

  socket.on('score_update', (data: { playerId: string; score: number }) => {
    console.log(`[Socket] Score update: ${data.playerId} → ${data.score}`);
    battleScene.updateScore(data.playerId, data.score);
  });

  socket.on('round_end', (data: { rankings: Array<{ playerId: string; nickname: string; score: number; hp: number; rank: number }> }) => {
    console.log('[Socket] Round end');
    if (codingIntervalId) {
      clearInterval(codingIntervalId);
      codingIntervalId = null;
    }
    setTimeout(() => showResultOverlay(data.rankings), 800);
  });

  socket.on('error', (data: { message: string }) => {
    console.error('[Socket] Error:', data.message);
  });
}

function startCodingCountdown(): void {
  if (codingIntervalId) {
    clearInterval(codingIntervalId);
  }
}

function showBattleUI(): void {
  lobbyEl.classList.add('hidden');
  editorPanel.classList.remove('hidden');
  battlePanel.classList.remove('hidden');
  perfOverlay.classList.add('active');

  setTimeout(() => {
    if (editor) editor.refresh();
  }, 200);
}

function showResultOverlay(rankings: Array<{ playerId: string; nickname: string; score: number; hp: number; rank: number }>): void {
  resultOverlay.classList.add('active');
  rankingList.innerHTML = '';

  const rankClasses = ['gold', 'silver', 'bronze'];
  const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

  rankings.forEach((r, i) => {
    const li = document.createElement('li');
    const rankClass = i < 3 ? rankClasses[i] : '';
    const rankColor = i < 3 ? rankColors[i] : '#888888';
    li.className = `ranking-item ${rankClass}`.trim();
    li.innerHTML = `
      <span class="ranking-rank" style="color: ${rankColor}">#${r.rank}</span>
      <span class="ranking-name">${r.nickname}</span>
      <span class="ranking-score">${r.score} pts</span>
    `;

    li.style.animationDelay = `${i * 0.1}s`;
    rankingList.appendChild(li);
  });
}

function submitCode(): void {
  if (isSubmitted || !currentRoomId) return;

  const code = editor.getValue();
  if (!code.trim()) return;

  isSubmitted = true;
  btnSubmit.disabled = true;
  btnSubmit.textContent = '运行中...';
  editorStatus.textContent = '运行中';
  editorStatus.style.color = '#00d4ff';
  editor.setOption('readOnly', true);

  lastSubmitTimestamp = performance.now();

  socket.emit('submit_code', {
    roomId: currentRoomId,
    code,
  });
}

function goBackToLobby(): void {
  resultOverlay.classList.remove('active');
  editorPanel.classList.add('hidden');
  battlePanel.classList.add('hidden');
  perfOverlay.classList.remove('active');
  lobbyEl.classList.remove('hidden');
  btnMatch.disabled = false;
  matchingArea.classList.remove('active');
  nicknameInput.value = '';
  countdownDisplay.textContent = '--';
  countdownDisplay.style.color = '#ff6b35';
  countdownDisplay.classList.remove('pulse');

  editor.setOption('readOnly', true);
  editor.setValue('');
  challengeText.textContent = '等待题目下发...';
  editorStatus.textContent = '待提交';
  editorStatus.style.color = '#ff6b35';
  btnSubmit.disabled = false;
  btnSubmit.textContent = '提交代码';
  isSubmitted = false;
  currentRoomId = '';

  if (codingIntervalId) {
    clearInterval(codingIntervalId);
    codingIntervalId = null;
  }

  if (battleScene) {
    battleScene.reset();
  }
}

btnMatch.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    nicknameInput.focus();
    nicknameInput.style.borderColor = '#ff4444';
    setTimeout(() => { nicknameInput.style.borderColor = ''; }, 1000);
    return;
  }

  btnMatch.disabled = true;
  matchingArea.classList.add('active');

  if (!socket?.connected) {
    initSocket();
    socket.on('connect', () => {
      socket.emit('join_queue', { nickname });
    });
  } else {
    socket.emit('join_queue', { nickname });
  }
});

nicknameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnMatch.click();
});

btnSubmit.addEventListener('click', submitCode);

btnAgain.addEventListener('click', () => {
  goBackToLobby();
  socket.emit('play_again', {});
});

function monitorPerformance(): void {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    const fps = frameCount;
    frameCount = 0;
    lastFpsTime = now;

    if (perfOverlay.classList.contains('active')) {
      perfFps.textContent = `FPS: ${fps}`;
    }

    if (fps < 30) {
      console.warn(`[Perf] FPS dropped below 30: ${fps}`);
      perfFps.style.color = '#ff4444';
    } else {
      perfFps.style.color = '#4ade80';
    }
  }
  requestAnimationFrame(monitorPerformance);
}

document.addEventListener('DOMContentLoaded', () => {
  initCodeMirror();
  initPhaser();
  initSocket();
  requestAnimationFrame(monitorPerformance);
});
