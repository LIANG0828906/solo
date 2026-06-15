declare const io: any;
declare const QRCode: any;

interface PollOption {
  id: string;
  text: string;
  emoji?: string;
  votes: number;
  color: string;
}

interface PollResult {
  roomCode: string;
  title: string;
  options: PollOption[];
  totalVotes: number;
  endTime: number;
  isEnded: boolean;
  winnerId?: string;
}

const OPTION_COLORS = [
  '#98D8C8', '#F7B7C8', '#A8D8EA', '#FFE66D', '#C5B4E3',
  '#F4A261', '#81C995', '#FFD3B5', '#B8D4E3', '#E8D5B7'
];

const app = document.getElementById('app')!;
let socket: any = null;
let currentPollState: PollResult | null = null;
let animationId: number | null = null;
let displayedVotes: number[] = [];
let targetVotes: number[] = [];
let particles: Particle[] = [];
let particleStartTime = 0;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

function getClientId(): string {
  let id = localStorage.getItem('voteClientId');
  if (!id) {
    id = 'c_' + Math.random().toString(36).substr(2, 16);
    localStorage.setItem('voteClientId', id);
  }
  return id;
}

function getRoute(): { page: string; param?: string } {
  const path = window.location.pathname;
  if (path.startsWith('/vote/')) {
    return { page: 'vote', param: path.slice(6) };
  }
  if (path.startsWith('/result/')) {
    return { page: 'result', param: path.slice(8) };
  }
  return { page: 'home' };
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  render();
}

window.addEventListener('popstate', render);

function render() {
  const route = getRoute();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  stopAnimation();
  particles = [];

  if (route.page === 'home') {
    renderHomePage();
  } else if (route.page === 'vote' && route.param) {
    renderVotePage(route.param);
  } else if (route.page === 'result' && route.param) {
    renderResultPage(route.param);
  } else {
    renderHomePage();
  }
}

function renderHomePage() {
  app.className = 'create-page';
  app.innerHTML = `
    <div style="min-height:100%;width:100%;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;">
      <div class="card" style="width:100%;max-width:600px;">
        <h1 style="font-family:'Poppins',sans-serif;font-size:2rem;font-weight:700;margin:0 0 8px 0;background:linear-gradient(135deg,#FF6B35,#8B5CF6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
          🎯 团队决策投票
        </h1>
        <p style="font-family:'Poppins',sans-serif;color:#666;margin:0 0 24px 0;">快速发起投票，实时查看结果</p>
        
        <div id="createForm">
          <div style="margin-bottom:20px;">
            <label style="font-family:'Poppins',sans-serif;font-weight:600;color:#333;display:block;margin-bottom:8px;">投票标题</label>
            <input id="pollTitle" type="text" class="input" placeholder="例如：今天中午吃什么？" style="width:100%;box-sizing:border-box;">
          </div>
          
          <div style="margin-bottom:20px;">
            <label style="font-family:'Poppins',sans-serif;font-weight:600;color:#333;display:block;margin-bottom:8px;">投票选项（2-10个）</label>
            <div id="optionsContainer"></div>
            <button id="addOptionBtn" class="btn" style="margin-top:12px;background:linear-gradient(135deg,#f0f0f0,#e0e0e0);color:#333;width:auto;padding:8px 16px;font-size:0.9rem;">
              ➕ 添加选项
            </button>
          </div>
          
          <div style="margin-bottom:24px;">
            <label style="font-family:'Poppins',sans-serif;font-weight:600;color:#333;display:block;margin-bottom:8px;">投票有效期</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button class="duration-btn btn" data-duration="300" style="background:linear-gradient(135deg,#f0f0f0,#e0e0e0);color:#333;">5分钟</button>
              <button class="duration-btn btn" data-duration="600" style="background:linear-gradient(135deg,#FF6B35,#8B5CF6);color:#fff;">10分钟</button>
              <button class="duration-btn btn" data-duration="1800" style="background:linear-gradient(135deg,#f0f0f0,#e0e0e0);color:#333;">30分钟</button>
              <div style="display:flex;gap:8px;align-items:center;">
                <input id="customDuration" type="number" class="input" placeholder="自定义" style="width:120px;padding:10px 14px;">
                <span style="font-family:'Poppins',sans-serif;color:#666;font-size:0.9rem;">分钟</span>
              </div>
            </div>
          </div>
          
          <button id="createBtn" class="btn" style="width:100%;background:linear-gradient(135deg,#FF6B35,#8B5CF6);color:#fff;font-size:1.1rem;padding:14px;">
            🚀 创建投票
          </button>
        </div>
        
        <div id="createdResult" style="display:none;text-align:center;">
          <h2 style="font-family:'Poppins',sans-serif;font-size:1.5rem;color:#333;margin:0 0 16px 0;">🎉 投票已创建！</h2>
          <div style="background:linear-gradient(135deg,#FF6B35,#8B5CF6);color:#fff;padding:24px;border-radius:16px;margin-bottom:20px;">
            <p style="font-family:'Poppins',sans-serif;margin:0 0 8px 0;opacity:0.9;">房间码</p>
            <p id="roomCodeDisplay" style="font-family:'Poppins',sans-serif;font-size:3rem;font-weight:700;margin:0;letter-spacing:8px;">000000</p>
          </div>
          <div id="qrcodeContainer" style="display:flex;justify-content:center;margin-bottom:20px;"></div>
          <p id="voteLink" style="font-family:'Poppins',sans-serif;color:#666;font-size:0.9rem;word-break:break-all;margin-bottom:20px;"></p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
            <button id="resetBtn" class="btn" style="background:linear-gradient(135deg,#f0f0f0,#e0e0e0);color:#333;">🔄 重置投票</button>
            <button id="openResultBtn" class="btn" style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:#fff;">📊 查看大屏</button>
            <button id="newPollBtn" class="btn" style="background:linear-gradient(135deg,#FF6B35,#8B5CF6);color:#fff;">➕ 新建投票</button>
          </div>
        </div>

        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee;">
          <p style="font-family:'Poppins',sans-serif;font-weight:600;color:#333;margin:0 0 12px 0;">已有房间？</p>
          <div style="display:flex;gap:10px;">
            <input id="joinRoomCode" type="text" class="input" placeholder="输入6位房间码" style="flex:1;text-transform:uppercase;letter-spacing:2px;">
            <button id="joinVoteBtn" class="btn" style="background:linear-gradient(135deg,#10B981,#059669);color:#fff;">📱 参与投票</button>
            <button id="joinResultBtn" class="btn" style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:#fff;">📊 查看结果</button>
          </div>
        </div>
      </div>
    </div>
  `;
  initHomePageEvents();
}

