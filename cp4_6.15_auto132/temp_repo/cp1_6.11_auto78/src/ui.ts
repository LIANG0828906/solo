import type { Card, CardGroup, CardGroupSummary } from './card';
import { getMemoryStats, getIntervalDays } from './card';
import { ReviewState } from './review';

declare global {
  interface Window {
    marked?: any;
    DOMPurify?: any;
  }
}

function renderMarkdown(md: string): string {
  const text = md && md.trim() ? md : '';
  try {
    const html = window.marked ? window.marked.parse(text) : text.replace(/\n/g, '<br/>');
    return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
  } catch (e) {
    return text.replace(/\n/g, '<br/>');
  }
}

export interface CreateFormState {
  cards: Array<{ front: string; back: string }>;
}

export function renderCard(card: Card | { front: string; back: string }, opts?: { flipped?: boolean }): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'review-card-3d' + (opts?.flipped ? ' flipped' : '');

  const front = document.createElement('div');
  front.className = 'card-face card-face-front';
  front.innerHTML = `
    <div class="card-label">正面 · FRONT</div>
    <div class="card-content">${renderMarkdown(card.front)}</div>
  `;

  const back = document.createElement('div');
  back.className = 'card-face card-face-back';
  back.innerHTML = `
    <div class="card-label">背面 · BACK</div>
    <div class="card-content">${renderMarkdown(card.back)}</div>
  `;

  wrap.appendChild(front);
  wrap.appendChild(back);
  return wrap;
}

export function renderPreviewCard(front: string, back: string): void {
  const frontEl = document.getElementById('previewFront');
  const backEl = document.getElementById('previewBack');
  if (frontEl) frontEl.innerHTML = front.trim() ? renderMarkdown(front) : '<span style="opacity:0.4">在此输入问题开始预览...</span>';
  if (backEl) backEl.innerHTML = back.trim() ? renderMarkdown(back) : '<span style="opacity:0.4">在此输入答案开始预览...</span>';
}

export function renderCardsList(state: CreateFormState, onDelete: (idx: number) => void): void {
  const listEl = document.getElementById('cardsList');
  const countEl = document.getElementById('cardCount');
  if (!listEl) return;

  if (countEl) countEl.textContent = `(${state.cards.length})`;

  if (state.cards.length === 0) {
    listEl.innerHTML = '<div style="text-align:center; padding:30px 10px; color: rgba(255,255,255,0.4); font-size: 13px;">暂无卡片，请在左侧添加</div>';
    return;
  }

  listEl.innerHTML = '';
  state.cards.forEach((c, idx) => {
    const item = document.createElement('div');
    item.className = 'mini-card';
    item.innerHTML = `
      <div class="mini-card-content">
        <div class="mini-card-front">${idx + 1}. ${escapeHtml(truncate(c.front, 50)) || '(无正面内容)'}</div>
        <div class="mini-card-back">${escapeHtml(truncate(c.back, 60)) || '(无背面内容)'}</div>
      </div>
      <button class="mini-card-del" title="删除">✕</button>
    `;
    const del = item.querySelector('.mini-card-del');
    del?.addEventListener('click', (e) => {
      e.stopPropagation();
      onDelete(idx);
    });
    listEl.appendChild(item);
  });
}

