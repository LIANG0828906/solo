import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/selection/active-line';
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
const matchingText = document.querySelector('.matching-text')!;

let frameCount = 0;
let lastFpsTime = performance.now();
let lastSubmitTimestamp = 0;
let perfFpsBuffer: number[] = [];
let maxLatency = 0;
let minLatency = Number.MAX_SAFE_INTEGER;
let totalLatency = 0;
let latencyCount = 0;

function initCodeMirror(): void {
  if (!codeEditorEl) {
    console.error('[Init] ❌ #code-editor DOM element not found!');
    return;
  }

  console.log('[Init] ✅ CodeMirror mounting to #code-editor (size check: W=' + codeEditorEl.offsetWidth + ', H=' + codeEditorEl.offsetHeight + ')');

  editor = CodeMirror(codeEditorEl, {
    value: '// 等待匹配成功后开始编写代码...',
    mode: 'javascript',
    theme: 'monokai',
    lineNumbers: true,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    readOnly: true,
    firstLineNumber: 1,
    viewportMargin: Infinity,
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
  editor.refresh();

  console.log('[Init] ✅ CodeMirror initialized');
}

function initPhaser(): void {
  battleScene = new BattleScene();

  const container = document.getElementById('game-container');
  const phaserWidth = container ? Math.max(container.clientWidth, 600) : 800;
  const phaserHeight = container ? Math.max(container.clientHeight, 500) : 600;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: phaserWidth,
    height: phaserHeight,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: phaserWidth,
      height: phaserHeight,
    },
    scene: [battleScene],
    fps: {
      target: 60,
      min: 30,
      forceSetTimeOut: false,
      panicMax: 120,
      deltaHistory: 10,
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: false,
      clearBeforeRender: true,
    },
    audio: {
      noAudio: true,
    },
  });

  (window as any).__phaserGame = game;

  game.events.on('step', () => {
    frameCount++;
  });

  console.log('[Init] ✅ Phaser game instance created');
}

