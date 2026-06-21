import { DrawingManager, SpellType, Stroke, SPELL_COLORS } from './drawing';
import { CombatManager, matchRune, RUNE_TEMPLATES } from './combat';

type GameMode = 'draw' | 'combat';

interface SavedRune {
  id: string;
  name: string;
  strokes: Stroke[];
  thumbnail: string;
  spellType: SpellType;
}

const MAX_SAVED_RUNES = 10;

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private drawingManager: DrawingManager;
  private combatManager: CombatManager;
  private mode: GameMode = 'draw';
  private lastTime: number = 0;
  private spellType: SpellType = 'fire';
  private savedRunes: SavedRune[] = [];
  private selectedTemplateIndex: number = -1;
  private battleStarted: boolean = false;
  private battleOverHandled: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.drawingManager = new DrawingManager(this.canvas);
    this.combatManager = new CombatManager(this.canvas);

    this.loadSavedRunes();
    this.setupEventListeners();
    this.updateModeUI();
    this.renderTemplateGallery();

    this.drawingManager.render();
    this.startLoop();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.offsetX, e.offsetY));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e.offsetX, e.offsetY));
    this.canvas.addEventListener('mouseup', () => this.onPointerUp());
    this.canvas.addEventListener('mouseleave', () => this.onPointerUp());

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const touch = e.touches[0];
      this.onPointerDown((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const touch = e.touches[0];
      this.onPointerMove((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.onPointerUp();
    }, { passive: false });

    document.getElementById('undo-btn')!.addEventListener('click', () => {
      if (this.mode === 'draw') {
        this.drawingManager.undo();
        this.drawingManager.render();
      }
    });

    document.getElementById('redo-btn')!.addEventListener('click', () => {
      if (this.mode === 'draw') {
        this.drawingManager.redo();
        this.drawingManager.render();
      }
    });

    document.getElementById('activate-btn')!.addEventListener('click', () => {
      this.onActivate();
    });

    document.getElementById('save-rune-btn')!.addEventListener('click', () => {
      this.saveCurrentRune();
    });

    document.getElementById('replay-btn')!.addEventListener('click', () => {
      this.hideModal();
      this.battleStarted = false;
      this.battleOverHandled = false;
      this.combatManager.startBattle();
      this.battleStarted = true;
      this.switchMode('draw');
      this.updateHealthBars();
    });

    document.getElementById('share-btn')!.addEventListener('click', () => {
      this.shareResult();
    });

    document.querySelectorAll('.spell-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const spell = target.dataset.spell as SpellType;
        this.setSpellType(spell);
      });
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const mode = target.dataset.mode as GameMode;
        this.switchMode(mode);
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (this.mode === 'draw') {
          this.drawingManager.undo();
          this.drawingManager.render();
        }
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        if (this.mode === 'draw') {
          this.drawingManager.redo();
          this.drawingManager.render();
        }
      }
    });
  }

  private updateModeUI(): void {
    const drawControls = [document.getElementById('undo-btn')!, document.getElementById('redo-btn')!];
    const activateBtn = document.getElementById('activate-btn')!;
    const spellSelector = document.getElementById('spell-selector')!;

    document.querySelectorAll('.mode-btn').forEach(btn => {
      const el = btn as HTMLElement;
      el.classList.toggle('active', el.dataset.mode === this.mode);
    });

    if (this.mode === 'draw') {
      drawControls.forEach(el => (el as HTMLElement).style.display = 'flex');
      activateBtn.style.display = 'block';
      spellSelector.style.display = 'flex';
      this.canvas.style.cursor = 'crosshair';
    } else {
      drawControls.forEach(el => (el as HTMLElement).style.display = 'none');
      activateBtn.style.display = 'none';
      spellSelector.style.display = 'none';
      this.canvas.style.cursor = 'default';
    }
  }

  private onPointerDown(x: number, y: number): void {
    if (this.mode === 'draw') {
      this.drawingManager.startDrawing(x, y);
    }
  }

  private onPointerMove(x: number, y: number): void {
    if (this.mode === 'draw') {
      this.drawingManager.draw(x, y);
    }
  }

  private onPointerUp(): void {
    if (this.mode === 'draw') {
      this.drawingManager.stopDrawing();
    }
  }

  private setSpellType(type: SpellType): void {
    this.spellType = type;
    this.drawingManager.setSpellType(type);

    document.querySelectorAll('.spell-btn').forEach(btn => {
      const el = btn as HTMLElement;
      el.classList.remove('active-fire', 'active-ice', 'active-lightning');
      if (el.dataset.spell === type) {
        el.classList.add(`active-${type}`);
      }
    });
  }

  private switchMode(mode: GameMode): void {
    this.mode = mode;
    this.updateModeUI();

    if (mode === 'draw') {
      this.drawingManager.render();
    } else {
      if (!this.battleStarted) {
        this.combatManager.startBattle();
        this.battleStarted = true;
        this.battleOverHandled = false;
      }
      this.updateHealthBars();
    }
  }

  private onActivate(): void {
    if (this.battleStarted && this.combatManager.isBattleOver()) return;

    const points = this.drawingManager.getAllPoints();
    if (points.length < 10) {
      this.showFeedback('请绘制更多笔画');
      return;
    }

    const match = matchRune(points);

    if (!this.battleStarted) {
      this.combatManager.startBattle();
      this.battleStarted = true;
      this.battleOverHandled = false;
    }

    const strokes = this.drawingManager.getStrokes();
    let cx = 0, cy = 0, count = 0;
    for (const s of strokes) {
      for (const p of s.points) {
        cx += p.x; cy += p.y; count++;
      }
    }
    cx /= count; cy /= count;

    const result = this.combatManager.activateRune(points, { x: cx, y: cy }, match.spellType);
    this.updateHealthBars();

    if (result.matched) {
      this.showFeedback(`${match.name} 匹配 ${Math.round(match.score * 100)}%! -${result.damage}HP`);
      this.drawingManager.clear();
      this.mode = 'combat';
      this.updateModeUI();
    } else {
      if (match.score > 0.4) {
        this.showFeedback(`${match.name} 匹配度 ${Math.round(match.score * 100)}% (需>70%)`);
      } else {
        this.showFeedback(`匹配度不足: ${Math.round(match.score * 100)}%`);
      }
    }
  }

  private showFeedback(text: string): void {
    const el = document.getElementById('match-feedback')!;
    el.textContent = text;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1500);
  }

  private updateHealthBars(): void {
    const playerBar = document.getElementById('player-health')!;
    const enemyBar = document.getElementById('enemy-health')!;
    const cooldownBar = document.getElementById('cooldown-bar')!;

    const playerPct = (this.combatManager.getPlayerHealth() / this.combatManager.getPlayerMaxHealth()) * 100;
    const enemyPct = (this.combatManager.getEnemyHealth() / this.combatManager.getEnemyMaxHealth()) * 100;
    const cooldownPct = this.combatManager.getCooldownTimer() > 0
      ? (this.combatManager.getCooldownTimer() / this.combatManager.getCooldownMax()) * 100
      : 0;

    playerBar.style.width = `${playerPct}%`;
    enemyBar.style.width = `${enemyPct}%`;
    cooldownBar.style.width = `${cooldownPct}%`;

    if (playerPct < 20) playerBar.classList.add('pulse');
    else playerBar.classList.remove('pulse');

    if (enemyPct < 20) enemyBar.classList.add('pulse');
    else enemyBar.classList.remove('pulse');
  }

  private saveCurrentRune(): void {
    const strokes = this.drawingManager.getStrokes();
    if (strokes.length === 0) return;

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 40;
    thumbCanvas.height = 40;
    this.drawingManager.renderToThumbnail(thumbCanvas);
    const thumbnail = thumbCanvas.toDataURL();

    const rune: SavedRune = {
      id: Date.now().toString(),
      name: `符文 ${this.savedRunes.length + 1}`,
      strokes: strokes.map(s => ({ ...s, points: [...s.points] })),
      thumbnail,
      spellType: this.spellType
    };

    if (this.selectedTemplateIndex >= 0 && this.selectedTemplateIndex < this.savedRunes.length) {
      this.savedRunes[this.selectedTemplateIndex] = rune;
    } else {
      if (this.savedRunes.length >= MAX_SAVED_RUNES) {
        this.savedRunes.shift();
      }
      this.savedRunes.push(rune);
      this.selectedTemplateIndex = this.savedRunes.length - 1;
    }

    this.persistSavedRunes();
    this.renderTemplateGallery();

    fetch('/api/runes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rune)
    }).catch(() => {});
  }

  private loadSavedRunes(): void {
    try {
      const data = localStorage.getItem('rune-workshop-saved');
      if (data) {
        this.savedRunes = JSON.parse(data);
      }
    } catch {}

    fetch('/api/runes')
      .then(r => r.json())
      .then((runes: SavedRune[]) => {
        if (runes && runes.length > 0 && this.savedRunes.length === 0) {
          this.savedRunes = runes.slice(0, MAX_SAVED_RUNES);
          this.persistSavedRunes();
          this.renderTemplateGallery();
        }
      })
      .catch(() => {});
  }

  private persistSavedRunes(): void {
    try {
      localStorage.setItem('rune-workshop-saved', JSON.stringify(this.savedRunes));
    } catch {}
  }

  private renderTemplateGallery(): void {
    const grid = document.getElementById('template-grid')!;
    grid.innerHTML = '';

    this.savedRunes.forEach((rune, idx) => {
      const item = document.createElement('div');
      item.className = 'template-item' + (idx === this.selectedTemplateIndex ? ' selected' : '');
      const img = document.createElement('img');
      img.src = rune.thumbnail;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      item.appendChild(img);

      item.addEventListener('click', () => {
        this.selectedTemplateIndex = idx;
        this.renderTemplateGallery();

        if (this.mode !== 'draw') {
          this.switchMode('draw');
        }

        const strokes = rune.strokes.map(s => ({
          ...s,
          points: s.points.map(p => ({ ...p }))
        }));
        this.drawingManager.loadStrokes(strokes);
        this.setSpellType(rune.spellType);
        this.drawingManager.render();
      });

      grid.appendChild(item);
    });
  }

  private showModal(): void {
    const result = this.combatManager.getBattleResult();
    document.getElementById('result-duration')!.textContent = result.duration.toString();
    document.getElementById('result-spells')!.textContent = result.spellCount.toString();
    document.getElementById('result-grade')!.textContent = result.grade;

    const gradeEl = document.getElementById('result-grade')!;
    if (result.grade === 'S') gradeEl.style.color = '#FFD700';
    else if (result.grade === 'A') gradeEl.style.color = '#48BB78';
    else if (result.grade === 'B') gradeEl.style.color = '#4299E1';
    else gradeEl.style.color = '#A0AEC0';

    document.getElementById('result-modal')!.classList.add('show');

    fetch('/api/battles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    }).catch(() => {});
  }

  private hideModal(): void {
    document.getElementById('result-modal')!.classList.remove('show');
  }

  private shareResult(): void {
    const result = this.combatManager.getBattleResult();
    const text = `灵符工坊 - 战斗结果\n等级: ${result.grade}\n时长: ${result.duration}秒\n法术: ${result.spellCount}次\n最高连击: ${result.comboMax}`;
    navigator.clipboard.writeText(text).then(() => {
      this.showFeedback('结果已复制到剪贴板!');
    }).catch(() => {
      this.showFeedback('复制失败');
    });
  }

  private startLoop(): void {
    const loop = (time: number) => {
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      if (this.mode === 'combat' && this.battleStarted) {
        this.combatManager.update(dt);
        this.combatManager.render();
        this.updateHealthBars();

        if (this.combatManager.isBattleOver() && !this.battleOverHandled) {
          this.battleOverHandled = true;
          setTimeout(() => this.showModal(), 500);
        }
      } else if (this.mode === 'draw') {
        if (this.drawingManager.isDirty()) {
          this.drawingManager.render();
        }
      }

      requestAnimationFrame(loop);
    };

    this.lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}

new Game();