export function renderGroupsList(groups: CardGroupSummary[], onReview: (id: string) => void, onCreate: () => void): void {
  const listEl = document.getElementById('groupsList');
  if (!listEl) return;

  if (!groups || groups.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>暂无卡片组，点击"创建卡片组"开始吧！</p>
        <button class="btn btn-primary" data-goto-btn>＋ 创建第一个卡片组</button>
      </div>
    `;
    listEl.querySelector('[data-goto-btn]')?.addEventListener('click', onCreate);
    return;
  }

  listEl.innerHTML = '';
  groups.forEach(g => {
    const el = document.createElement('div');
    el.className = 'glass group-card';
    el.innerHTML = `
      <div class="group-card-header">
        <div class="group-card-name">${escapeHtml(g.name)}</div>
        <div class="group-card-count">${g.cardCount} 张</div>
      </div>
      <div class="group-card-owner">👤 ${escapeHtml(g.owner)} · ${formatDate(g.createDate)}</div>
      <div class="group-card-stats">
        <div class="stat-chip high">今日复习 ${g.reviewedToday || 0}</div>
      </div>
      <button class="group-card-btn">开始复习 →</button>
    `;
    el.querySelector('.group-card-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      onReview(g.id);
    });
    el.addEventListener('click', () => onReview(g.id));
    listEl.appendChild(el);
  });
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
  desc: (days?: number) => string;
}

export function renderProgressPanel(cards: Card[], reviewedToday: number = 0): void {
  const canvas = document.getElementById('pieChart') as HTMLCanvasElement | null;
  const legendEl = document.getElementById('chartLegend');
  if (!canvas || !legendEl) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const stats = getMemoryStats(cards);
  const total = Math.max(1, stats.total);

  const slices: PieSlice[] = [
    {
      label: '高记忆',
      value: stats.high,
      color: '#2E7D32',
      desc: (d = 8) => `高记忆卡片：${stats.high}张，预计${d}天后需要复习`
    },
    {
      label: '中记忆',
      value: stats.mid,
      color: '#E65100',
      desc: (d = 3) => `中记忆卡片：${stats.mid}张，预计${d}天后需要复习`
    },
    {
      label: '低记忆',
      value: stats.low,
      color: '#B71C1C',
      desc: () => `低记忆卡片：${stats.low}张，需要尽快复习`
    }
  ];

  const dpr = window.devicePixelRatio || 1;
  const size = 200;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 86;
  const innerRadius = 56;
  const ringRadius = 96;
  const ringWidth = 6;

  const ratio = total > 0 ? Math.min(1, reviewedToday / total) : 0;

  let startAngle = -Math.PI / 2;
  const sliceAngles: Array<{ slice: PieSlice; start: number; end: number }> = [];

  slices.forEach(slice => {
    if (slice.value === 0) return;
    const ang = (slice.value / total) * Math.PI * 2;
    sliceAngles.push({ slice, start: startAngle, end: startAngle + ang });
    startAngle += ang;
  });

  const animDuration = 2000;
  const animStart = performance.now();
  let finalRatio = 0;

  function draw(now: number) {
    const elapsed = now - animStart;
    const t = Math.min(1, elapsed / animDuration);
    const ease = 1 - Math.pow(1 - t, 3);

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius + ringWidth / 2, 0, Math.PI * 2);
    ctx.arc(cx, cy, ringRadius - ringWidth / 2, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.restore();

    const progressAngle = Math.PI * 2 * ratio * ease;
    if (progressAngle > 0.001) {
      ctx.save();
      ctx.beginPath();
      if (progressAngle >= Math.PI * 2) {
        ctx.arc(cx, cy, ringRadius + ringWidth / 2, 0, Math.PI * 2);
        ctx.arc(cx, cy, ringRadius - ringWidth / 2, Math.PI * 2, 0, true);
      } else {
        const start = -Math.PI / 2;
        const end = start + progressAngle;
        ctx.moveTo(cx + Math.cos(start) * (ringRadius - ringWidth / 2), cy + Math.sin(start) * (ringRadius - ringWidth / 2));
        ctx.arc(cx, cy, ringRadius - ringWidth / 2, start, end, false);
        ctx.lineTo(cx + Math.cos(end) * (ringRadius + ringWidth / 2), cy + Math.sin(end) * (ringRadius + ringWidth / 2));
        ctx.arc(cx, cy, ringRadius + ringWidth / 2, end, start, true);
        ctx.closePath();
      }
      const grad = ctx.createLinearGradient(cx - ringRadius, cy - ringRadius, cx + ringRadius, cy + ringRadius);
      grad.addColorStop(0, '#7C4DFF');
      grad.addColorStop(1, '#E040FB');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    sliceAngles.forEach(({ slice, start, end }) => {
      const sAng = -Math.PI / 2 + (start + Math.PI / 2) * ease;
      const eAng = -Math.PI / 2 + (end + Math.PI / 2) * ease;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerRadius, sAng, eAng);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0033';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText(String(Math.round(reviewedToday * ease)), cx, cy - 10);
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`/ ${total} 今日`, cx, cy + 14);

    if (t < 1) {
      requestAnimationFrame(draw);
    } else {
      finalRatio = ease;
    }
  }
  requestAnimationFrame(draw);

  (canvas as any).__sliceAngles = sliceAngles;
  (canvas as any).__cx = cx;
  (canvas as any).__cy = cy;
  (canvas as any).__outerR = outerRadius;
  (canvas as any).__innerR = innerRadius;
  (canvas as any).__slices = slices;
  (canvas as any).__size = size;

  legendEl.innerHTML = '';
  slices.forEach(s => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-color" style="background:${s.color}"></div>
      <div class="legend-label">${s.label}</div>
      <div class="legend-value">${s.value}</div>
    `;
    legendEl.appendChild(item);
  });
}

