import { Camel } from './camel.ts';
import { EventSystem, GameEvent, EventEffect } from './event.ts';
import { GameMap, MapPoint, Town } from './map.ts';

interface GameState {
  water: number;
  maxWater: number;
  food: number;
  maxFood: number;
  morale: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  totalDistanceTraveled: number;
  startTime: number;
  elapsedTime: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: GameMap;
  private camels: Camel[];
  private eventSystem: EventSystem;
  private gameState: GameState;
  private lastTime: number;
  private animationFrameId: number | null;
  private distanceSinceLastEvent: number;
  private eventDistanceThreshold: number;

  private scale: number;
  private offsetX: number;
  private offsetY: number;
  private targetScale: number;
  private minScale: number;
  private maxScale: number;

  private isDragging: boolean;
  private lastMouseX: number;
  private lastMouseY: number;
  private dragOffsetX: number;
  private dragOffsetY: number;

  private isPausedForEvent: boolean;
  private eventTimeout: number | null;

  private lastFrameTime: number;
  private frameCount: number;
  private fps: number;

  private tentActive: boolean;
  private tentPosition: { x: number; y: number } | null;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.map = new GameMap(1600, 1200);
    this.camels = [];
    this.eventSystem = new EventSystem();

    this.gameState = {
      water: 100,
      maxWater: 100,
      food: 100,
      maxFood: 100,
      morale: 80,
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      totalDistanceTraveled: 0,
      startTime: 0,
      elapsedTime: 0
    };

    this.lastTime = 0;
    this.animationFrameId = null;
    this.distanceSinceLastEvent = 0;
    this.eventDistanceThreshold = 50;

    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.targetScale = 1;
    this.minScale = 0.8;
    this.maxScale = 1.5;

    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.isPausedForEvent = false;
    this.eventTimeout = null;

    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fps = 60;

    this.tentActive = false;
    this.tentPosition = null;

