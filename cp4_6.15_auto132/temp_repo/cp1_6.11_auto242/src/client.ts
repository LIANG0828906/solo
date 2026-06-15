interface Player {
  id: string;
  nickname: string;
  score: number;
  isOnline: boolean;
  isHost: boolean;
  seatIndex: number;
}

interface Score {
  meter: number;
  imagery: number;
  allusion: number;
  total: number;
}

interface Recommendation {
  poem: string;
  author: string;
  title: string;
  reason: string;
}

interface PoemEntry {
  playerId: string;
  nickname: string;
  upperLine: string;
  lowerLine: string;
  score: Score;
}

interface RoomState {
  id: string;
  players: Player[];
  currentTurn: number;
  currentUpperLine: string;
  timeLeft: number;
  gameState: 'waiting' | 'playing' | 'scoring' | 'flowing';
  poemEntries: PoemEntry[];
}

declare const io: any;

const SERVER_URL = 'http://localhost:3000';
const app = document.getElementById('app')!;
let socket: any = null;
let currentRoomId: string = '';
let currentPlayerId: string = '';
let currentNickname: string = '';
let currentRoomState: RoomState | null = null;
let currentUpperLine: string = '';
let currentUpperRhyme: string = '';
let isMyTurn: boolean = false;
let timeLeft: number = 90;
let messageThrottleTime: number = 0;
let typingTimeout: any = null;

const rhymeMap = new Map<string, string[]>();
const rhymeCharMap = new Map<string, string>();

const initRhymeDatabase = () => {
  const rhymeGroups: Record<string, string[]> = {
    'ang': ['光', '霜', '乡', '香', '长', '阳', '忘', '狂', '凉', '伤', '床', '方', '黄', '肠', '堂', '茫', '浪', '苍', '廊'],
    'ing': ['明', '声', '情', '青', '轻', '听', '星', '亭', '庭', '宁', '平', '行', '城', '成', '名', '灵', '清', '晴', '精'],
    'an': ['山', '间', '还', '寒', '关', '颜', '闲', '难', '眠', '年', '天', '前', '边', '烟', '泉', '船', '怜', '传', '牵'],
    'u': ['流', '秋', '楼', '愁', '舟', '头', '游', '留', '休', '州', '幽', '柔', '浮', '收', '钩', '悠', '畴', '酬', '稠'],
    'i': ['溪', '西', '低', '迷', '啼', '题', '堤', '梯', '泥', '犁', '鸡', '栖', '齐', '兮', '霓', '犀', '蹊', '黎', '携'],
    'ao': ['高', '毛', '豪', '桃', '朝', '遥', '桥', '调', '飘', '潮', '箫', '霄', '销', '骄', '烧', '摇', '滔', '雕', '袍'],
    'ou': ['秋', '流', '舟', '楼', '愁', '头', '游', '留', '休', '州', '幽', '柔', '浮', '收', '钩', '鸥', '楼', '眸', '筹'],
    'a': ['花', '家', '霞', '茶', '沙', '涯', '鸦', '华', '斜', '夸', '麻', '瓜', '蛙', '虾', '槎', '芽', '纱', '娃', '琶'],
    'uo': ['波', '河', '歌', '多', '过', '罗', '蓑', '荷', '蛾', '磨', '阿', '哦', '婆', '梭', '驮', '螺', '蓑', '婆', '酡'],
    'e': ['歌', '河', '波', '多', '过', '罗', '蓑', '荷', '蛾', '磨', '阿', '哦', '婆', '梭', '驮', '鹅', '娥', '蛾', '歌']
  };

  Object.entries(rhymeGroups).forEach(([rhyme, chars]) => {
    rhymeMap.set(rhyme, chars);
    chars.forEach(char => rhymeCharMap.set(char, rhyme));
  });
};

initRhymeDatabase();

const checkRhyme = (char: string, targetRhyme: string): boolean => {
  const charRhyme = rhymeCharMap.get(char);
  return charRhyme === targetRhyme;
};

const getMatchingChars = (rhyme: string): string[] => {
  return rhymeMap.get(rhyme) || [];
};