export function setupChartTooltip(): void {
  const canvas = document.getElementById('pieChart') as HTMLCanvasElement | null;
  const tooltip = document.getElementById('chartTooltip') as HTMLElement | null;
  if (!canvas || !tooltip) return;

  function getMousePos(evt: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width ? (200 / (canvas.width / (window.devicePixelRatio || 1))) : 1;
    return {
      x: (evt.clientX - rect.left) * scale,
      y: (evt.clientY - rect.top) * scale
    };
  }

  function isInSlice(mx: number, my: number, cx: number, cy: number, r1: number, r2: number, a1: number, a2: number) {
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < r1 || dist > r2) return false;
    let ang = Math.atan2(dy, dx);
    if (ang < -Math.PI / 2) ang += Math.PI * 2;
    let aa1 = a1;
    let aa2 = a2;
    if (aa1 < -Math.PI / 2) aa1 += Math.PI * 2;
    if (aa2 < -Math.PI / 2) aa2 += Math.PI * 2;
    if (aa2 <= aa1) aa2 += Math.PI * 2;
    if (ang < aa1) ang += Math.PI * 2;
    return ang >= aa1 && ang <= aa2;
  }

  canvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    const info = canvas as any;
    const sliceAngles: any[] = info.__sliceAngles || [];
    const cx: number = info.__cx;
    const cy: number = info.__cy;
    const outerR: number = info.__outerR;
    const innerR: number = info.__innerR;
    const slices: PieSlice[] = info.__slices || [];

    let hit = -1;
    for (let i = 0; i < sliceAngles.length; i++) {
      const { slice, start, end } = sliceAngles[i];
      if (isInSlice(pos.x, pos.y, cx, cy, innerR, outerR, start, end)) {
        hit = slices.indexOf(slice);
        break;
      }
    }

    if (hit >= 0 && slices[hit]) {
      const s = slices[hit];
      const days = s.label === '高记忆' ? getIntervalDays(5) : s.label === '中记忆' ? getIntervalDays(3) : getIntervalDays(1);
      tooltip.innerHTML = s.desc(days);
      tooltip.classList.add('visible');
      const rect = (canvas.parentElement as HTMLElement).getBoundingClientRect();
      const tipX = e.clientX - rect.left + 16;
      const tipY = e.clientY - rect.top + 16;
      tooltip.style.left = tipX + 'px';
      tooltip.style.top = tipY + 'px';
    } else {
      tooltip.classList.remove('visible');
    }
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.classList.remove('visible');
  });
}

