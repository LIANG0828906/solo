import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from './gameEngine';
import { Renderer, ViewTransform } from './renderer';
import { EventSystem } from './eventSystem';
import {
  GameStateSnapshot, GameEvent, EventOption, SaveMeta,
  ERA_INFO, BUILDINGS, BuildingType, BuildingDef, GameState
} from './types';

const API = 'http://localhost:3001/api';

class GameApp {
  engine: GameEngine;
  renderer: Renderer;
  events: EventSystem;
  ui: HTMLElement;
  canvas: HTMLCanvasElement;
  drag: { active: boolean; sx: number; sy: number; v0: ViewTransform; moved: boolean } | null = null;
  buildMenu: { el: HTMLElement; tileX: number; tileY: number } | null = null;
  modalsOpen = 0;
  animating = new Set<string>();
  pendingEvent: GameEvent | null = null;
  saveList: (SaveMeta | null)[] = [null, null, null, null, null];

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ui = document.getElementById('uiContainer')!;
    this.engine = new GameEngine(Date.now());
    this.renderer = new Renderer(this.canvas);
    this.events = new EventSystem();
    this.init();
  }

  async init() {
    this.renderer.centerMap(this.engine.getState());
    this.renderer.startLoop(() => this.engine.getState());
    this.events.loadEvents().then(() => {
      const snap = this.engine.getState();
      if (snap.turn >= 5 && snap.turn % 5 === 0) { /* noop */ }
    });
    this.fetchSaves();
    this.bindCanvas();
    this.renderUI();
    window.addEventListener('resize', () => this.renderUI());
    this.engine.onUpdate(() => { /* noop - renderer loops independently */ });
    setInterval(() => this.fetchSaves(), 4000);
  }

  bindCanvas() {
    const c = this.canvas;
    c.addEventListener('mousedown', e => {
      if (this.modalsOpen > 0) return;
      this.drag = { active: true, sx: e.clientX, sy: e.clientY, v0: this.renderer.getView(), moved: false };
    });
    c.addEventListener('mousemove', e => {
      if (!this.drag?.active) return;
      const dx = e.clientX - this.drag.sx, dy = e.clientY - this.drag.sy;
      if (Math.hypot(dx, dy) > 4) this.drag.moved = true;
      const v = { ...this.drag.v0 };
      v.offsetX += dx / v.scale;
      v.offsetY += dy / v.scale;
      this.renderer.setView(v);
    });
    const end = (e: MouseEvent) => {
      if (!this.drag) return;
      const moved = this.drag.moved;
      this.drag.active = false;
      const v = this.renderer.getView();
      const snap = this.engine.getState();
      v.scale = Math.max(0.5, Math.min(2, v.scale));
      this.renderer.setView(v);
      this.renderer.clampView(snap);
      if (!moved) {
        const rect = c.getBoundingClientRect();
        const { x, y } = this.renderer.screenToTile(e.clientX - rect.left, e.clientY - rect.top);
        if (x >= 0 && y >= 0 && x < snap.cols && y < snap.rows) {
          this.handleTileClick(x, y, e.clientX, e.clientY);
        } else {
          this.closeBuildMenu();
        }
      }
      this.drag = null;
    };
    c.addEventListener('mouseup', end);
    c.addEventListener('mouseleave', e => end(e as MouseEvent));
    c.addEventListener('wheel', e => {
      if (this.modalsOpen > 0) return;
      e.preventDefault();
      const snap = this.engine.getState();
      const v = this.renderer.getView();
      const old = v.scale;
      const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      v.scale = Math.max(0.5, Math.min(2, v.scale * delta));
      const rect = c.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const cx = (mx - c.clientWidth / 2) / old - v.offsetX;
      const cy = (my - c.clientHeight / 2) / old - v.offsetY;
      v.offsetX = (mx - c.clientWidth / 2) / v.scale - cx;
      v.offsetY = (my - c.clientHeight / 2) / v.scale - cy;
      this.renderer.setView(v);
      this.renderer.clampView(snap);
    }, { passive: false });

    let tStart: { x: number; y: number; t: number; v: ViewTransform } | null = null;
    c.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        tStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), v: this.renderer.getView() };
      }
    }, { passive: true });
    c.addEventListener('touchmove', e => {
      if (this.modalsOpen > 0) return;
      if (e.touches.length === 1 && tStart) {
        const t = e.touches[0];
        const dx = t.clientX - tStart.x, dy = t.clientY - tStart.y;
        if (Math.hypot(dx, dy) > 5) { (tStart as any).moved = true; }
        const v = { ...tStart.v };
        v.offsetX += dx / v.scale;
        v.offsetY += dy / v.scale;
        this.renderer.setView(v);
        e.preventDefault();
      }
    }, { passive: false });
    c.addEventListener('touchend', e => {
      const snap = this.engine.getState();
      const v = this.renderer.getView();
      v.scale = Math.max(0.5, Math.min(2, v.scale));
      this.renderer.setView(v);
      this.renderer.clampView(snap);
      if (tStart && !(tStart as any).moved && Date.now() - tStart.t < 300) {
        const rect = c.getBoundingClientRect();
        const { x, y } = this.renderer.screenToTile(tStart.x - rect.left, tStart.y - rect.top);
        if (x >= 0 && y >= 0 && x < snap.cols && y < snap.rows) {
          this.handleTileClick(x, y, tStart.x, tStart.y);
        } else this.closeBuildMenu();
      }
      tStart = null;
    });
  }

  handleTileClick(x: number, y: number, sx: number, sy: number) {
    const snap = this.engine.getState();
    const tile = snap.map[y][x];
    if (tile.building) {
      this.closeBuildMenu();
      this.floatText(`${BUILDINGS[tile.building.type].name}  ${BUILDINGS[tile.building.type].desc}`, sx, sy, 'info');
      return;
    }
    if (tile.terrain === 'river') {
      this.closeBuildMenu();
      this.floatText('河流无法建造', sx, sy, 'bad');
      return;
    }
    this.showBuildMenu(x, y, sx, sy);
  }

  showBuildMenu(tx: number, ty: number, sx: number, sy: number) {
    this.closeBuildMenu();
    const avail = this.engine.getAvailableBuildings();
    const el = document.createElement('div');
    el.className = 'buildMenu';
    const rect = this.canvas.getBoundingClientRect();
    const maxW = window.innerWidth;
    const menuW = 210;
    let px = sx - rect.left + 12;
    let py = sy - rect.top - 6;
    if (px + menuW > maxW - 10) px = sx - rect.left - menuW - 8;
    el.style.left = `${px}px`;
    el.style.top = `${py}px`;
    const title = document.createElement('div');
    title.className = 'buildMenuTitle';
    title.textContent = `建造建筑 (${tx + 1},${ty + 1})`;
    el.appendChild(title);
    avail.forEach((def: BuildingDef) => {
      const check = this.engine.canBuild(tx, ty, def.type);
      const item = document.createElement('div');
      item.className = 'buildItem' + (check.ok ? '' : ' locked');
      const costStr = Object.entries(def.cost).map(([k, v]) => {
        const label = { food: '食物', wood: '木材', stone: '石器' }[k] || k;
        return `${label}${v}`;
      }).join(' ');
      item.innerHTML = `
        <div class="buildItemIcon" style="background:${def.bgColor}">${def.icon}</div>
        <div class="buildItemInfo">
          <div class="buildItemName">${def.name}</div>
          <div class="buildItemCost">${costStr} · ${def.desc}</div>
        </div>`;
      if (check.ok) {
        item.onclick = () => {
          this.doBuild(tx, ty, def.type, sx, sy);
          this.closeBuildMenu();
        };
      } else {
        item.title = check.reason || '不可建造';
      }
      el.appendChild(item);
    });
    const closeBtn = document.createElement('div');
    closeBtn.className = 'buildItem';
    closeBtn.innerHTML = `<div class="buildItemIcon" style="background:#8B6F47">✕</div><div class="buildItemInfo"><div class="buildItemName" style="color:#8B6F47">关闭</div></div>`;
    closeBtn.onclick = () => this.closeBuildMenu();
    el.appendChild(closeBtn);
    document.getElementById('uiContainer')!.appendChild(el);
    this.buildMenu = { el, tileX: tx, tileY: ty };
    document.addEventListener('click', this._outside, { once: true });
  }

  _outside = (e: MouseEvent) => {
    if (!this.buildMenu) return;
    const m = this.buildMenu.el;
    if (!m.contains(e.target as Node)) this.closeBuildMenu();
    else document.addEventListener('click', this._outside, { once: true });
  };

  closeBuildMenu() {
    if (this.buildMenu) {
      this.buildMenu.el.remove();
      this.buildMenu = null;
    }
  }

  doBuild(tx: number, ty: number, type: BuildingType, sx: number, sy: number) {
    const def = BUILDINGS[type];
    const b = this.engine.build(tx, ty, type);
    if (!b) {
      this.floatText('资源不足', sx, sy, 'bad');
      return;
    }
    this.renderer.addBuildParticles(tx, ty);
    setTimeout(() => this.renderer.addSparkParticles(tx, ty, '#FFE8A3'), 300);
    Object.entries(def.cost).forEach(([k, v]) => {
      this.floatText(`${{food:'食物',wood:'木材',stone:'石器'}[k]||k} -${v}`, sx, sy + 30, 'bad');
    });
    this.renderUI();
  }

  nextTurn() {
    const res = this.engine.nextTurn();
    const snap = this.engine.getState();
    if (res.deltaRes) {
      this.animateResourceChanges(res.deltaRes, res.deltaPop);
    }
    if (res.shouldTriggerEvent) {
      const ev = this.events.pickEvent(snap.era, snap.turn, snap.rngSeed);
      if (ev) {
        this.pendingEvent = ev;
        setTimeout(() => this.showEventModal(ev), 150);
      }
    }
    if (snap.justUnlockedEra !== undefined) {
      setTimeout(() => this.showEraUnlock(snap.justUnlockedEra!), 300);
    }
    this.renderUI();
  }

  animateResourceChanges(deltaRes: Partial<{ food: number; wood: number; stone: number; science: number }>, deltaPop: number) {
    const rp = this.ui.querySelector('.resourcePanel')!;
    (['food', 'wood', 'stone', 'science'] as const).forEach(k => {
      const v = deltaRes[k] || 0;
      if (v === 0) return;
      const el = rp.querySelector(`[data-res="${k}"] .resourceValue`) as HTMLElement;
      if (!el) return;
      el.classList.remove('bounce-up', 'bounce-down');
      void el.offsetWidth;
      el.classList.add(v > 0 ? 'bounce-up' : 'bounce-down');
      setTimeout(() => el.classList.remove('bounce-up', 'bounce-down'), 600);
    });
    if (deltaPop !== 0) {
      const el = rp.querySelector(`[data-res="population"] .resourceValue`) as HTMLElement;
      if (el) {
        el.classList.remove('bounce-up', 'bounce-down');
        void el.offsetWidth;
        el.classList.add(deltaPop > 0 ? 'bounce-up' : 'bounce-down');
        setTimeout(() => el.classList.remove('bounce-up', 'bounce-down'), 600);
      }
    }
  }

  floatText(text: string, sx: number, sy: number, kind: 'good' | 'bad' | 'info') {
    const el = document.createElement('div');
    el.className = `floatText ${kind}`;
    el.textContent = text;
    const rect = this.canvas.getBoundingClientRect();
    el.style.left = `${sx - rect.left}px`;
    el.style.top = `${sy - rect.top}px`;
    el.style.transform = 'translate(-50%, 0)';
    this.ui.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  showEventModal(ev: GameEvent) {
    this.modalsOpen++;
    const overlay = document.createElement('div');
    overlay.className = 'modalOverlay';
    const modal = document.createElement('div');
    modal.className = 'eventModal';
    modal.innerHTML = `
      <div class="eventTypeBadge">${ev.typeLabel}</div>
      <div class="eventTitle">${ev.name}</div>
      <div class="eventDesc">${ev.description}</div>
      <div class="eventOptions"></div>`;
    const optsEl = modal.querySelector('.eventOptions')!;
    ev.options.forEach((opt: EventOption) => {
      const btn = document.createElement('button');
      btn.className = 'eventOption';
      btn.textContent = opt.text;
      btn.onclick = () => {
        modal.classList.add('closing');
        setTimeout(() => {
          overlay.remove();
          this.modalsOpen--;
          this.resolveEvent(ev, opt);
        }, 260);
      };
      optsEl.appendChild(btn);
    });
    overlay.appendChild(modal);
    this.ui.appendChild(overlay);
    if (ev.type === 'disaster') {
      this.renderer.setShake(8, 500);
    }
  }

  resolveEvent(ev: GameEvent, opt: EventOption) {
    const before = { ...this.engine.state.resources, pop: this.engine.state.population };
    const r = this.engine.applyEventEffect(opt.effects);
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    this.floatText(opt.resultText, cx, cy - 40, 'info');
    if (r.resultText) this.floatText(r.resultText, cx, cy + 20, 'good');
    const diff = {
      food: this.engine.state.resources.food - before.food,
      wood: this.engine.state.resources.wood - before.wood,
      stone: this.engine.state.resources.stone - before.stone,
      pop: this.engine.state.population - before.pop
    };
    Object.entries(diff).forEach(([k, v], i) => {
      if (!v) return;
      const label = { food: '食物', wood: '木材', stone: '石器', pop: '人口' }[k] || k;
      setTimeout(() => this.floatText(`${label} ${v > 0 ? '+' : ''}${v}`, cx, cy + 60 + i * 24, v > 0 ? 'good' : 'bad'), 100 + i * 60);
    });
    if (this.engine.state.justUnlockedEra !== undefined) {
      setTimeout(() => this.showEraUnlock(this.engine.state.justUnlockedEra!), 400);
    }
    if (r.destroyedBuildings > 0) this.renderer.setShake(10, 500);
    this.engine.state.eventHistory.push(`T${this.engine.state.turn} ${ev.name}: ${opt.id}`);
    this.renderUI();
  }

  showEraUnlock(era: number) {
    const info = ERA_INFO[era as 0 | 1 | 2 | 3];
    this.modalsOpen++;
    const overlay = document.createElement('div');
    overlay.className = 'modalOverlay';
    const unlocks: { icon: string; name: string; desc: string }[] = [];
    Object.values(BUILDINGS).filter(b => b.minEra === era).forEach(b => {
      unlocks.push({ icon: b.icon, name: b.name, desc: b.desc });
    });
    const abilities = [
      { name: '无', desc: '石器时代基本能力' },
      { name: '灌溉技术', desc: '农田产量提升，灌溉渠解锁' },
      { name: '军事训练', desc: '兵营与铸币所解锁' },
      { name: '铁具锻造', desc: '铁匠铺与城墙解锁' }
    ][era];
    unlocks.push({ icon: '✨', name: `特殊能力: ${abilities.name}`, desc: abilities.desc });
    const listHtml = unlocks.map(u => `
      <li class="unlockItem">
        <div class="unlockIcon">${u.icon}</div>
        <div class="unlockInfo">
          <div class="unlockName">${u.name}</div>
          <div class="unlockDesc">${u.desc}</div>
        </div>
      </li>`).join('');
    overlay.innerHTML = `
      <div class="techScroll">
        <div class="eraName">${info.name}</div>
        <div class="eraSub">${info.sub}</div>
        <ul class="unlockList">${listHtml}</ul>
        <button class="scrollClose">开启新篇章</button>
      </div>`;
    const btn = overlay.querySelector('.scrollClose') as HTMLButtonElement;
    btn.onclick = () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.25s';
      setTimeout(() => { overlay.remove(); this.modalsOpen--; }, 280);
    };
    this.ui.appendChild(overlay);
    this.renderUI();
  }

  async fetchSaves() {
    try {
      const res = await fetch(`${API}/saves`);
      const json = await res.json();
      if (json?.success) this.saveList = json.data;
      this.renderSidebar();
    } catch { /* offline */ }
  }

  async saveToSlot(slot: number) {
    const snap = this.engine.getState();
    const name = `存档 ${slot + 1} · T${snap.turn}`;
    try {
      const res = await fetch(`${API}/saves/${slot}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: snap, name })
      });
      const json = await res.json();
      if (json.success) {
        this.floatText(`已保存到存档 ${slot + 1}`, window.innerWidth - 120, window.innerHeight - 200, 'good');
        this.fetchSaves();
      } else this.floatText('保存失败', window.innerWidth / 2, window.innerHeight / 2, 'bad');
    } catch {
      this.floatText('服务器未启动', window.innerWidth / 2, window.innerHeight / 2, 'bad');
    }
  }

  async loadFromSlot(slot: number) {
    try {
      const res = await fetch(`${API}/saves/${slot}`);
      const json = await res.json();
      if (json?.success && json.data) {
        this.engine.setState(json.data as GameState);
        this.renderer.centerMap(this.engine.getState());
        this.floatText(`已加载存档 ${slot + 1}`, window.innerWidth / 2, window.innerHeight / 2, 'good');
        this.renderUI();
      } else this.floatText('加载失败', window.innerWidth / 2, window.innerHeight / 2, 'bad');
    } catch {
      this.floatText('服务器未启动', window.innerWidth / 2, window.innerHeight / 2, 'bad');
    }
  }

  renderSidebar() {
    let sb = this.ui.querySelector('.sideBar') as HTMLElement | null;
    if (!sb) {
      sb = document.createElement('div');
      sb.className = 'sideBar';
      this.ui.appendChild(sb);
    }
    const snap = this.engine.getState();
    let html = `<div class="sideBarTitle">📜 存档管理 (5槽位)</div>`;
    html += `<div style="font-size:12px;color:#8B6F47;margin-bottom:8px;line-height:1.5">
      <b>T${snap.turn}</b> · ${ERA_INFO[snap.era].name} · 人口 ${snap.population}/${snap.populationCap}
    </div>`;
    this.saveList.forEach((s, i) => {
      if (!s) {
        html += `<div class="saveSlot empty">
          <div class="saveSlotName">槽位 ${i + 1}（空）</div>
          <div class="saveSlotInfo">点击保存到该槽位</div>
          <div class="saveActions"><button class="btn btn-save" data-slot="${i}" data-act="save">保存</button></div>
        </div>`;
      } else {
        const d = new Date(s.savedAt);
        const dStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        html += `<div class="saveSlot">
          <div class="saveSlotName">${s.name}</div>
          <div class="saveSlotInfo">${dStr} · ${ERA_INFO[s.era as 0|1|2|3].name} · ${s.population}人</div>
          <div class="saveActions">
            <button class="btn btn-save" data-slot="${i}" data-act="save">覆盖</button>
            <button class="btn btn-load" data-slot="${i}" data-act="load">读取</button>
          </div>
        </div>`;
      }
    });
    if (snap.statuses.length > 0) {
      html += `<div class="sideBarTitle" style="margin-top:14px">🎖️ 当前状态</div>`;
      snap.statuses.forEach(st => {
        html += `<div class="saveSlot" style="margin-bottom:6px;padding:8px">
          <div class="saveSlotName" style="font-size:12px">${st.name} <span style="float:right;color:#CD853F">${st.turns}回合</span></div>
          <div class="saveSlotInfo">${st.effect || ''}
            ${st.perTurn ? Object.entries(st.perTurn).map(([k, v]) => ` +${v}${{food:'食物',wood:'木材',stone:'石器',science:'科技'}[k]||k}/回合`).join('') : ''}
          </div>
        </div>`;
      });
    }
    sb.innerHTML = html;
    sb.querySelectorAll('[data-act]').forEach(el => {
      const btn = el as HTMLElement;
      const slot = parseInt(btn.dataset.slot || '0');
      const act = btn.dataset.act;
      btn.onclick = (e) => { e.stopPropagation(); if (act === 'save') this.saveToSlot(slot); else this.loadFromSlot(slot); };
    });
  }

  renderUI() {
    const snap = this.engine.getState();
    const eraInfo = ERA_INFO[snap.era];
    let topBar = this.ui.querySelector('.topBar') as HTMLElement | null;
    if (!topBar) {
      topBar = document.createElement('div');
      topBar.className = 'topBar';
      this.ui.appendChild(topBar);
    }
    topBar.innerHTML = `
      <div class="turnInfo">
        <span class="eraBadge">${eraInfo.name}</span>
        <span>回合 <b style="color:#D4A373;font-size:17px">${snap.turn}</b></span>
        <span>👥 ${snap.population}<span style="color:#D4A373">/${snap.populationCap}</span></span>
      </div>
      <div class="turnInfo"><button class="turnBtn" id="nextTurnBtn">⏭ 下一回合</button></div>`;
    (topBar.querySelector('#nextTurnBtn') as HTMLButtonElement).onclick = () => this.nextTurn();

    let rp = this.ui.querySelector('.resourcePanel') as HTMLElement | null;
    if (!rp) {
      rp = document.createElement('div');
      rp.className = 'resourcePanel';
      this.ui.appendChild(rp);
    }
    const resList = [
      { k: 'population', name: '人口', icon: '👥', bg: '#4A90D9', value: snap.population, unit: `${snap.population} / ${snap.populationCap}` },
      { k: 'food', name: '食物', icon: '🍞', bg: '#E8A838', value: snap.resources.food },
      { k: 'wood', name: '木材', icon: '🪵', bg: '#A0522D', value: snap.resources.wood },
      { k: 'stone', name: '石器', icon: '🪨', bg: '#708090', value: snap.resources.stone },
      { k: 'science', name: '科技', icon: '🔬', bg: '#9370DB', value: snap.resources.science }
    ];
    rp.innerHTML = resList.map(r => `
      <div class="resourceItem" data-res="${r.k}">
        <div class="resourceIcon" style="background:${r.bg}">${r.icon}</div>
        <div class="resourceName">${r.name}</div>
        <div class="resourceValue">${r.unit ?? r.value}</div>
      </div>`).join('');

    let bn = this.ui.querySelector('.bottomNav') as HTMLElement | null;
    if (!bn) {
      bn = document.createElement('div');
      bn.className = 'bottomNav';
      this.ui.appendChild(bn);
    }
    bn.innerHTML = `
      <div class="navItem" id="navSave"><div class="navItemIcon">💾</div><div>存档</div></div>
      <div class="navItem" id="navCenter"><div class="navItemIcon">🧭</div><div>居中</div></div>
      <div class="navItem" id="navTurn"><div class="navItemIcon">⏭️</div><div>回合</div></div>
      <div class="navItem" id="navInfo"><div class="navItemIcon">ℹ️</div><div>提示</div></div>`;
    (bn.querySelector('#navSave') as HTMLElement).onclick = () => {
      const sb = this.ui.querySelector('.sideBar') as HTMLElement;
      sb?.classList.toggle('open');
    };
    (bn.querySelector('#navCenter') as HTMLElement).onclick = () => { this.renderer.centerMap(snap); this.renderer.clampView(snap); };
    (bn.querySelector('#navTurn') as HTMLElement).onclick = () => this.nextTurn();
    (bn.querySelector('#navInfo') as HTMLElement).onclick = () => {
      alert('玩法提示：\n\n• 点击空白格子 → 建造建筑\n• 鼠标滚轮 → 缩放地图\n• 拖拽地图 → 平移视角\n• 每5回合 → 随机事件\n• 人口达到10/25/50 → 解锁新时代');
    };

    this.renderSidebar();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  (window as any).__game = new GameApp();
});