let selectedDuration = 600;
let options: { text: string; emoji: string }[] = [];

function initHomePageEvents() {
  options = [
    { text: '', emoji: '🍕' },
    { text: '', emoji: '🍔' }
  ];
  renderOptions();

  document.getElementById('addOptionBtn')!.addEventListener('click', () => {
    if (options.length >= 10) {
      alert('最多只能添加10个选项');
      return;
    }
    const emojis = ['🍕', '🍔', '🍜', '🍣', '🎮', '🎬', '🎵', '📚', '⚽', '🚀'];
    options.push({ text: '', emoji: emojis[options.length % emojis.length] });
    renderOptions();
  });

  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.duration-btn').forEach(b => {
        (b as HTMLElement).style.background = 'linear-gradient(135deg,#f0f0f0,#e0e0e0)';
        (b as HTMLElement).style.color = '#333';
      });
      (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,#FF6B35,#8B5CF6)';
      (e.currentTarget as HTMLElement).style.color = '#fff';
      selectedDuration = parseInt((e.currentTarget as HTMLElement).dataset.duration!);
    });
  });

  document.getElementById('customDuration')!.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value);
    if (val > 0) {
      selectedDuration = val * 60;
      document.querySelectorAll('.duration-btn').forEach(b => {
        (b as HTMLElement).style.background = 'linear-gradient(135deg,#f0f0f0,#e0e0e0)';
        (b as HTMLElement).style.color = '#333';
      });
    }
  });

  document.getElementById('createBtn')!.addEventListener('click', createPoll);

  document.getElementById('resetBtn')!.addEventListener('click', resetPoll);
  document.getElementById('openResultBtn')!.addEventListener('click', () => {
    const code = (document.getElementById('roomCodeDisplay') as HTMLElement).textContent!;
    navigate('/result/' + code);
  });
  document.getElementById('newPollBtn')!.addEventListener('click', () => {
    (document.getElementById('createForm') as HTMLElement).style.display = 'block';
    (document.getElementById('createdResult') as HTMLElement).style.display = 'none';
    options = [
      { text: '', emoji: '🍕' },
      { text: '', emoji: '🍔' }
    ];
    (document.getElementById('pollTitle') as HTMLInputElement).value = '';
    renderOptions();
  });

  document.getElementById('joinVoteBtn')!.addEventListener('click', () => {
    const code = (document.getElementById('joinRoomCode') as HTMLInputElement).value.trim();
    if (code.length === 6) navigate('/vote/' + code);
    else alert('请输入6位房间码');
  });
  document.getElementById('joinResultBtn')!.addEventListener('click', () => {
    const code = (document.getElementById('joinRoomCode') as HTMLInputElement).value.trim();
    if (code.length === 6) navigate('/result/' + code);
    else alert('请输入6位房间码');
  });
}