    this.initialize();
  }

  private initialize(): void {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

    document.getElementById('start-btn')?.addEventListener('click', () => this.startGame());
    document.getElementById('restart-btn')?.addEventListener('click', () => this.restartGame());

    this.eventSystem.setOnChoiceCallback((effect) => this.handleEventEffect(effect));

    this.centerOnStartPosition();
  }

  private resizeCanvas(): void {
    const container = document.getElementById('game-container');
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    }
  }

  private centerOnStartPosition(): void {
    const town = this.map.getTowns()[0];
    if (town) {
      this.offsetX = this.canvas.width / 2 / this.scale - town.x;
      this.offsetY = this.canvas.height / 2 / this.scale - town.y;
    }
  }

  private initializeCamels(): void {
    const startTown = this.map.getTowns()[0];
    if (!startTown) return;

    const camelCount = 7;
    this.camels = [];

    const rows = 3;
    const cols = 3;
    const spacingX = 35;
    const spacingY = 28;
    const startX = startTown.x - ((cols - 1) * spacingX) / 2;
    const startY = startTown.y + 50;

    let index = 0;
    for (let row = 0; row < rows && index < camelCount; row++) {
      for (let col = 0; col < cols && index < camelCount; col++) {
        const offsetX = col * spacingX + (row % 2 === 0 ? 0 : spacingX / 2);
        const offsetY = row * spacingY;
        const camel = new Camel(
          index,
          startX + offsetX,
          startY + offsetY
        );
        this.camels.push(camel);
        index++;
      }
    }
  }

  private startGame(): void {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
      startScreen.classList.add('hidden');
    }

    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.gameState.isGameOver = false;
    this.gameState.totalDistanceTraveled = 0;
    this.gameState.startTime = Date.now();
    this.gameState.elapsedTime = 0;
    this.gameState.water = 100;
    this.gameState.food = 100;
    this.gameState.morale = 80;

    this.distanceSinceLastEvent = 0;
    this.tentActive = false;
    this.tentPosition = null;

    this.map.reset();
    this.initializeCamels();
    this.centerOnStartPosition();
    this.updateStatusUI();

    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);

    console.log('🐫 商队出发了！祝旅途顺利...');
  }

  private restartGame(): void {
    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) {
      resultScreen.classList.remove('visible');
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.startGame();
  }

  private gameLoop(currentTime: number): void {
    if (!this.gameState.isPlaying) return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.frameCount++;
    if (currentTime - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
    }

    if (!this.gameState.isPaused && !this.isPausedForEvent && !this.tentActive) {
      this.update(deltaTime);
    }

    this.eventSystem.update(deltaTime);
    this.updateEventTimerUI();

    this.render();

    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(deltaTime: number): void {
    this.gameState.elapsedTime = (Date.now() - this.gameState.startTime) / 1000;

    this.map.update(deltaTime, this.camels);

    let anyMoving = false;
    let totalDistance = 0;

    const waterConsumption = 0.02 * deltaTime;
    const staminaConsumption = 0.05 * deltaTime;

    const lowWaterPenalty = this.gameState.water < 20 ? 0.7 : 1;
    const inSandstormPenalty = this.isCaravanInSandstorm() ? 0.5 : 1;
    const speedMultiplier = lowWaterPenalty * inSandstormPenalty;

    for (const camel of this.camels) {
      if (camel.state.isAlive) {
        camel.setSpeedMultiplier(speedMultiplier);
        const moved = camel.update(deltaTime, waterConsumption, staminaConsumption);
        if (moved) {
          anyMoving = true;
          totalDistance += camel.getSpeed() * deltaTime * 60;
        }
      }
    }

    if (anyMoving) {
      const avgDistance = totalDistance / this.getAliveCamelCount();
      this.gameState.totalDistanceTraveled += avgDistance;
      this.distanceSinceLastEvent += avgDistance;

      const consumptionRate = 0.03 * deltaTime * this.getAliveCamelCount() * 0.3;
      this.gameState.water = Math.max(0, this.gameState.water - consumptionRate);
      this.gameState.food = Math.max(0, this.gameState.food - consumptionRate * 0.8);

      if (this.distanceSinceLastEvent >= this.eventDistanceThreshold) {
        this.distanceSinceLastEvent = 0;
        this.triggerRandomEvent();
      }

      this.followCamels();
    }

    this.checkTownArrival();
    this.checkOasisBonus();
    this.checkGameOver();

    if (this.gameState.water < 20 && Math.random() < 0.01) {
      console.log('🐫 骆驼发出疲惫的低鸣声... 水快不够了');
    }

    this.updateStatusUI();
  }

  private getAliveCamelCount(): number {
    return this.camels.filter(c => c.state.isAlive).length;
  }

  private isCaravanInSandstorm(): boolean {
    if (this.camels.length === 0) return false;
    const avgX = this.camels.reduce((sum, c) => sum + c.state.x, 0) / this.camels.length;
    const avgY = this.camels.reduce((sum, c) => sum + c.state.y, 0) / this.camels.length;
    return this.map.checkSandstormCollision(avgX, avgY);
  }

  private followCamels(): void {
    const aliveCamels = this.camels.filter(c => c.state.isAlive);
    if (aliveCamels.length === 0) return;

    const avgX = aliveCamels.reduce((sum, c) => sum + c.state.x, 0) / aliveCamels.length;
    const avgY = aliveCamels.reduce((sum, c) => sum + c.state.y, 0) / aliveCamels.length;

    const targetOffsetX = this.canvas.width / 2 / this.scale - avgX;
    const targetOffsetY = this.canvas.height / 2 / this.scale - avgY;

    this.offsetX += (targetOffsetX - this.offsetX) * 0.05;
    this.offsetY += (targetOffsetY - this.offsetY) * 0.05;
  }

  private checkTownArrival(): void {
    const aliveCamels = this.camels.filter(c => c.state.isAlive);
    if (aliveCamels.length === 0) return;

    const avgX = aliveCamels.reduce((sum, c) => sum + c.state.x, 0) / aliveCamels.length;
    const avgY = aliveCamels.reduce((sum, c) => sum + c.state.y, 0) / aliveCamels.length;

    const town = this.map.checkTownCollision(avgX, avgY);
    if (town && !town.visited) {
      this.map.visitTown(town);
      this.gameState.water = Math.min(this.gameState.maxWater, this.gameState.water + 30);
      this.gameState.food = Math.min(this.gameState.maxFood, this.gameState.food + 25);
      this.gameState.morale = Math.min(100, this.gameState.morale + 15);

      for (const camel of this.camels) {
        if (camel.state.isAlive) {
          camel.drinkWater(20);
          camel.rest(30);
        }
      }

      console.log(`🏙️ 抵达城镇: ${town.name}！补给了水和食物。`);
      this.map.addScreenShake(0.3);

      this.stopAllCamels();

      if (this.map.getVisitedTownCount() >= this.map.getTowns().length) {
        this.endGame(true);
      }
    }
  }

  private checkOasisBonus(): void {
    const aliveCamels = this.camels.filter(c => c.state.isAlive);
    if (aliveCamels.length === 0) return;

    const avgX = aliveCamels.reduce((sum, c) => sum + c.state.x, 0) / aliveCamels.length;
    const avgY = aliveCamels.reduce((sum, c) => sum + c.state.y, 0) / aliveCamels.length;

    const oasis = this.map.checkOasisCollision(avgX, avgY, 20);
    if (oasis) {
      if (Math.random() < 0.02) {
        this.gameState.water = Math.min(this.gameState.maxWater, this.gameState.water + 5);
        for (const camel of this.camels) {
          if (camel.state.isAlive) {
            camel.drinkWater(3);
          }
        }
      }
    }
  }

  private checkGameOver(): void {
    const aliveCamels = this.camels.filter(c => c.state.isAlive);
    if (aliveCamels.length === 0) {
      this.endGame(false);
      return;
    }

    if (this.gameState.water <= 0 && this.gameState.food <= 0) {
      this.gameState.morale -= 0.1;
      if (this.gameState.morale <= 0) {
        this.endGame(false);
      }
    }
  }

  private endGame(victory: boolean): void {
    this.gameState.isPlaying = false;
    this.gameState.isGameOver = true;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) {
      resultScreen.classList.add('visible');
    }

    const score = this.calculateScore(victory);
    this.displayResult(score, victory);
  }

  private calculateScore(victory: boolean): number {
    if (!victory) return 0;

    let score = 0;

    const aliveRatio = this.getAliveCamelCount() / this.camels.length;
    score += aliveRatio * 40;

    score += this.gameState.water * 0.2;
    score += this.gameState.food * 0.15;

    const timeBonus = Math.max(0, 600 - this.gameState.elapsedTime);
    score += timeBonus * 0.05;

    score += this.gameState.morale * 0.1;

    return Math.round(score);
  }

  private displayResult(score: number, victory: boolean): void {
    const gradeElement = document.getElementById('result-grade');
    const scoreElement = document.getElementById('result-score');
    const detailsElement = document.getElementById('result-details');

    if (!victory) {
      if (gradeElement) gradeElement.textContent = '失败';
      if (scoreElement) scoreElement.textContent = '商队覆灭...';
      if (detailsElement) {
        detailsElement.innerHTML = `
          <div>存活骆驼: 0 峰</div>
          <div>旅程时间: ${Math.floor(this.gameState.elapsedTime / 60)}分${Math.floor(this.gameState.elapsedTime % 60)}秒</div>
        `;
      }
      return;
    }

    let grade = 'D';
    if (score >= 90) grade = 'S';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';

    if (gradeElement) gradeElement.textContent = grade;
    if (scoreElement) scoreElement.textContent = `得分: ${score}`;
    if (detailsElement) {
      detailsElement.innerHTML = `
        <div>存活骆驼: ${this.getAliveCamelCount()} 峰</div>
        <div>剩余水: ${Math.round(this.gameState.water)}%</div>
        <div>剩余粮: ${Math.round(this.gameState.food)}%</div>
        <div>旅程时间: ${Math.floor(this.gameState.elapsedTime / 60)}分${Math.floor(this.gameState.elapsedTime % 60)}秒</div>
      `;
    }
  }

  private triggerRandomEvent(): void {
    const event = this.eventSystem.triggerRandomEvent();
    if (event) {
      this.isPausedForEvent = true;
      this.stopAllCamels();
      this.showEventPopup(event);
    }
  }

  private showEventPopup(event: GameEvent): void {
    const popup = document.getElementById('event-popup');
    const title = document.getElementById('event-title');
    const desc = document.getElementById('event-desc');
    const buttons = document.getElementById('event-buttons');

    if (popup && title && desc && buttons) {
      title.textContent = event.title;
      desc.textContent = event.description;

      buttons.innerHTML = '';
      event.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'event-btn';
        btn.textContent = choice.text;
        btn.addEventListener('click', () => this.handleEventChoice(index));
        buttons.appendChild(btn);
      });

      popup.classList.add('visible');
    }
  }

  private hideEventPopup(): void {
    const popup = document.getElementById('event-popup');
    if (popup) {
      popup.classList.remove('visible');
    }
  }

  private handleEventChoice(index: number): void {
    const effect = this.eventSystem.makeChoice(index);
    if (effect) {
      this.handleEventEffect(effect);
    }
    this.hideEventPopup();
    this.isPausedForEvent = false;
  }

  private handleEventEffect(effect: EventEffect): void {
    if (effect.water !== undefined) {
      this.gameState.water = Math.max(0, Math.min(this.gameState.maxWater, this.gameState.water + effect.water));
    }

    if (effect.food !== undefined) {
      this.gameState.food = Math.max(0, Math.min(this.gameState.maxFood, this.gameState.food + effect.food));
    }

    if (effect.morale !== undefined) {
      this.gameState.morale = Math.max(0, Math.min(100, this.gameState.morale + effect.morale));
    }

    if (effect.camelDamage !== undefined) {
      const aliveCamels = this.camels.filter(c => c.state.isAlive);
      if (aliveCamels.length > 0) {
        const targetCamel = aliveCamels[Math.floor(Math.random() * aliveCamels.length)];
        targetCamel.takeDamage(effect.camelDamage);
        if (!targetCamel.state.isAlive) {
          console.log(`💀 一峰骆驼倒下了...`);
          this.redistributeLoad(targetCamel);
        }
      }
    }

    if (effect.camelHeal !== undefined) {
      for (const camel of this.camels) {
        if (camel.state.isAlive) {
          camel.state.stamina = Math.min(camel.state.maxStamina, camel.state.stamina + effect.camelHeal);
        }
      }
    }

    if (effect.stopMovement) {
      this.tentActive = true;
      const aliveCamels = this.camels.filter(c => c.state.isAlive);
      if (aliveCamels.length > 0) {
        const avgX = aliveCamels.reduce((sum, c) => sum + c.state.x, 0) / aliveCamels.length;
        const avgY = aliveCamels.reduce((sum, c) => sum + c.state.y, 0) / aliveCamels.length;
        this.tentPosition = { x: avgX, y: avgY };
      }
      this.stopAllCamels();

      setTimeout(() => {
        this.tentActive = false;
        this.tentPosition = null;
      }, 3000);
    }

    if (effect.message) {
      console.log(`📜 ${effect.message}`);
    }

    this.map.addScreenShake(0.2);
    this.updateStatusUI();
  }

  private redistributeLoad(deadCamel: Camel): void {
    const loadToDistribute = deadCamel.state.load;
    const aliveCamels = this.camels.filter(c => c.state.isAlive);

    if (aliveCamels.length === 0) return;

    const loadPerCamel = loadToDistribute / aliveCamels.length;
    for (const camel of aliveCamels) {
      camel.addLoad(loadPerCamel);
    }
  }

  private updateEventTimerUI(): void {
    const timeElement = document.getElementById('event-time');
    if (timeElement && this.eventSystem.isEventActive()) {
      timeElement.textContent = Math.ceil(this.eventSystem.getEventTimer()).toString();
    }
  }

  private updateStatusUI(): void {
    const waterBar = document.getElementById('water-bar');
    const waterText = document.getElementById('water-text');
    const foodBar = document.getElementById('food-bar');
    const foodText = document.getElementById('food-text');
    const moraleFace = document.getElementById('morale-face');
    const camelCount = document.getElementById('camel-count');

    if (waterBar) waterBar.style.width = `${this.gameState.water}%`;
    if (waterText) waterText.textContent = `${Math.round(this.gameState.water)}%`;

    if (foodBar) foodBar.style.width = `${this.gameState.food}%`;
    if (foodText) foodText.textContent = `${Math.round(this.gameState.food)}%`;

    if (moraleFace) {
      if (this.gameState.morale >= 70) {
        moraleFace.textContent = '😊';
      } else if (this.gameState.morale >= 40) {
        moraleFace.textContent = '😐';
      } else {
        moraleFace.textContent = '😟';
      }
    }

    if (camelCount) {
      camelCount.textContent = this.getAliveCamelCount().toString();
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.map.render(this.ctx, this.camels, this.scale, this.offsetX * this.scale, this.offsetY * this.scale);

    if (this.tentActive && this.tentPosition) {
      this.drawTent(this.tentPosition.x, this.tentPosition.y);
    }
  }

  private drawTent(x: number, y: number): void {
    this.ctx.save();
    this.ctx.translate(this.offsetX * this.scale + x * this.scale, this.offsetY * this.scale + y * this.scale);
    this.ctx.scale(this.scale, this.scale);

    const windOffset = Math.sin(Date.now() * 0.005) * 3;

    this.ctx.fillStyle = '#C19A6B';
    this.ctx.strokeStyle = '#8B7355';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(-30, 20);
    this.ctx.quadraticCurveTo(windOffset, -40, 30, 20);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#8B7355';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -35);
    this.ctx.lineTo(5, -45);
    this.ctx.lineTo(-5, -45);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#5D4037';
    this.ctx.beginPath();
    this.ctx.moveTo(-8, 20);
    this.ctx.lineTo(0, -10);
    this.ctx.lineTo(8, 20);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  private stopAllCamels(): void {
    for (const camel of this.camels) {
      camel.stop();
    }
  }

  private handleClick(e: MouseEvent): void {
    if (!this.gameState.isPlaying || this.gameState.isPaused || this.isPausedForEvent || this.tentActive) return;
    if (this.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / this.scale - this.offsetX;
    const mouseY = (e.clientY - rect.top) / this.scale - this.offsetY;

    this.moveCaravanTo(mouseX, mouseY);
  }

  private moveCaravanTo(targetX: number, targetY: number): void {
    const aliveCamels = this.camels.filter(c => c.state.isAlive);
    if (aliveCamels.length === 0) return;

    const avgX = aliveCamels.reduce((sum, c) => sum + c.state.x, 0) / aliveCamels.length;
    const avgY = aliveCamels.reduce((sum, c) => sum + c.state.y, 0) / aliveCamels.length;

    const path = this.map.findPath(avgX, avgY, targetX, targetY);
    this.map.setPath(path);

    this.moveCamelsAlongPath();
  }

  private moveCamelsAlongPath(): void {
    const nextPoint = this.map.getNextPathPoint();
    if (!nextPoint) return;

    const aliveCamels = this.camels.filter(c => c.state.isAlive);
    if (aliveCamels.length === 0) return;

    for (let i = 0; i < aliveCamels.length; i++) {
      const camel = aliveCamels[i];
      const offsetAngle = (i / aliveCamels.length) * Math.PI * 2;
      const offsetRadius = 15;
      const offsetX = Math.cos(offsetAngle) * offsetRadius;
      const offsetY = Math.sin(offsetAngle) * offsetRadius;

      camel.setTarget(nextPoint.x + offsetX, nextPoint.y + offsetY);
    }

    const checkArrival = setInterval(() => {
      if (!this.gameState.isPlaying) {
        clearInterval(checkArrival);
        return;
      }

      const allArrived = aliveCamels.every(c => !c.isMovingState());
      if (allArrived) {
        clearInterval(checkArrival);
        this.map.advancePath();

        if (!this.map.isPathComplete()) {
          this.moveCamelsAlongPath();
        }
      }
    }, 100);
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = false;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.dragOffsetX = this.offsetX;
    this.dragOffsetY = this.offsetY;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (e.buttons !== 1) return;

    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      this.isDragging = true;
    }

    if (this.isDragging) {
      this.offsetX = this.dragOffsetX + dx / this.scale;
      this.offsetY = this.dragOffsetY + dy / this.scale;
    }
  }

  private handleMouseUp(): void {
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    const zoomSpeed = 0.1;
    if (e.deltaY > 0) {
      this.targetScale = Math.max(this.minScale, this.targetScale - zoomSpeed);
    } else {
      this.targetScale = Math.min(this.maxScale, this.targetScale + zoomSpeed);
    }

    this.scale += (this.targetScale - this.scale) * 0.2;
  }

  private touchStartDistance: number = 0;
  private initialScale: number = 1;

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1) {
      this.isDragging = false;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      this.dragOffsetX = this.offsetX;
      this.dragOffsetY = this.offsetY;
    } else if (e.touches.length === 2) {
      this.touchStartDistance = this.getTouchDistance(e.touches);
      this.initialScale = this.scale;
      this.targetScale = this.scale;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        this.offsetX = this.dragOffsetX + dx / this.scale;
        this.offsetY = this.dragOffsetY + dy / this.scale;
      }
    } else if (e.touches.length === 2) {
      const distance = this.getTouchDistance(e.touches);
      const scaleFactor = distance / this.touchStartDistance;
      this.targetScale = Math.max(this.minScale, Math.min(this.maxScale, this.initialScale * scaleFactor));
      this.scale += (this.targetScale - this.scale) * 0.3;
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.changedTouches.length === 1 && !this.isDragging) {
      const touch = e.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (touch.clientX - rect.left) / this.scale - this.offsetX;
      const mouseY = (touch.clientY - rect.top) / this.scale - this.offsetY;

      if (this.gameState.isPlaying && !this.gameState.isPaused && !this.isPausedForEvent && !this.tentActive) {
        this.moveCaravanTo(mouseX, mouseY);
      }
    }

    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public getFPS(): number {
    return this.fps;
  }
}

const game = new Game();