function initSocket(): void {
  socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    myPlayerId = socket.id!;
    console.log(`[Socket] ✅ Connected: ${myPlayerId}`);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] ⚠ Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] ❌ Connection error:', err.message);
    btnMatch.disabled = false;
    matchingArea.classList.remove('active');
  });

  socket.on('queue_status', (data: { status: string; queueSize: number; message?: string }) => {
    console.log(`[Queue] 📊 status=${data.status}, size=${data.size || data.queueSize}`);
    if (data.message) {
      matchingText.textContent = data.message + `(${data.queueSize})`;
    } else {
      matchingText.textContent = `正在寻找对手... (${data.queueSize}人等待)`;
    }
  });

  socket.on('matched', (data: { roomId: string; players: any[] }) => {
    console.log(`[Socket] ⚔ MATCHED! Room=${data.roomId}, Players=${data.players.length}`);
    currentRoomId = data.roomId;

    switchToBattleScreen();

    setTimeout(() => {
      battleScene.setupPlayers(data.players);
      if (editor) editor.refresh();
    }, 100);
  });

  socket.on('countdown', (seconds: number) => {
    countdownDisplay.textContent = String(seconds);
    countdownDisplay.classList.add('pulse');
    battleScene.showCountdown(seconds);
    console.log(`[Countdown] ⏳ ${seconds}s until round start`);
  });

  socket.on('round_start', (data: { challenge: { description: string; template: string } }) => {
    console.log('[Socket] 🚀 Round started:', data.challenge.description.substring(0, 40) + '...');

    countdownDisplay.classList.remove('pulse');
    challengeText.textContent = data.challenge.description;

    if (editor) {
      editor.setOption('readOnly', false);
      editor.setValue(data.challenge.template || 'function solution() {\n  \n}');
      editor.clearHistory();
      setTimeout(() => {
        editor.refresh();
        editor.focus();
        editor.setCursor(editor.lineCount() - 1, 0);
      }, 50);
    }

    editorStatus.textContent = '待提交';
    editorStatus.style.color = '#ff6b35';
    isSubmitted = false;
    btnSubmit.disabled = false;
    btnSubmit.textContent = '提交代码';
  });

  socket.on('coding_countdown', (seconds: number) => {
    countdownDisplay.textContent = String(seconds);
    if (seconds <= 5) {
      countdownDisplay.style.color = '#ff4444';
      countdownDisplay.classList.add('pulse');
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
    const localLatency = performance.now() - lastSubmitTimestamp;
    maxLatency = Math.max(maxLatency, data.latency);
    minLatency = Math.min(minLatency, data.latency);
    totalLatency += data.latency;
    latencyCount++;

    const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
    perfLatency.textContent = `Latency: ${data.latency}ms (avg:${avgLatency}, max:${maxLatency})`;

    console.log(`[Perf] 📊 Latency: ${data.latency}ms | Local: ${localLatency.toFixed(0)}ms | Avg: ${avgLatency}ms | Max: ${maxLatency}ms | Min: ${minLatency}ms`);

    if (data.latency > 2000) {
      console.warn(`[Perf] ⚠ SLA VIOLATION: latency=${data.latency}ms exceeds 2000ms target!`);
      perfLatency.style.color = '#ff4444';
      setTimeout(() => { perfLatency.style.color = '#4ade80'; }, 3000);
    }

    if (data.passed) {
      editorStatus.textContent = `✅ ${data.passedCount}/${data.totalCount}`;
      editorStatus.style.color = '#4ade80';
      flashEditorBorder('#4ade80');
    } else {
      const errMsg = data.error ? `(${data.error.substring(0, 18)})` : '';
      editorStatus.textContent = `❌ ${data.passedCount}/${data.totalCount} ${errMsg}`;
      editorStatus.style.color = '#ff4444';
      flashEditorBorder('#ff4444');
    }
  });

  socket.on('damage', (data: { fromId: string; targetId: string; amount: number; type: string }) => {
    console.log(`[Combat] ⚡ ${data.type}: ${data.fromId.slice(0, 4)} → ${data.targetId.slice(0, 4)} -${data.amount}HP`);
    if (data.type === 'error') {
      battleScene.applyDamage(data.fromId, data.fromId, 0, 'error');
    } else {
      battleScene.applyDamage(data.fromId, data.targetId, data.amount, data.type);
    }
  });

  socket.on('player_defeated', (data: { playerId: string; killerId: string | null }) => {
    console.log(`[Combat] 💀 Player ${data.playerId.slice(0, 6)} defeated (by ${data.killerId ? data.killerId.slice(0, 6) : 'disconnect'})`);
    battleScene.playerDefeated(data.playerId);
  });

  socket.on('score_update', (data: { playerId: string; score: number; delta?: number; defeated?: string }) => {
    console.log(`[Score] 🏆 Player ${data.playerId.slice(0, 6)} → ${data.score} (+${data.delta || 10})`);
    if (data.defeated) {
      showToast(`⚔ 击败了 ${data.defeated}! +${data.delta || 10}分`);
    }
    battleScene.updateScore(data.playerId, data.score);
  });

  socket.on('round_end', (data: { rankings: Array<{ playerId: string; nickname: string; score: number; hp: number; rank: number }> }) => {
    console.log('[Round] 🏁 Round ended!');
    if (codingIntervalId) {
      clearInterval(codingIntervalId);
      codingIntervalId = null;
    }
    setTimeout(() => showResultOverlay(data.rankings), 800);
  });

  socket.on('error', (data: { message: string }) => {
    console.error('[Socket] ❌ Server error:', data.message);
    alert('错误: ' + data.message);
  });
}