function renderOptions() {
  const container = document.getElementById('optionsContainer')!;
  container.innerHTML = '';
  options.forEach((opt, idx) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;margin-bottom:10px;align-items:center;';
    row.innerHTML = `
      <input type="text" class="emoji-input" value="${opt.emoji}" maxlength="2" style="width:50px;padding:12px;border-radius:12px;border:2px solid #e0e0e0;font-size:1.2rem;text-align:center;font-family:'Poppins',sans-serif;outline:none;transition:border-color 0.2s;" 
        onfocus="this.style.borderColor='#8B5CF6'" onblur="this.style.borderColor='#e0e0e0'">
      <input type="text" class="option-text" value="${opt.text}" placeholder="选项 ${idx + 1}" class="input" style="flex:1;">
      ${options.length > 2 ? `<button class="remove-btn btn" style="background:linear-gradient(135deg,#fee,#fcc);color:#e53e3e;padding:10px 14px;width:auto;">✕</button>` : ''}
    `;
    const emojiInput = row.querySelector('.emoji-input') as HTMLInputElement;
    const textInput = row.querySelector('.option-text') as HTMLInputElement;
    emojiInput.addEventListener('input', (e) => {
      options[idx].emoji = (e.target as HTMLInputElement).value;
    });
    textInput.addEventListener('input', (e) => {
      options[idx].text = (e.target as HTMLInputElement).value;
    });
    const removeBtn = row.querySelector('.remove-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        options.splice(idx, 1);
        renderOptions();
      });
    }
    container.appendChild(row);
  });
}

let currentCreatedRoomCode = '';

async function createPoll() {
  const title = (document.getElementById('pollTitle') as HTMLInputElement).value.trim();
  const validOptions = options.filter(o => o.text.trim().length > 0);
  
  if (!title) { alert('请输入投票标题'); return; }
  if (validOptions.length < 2) { alert('至少需要2个有效选项'); return; }
  if (validOptions.length > 10) { alert('最多10个选项'); return; }

  try {
    const res = await fetch('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        options: validOptions,
        duration: selectedDuration
      })
    });
    const data = await res.json();
    currentCreatedRoomCode = data.roomCode;
    showCreatedResult(data.roomCode);
  } catch (e) {
    alert('创建失败：' + (e as Error).message);
  }
}