const calculateMatchPercentage = (input: string, upperLine: string): number => {
  if (!input) return 0;
  
  let score = 0;
  
  if (input.length >= 4) score += 20;
  if (input.length >= 5) score += 10;
  if (input.length >= 7) score += 10;
  
  const lastChar = input.charAt(input.length - 1);
  if (checkRhyme(lastChar, currentUpperRhyme)) {
    score += 30;
  }
  
  const imageryChars = ['月', '山', '水', '风', '花', '云', '雨', '雪', '夜', '春', '秋', '江', '河', '湖', '海', '松', '竹', '梅', '柳', '星'];
  for (const char of input) {
    if (imageryChars.includes(char)) {
      score += 5;
    }
  }
  
  for (const char of upperLine) {
    if (input.includes(char)) {
      score += 3;
    }
  }
  
  return Math.min(100, score);
};

const showError = (message: string) => {
  const existingToast = document.querySelector('.error-toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
};

const renderLobby = () => {
  app.innerHTML = `
    <div class="horizontal-plaque">
      <div class="plaque-title">曲水流觞</div>
    </div>
    <div class="lobby">
      <h1 class="lobby-title">曲水流觞</h1>
      <p class="lobby-subtitle">与文人墨客共赴雅集，联句赋诗</p>
      
      <div class="input-group">
        <label class="input-label">请输入您的雅号</label>
        <input type="text" class="text-input" id="nicknameInput" placeholder="如：青莲居士" maxlength="8">
      </div>
      
      <div class="btn-group">
        <button class="btn btn-primary" id="createRoomBtn">创建房间</button>
        <button class="btn btn-secondary" id="joinRoomBtn">加入房间</button>
      </div>
      
      <div class="input-group hidden" id="joinRoomGroup">
        <label class="input-label">请输入房间号</label>
        <input type="text" class="text-input" id="roomIdInput" placeholder="6位字母数字" maxlength="6" style="text-transform: uppercase; letter-spacing: 4px;">
        <button class="btn btn-primary" id="confirmJoinBtn">确认加入</button>
      </div>
      
      <div class="room-info hidden" id="roomInfo">
        <span>房间号：</span>
        <span class="room-code" id="roomCodeDisplay"></span>
        <button class="copy-btn" id="copyBtn">复制</button>
      </div>
      
      <p class="lobby-subtitle hidden" id="waitingText">等待其他玩家加入...</p>
      <p class="lobby-subtitle" id="playerCount">玩家人数：0 / 6</p>
      
      <button class="btn btn-primary hidden" id="startBtn" style="margin-top: 20px;">开始雅集</button>
    </div>
  `;
  
  const nicknameInput = document.getElementById('nicknameInput') as HTMLInputElement;
  const createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
  const joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
  const joinRoomGroup = document.getElementById('joinRoomGroup') as HTMLDivElement;
  const roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement;
  const confirmJoinBtn = document.getElementById('confirmJoinBtn') as HTMLButtonElement;
  const roomInfo = document.getElementById('roomInfo') as HTMLDivElement;
  const roomCodeDisplay = document.getElementById('roomCodeDisplay') as HTMLSpanElement;
  const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
  const waitingText = document.getElementById('waitingText') as HTMLParagraphElement;
  const playerCount = document.getElementById('playerCount') as HTMLParagraphElement;
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  
  createRoomBtn.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
      nicknameInput.classList.add('error');
      setTimeout(() => nicknameInput.classList.remove('error'), 300);
      showError('请输入您的雅号');
      return;
    }
    
    currentNickname = nickname;
    socket.emit('create_room', { nickname });
  });
  
  joinRoomBtn.addEventListener('click', () => {
    joinRoomGroup.classList.toggle('hidden');
  });
  
  confirmJoinBtn.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim();
    const roomId = roomIdInput.value.trim().toUpperCase();
    
    if (!nickname) {
      nicknameInput.classList.add('error');
      showError('请输入您的雅号');
      return;
    }
    
    if (!roomId || roomId.length !== 6) {
      roomIdInput.classList.add('error');
      showError('请输入6位房间号');
      return;
    }
    
    currentNickname = nickname;
    const savedPlayerId = sessionStorage.getItem('playerId');
    socket.emit('join_room', { roomId, nickname, playerId: savedPlayerId || undefined });
  });
  
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentRoomId);
    copyBtn.textContent = '已复制!';
    setTimeout(() => copyBtn.textContent = '复制', 2000);
  });
  
  startBtn.addEventListener('click', () => {
    socket.emit('start_game', { roomId: currentRoomId });
  });
  
  socket.on('room_created', (roomId: string) => {
    currentRoomId = roomId;
    roomCodeDisplay.textContent = roomId;
    roomInfo.classList.remove('hidden');
    waitingText.classList.remove('hidden');
    createRoomBtn.disabled = true;
    joinRoomBtn.disabled = true;
    joinRoomGroup.classList.add('hidden');
  });
  
  socket.on('room_joined', (roomId: string) => {
    currentRoomId = roomId;
    roomCodeDisplay.textContent = roomId;
    roomInfo.classList.remove('hidden');
    waitingText.classList.remove('hidden');
    createRoomBtn.disabled = true;
    joinRoomBtn.disabled = true;
    joinRoomGroup.classList.add('hidden');
  });
  
  socket.on('room_state', (state: RoomState) => {
    currentRoomState = state;
    playerCount.textContent = `玩家人数：${state.players.length} / 6`;
    
    const currentPlayer = state.players.find(p => p.id === socket.id);
    if (currentPlayer?.isHost && state.players.length >= 3 && state.gameState === 'waiting') {
      startBtn.classList.remove('hidden');
    } else {
      startBtn.classList.add('hidden');
    }
    
    if (state.gameState === 'playing') {
      renderGame();
    }
  });
  
  socket.on('game_started', (state: RoomState) => {
    currentRoomState = state;
    renderGame();
  });
};

