import {
  IngredientType,
  FireLevel,
  StoveState,
  Particle,
  Stove,
  FlyingDish,
  CompletedDish,
  ScorePopup,
  DataPanelState,
  INGREDIENTS_DATA,
  FIRE_CONFIG,
  STOVE_RADIUS,
  BOWL_RADIUS,
  PLATE_RADIUS,
  RING_RADIUS
} from './types';

export class Kitchen {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;

  stoves: Stove[] = [];
  particles: Particle[] = [];
  completedDishes: CompletedDish[] = [];
  scorePopups: ScorePopup[] = [];

  totalScore: number = 0;
  scoreScaleTarget: number = 1;
  scoreScaleCurrent: number = 1;
  highScoreStreak: number = 0;
  comboActive: boolean = false;
  comboStartTime: number = 0;

  dataPanel: DataPanelState = {
    cookingCount: 0,
    avgScore: 0,
    highScoreStreak: 0,
    lastUpdate: 0
  };

  draggingIngredient: IngredientType | null = null;
  dragX: number = 0;
  dragY: number = 0;
  selectedStove: number | null = null;

  bowlPositions: { x: number; y: number; ingredient: IngredientType }[] = [];
  plateSlots: { x: number; y: number; occupied: boolean }[] = [];

  prepTableX: number = 0;
  prepTableY: number = 0;
  prepTableW: number = 200;
  prepTableH: number = 400;

  finishedTableX: number = 0;
  finishedTableY: number = 0;
  finishedTableW: number = 200;
  finishedTableH: number = 400;

  counterY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    this.initKitchen();
    this.setupEventListeners();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  initKitchen() {
    this.counterY = this.height * 0.55;

    this.prepTableX = 40;
    this.prepTableY = this.counterY - this.prepTableH + 20;

    this.finishedTableX = this.width - this.finishedTableW - 40;
    this.finishedTableY = this.counterY - this.finishedTableH + 20;

    const stoveStartX = this.prepTableX + this.prepTableW + 60;
    const stoveSpacing = 180;
    this.stoves = [];
    for (let i = 0; i < 3; i++) {
      this.stoves.push({
        index: i,
        x: stoveStartX + i * (STOVE_RADIUS * 2 + stoveSpacing - STOVE_RADIUS * 2) + STOVE_RADIUS,
        y: this.counterY - 10,
        state: 'idle',
        ingredient: null,
        fireLevel: 'medium',
        cookTime: 0,
        maxCookTime: FIRE_CONFIG.medium.duration,
        startTime: 0,
        elapsedTime: 0,
        warningActive: false,
        warningCount: 0,
        warningStartTime: 0,
        ringActive: false,
        ringStartTime: 0,
        flyingDish: null
      });
    }

    const bowlSpacing = 75;
    const bowlStartY = this.prepTableY + 80;
    const ingredientTypes: IngredientType[] = ['greens', 'tofu', 'fish', 'meat', 'chili'];
    this.bowlPositions = [];
    for (let i = 0; i < 5; i++) {
      this.bowlPositions.push({
        x: this.prepTableX + this.prepTableW / 2,
        y: bowlStartY + i * bowlSpacing,
        ingredient: ingredientTypes[i]
      });
    }

    const plateStartY = this.finishedTableY + 70;
    const plateSpacing = 100;
    this.plateSlots = [];
    for (let i = 0; i < 4; i++) {
      this.plateSlots.push({
        x: this.finishedTableX + this.finishedTableW / 2,
        y: plateStartY + i * plateSpacing,
        occupied: false
      });
    }
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    window.addEventListener('resize', () => {
      this.resize();
      this.initKitchen();
    });
  }