function showCreatedResult(roomCode: string) {
  (document.getElementById('createForm') as HTMLElement).style.display = 'none';
  (document.getElementById('createdResult') as HTMLElement).style.display = 'block';
  (document.getElementById('roomCodeDisplay') as HTMLElement).textContent = roomCode;
  
  const link = window.location.origin + '/vote/' + roomCode;
  (document.getElementById('voteLink') as HTMLElement).textContent = '投票链接：' + link;
  
  const qrContainer = document.getElementById('qrcodeContainer')!;
  qrContainer.innerHTML = '';
  if (typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
      text: link,
      width: 180,
      height: 180,
      colorDark: '#1a1a1a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

async function resetPoll() {
  if (!currentCreatedRoomCode) return;
  try {
    const res = await fetch('/api/reset/' + currentCreatedRoomCode, { method: 'POST' });
    if (res.ok) alert('投票已重置！');
  } catch (e) {
    alert('重置失败');
  }
}

function renderVotePage(roomCode: string) {
  app.className = 'create-page';
  app.innerHTML = `
    <div style="min-height:100%;width:100%;padding:20px;box-sizing:border-box;">
      <div class="card" style="max-width:700px;margin:0 auto;">
        <div id="voteLoading" style="text-align:center;padding:40px;">
          <p style="font-family:'Poppins',sans-serif;font-size:1.2rem;color:#666;">⏳ 加载中...</p>
        </div>
        <div id="voteContent" style="display:none;">
          <h1 id="voteTitle" style="font-family:'Poppins',sans-serif;font-size:1.8rem;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;text-align:center;"></h1>
          <p id="voteTimer" style="font-family:'Poppins',sans-serif;color:#8B5CF6;text-align:center;margin:0 0 24px 0;font-weight:600;"></p>
          <div id="optionsGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;"></div>
          <div id="alreadyVoted" style="display:none;text-align:center;padding:20px;">
            <p style="font-family:'Poppins',sans-serif;font-size:1.2rem;color:#10B981;font-weight:600;">✅ 您已完成投票</p>
            <p style="font-family:'Poppins',sans-serif;color:#666;">感谢您的参与！</p>
          </div>
          <div id="voteEnded" style="display:none;text-align:center;padding:20px;">
            <p style="font-family:'Poppins',sans-serif;font-size:1.2rem;color:#EF4444;font-weight:600;">⏰ 投票已结束</p>
          </div>
        </div>
        <div id="voteError" style="display:none;text-align:center;padding:40px;">
          <p style="font-family:'Poppins',sans-serif;font-size:1.2rem;color:#EF4444;margin:0 0 16px 0;">❌ 房间不存在</p>
          <button onclick="window.location.href='/'" class="btn" style="background:linear-gradient(135deg,#FF6B35,#8B5CF6);color:#fff;">返回首页</button>
        </div>
      </div>
    </div>
    <div id="toast" style="display:none;position:fixed;top:30px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#10B981,#059669);color:#fff;padding:14px 28px;border-radius:50px;font-family:'Poppins',sans-serif;font-weight:600;box-shadow:0 10px 30px rgba(16,185,129,0.3);z-index:9999;">
      ✅ 投票成功！
    </div>
    <div id="confirmModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);display:none;align-items:center;justify-content:center;z-index:9998;">
      <div class="card" style="max-width:400px;width:90%;text-align:center;">
        <p id="confirmText" style="font-family:'Poppins',sans-serif;font-size:1.2rem;color:#1a1a1a;margin:0 0 20px 0;font-weight:600;"></p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button id="confirmCancel" class="btn" style="background:linear-gradient(135deg,#f0f0f0,#e0e0e0);color:#333;">取消</button>
          <button id="confirmOk" class="btn" style="background:linear-gradient(135deg,#10B981,#059669);color:#fff;">确认投票</button>
        </div>
      </div>
    </div>
  `;
  initVotePage(roomCode);
}

function initVotePage(roomCode: string) {
  socket = io();
  let timerInterval: number | null = null;

  function updateTimer() {
    if (!currentPollState) return;
    const remaining = Math.max(0, currentPollState.endTime - Date.now());
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    (document.getElementById('voteTimer') as HTMLElement).textContent = 
      currentPollState.isEnded ? '已结束' : `⏱ 剩余时间：${mins}:${secs.toString().padStart(2, '0')}`;
  }

  socket.on('connect', () => {
    socket.emit('join', { roomCode });
  });

  socket.on('poll-state', (state: PollResult) => {
    currentPollState = state;
    (document.getElementById('voteLoading') as HTMLElement).style.display = 'none';
    (document.getElementById('voteContent') as HTMLElement).style.display = 'block';
    (document.getElementById('voteTitle') as HTMLElement).textContent = state.title;
    renderVoteOptions(state);
    updateTimer();
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(updateTimer, 1000);

    const clientId = getClientId();
    fetch('/api/poll/' + roomCode + '?clientId=' + clientId)
      .then(r => r.json())
      .then(data => {
        if (data.hasVoted) {
          (document.getElementById('alreadyVoted') as HTMLElement).style.display = 'block';
          (document.getElementById('optionsGrid') as HTMLElement).style.display = 'none';
        }
        if (state.isEnded) {
          (document.getElementById('voteEnded') as HTMLElement).style.display = 'block';
          (document.getElementById('optionsGrid') as HTMLElement).style.display = 'none';
        }
      })
      .catch(() => {});
  });

  socket.on('poll-ended', () => {
    if (currentPollState) currentPollState.isEnded = true;
    (document.getElementById('voteEnded') as HTMLElement).style.display = 'block';
    (document.getElementById('optionsGrid') as HTMLElement).style.display = 'none';
  });

  socket.on('voted', (res: any) => {
    if (res.success) {
      showToast();
      (document.getElementById('alreadyVoted') as HTMLElement).style.display = 'block';
      (document.getElementById('optionsGrid') as HTMLElement).style.display = 'none';
    } else {
      alert(res.message || '投票失败');
    }
  });

  socket.on('connect_error', () => {
    (document.getElementById('voteLoading') as HTMLElement).style.display = 'none';
    (document.getElementById('voteError') as HTMLElement).style.display = 'block';
  });

  setTimeout(() => {
    if (!currentPollState) {
      fetch('/api/poll/' + roomCode)
        .then(r => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then(() => {
          socket.emit('join', { roomCode });
        })
        .catch(() => {
          (document.getElementById('voteLoading') as HTMLElement).style.display = 'none';
          (document.getElementById('voteError') as HTMLElement).style.display = 'block';
        });
    }
  }, 2000);
}

function renderVoteOptions(state: PollResult) {
  const grid = document.getElementById('optionsGrid')!;
  grid.innerHTML = '';
  state.options.forEach((opt, idx) => {
    const block = document.createElement('div');
    block.className = 'option-block';
    block.style.cssText = `
      background:${opt.color};
      border-radius:16px;
      padding:24px 16px;
      cursor:pointer;
      text-align:center;
      transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow:0 4px 12px ${opt.color}55;
      user-select:none;
    `;
    block.innerHTML = `
      <div style="font-size:2.5rem;margin-bottom:8px;">${opt.emoji || ''}</div>
      <div style="font-family:'Poppins',sans-serif;font-weight:600;color:#1a1a1a;font-size:1rem;word-break:break-word;">${opt.text}</div>
    `;
    block.addEventListener('mouseenter', () => {
      block.style.transform = 'scale(1.03)';
      block.style.boxShadow = `0 8px 24px ${opt.color}88`;
    });
    block.addEventListener('mouseleave', () => {
      block.style.transform = 'scale(1)';
      block.style.boxShadow = `0 4px 12px ${opt.color}55`;
    });
    block.addEventListener('click', () => {
      block.style.animation = 'none';
      block.offsetHeight;
      block.style.animation = 'pulse-anim 0.3s ease';
      block.style.filter = 'brightness(0.85)';
      setTimeout(() => { block.style.filter = 'brightness(1)'; }, 300);
      showConfirmModal(opt, () => {
        socket.emit('vote', { roomCode: state.roomCode, optionId: opt.id, clientId: getClientId() });
      });
    });
    grid.appendChild(block);
  });
}

let pendingConfirmAction: (() => void) | null = null;
function showConfirmModal(option: PollOption, onConfirm: () => void) {
  const modal = document.getElementById('confirmModal') as HTMLElement;
  (document.getElementById('confirmText') as HTMLElement).innerHTML = 
    `确定要投票给<br><span style="color:#8B5CF6;">${option.emoji || ''} ${option.text}</span> 吗？`;
  modal.style.display = 'flex';
  pendingConfirmAction = onConfirm;
}

document.addEventListener('click', (e) => {
  const cancelBtn = document.getElementById('confirmCancel');
  const okBtn = document.getElementById('confirmOk');
  if (cancelBtn && e.target === cancelBtn) {
    (document.getElementById('confirmModal') as HTMLElement).style.display = 'none';
    pendingConfirmAction = null;
  }
  if (okBtn && e.target === okBtn) {
    (document.getElementById('confirmModal') as HTMLElement).style.display = 'none';
    if (pendingConfirmAction) pendingConfirmAction();
    pendingConfirmAction = null;
  }
});

function showToast() {
  const toast = document.getElementById('toast') as HTMLElement;
  toast.style.display = 'block';
  toast.style.animation = 'none';
  toast.offsetHeight;
  toast.style.animation = 'fade-in 0.3s ease forwards';
  setTimeout(() => {
    toast.style.animation = 'fade-in 0.3s ease reverse forwards';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 1000);
}

function renderResultPage(roomCode: string) {
  app.className = 'result-page';
  app.innerHTML = `
    <div style="width:100%;height:100vh;position:relative;">
      <canvas id="resultCanvas" style="width:100%;height:100%;display:block;"></canvas>
      <div id="resultLoading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <p style="font-family:'Poppins',sans-serif;font-size:1.5rem;color:#fff;">⏳ 正在连接...</p>
      </div>
      <div id="resultError" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:20px;">
        <p style="font-family:'Poppins',sans-serif;font-size:1.5rem;color:#fff;">❌ 房间不存在</p>
        <button onclick="window.location.href='/'" class="btn" style="background:linear-gradient(135deg,#FF6B35,#8B5CF6);color:#fff;font-size:1rem;">返回首页</button>
      </div>
      <div id="winnerOverlay" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;pointer-events:none;">
        <div id="winnerContent" style="text-align:center;">
          <p style="font-family:'Poppins',sans-serif;font-size:1.5rem;color:#fff;opacity:0.8;margin:0 0 8px 0;">🎉 获胜选项</p>
          <h1 id="winnerName" style="font-family:'Poppins',sans-serif;font-size:4rem;font-weight:700;color:#fff;margin:0 0 8px 0;text-shadow:0 0 40px rgba(255,255,255,0.5);"></h1>
          <p id="winnerVotes" style="font-family:'Poppins',sans-serif;font-size:1.5rem;color:#fff;opacity:0.9;margin:0;"></p>
        </div>
      </div>
    </div>
  `;
  initResultPage(roomCode);
}

function initResultPage(roomCode: string) {
  const canvas = document.getElementById('resultCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  
  function resize() {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);

  socket = io();
  let hasShownWinner = false;

  socket.on('connect', () => {
    socket.emit('join', { roomCode });
  });

  socket.on('poll-state', (state: PollResult) => {
    currentPollState = state;
    (document.getElementById('resultLoading') as HTMLElement).style.display = 'none';
    
    if (targetVotes.length !== state.options.length) {
      targetVotes = state.options.map(o => o.votes);
      displayedVotes = state.options.map(o => 0);
    } else {
      targetVotes = state.options.map(o => o.votes);
    }
    
    if (state.isEnded && !hasShownWinner) {
      hasShownWinner = true;
      showWinnerEffect(state);
    }
    
    startAnimation(canvas, ctx, state);
  });

  socket.on('poll-ended', (data: any) => {
    if (!hasShownWinner && data.winner) {
      hasShownWinner = true;
      showWinnerEffect(data.results);
    }
  });

  socket.on('connect_error', () => {
    (document.getElementById('resultLoading') as HTMLElement).style.display = 'none';
    (document.getElementById('resultError') as HTMLElement).style.display = 'flex';
  });

  setTimeout(() => {
    if (!currentPollState) {
      fetch('/api/poll/' + roomCode)
        .then(r => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((state: PollResult) => {
          currentPollState = state;
          (document.getElementById('resultLoading') as HTMLElement).style.display = 'none';
          targetVotes = state.options.map(o => o.votes);
          displayedVotes = state.options.map(o => 0);
          if (state.isEnded) {
            hasShownWinner = true;
            showWinnerEffect(state);
          }
          startAnimation(canvas, ctx, state);
          socket.emit('join', { roomCode });
        })
        .catch(() => {
          (document.getElementById('resultLoading') as HTMLElement).style.display = 'none';
          (document.getElementById('resultError') as HTMLElement).style.display = 'flex';
        });
    }
  }, 2000);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function startAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, state: PollResult) {
  stopAnimation();
  let startTime = performance.now();
  
  function animate(now: number) {
    const elapsed = (now - startTime) / 1000;
    
    for (let i = 0; i < displayedVotes.length; i++) {
      if (displayedVotes[i] !== targetVotes[i]) {
        const diff = targetVotes[i] - displayedVotes[i];
        displayedVotes[i] += diff * Math.min(1, elapsed * 2);
        if (Math.abs(displayedVotes[i] - targetVotes[i]) < 0.01) {
          displayedVotes[i] = targetVotes[i];
        }
      }
    }
    startTime = now;
    
    drawBarChart(canvas, ctx, state);
    updateParticles(ctx, canvas.clientWidth, canvas.clientHeight, now);
    
    animationId = requestAnimationFrame(animate);
  }
  animationId = requestAnimationFrame(animate);
}

function drawBarChart(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, state: PollResult) {
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
  bgGrad.addColorStop(0, '#0F2744');
  bgGrad.addColorStop(1, '#000000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.font = 'bold 2.5rem Poppins, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,255,255,0.3)';
  ctx.shadowBlur = 20;
  ctx.fillText(state.title, W / 2, 60);
  ctx.shadowBlur = 0;

  if (displayedVotes.length === 0) return;

  const maxVotes = Math.max(1, ...targetVotes);
  const padding = 80;
  const chartTop = 120;
  const chartBottom = H - 100;
  const chartLeft = padding;
  const chartRight = W - padding;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;
  const barCount = displayedVotes.length;
  const gap = 20;
  const barWidth = Math.min(80, (chartWidth - gap * (barCount - 1)) / barCount);
  const totalBarWidth = barCount * barWidth + (barCount - 1) * gap;
  const startX = chartLeft + (chartWidth - totalBarWidth) / 2;

  const remaining = Math.max(0, state.endTime - Date.now());
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  ctx.font = '600 1.2rem Poppins, sans-serif';
  ctx.fillStyle = state.isEnded ? '#EF4444' : '#FFE66D';
  ctx.textAlign = 'right';
  ctx.fillText(state.isEnded ? '⏰ 已结束' : `⏱ ${mins}:${secs.toString().padStart(2, '0')}`, W - 40, 50);

  ctx.font = '500 1rem Poppins, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'left';
  ctx.fillText(`总票数: ${state.totalVotes}`, 40, 50);

  state.options.forEach((opt, i) => {
    const x = startX + i * (barWidth + gap);
    const barHeight = (displayedVotes[i] / maxVotes) * chartHeight * 0.85;
    const y = chartBottom - barHeight;

    ctx.shadowColor = opt.color;
    ctx.shadowBlur = 20;

    const barGrad = ctx.createLinearGradient(x, y, x, chartBottom);
    barGrad.addColorStop(0, lightenColor(opt.color, 20));
    barGrad.addColorStop(1, opt.color);
    ctx.fillStyle = barGrad;

    roundRect(ctx, x, y, barWidth, barHeight, 10);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 1.5rem Poppins, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const percent = state.totalVotes > 0 ? ((displayedVotes[i] / state.totalVotes) * 100).toFixed(0) : '0';
    ctx.fillText(`${Math.round(displayedVotes[i])} 票`, x + barWidth / 2, y - 35);
    ctx.font = '500 1rem Poppins, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`${percent}%`, x + barWidth / 2, y - 15);

    ctx.font = '2rem Poppins, sans-serif';
    ctx.fillText(opt.emoji || '', x + barWidth / 2, chartBottom + 35);
    ctx.font = '500 0.9rem Poppins, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const displayText = opt.text.length > 8 ? opt.text.slice(0, 8) + '...' : opt.text;
    ctx.fillText(displayText, x + barWidth / 2, chartBottom + 55);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (h < r * 2) r = h / 2;
  if (w < r * 2) r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function showWinnerEffect(state: PollResult) {
  const winner = state.options.reduce((a, b) => a.votes >= b.votes ? a : b);
  
  const overlay = document.getElementById('winnerOverlay') as HTMLElement;
  (document.getElementById('winnerName') as HTMLElement).innerHTML = `${winner.emoji || ''} ${winner.text}`;
  (document.getElementById('winnerVotes') as HTMLElement).textContent = `${winner.votes} 票  (${state.totalVotes > 0 ? ((winner.votes / state.totalVotes) * 100).toFixed(0) : 0}%)`;
  overlay.style.display = 'flex';
  overlay.style.animation = 'fade-in 0.5s ease forwards';

  const canvas = document.getElementById('resultCanvas') as HTMLCanvasElement;
  createExplosion(canvas.clientWidth / 2, canvas.clientHeight / 2, winner.color);
  particleStartTime = performance.now();
}

function createExplosion(cx: number, cy: number, color: string) {
  particles = [];
  const count = 150;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
    const speed = 3 + Math.random() * 6;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color,
      size: 3 + Math.random() * 5,
      life: 1,
      maxLife: 2000
    });
  }
}

function updateParticles(ctx: CanvasRenderingContext2D, W: number, H: number, now: number) {
  if (particles.length === 0) return;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.vx *= 0.99;
    p.vy *= 0.99;
    p.life -= 1 / 60;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

render();