const renderGame = () => {
  if (!currentRoomState) return;
  
  const seatPositions = calculateSeatPositions();
  
  app.innerHTML = `
    <div class="horizontal-plaque">
      <div class="plaque-title">曲水流觞</div>
    </div>
    
    <div class="turn-indicator hidden" id="turnIndicator"></div>
    
    <div class="game-container">
      <div class="stream-container">
        <div class="stream"></div>
        <svg class="stream-path" viewBox="0 0 1200 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:0.6" />
              <stop offset="50%" style="stop-color:#B0E0E6;stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:#87CEEB;stop-opacity:0.6" />
            </linearGradient>
          </defs>
          <path d="M 0 150 Q 300 80, 600 150 T 1200 150" 
                fill="none" 
                stroke="url(#streamGradient)" 
                stroke-width="60"
                stroke-linecap="round"/>
        </svg>
      </div>
      
      <div class="seats-container" id="seatsContainer">
        ${seatPositions.map((pos, index) => {
          const player = currentRoomState!.players.find(p => p.seatIndex === index);
          const isCurrentTurn = currentRoomState!.currentTurn === index && currentRoomState!.gameState === 'playing';
          return `
            <div class="seat ${player ? '' : 'empty'} ${isCurrentTurn ? 'current-turn' : ''}" 
                 style="left: ${pos.x}%; top: ${pos.y}%;"
                 data-seat="${index}">
              ${player ? `
                <span class="seat-number">${index + 1}</span>
                <span class="seat-status ${player.isOnline ? 'online' : 'offline'}"></span>
                <span class="seat-score" title="累计得分">${player.score}</span>
                <span class="seat-player-name">${player.nickname}</span>
              ` : `<span class="seat-number">${index + 1}</span>`}
            </div>
          `;
        }).join('')}
      </div>
      
      <div id="fanPanelContainer"></div>
    </div>
    
    <div class="player-panel">
      <button class="player-toggle" id="playerToggle">⚙</button>
      <div class="player-list hidden" id="playerList">
        <div class="player-list-title">雅集宾客</div>
        <div id="playerListItems"></div>
        <button class="start-game-btn hidden" id="startGameBtn">开始雅集</button>
      </div>
    </div>
    
    <div class="petal-container" id="petalContainer"></div>
    <div class="monument-container hidden" id="monumentContainer"></div>
    <button class="restart-btn hidden" id="restartBtn">再赋新词</button>
  `;
  
  updatePlayerList();
  
  const playerToggle = document.getElementById('playerToggle') as HTMLButtonElement;
  const playerList = document.getElementById('playerList') as HTMLDivElement;
  
  playerToggle.addEventListener('click', () => {
    playerList.classList.toggle('hidden');
  });
  
  const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement;
  const currentPlayer = currentRoomState.players.find(p => p.id === socket.id);
  if (currentPlayer?.isHost && currentRoomState.gameState === 'waiting' && currentRoomState.players.length >= 3) {
    startGameBtn.classList.remove('hidden');
  }
  
  startGameBtn.addEventListener('click', () => {
    socket.emit('start_game', { roomId: currentRoomId });
  });
  
  const restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;
  restartBtn.addEventListener('click', () => {
    const currentPlayer = currentRoomState?.players.find(p => p.id === socket.id);
    if (currentPlayer?.isHost) {
      socket.emit('restart_game', { roomId: currentRoomId });
      document.getElementById('monumentContainer')?.classList.add('hidden');
      restartBtn.classList.add('hidden');
    }
  });
};