  getEventPos(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  onMouseDown(e: MouseEvent) {
    const pos = this.getEventPos(e);
    this.handlePress(pos.x, pos.y);
  }

  onMouseMove(e: MouseEvent) {
    const pos = this.getEventPos(e);
    this.handleMove(pos.x, pos.y);
  }

  onMouseUp(e: MouseEvent) {
    const pos = this.getEventPos(e);
    this.handleRelease(pos.x, pos.y);
  }

  onTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const pos = this.getEventPos(e.touches[0]);
      this.handlePress(pos.x, pos.y);
    }
  }

  onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const pos = this.getEventPos(e.touches[0]);
      this.handleMove(pos.x, pos.y);
    }
  }

  onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      const pos = this.getEventPos(e.changedTouches[0]);
      this.handleRelease(pos.x, pos.y);
    }
  }

  handlePress(x: number, y: number) {
    for (const bowl of this.bowlPositions) {
      const dx = x - bowl.x;
      const dy = y - bowl.y;
      if (dx * dx + dy * dy <= BOWL_RADIUS * BOWL_RADIUS) {
        this.draggingIngredient = bowl.ingredient;
        this.dragX = x;
        this.dragY = y;
        this.canvas.classList.add('dragging');
        return;
      }
    }

    for (let i = 0; i < this.stoves.length; i++) {
      const stove = this.stoves[i];
      const dx = x - stove.x;
      const dy = y - stove.y;
      if (dx * dx + dy * dy <= STOVE_RADIUS * STOVE_RADIUS) {
        this.selectedStove = this.selectedStove === i ? null : i;
        return;
      }
    }

    if (this.selectedStove !== null) {
      const stove = this.stoves[this.selectedStove];
      const buttonPositions = this.getFireButtonPositions(stove);
      const fireLevels: FireLevel[] = ['gentle', 'medium', 'strong'];
      
      for (let i = 0; i < buttonPositions.length; i++) {
        const btn = buttonPositions[i];
        const dx = x - btn.x;
        const dy = y - btn.y;
        if (dx * dx + dy * dy <= 20 * 20) {
          stove.fireLevel = fireLevels[i];
          if (stove.state === 'cooking') {
            const remainingRatio = 1 - stove.elapsedTime / stove.maxCookTime;
            stove.maxCookTime = FIRE_CONFIG[fireLevels[i]].duration;
            stove.elapsedTime = stove.maxCookTime * (1 - remainingRatio);
          }
          return;
        }
      }
    }
  }

  handleMove(x: number, y: number) {
    if (this.draggingIngredient) {
      this.dragX = x;
      this.dragY = y;
    }
  }

  handleRelease(x: number, y: number) {
    if (this.draggingIngredient) {
      for (let i = 0; i < this.stoves.length; i++) {
        const stove = this.stoves[i];
        const dx = x - stove.x;
        const dy = y - stove.y;
        if (dx * dx + dy * dy <= STOVE_RADIUS * STOVE_RADIUS) {
          if (stove.state === 'cooking') {
            this.triggerWarning(i);
          } else {
            this.startCooking(i, this.draggingIngredient);
          }
          break;
        }
      }
      this.draggingIngredient = null;
      this.canvas.classList.remove('dragging');
    }
  }

  getFireButtonPositions(stove: Stove): { x: number; y: number }[] {
    const baseY = stove.y - STOVE_RADIUS - 100;
    const spacing = 55;
    return [
      { x: stove.x - spacing, y: baseY },
      { x: stove.x, y: baseY },
      { x: stove.x + spacing, y: baseY }
    ];
  }

  triggerWarning(stoveIndex: number) {
    const stove = this.stoves[stoveIndex];
    if (stove.warningActive) return;
    stove.warningActive = true;
    stove.warningCount = 0;
    stove.warningStartTime = performance.now();
  }

  startCooking(stoveIndex: number, ingredient: IngredientType) {
    const stove = this.stoves[stoveIndex];
    stove.state = 'cooking';
    stove.ingredient = ingredient;
    stove.fireLevel = stove.fireLevel || 'medium';
    stove.maxCookTime = FIRE_CONFIG[stove.fireLevel].duration;
    stove.elapsedTime = 0;
    stove.startTime = performance.now();
  }

  calculateScore(stove: Stove): number {
    if (!stove.ingredient) return 0;
    const idealTime = INGREDIENTS_DATA[stove.ingredient].idealTime;
    const actualTime = stove.elapsedTime;
    const diff = Math.abs(actualTime - idealTime);
    
    let score = 100 - diff * 8;
    if (actualTime > idealTime + 2) {
      score -= 10;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  completeCooking(stoveIndex: number, currentTime: number) {
    const stove = this.stoves[stoveIndex];
    if (!stove.ingredient) return;

    const score = this.calculateScore(stove);
    this.totalScore += score;
    this.scoreScaleTarget = 1.1;

    if (score >= 80) {
      this.highScoreStreak++;
      if (this.highScoreStreak >= 3) {
        this.triggerComboEffect(currentTime);
      }
    } else {
      this.highScoreStreak = 0;
    }

    this.scorePopups.push({
      score,
      x: stove.x,
      y: stove.y - STOVE_RADIUS - 40,
      startTime: currentTime,
      duration: 1500
    });

    const availableSlot = this.plateSlots.find(s => !s.occupied);
    if (availableSlot) {
      availableSlot.occupied = true;
      stove.flyingDish = {
        ingredient: stove.ingredient,
        startX: stove.x,
        startY: stove.y - STOVE_RADIUS,
        targetX: availableSlot.x,
        targetY: availableSlot.y,
        startTime: currentTime,
        duration: 1200,
        arcHeight: 100,
        score
      };
    }

    stove.ringActive = true;
    stove.ringStartTime = currentTime;

    stove.state = 'idle';
    stove.ingredient = null;
  }

  triggerComboEffect(currentTime: number) {
    this.comboActive = true;
    this.comboStartTime = currentTime;
    
    for (let i = 0; i < 100; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      switch (side) {
        case 0:
          x = Math.random() * this.width;
          y = -10;
          vx = (Math.random() - 0.5) * 2;
          vy = 2 + Math.random() * 3;
          break;
        case 1:
          x = this.width + 10;
          y = Math.random() * this.height;
          vx = -(2 + Math.random() * 3);
          vy = (Math.random() - 0.5) * 2;
          break;
        case 2:
          x = Math.random() * this.width;
          y = this.height + 10;
          vx = (Math.random() - 0.5) * 2;
          vy = -(2 + Math.random() * 3);
          break;
        default:
          x = -10;
          y = Math.random() * this.height;
          vx = 2 + Math.random() * 3;
          vy = (Math.random() - 0.5) * 2;
      }
      this.particles.push({
        x, y, vx, vy,
        life: 3000,
        maxLife: 3000,
        size: 4 + Math.random() * 4,
        color: '#FFD700',
        type: 'gold'
      });
    }
  }

  spawnFlameParticles(stove: Stove, currentTime: number) {
    if (stove.state !== 'cooking') return;

    const config = FIRE_CONFIG[stove.fireLevel];
    const spawnRate = config.particles / config.duration / 60;
    const maxParticlesPerStove = config.particles;
    
    const existingCount = this.particles.filter(
      p => p.type === 'flame' && p.stoveIndex === stove.index
    ).length;

    if (existingCount >= maxParticlesPerStove) return;
    if (Math.random() > spawnRate * 3) return;

    const baseColor = stove.fireLevel === 'gentle' 
      ? '#FF4500' 
      : stove.fireLevel === 'medium' 
        ? '#FFA500' 
        : '#FFFF99';
    
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const speed = stove.fireLevel === 'strong' ? 2.5 + Math.random() * 2 : 1.5 + Math.random() * 1.5;
    
    this.particles.push({
      x: stove.x + (Math.random() - 0.5) * 30,
      y: stove.y,
      vx: Math.cos(angle) * speed * 0.5,
      vy: Math.sin(angle) * speed,
      life: 800 + Math.random() * 400,
      maxLife: 1200,
      size: 4 + Math.random() * 6,
      color: baseColor,
      type: 'flame',
      stoveIndex: stove.index
    });

    if (stove.fireLevel === 'strong' && Math.random() < 0.3) {
      const sparkAngle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const sparkSpeed = 4 + Math.random() * 3;
      this.particles.push({
        x: stove.x + (Math.random() - 0.5) * 20,
        y: stove.y - 10,
        vx: Math.cos(sparkAngle) * sparkSpeed,
        vy: Math.sin(sparkAngle) * sparkSpeed,
        life: 600 + Math.random() * 400,
        maxLife: 1000,
        size: 2 + Math.random() * 3,
        color: '#FFFF00',
        type: 'spark',
        stoveIndex: stove.index
      });
    }

    if (Math.random() < 0.1) {
      this.particles.push({
        x: stove.x + (Math.random() - 0.5) * 40,
        y: stove.y - 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.8 - Math.random() * 0.8,
        life: 2000 + Math.random() * 1500,
        maxLife: 3500,
        size: 8 + Math.random() * 8,
        color: stove.fireLevel === 'strong' ? '#696969' : '#A9A9A9',
        type: 'smoke',
        stoveIndex: stove.index
      });
    }
  }

  updateParticles(deltaTime: number, currentTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime * 0.06;
      p.y += p.vy * deltaTime * 0.06;
      p.life -= deltaTime;

      if (p.type === 'flame' || p.type === 'smoke' || p.type === 'gold') {
        p.vy -= 0.02;
      }
      if (p.type === 'smoke') {
        p.vx += (Math.random() - 0.5) * 0.05;
        p.size += 0.02;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateStoves(currentTime: number, deltaTime: number) {
    for (let i = 0; i < this.stoves.length; i++) {
      const stove = this.stoves[i];

      if (stove.state === 'cooking') {
        stove.elapsedTime += deltaTime / 1000;
        if (stove.elapsedTime >= stove.maxCookTime) {
          stove.elapsedTime = stove.maxCookTime;
          this.completeCooking(i, currentTime);
        }
      }

      if (stove.warningActive) {
        const elapsed = currentTime - stove.warningStartTime;
        const cycleTime = 600;
        stove.warningCount = Math.floor(elapsed / cycleTime);
        if (stove.warningCount >= 3) {
          stove.warningActive = false;
        }
      }

      if (stove.ringActive) {
        const elapsed = currentTime - stove.ringStartTime;
        if (elapsed >= 800) {
          stove.ringActive = false;
        }
      }

      if (stove.flyingDish) {
        const fd = stove.flyingDish;
        const elapsed = currentTime - fd.startTime;
        if (elapsed >= fd.duration) {
          const slotIndex = this.plateSlots.findIndex(
            s => s.x === fd.targetX && s.y === fd.targetY
          );
          if (slotIndex >= 0) {
            this.completedDishes.push({
              ingredient: fd.ingredient,
              score: fd.score,
              x: fd.targetX,
              y: fd.targetY,
              placedTime: currentTime,
              plateIndex: slotIndex
            });
          }
          stove.flyingDish = null;
        }
      }

      this.spawnFlameParticles(stove, currentTime);
    }
  }

  updateDataPanel(currentTime: number) {
    if (currentTime - this.dataPanel.lastUpdate < 500) return;
    
    this.dataPanel.lastUpdate = currentTime;
    this.dataPanel.cookingCount = this.stoves.filter(s => s.state === 'cooking').length;
    
    const scores = this.completedDishes.map(d => d.score);
    if (scores.length > 0) {
      this.dataPanel.avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    
    this.dataPanel.highScoreStreak = this.highScoreStreak;
  }

  update(currentTime: number, deltaTime: number) {
    if (this.comboActive && currentTime - this.comboStartTime >= 3000) {
      this.comboActive = false;
    }

    this.scoreScaleCurrent += (this.scoreScaleTarget - this.scoreScaleCurrent) * 0.1;
    if (Math.abs(this.scoreScaleCurrent - this.scoreScaleTarget) < 0.01) {
      this.scoreScaleTarget = 1;
    }

    this.scorePopups = this.scorePopups.filter(p => currentTime - p.startTime < p.duration);

    this.updateStoves(currentTime, deltaTime);
    this.updateParticles(deltaTime, currentTime);
    this.updateDataPanel(currentTime);
  }
}