export function renderReviewScreen(
  reviewState: ReviewState,
  onFlip: () => void,
  onFeedback: (level: 1 | 2 | 3) => void,
  onBack: () => void
): void {
  const container = document.getElementById('reviewContainer');
  if (!container) return;

  container.innerHTML = '';

  const card3d = renderCard(reviewState.currentCard || { front: '', back: '' }, { flipped: reviewState.isFlipped });

  container.innerHTML = `
    <div class="review-header">
      <button class="review-back" id="reviewBack">← 返回卡片组</button>
      <div class="review-progress" id="reviewProgress">
        已复习 ${reviewState.reviewedCount} · 今日 ${reviewState.reviewedToday}
      </div>
    </div>

    <div class="review-stats-bar" id="reviewStatsBar"></div>

    <div class="review-card-wrap" id="reviewCardWrap">
      <div class="review-card-slide" id="reviewCardSlide"></div>
    </div>

    <div class="review-actions" id="reviewActions">
      <button class="flip-btn" id="flipBtn">🔄 翻转</button>
    </div>
  `;

  const slide = container.querySelector('#reviewCardSlide') as HTMLElement;
  if (slide && reviewState.currentCard) {
    slide.appendChild(card3d);
  }

  const statsBar = container.querySelector('#reviewStatsBar') as HTMLElement;
  const st = reviewState.getStats();
  statsBar.innerHTML = `
    <div class="review-stat glass"><div class="review-stat-value" style="color:#66BB6A">${st.total}</div><div class="review-stat-label">总卡片</div></div>
    <div class="review-stat glass"><div class="review-stat-value" style="color:#FFB74D">${st.due}</div><div class="review-stat-label">待复习</div></div>
    <div class="review-stat glass"><div class="review-stat-value" style="color:#42A5F5">${st.reviewedToday}</div><div class="review-stat-label">今日完成</div></div>
  `;

  if (!reviewState.currentCard) {
    const wrap = container.querySelector('#reviewCardWrap') as HTMLElement;
    wrap.innerHTML = `
      <div class="empty-review">
        <h2>🎉 全部复习完毕！</h2>
        <p>这组卡片暂时没有需要复习的内容了。稍后再来或继续浏览其他卡片吧！</p>
        <button class="btn btn-primary" id="reviewBack2">返回卡片组列表</button>
      </div>
    `;
    const actions = container.querySelector('#reviewActions') as HTMLElement;
    actions.innerHTML = '';
    (wrap.querySelector('#reviewBack2') as HTMLElement)?.addEventListener('click', onBack);
    (container.querySelector('#reviewBack') as HTMLElement)?.addEventListener('click', onBack);
    return;
  }

  const flipBtn = container.querySelector('#flipBtn') as HTMLButtonElement;
  flipBtn?.addEventListener('click', onFlip);

  container.querySelector('#reviewBack')?.addEventListener('click', onBack);

  reviewState.on('cardFlipped', (flipped: boolean) => {
    const c3d = container.querySelector('.review-card-3d') as HTMLElement;
    if (c3d) {
      if (flipped) c3d.classList.add('flipped');
      else c3d.classList.remove('flipped');
    }
    if (flipped) {
      const actions = container.querySelector('#reviewActions') as HTMLElement;
      if (actions && !actions.querySelector('.feedback-buttons')) {
        actions.innerHTML = `
          <div class="feedback-buttons">
            <button class="feedback-btn btn-red" data-level="1">😵 完全忘了</button>
            <button class="feedback-btn btn-orange" data-level="2">🤔 有点模糊</button>
            <button class="feedback-btn btn-green" data-level="3">😊 记得牢</button>
          </div>
        `;
        actions.querySelectorAll('.feedback-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const level = Number((btn as HTMLElement).dataset.level) as 1 | 2 | 3;
            onFeedback(level);
          });
        });
      }
    }
  });

  reviewState.on('cardChanged', (card: Card | null) => {
    const slideEl = container.querySelector('#reviewCardSlide') as HTMLElement;
    if (!slideEl) return;

    if (!card) {
      const wrap = container.querySelector('#reviewCardWrap') as HTMLElement;
      wrap.innerHTML = `
        <div class="empty-review">
          <h2>🎉 本轮复习完成！</h2>
          <p>本轮共复习 ${reviewState.reviewedCount} 张卡片。稍后再来或继续浏览吧！</p>
          <button class="btn btn-primary" id="reviewBack3">返回卡片组列表</button>
        </div>
      `;
      const actions = container.querySelector('#reviewActions') as HTMLElement;
      actions.innerHTML = '';
      (wrap.querySelector('#reviewBack3') as HTMLElement)?.addEventListener('click', onBack);
      return;
    }

    const oldContent = slideEl.innerHTML;
    const wrap = container.querySelector('#reviewCardWrap') as HTMLElement;

    const newSlide = document.createElement('div');
    newSlide.className = 'review-card-slide slide-in';
    const newCard = renderCard(card, { flipped: false });
    newSlide.appendChild(newCard);
    wrap.appendChild(newSlide);

    slideEl.classList.add('slide-out');

    setTimeout(() => {
      slideEl.remove();
      newSlide.classList.remove('slide-in');
      newSlide.id = 'reviewCardSlide';
    }, 420);

    const actions = container.querySelector('#reviewActions') as HTMLElement;
    actions.innerHTML = '<button class="flip-btn" id="flipBtn">🔄 翻转</button>';
    const newFlip = actions.querySelector('#flipBtn') as HTMLButtonElement;
    newFlip.addEventListener('click', onFlip);

    const prog = container.querySelector('#reviewProgress') as HTMLElement;
    if (prog) prog.textContent = `已复习 ${reviewState.reviewedCount} · 今日 ${reviewState.reviewedToday}`;
    const st2 = reviewState.getStats();
    statsBar.innerHTML = `
      <div class="review-stat glass"><div class="review-stat-value" style="color:#66BB6A">${st2.total}</div><div class="review-stat-label">总卡片</div></div>
      <div class="review-stat glass"><div class="review-stat-value" style="color:#FFB74D">${st2.due}</div><div class="review-stat-label">待复习</div></div>
      <div class="review-stat glass"><div class="review-stat-value" style="color:#42A5F5">${st2.reviewedToday}</div><div class="review-stat-label">今日完成</div></div>
    `;
  });
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  const plain = str.replace(/[#*`_~\[\]()>-]/g, '').replace(/\n/g, ' ').trim();
  return plain.length > len ? plain.slice(0, len) + '...' : plain;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '';
  }
}

export function showToast(msg: string, type: 'info' | 'success' | 'error' = 'info'): void {
  const existing = document.querySelector('.app-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'app-toast';
  const colors: Record<string, string> = {
    info: 'rgba(124, 77, 255, 0.95)',
    success: 'rgba(76, 175, 80, 0.95)',
    error: 'rgba(244, 67, 54, 0.95)'
  };
  toast.style.cssText = `
    position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-10px);
    padding:12px 24px;border-radius:12px;color:#fff;font-size:14px;font-weight:500;
    z-index:9999;opacity:0;transition:all 0.3s;box-shadow:0 10px 40px rgba(0,0,0,0.3);
    backdrop-filter:blur(10px);background:${colors[type] || colors.info};
    border:1px solid rgba(255,255,255,0.2);
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => toast.remove(), 350);
  }, 2500);
}