const calculateSeatPositions = () => {
  const positions = [];
  const containerWidth = 1200;
  const containerHeight = 350;
  
  for (let i = 0; i < 6; i++) {
    const isTop = i < 3;
    const col = i % 3;
    const xPercent = 15 + col * 35;
    const yPercent = isTop ? 10 : 75;
    positions.push({ x: xPercent, y: yPercent });
  }
  
  return positions;
};

const updatePlayerList = () => {
  if (!currentRoomState) return;
  
  const playerListItems = document.getElementById('playerListItems');
  if (!playerListItems) return;
  
  const sortedPlayers = [...currentRoomState.players].sort((a, b) => a.seatIndex - b.seatIndex);
  
  playerListItems.innerHTML = sortedPlayers.map(player => `
    <div class="player-list-item ${player.id === socket.id ? 'current' : ''}">
      <span class="player-status-dot ${player.isOnline ? 'online' : 'offline'}"></span>
      <span class="player-list-name ${player.isHost ? 'host' : ''}">${player.nickname}</span>
      <span class="player-list-score">
        <span class="star-icon">★</span>
        ${player.score}
      </span>
    </div>
  `).join('');
};

const showFanPanel = (upperLine: string, upperRhyme: string, seatIndex: number) => {
  const container = document.getElementById('fanPanelContainer');
  if (!container) return;
  
  const seatPositions = calculateSeatPositions();
  const pos = seatPositions[seatIndex];
  
  container.innerHTML = `
    <div class="fan-panel" style="left: ${pos.x}%; top: ${pos.y + 15}%; transform: translateX(-50%);">
      <div class="countdown" id="countdown">${timeLeft}秒</div>
      <div class="fan-upper-line">${upperLine}</div>
      <div class="fan-input-container">
        <input type="text" class="fan-input" id="poemInput" placeholder="请输入下句..." maxlength="12">
        <span class="rhyme-indicator mismatch" id="rhymeIndicator">不押韵</span>
      </div>
      <div class="match-progress">
        <div class="match-progress-bar">
          <div class="match-progress-fill" id="matchProgressFill" style="width: 0%"></div>
        </div>
        <span class="match-percent" id="matchPercent">0%</span>
      </div>
      <button class="submit-btn" id="submitBtn" disabled>提交</button>
    </div>
  `;
  
  const poemInput = document.getElementById('poemInput') as HTMLInputElement;
  const rhymeIndicator = document.getElementById('rhymeIndicator') as HTMLSpanElement;
  const matchProgressFill = document.getElementById('matchProgressFill') as HTMLDivElement;
  const matchPercent = document.getElementById('matchPercent') as HTMLSpanElement;
  const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
  const countdown = document.getElementById('countdown') as HTMLDivElement;
  
  if (isMyTurn) {
    poemInput.focus();
  } else {
    poemInput.disabled = true;
    poemInput.placeholder = '请等待其他玩家...';
  }
  
  const updateCountdown = () => {
    if (countdown) {
      countdown.textContent = `${timeLeft}秒`;
      if (timeLeft <= 10) {
        countdown.classList.add('urgent');
      }
    }
  };
  
  updateCountdown();
  
  poemInput.addEventListener('input', () => {
    const value = poemInput.value.trim();
    const lastChar = value.charAt(value.length - 1);
    const isRhymeMatch = checkRhyme(lastChar, upperRhyme);
    const matchPercentValue = calculateMatchPercentage(value, upperLine);
    
    rhymeIndicator.textContent = isRhymeMatch ? '押韵' : '不押韵';
    rhymeIndicator.className = `rhyme-indicator ${isRhymeMatch ? 'match' : 'mismatch'}`;
    matchProgressFill.style.width = `${matchPercentValue}%`;
    matchPercent.textContent = `${matchPercentValue}%`;
    
    submitBtn.disabled = !isRhymeMatch || value.length < 4;
    
    if (Date.now() - messageThrottleTime > 100) {
      messageThrottleTime = Date.now();
      socket.emit('typing', { roomId: currentRoomId, isTyping: true });
      
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('typing', { roomId: currentRoomId, isTyping: false });
      }, 500);
    }
  });
  
  submitBtn.addEventListener('click', () => {
    const value = poemInput.value.trim();
    if (value.length >= 4) {
      socket.emit('submit_poem', { roomId: currentRoomId, poem: value });
    }
  });
  
  poemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !submitBtn.disabled) {
      submitBtn.click();
    }
  });
};