function switchToBattleScreen(): void {
  console.log('[UI] 🔄 Switching to BATTLE SCREEN');

  lobbyEl.classList.add('hidden');
  matchingArea.classList.remove('active');

  editorPanel.classList.remove('hidden');
  battlePanel.classList.remove('hidden');
  perfOverlay.classList.add('active');

  const battlePanelEl = document.getElementById('battle-panel')!;
  console.log('[UI] Battle panel visible, size:', battlePanelEl.clientWidth, 'x', battlePanelEl.clientHeight);
  console.log('[UI] Editor panel visible, size:', editorPanel.clientWidth, 'x', editorPanel.clientHeight);

  const refreshSchedule = [10, 50, 100, 200, 500, 1000];
  refreshSchedule.forEach((delay, idx) => {
    setTimeout(() => {
      if (editor) {
        editor.refresh();
        console.log(`[UI] 🔄 CodeMirror refresh #${idx + 1} at ${delay}ms`);
      }
      if (battleScene) {
        battleScene.scene && battleScene.scale.resize(battlePanelEl.clientWidth, battlePanelEl.clientHeight);
      }
    }, delay);
  });
}

function flashEditorBorder(color: string): void {
  const originalBorder = editorPanel.style.borderRight;
  editorPanel.style.borderRight = `3px solid ${color}`;
  editorPanel.style.boxShadow = `0 0 20px ${color}40`;
  setTimeout(() => {
    editorPanel.style.borderRight = originalBorder || '1px solid #0f3460';
    editorPanel.style.boxShadow = 'none';
  }, 400);
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #1a1a2e, #0f3460);
    color: #ffd700;
    padding: 12px 28px;
    border-radius: 8px;
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    border: 1px solid #ffd700;
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s;
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(-4px)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function showResultOverlay(rankings: Array<{ playerId: string; nickname: string; score: number; hp: number; rank: number }>): void {
  resultOverlay.classList.add('active');
  rankingList.innerHTML = '';

  const rankClasses = ['gold', 'silver', 'bronze'];
  const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
  const rankEmojis = ['🥇', '🥈', '🥉'];

  rankings.forEach((r, i) => {
    const li = document.createElement('li');
    const rankClass = i < 3 ? rankClasses[i] : '';
    const rankColor = i < 3 ? rankColors[i] : '#888888';
    const emoji = i < 3 ? rankEmojis[i] : '';

    li.className = `ranking-item ${rankClass}`.trim();

    li.innerHTML = `
      <span class="ranking-rank" style="color: ${rankColor}">${emoji} #${r.rank}</span>
      <span class="ranking-name">${r.nickname}${r.playerId === myPlayerId ? ' (你)' : ''}</span>
      <span class="ranking-score">${r.score} <small style="opacity:0.6">pts</small></span>
    `;

    if (rankClass === 'gold') {
      li.style.animation = 'goldGlow 2s ease-in-out infinite';
    } else if (rankClass === 'silver') {
      li.style.animation = 'silverGlow 2s ease-in-out infinite 0.3s';
    } else if (rankClass === 'bronze') {
      li.style.animation = 'bronzeGlow 2s ease-in-out infinite 0.6s';
    }

    li.style.opacity = '0';
    li.style.transform = 'translateX(-20px)';
    rankingList.appendChild(li);

    setTimeout(() => {
      li.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      li.style.opacity = '1';
      li.style.transform = 'translateX(0)';
    }, 100 + i * 120);
  });

  if (!document.getElementById('ranking-style')) {
    const style = document.createElement('style');
    style.id = 'ranking-style';
    style.textContent = `
      @keyframes goldGlow {
        0%, 100% { box-shadow: 0 0 16px rgba(255,215,0,0.2), inset 0 0 20px rgba(255,215,0,0.05); }
        50% { box-shadow: 0 0 30px rgba(255,215,0,0.6), inset 0 0 30px rgba(255,215,0,0.15); }
      }
      @keyframes silverGlow {
        0%, 100% { box-shadow: 0 0 16px rgba(192,192,192,0.15), inset 0 0 20px rgba(192,192,192,0.04); }
        50% { box-shadow: 0 0 28px rgba(192,192,192,0.45), inset 0 0 28px rgba(192,192,192,0.12); }
      }
      @keyframes bronzeGlow {
        0%, 100% { box-shadow: 0 0 14px rgba(205,127,50,0.14), inset 0 0 18px rgba(205,127,50,0.04); }
        50% { box-shadow: 0 0 24px rgba(205,127,50,0.4), inset 0 0 24px rgba(205,127,50,0.1); }
      }
    `;
    document.head.appendChild(style);
  }
}

function submitCode(): void {
  if (isSubmitted || !currentRoomId) return;
  if (!editor) return;

  const code = editor.getValue();
  if (!code.trim()) {
    editorStatus.textContent = '⚠ 代码为空';
    editorStatus.style.color = '#ffff00';
    return;
  }

  isSubmitted = true;
  btnSubmit.disabled = true;
  btnSubmit.textContent = '⏳ 运行中...';
  editorStatus.textContent = '🔨 运行中';
  editorStatus.style.color = '#00d4ff';
  editor.setOption('readOnly', true);

  lastSubmitTimestamp = performance.now();
  console.log(`[Submit] 📝 Submitting code (${code.length} bytes), timestamp=${lastSubmitTimestamp.toFixed(0)}ms`);

  socket.emit('submit_code', {
    roomId: currentRoomId,
    code,
  });
}

function goBackToLobby(): void {
  console.log('[UI] 🔙 Returning to lobby');

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

  if (editor) {
    editor.setOption('readOnly', true);
    editor.setValue('// 等待匹配成功后开始编写代码...');
    editor.clearHistory();
  }

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
    nicknameInput.style.boxShadow = '0 0 16px rgba(255,68,68,0.4)';
    setTimeout(() => {
      nicknameInput.style.borderColor = '';
      nicknameInput.style.boxShadow = '';
    }, 1000);
    return;
  }

  btnMatch.disabled = true;
  matchingArea.classList.add('active');
  matchingText.textContent = '正在连接服务器...';

  console.log('[UI] 🎯 Start matching:', nickname);

  if (!socket || !socket.connected) {
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
  setTimeout(() => {
    socket.emit('play_again', {});
    matchingArea.classList.add('active');
    btnMatch.disabled = true;
  }, 300);
});