const hideFanPanel = () => {
  const container = document.getElementById('fanPanelContainer');
  if (container) {
    container.innerHTML = '';
  }
};

const showScoreScroll = (
  upperLine: string,
  lowerLine: string,
  score: Score,
  recommendations: Recommendation[],
  rhymeMatch: boolean,
  isCurrentPlayer: boolean
) => {
  const modal = document.createElement('div');
  modal.className = 'scroll-modal';
  modal.innerHTML = `
    <div class="scroll-container">
      <div class="scroll-header">诗成得赏</div>
      <div class="scroll-body">
        <div class="poem-display">
          <div class="poem-line">${upperLine}</div>
          <div class="poem-line">${lowerLine}</div>
          ${!rhymeMatch ? '<div style="color: var(--rouge); font-size: 0.9rem; margin-top: 10px;">注：此句未押韵，分数酌减</div>' : ''}
        </div>
        
        <div class="score-section">
          <div class="score-title">三维评分</div>
          <div class="score-item">
            <span class="score-label">格律</span>
            <div class="score-bar-container">
              <div class="score-bar" data-target="${score.meter}"></div>
            </div>
            <span class="score-value">${score.meter}</span>
          </div>
          <div class="score-item">
            <span class="score-label">意象</span>
            <div class="score-bar-container">
              <div class="score-bar" data-target="${score.imagery}"></div>
            </div>
            <span class="score-value">${score.imagery}</span>
          </div>
          <div class="score-item">
            <span class="score-label">用典</span>
            <div class="score-bar-container">
              <div class="score-bar" data-target="${score.allusion}"></div>
            </div>
            <span class="score-value">${score.allusion}</span>
          </div>
        </div>
        
        <div class="total-score">
          <div class="total-score-label">总得分</div>
          <div class="total-score-value">${score.total}</div>
        </div>
        
        <div class="recommendations-section">
          <div class="recommendations-title">名人名句参考</div>
          ${recommendations.map(rec => `
            <div class="recommendation-item">
              <div class="recommendation-poem">${rec.poem}</div>
              <div class="recommendation-meta">——${rec.author}《${rec.title}》</div>
              <div class="recommendation-reason">${rec.reason}</div>
            </div>
          `).join('')}
        </div>
        
        <button class="scroll-close" id="scrollClose">${isCurrentPlayer ? '继续' : '知道了'}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => {
    const bars = modal.querySelectorAll('.score-bar');
    bars.forEach((bar: any) => {
      const target = bar.dataset.target;
      bar.style.width = `${target}%`;
    });
  }, 300);
  
  const closeBtn = modal.querySelector('#scrollClose') as HTMLButtonElement;
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

const createPetal = (poem: string, index: number, total: number): HTMLElement => {
  const petal = document.createElement('div');
  petal.className = 'petal';
  
  const startX = 10 + Math.random() * 20;
  const startY = 20 + Math.random() * 10;
  const delay = index * 0.5;
  
  petal.innerHTML = `
    <svg width="80" height="50" viewBox="0 0 80 50">
      <defs>
        <linearGradient id="petalGrad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFB7C5;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#FF69B4;stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <path d="M 40 5 Q 70 15, 75 30 Q 70 45, 40 45 Q 10 45, 5 30 Q 10 15, 40 5" 
            fill="url(#petalGrad${index})" 
            stroke="#FF69B4" 
            stroke-width="1"/>
      <text x="40" y="30" class="petal-text" text-anchor="middle">${poem}</text>
    </svg>
  `;
  
  petal.style.left = `${startX}%`;
  petal.style.top = `${startY}%`;
  petal.style.animation = `floatUpDown 1.5s ease-in-out infinite`;
  petal.style.animationDelay = `${delay}s`;
  
  return petal;
};

const animatePetals = (entries: PoemEntry[]) => {
  const container = document.getElementById('petalContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const monumentX = viewportWidth - 200;
  const monumentY = viewportHeight - 225;
  
  const poems = entries.map(e => e.lowerLine);
  
  poems.forEach((poem, index) => {
    const petal = createPetal(poem, index, poems.length);
    container.appendChild(petal);
    
    const duration = 5000;
    const delay = index * 500;
    const startX = (10 + Math.random() * 20) * viewportWidth / 100;
    const startY = (20 + Math.random() * 10) * viewportHeight / 100;
    
    const cp1x = viewportWidth * 0.35;
    const cp1y = viewportHeight * 0.4 + Math.random() * 50;
    const cp2x = viewportWidth * 0.65;
    const cp2y = viewportHeight * 0.5 - Math.random() * 50;
    
    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp + delay;
      const elapsed = timestamp - startTime;
      
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }
      
      const t = Math.min(elapsed / duration, 1);
      
      const x = Math.pow(1 - t, 3) * startX + 
                3 * Math.pow(1 - t, 2) * t * cp1x + 
                3 * (1 - t) * Math.pow(t, 2) * cp2x + 
                Math.pow(t, 3) * monumentX;
      
      const y = Math.pow(1 - t, 3) * startY + 
                3 * Math.pow(1 - t, 2) * t * cp1y + 
                3 * (1 - t) * Math.pow(t, 2) * cp2y + 
                Math.pow(t, 3) * monumentY;
      
      const floatOffset = Math.sin(t * Math.PI * 6) * 5;
      const rotation = t * 720;
      
      petal.style.left = `${x}px`;
      petal.style.top = `${y + floatOffset}px`;
      petal.style.transform = `rotate(${rotation}deg)`;
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        petal.style.opacity = '0';
        petal.style.transition = 'opacity 0.3s ease';
        
        if (index === poems.length - 1) {
          setTimeout(() => {
            showMonument(entries);
          }, 300);
        }
      }
    };
    
    requestAnimationFrame(animate);
  });
};

const showMonument = (entries: PoemEntry[]) => {
  const container = document.getElementById('monumentContainer');
  if (!container) return;
  
  container.classList.remove('hidden');
  
  const poemLines = entries.map(e => `${e.upperLine}，${e.lowerLine}`);
  
  container.innerHTML = `
    <div class="monument">
      <div class="monument-title">流觞诗碑</div>
      <div class="monument-poem">
        ${poemLines.map((line, i) => `
          <div class="monument-line" data-line="${i}">${line}</div>
        `).join('')}
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const lines = container.querySelectorAll('.monument-line');
    lines.forEach((line, index) => {
      setTimeout(() => {
        const text = line.textContent || '';
        line.textContent = '';
        
        text.split('').forEach((char, charIndex) => {
          setTimeout(() => {
            line.textContent += char;
            line.classList.add('show');
          }, charIndex * 300);
        });
      }, index * 1500);
    });
    
    const currentPlayer = currentRoomState?.players.find(p => p.id === socket.id);
    if (currentPlayer?.isHost) {
      const restartBtn = document.getElementById('restartBtn');
      if (restartBtn) {
        setTimeout(() => {
          restartBtn.classList.remove('hidden');
        }, poemLines.length * 3000 + 1000);
      }
    }
  }, 1000);
};

const initSocket = () => {
  socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 60
  });
  
  socket.on('connect', () => {
    currentPlayerId = socket.id;
    console.log('Connected to server:', currentPlayerId);
    
    const savedRoomId = sessionStorage.getItem('roomId');
    const savedNickname = sessionStorage.getItem('nickname');
    const savedPlayerId = sessionStorage.getItem('playerId');
    
    if (savedRoomId && savedNickname) {
      currentNickname = savedNickname;
      currentRoomId = savedRoomId;
      socket.emit('join_room', { roomId: savedRoomId, nickname: savedNickname, playerId: savedPlayerId || undefined });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    if (currentRoomId) {
      sessionStorage.setItem('roomId', currentRoomId);
      sessionStorage.setItem('nickname', currentNickname);
      sessionStorage.setItem('playerId', currentPlayerId);
    }
  });
  
  socket.on('reconnect', () => {
    console.log('Reconnected to server');
    sessionStorage.removeItem('roomId');
    sessionStorage.removeItem('nickname');
    sessionStorage.removeItem('playerId');
  });
  
  socket.on('error', (data: { message: string }) => {
    showError(data.message);
  });
  
  socket.on('player_joined', (player: Player) => {
    console.log('Player joined:', player.nickname);
  });
  
  socket.on('player_left', (player: Player) => {
    console.log('Player left:', player.nickname);
  });
  
  socket.on('turn_start', (data: {
    playerId: string;
    nickname: string;
    upperLine: string;
    upperRhyme: string;
    timeLeft: number;
  }) => {
    currentUpperLine = data.upperLine;
    currentUpperRhyme = data.upperRhyme;
    timeLeft = data.timeLeft;
    isMyTurn = data.playerId === socket.id;
    
    const turnIndicator = document.getElementById('turnIndicator');
    if (turnIndicator) {
      turnIndicator.classList.remove('hidden');
      turnIndicator.textContent = isMyTurn 
        ? '轮到您作诗了，请接句...' 
        : `请等待 ${data.nickname} 作诗...`;
    }
    
    const playerIndex = currentRoomState?.players.findIndex(p => p.id === data.playerId);
    if (playerIndex !== undefined && playerIndex >= 0) {
      showFanPanel(data.upperLine, data.upperRhyme, playerIndex);
      
      document.querySelectorAll('.seat').forEach((seat, idx) => {
        seat.classList.toggle('current-turn', idx === playerIndex);
      });
    }
  });
  
  socket.on('time_update', (remaining: number) => {
    timeLeft = remaining;
    const countdown = document.getElementById('countdown');
    if (countdown) {
      countdown.textContent = `${timeLeft}秒`;
      if (timeLeft <= 10) {
        countdown.classList.add('urgent');
      }
    }
  });
  
  socket.on('score_result', (data: {
    playerId: string;
    nickname: string;
    poem: string;
    upperLine: string;
    score: Score;
    recommendations: Recommendation[];
    rhymeMatch: boolean;
  }) => {
    hideFanPanel();
    
    const isCurrentPlayer = data.playerId === socket.id;
    showScoreScroll(data.upperLine, data.poem, data.score, data.recommendations, data.rhymeMatch, isCurrentPlayer);
    
    if (currentRoomState) {
      const player = currentRoomState.players.find(p => p.id === data.playerId);
      if (player) {
        player.score = data.score.total;
      }
      updatePlayerList();
    }
    
    document.querySelectorAll('.seat').forEach(seat => {
      seat.classList.remove('current-turn');
    });
  });
  
  socket.on('flowing_start', (entries: PoemEntry[]) => {
    hideFanPanel();
    
    const turnIndicator = document.getElementById('turnIndicator');
    if (turnIndicator) {
      turnIndicator.textContent = '曲水流觞，诗成碑立...';
    }
    
    setTimeout(() => {
      animatePetals(entries);
    }, 1000);
  });
  
  socket.on('game_restarted', (state: RoomState) => {
    currentRoomState = state;
    const monumentContainer = document.getElementById('monumentContainer');
    const restartBtn = document.getElementById('restartBtn');
    const petalContainer = document.getElementById('petalContainer');
    
    if (monumentContainer) monumentContainer.classList.add('hidden');
    if (restartBtn) restartBtn.classList.add('hidden');
    if (petalContainer) petalContainer.innerHTML = '';
    
    renderGame();
  });
  
  socket.on('player_typing', (data: { playerId: string; isTyping: boolean }) => {
    const turnIndicator = document.getElementById('turnIndicator');
    if (turnIndicator && data.playerId !== socket.id) {
      const player = currentRoomState?.players.find(p => p.id === data.playerId);
      if (player) {
        turnIndicator.textContent = data.isTyping 
          ? `${player.nickname} 正在斟酌诗句...` 
          : `请等待 ${player.nickname} 作诗...`;
      }
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  renderLobby();
});