function monitorPerformance(): void {
  const now = performance.now();
  const elapsed = now - lastFpsTime;

  if (elapsed >= 1000) {
    const fps = Math.round((frameCount * 1000) / elapsed);
    perfFpsBuffer.push(fps);
    if (perfFpsBuffer.length > 10) perfFpsBuffer.shift();

    const avgFps = Math.round(perfFpsBuffer.reduce((a, b) => a + b, 0) / perfFpsBuffer.length);

    if (perfOverlay.classList.contains('active')) {
      perfFps.textContent = `FPS: ${fps} (avg:${avgFps})`;
    }

    if (fps < 30) {
      console.warn(`[Perf] ⚠ LOW FPS: current=${fps}, avg=${avgFps} - below 30fps target!`);
      perfFps.style.color = '#ff4444';
    } else if (fps < 45) {
      perfFps.style.color = '#ffa500';
    } else {
      perfFps.style.color = '#4ade80';
    }

    frameCount = 0;
    lastFpsTime = now;
  }
  requestAnimationFrame(monitorPerformance);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Init] 🚀 DOM Content Loaded - initializing app');
  console.log(`[Init] 📄 #code-editor exists:`, !!document.getElementById('code-editor'));
  console.log(`[Init] 📄 #game-container exists:`, !!document.getElementById('game-container'));

  initCodeMirror();
  initPhaser();
  initSocket();
  requestAnimationFrame(monitorPerformance);

  console.log('[Init] ✅ App fully initialized');
});
