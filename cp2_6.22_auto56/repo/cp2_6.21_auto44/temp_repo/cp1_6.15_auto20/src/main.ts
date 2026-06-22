import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GridManager, Stall, StallType, STALL_CONFIGS } from './gridManager';
import { EventSystem, GameEvent } from './eventSystem';

interface GameState {
  day: number;
  hour: number;
  money: number;
  speed: number;
  selectedStallType: StallType | null;
  selectedStall: Stall | null;
}

class Game {
  private app: HTMLElement;
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private gridManager: GridManager;
  private eventSystem: EventSystem;
  
  private state: GameState;
  private timeAccumulator: number;
  private lastFrameTime: number;
  private fps: number;
  private frameCount: number;
  private fpsUpdateTime: number;
  
  private hud!: {
    money: HTMLElement;
    day: HTMLElement;
    hour: HTMLElement;
    fps: HTMLElement;
  };
  
  private detailPanel!: HTMLElement;
  private eventBanner!: HTMLElement;
  private buildMenu!: HTMLElement;
  private emptyHint!: HTMLElement;
  
  private chartCanvas!: HTMLCanvasElement;
  private chartCtx!: CanvasRenderingContext2D;
  
  private hoveredCell: { x: number; z: number } | null = null;
  
  constructor() {
    this.app = document.getElementById('app')!;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    this.app.appendChild(this.canvas);
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xFFF8E7);
    this.scene.fog = new THREE.Fog(0xFFF8E7, 20, 40);
    
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 16;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      100
    );
    this.camera.position.set(12, 12, 12);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableRotate = true;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 2;
    this.controls.maxPolarAngle = Math.PI / 3;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.gridManager = new GridManager(this.scene);
    this.eventSystem = new EventSystem(this.gridManager);
    
    this.state = {
      day: 1,
      hour: 8,
      money: 2000,
      speed: 1,
      selectedStallType: null,
      selectedStall: null
    };
    
    this.timeAccumulator = 0;
    this.lastFrameTime = performance.now();
    this.fps = 60;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
    
    this.initLighting();
    this.initUI();
    this.initEventListeners();
    this.initEventSystemCallbacks();
    
    this.animate();
  }
  
  private initLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    this.scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x98FB98, 0.3);
    this.scene.add(hemisphereLight);
  }
  
  private initUI(): void {
    this.createHUD();
    this.createBuildMenu();
    this.createDetailPanel();
    this.createEventBanner();
    this.createEmptyHint();
    this.updateUI();
  }
  
  private createHUD(): void {
    const hud = document.createElement('div');
    hud.className = 'hud';
    
    const leftDiv = document.createElement('div');
    leftDiv.className = 'hud-left';
    
    const moneyCard = this.createHUDCard('💰', '资金', 'money');
    const dayCard = this.createHUDCard('📅', '第', 'day');
    const hourCard = this.createHUDCard('🕐', '时间', 'hour');
    const fpsCard = this.createHUDCard('⚡', 'FPS', 'fps');
    
    leftDiv.appendChild(moneyCard);
    leftDiv.appendChild(dayCard);
    leftDiv.appendChild(hourCard);
    leftDiv.appendChild(fpsCard);
    
    const rightDiv = document.createElement('div');
    rightDiv.className = 'hud-right';
    
    const speedControl = document.createElement('div');
    speedControl.className = 'speed-control';
    
    [1, 2, 4].forEach(speed => {
      const btn = document.createElement('button');
      btn.className = 'speed-btn' + (speed === 1 ? ' active' : '');
      btn.textContent = `${speed}x`;
      btn.onclick = () => this.setSpeed(speed);
      speedControl.appendChild(btn);
    });
    
    rightDiv.appendChild(speedControl);
    
    hud.appendChild(leftDiv);
    hud.appendChild(rightDiv);
    this.app.appendChild(hud);
    
    this.hud = {
      money: moneyCard.querySelector('.value') as HTMLElement,
      day: dayCard.querySelector('.value') as HTMLElement,
      hour: hourCard.querySelector('.value') as HTMLElement,
      fps: fpsCard.querySelector('.value') as HTMLElement
    };
  }
  
  private createHUDCard(icon: string, label: string, key: string): HTMLElement {
    const card = document.createElement('div');
    card.className = 'hud-card';
    card.innerHTML = `
      <span class="icon">${icon}</span>
      <div>
        <div class="label">${label}</div>
        <div class="value" data-key="${key}">-</div>
      </div>
    `;
    return card;
  }
  
  private createBuildMenu(): void {
    this.buildMenu = document.createElement('div');
    this.buildMenu.className = 'build-menu';
    
    (Object.keys(STALL_CONFIGS) as StallType[]).forEach(type => {
      const config = STALL_CONFIGS[type];
      const option = document.createElement('div');
      option.className = 'stall-option';
      option.dataset.type = type;
      option.innerHTML = `
        <span class="icon">${config.icon}</span>
        <span class="name">${config.name}</span>
        <span class="price">¥${config.price}</span>
      `;
      option.onclick = () => this.selectStallType(type);
      this.buildMenu.appendChild(option);
    });
    
    this.app.appendChild(this.buildMenu);
  }
  
  private createDetailPanel(): void {
    this.detailPanel = document.createElement('div');
    this.detailPanel.className = 'detail-panel';
    this.detailPanel.innerHTML = `
      <button class="close-btn">✕</button>
      <div class="panel-content"></div>
    `;
    
    const closeBtn = this.detailPanel.querySelector('.close-btn')!;
    closeBtn.addEventListener('click', () => this.closeDetailPanel());
    
    this.app.appendChild(this.detailPanel);
  }
  
  private createEventBanner(): void {
    this.eventBanner = document.createElement('div');
    this.eventBanner.className = 'event-banner';
    this.eventBanner.innerHTML = `
      <span class="icon"></span>
      <div class="content">
        <div class="title"></div>
        <div class="desc"></div>
      </div>
    `;
    this.app.appendChild(this.eventBanner);
  }
  
  private createEmptyHint(): void {
    this.emptyHint = document.createElement('div');
    this.emptyHint.className = 'empty-hint';
    this.emptyHint.innerHTML = `
      <div class="emoji">👆</div>
      <div class="text">选择下方摊位，点击空地建造</div>
    `;
    this.app.appendChild(this.emptyHint);
  }
  
  private initEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.state.selectedStallType = null;
        this.state.selectedStall = null;
        this.updateBuildMenuSelection();
        this.closeDetailPanel();
        this.gridManager.unhighlightAllCells();
        this.hoveredCell = null;
      }
    });
  }
  
  private initEventSystemCallbacks(): void {
    this.eventSystem.setOnEventTriggered((event) => {
      this.showEventBanner(event);
    });
    
    this.eventSystem.setOnEventEnded((event) => {
      console.log('Event ended:', event.name);
    });
  }
  
  private onWindowResize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 16;
    
    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  private onCanvasClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const stallMeshes: THREE.Object3D[] = [];
    this.gridManager.stalls.forEach(stall => {
      stall.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isStallPart) {
          stallMeshes.push(child);
        }
      });
    });
    
    const stallIntersects = this.raycaster.intersectObjects(stallMeshes);
    if (stallIntersects.length > 0) {
      let obj = stallIntersects[0].object;
      while (obj.parent && !obj.userData.stall) {
        obj = obj.parent;
      }
      if (obj.userData.stall) {
        this.selectStall(obj.userData.stall);
        return;
      }
    }
    
    if (this.state.selectedStallType) {
      const cellMeshes: THREE.Object3D[] = [];
      this.gridManager.gridHelper.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isCell) {
          cellMeshes.push(child);
        }
      });
      
      const cellIntersects = this.raycaster.intersectObjects(cellMeshes);
      if (cellIntersects.length > 0) {
        const cell = cellIntersects[0].object;
        const { gridX, gridZ } = cell.userData;
        
        if (this.gridManager.canBuild(gridX, gridZ)) {
          this.buildStall(this.state.selectedStallType, gridX, gridZ);
        }
      }
    }
  }
  
  private onCanvasMouseMove(event: MouseEvent): void {
    if (!this.state.selectedStallType) {
      if (this.hoveredCell) {
        this.gridManager.unhighlightCell(this.hoveredCell.x, this.hoveredCell.z);
        this.hoveredCell = null;
      }
      return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const cellMeshes: THREE.Object3D[] = [];
    this.gridManager.gridHelper.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isCell) {
        cellMeshes.push(child);
      }
    });
    
    const cellIntersects = this.raycaster.intersectObjects(cellMeshes);
    if (cellIntersects.length > 0) {
      const cell = cellIntersects[0].object;
      const { gridX, gridZ } = cell.userData;
      
      if (!this.hoveredCell || this.hoveredCell.x !== gridX || this.hoveredCell.z !== gridZ) {
        if (this.hoveredCell) {
          this.gridManager.unhighlightCell(this.hoveredCell.x, this.hoveredCell.z);
        }
        this.hoveredCell = { x: gridX, z: gridZ };
        this.gridManager.highlightCell(gridX, gridZ, this.gridManager.canBuild(gridX, gridZ));
      }
    } else if (this.hoveredCell) {
      this.gridManager.unhighlightCell(this.hoveredCell.x, this.hoveredCell.z);
      this.hoveredCell = null;
    }
  }
  
  private selectStallType(type: StallType): void {
    const config = STALL_CONFIGS[type];
    if (this.state.money < config.price) {
      return;
    }
    
    this.state.selectedStallType = this.state.selectedStallType === type ? null : type;
    this.state.selectedStall = null;
    this.updateBuildMenuSelection();
    this.closeDetailPanel();
    
    if (!this.state.selectedStallType && this.hoveredCell) {
      this.gridManager.unhighlightCell(this.hoveredCell.x, this.hoveredCell.z);
      this.hoveredCell = null;
    }
  }
  
  private updateBuildMenuSelection(): void {
    const options = this.buildMenu.querySelectorAll('.stall-option');
    options.forEach(option => {
      const type = (option as HTMLElement).dataset.type as StallType;
      const config = STALL_CONFIGS[type];
      
      option.classList.toggle('selected', this.state.selectedStallType === type);
      option.classList.toggle('disabled', this.state.money < config.price);
    });
    
    this.emptyHint.style.display = this.state.selectedStallType ? 'none' : 'block';
  }
  
  private buildStall(type: StallType, gridX: number, gridZ: number): void {
    const config = STALL_CONFIGS[type];
    if (this.state.money < config.price) return;
    
    const stall = this.gridManager.buildStall(type, gridX, gridZ, 'player');
    if (stall) {
      this.gridManager.setOwnerIndicator(stall);
      this.state.money -= config.price;
      this.gridManager.updatePathLines();
      this.gridManager.updateStallCompetition();
      this.updateUI();
      
      setTimeout(() => {
        this.gridManager.aiBuild();
        this.gridManager.aiBuild();
        this.gridManager.updatePathLines();
        this.gridManager.updateStallCompetition();
      }, 1500);
    }
  }
  
  private selectStall(stall: Stall): void {
    this.state.selectedStall = stall;
    this.state.selectedStallType = null;
    this.updateBuildMenuSelection();
    
    if (this.hoveredCell) {
      this.gridManager.unhighlightCell(this.hoveredCell.x, this.hoveredCell.z);
      this.hoveredCell = null;
    }
    
    this.showDetailPanel(stall);
  }
  
  private showDetailPanel(stall: Stall): void {
    const config = STALL_CONFIGS[stall.type];
    const content = this.detailPanel.querySelector('.panel-content')!;
    
    const stars = Math.round(stall.satisfaction * 5);
    const totalRevenue = stall.revenuePerHour.reduce((a, b) => a + b, 0);
    const avgRevenue = totalRevenue / Math.max(1, stall.revenuePerHour.filter(v => v > 0).length);
    
    content.innerHTML = `
      <div class="header">
        <span class="icon">${config.icon}</span>
        <div class="info">
          <div class="name">${config.name}</div>
          <div class="owner ${stall.owner}">${stall.owner === 'player' ? '👤 你的摊位' : '🤖 AI对手'}</div>
        </div>
      </div>
      
      <div class="stars">
        ${[1, 2, 3, 4, 5].map(i => `<span class="star ${i <= stars ? 'filled' : ''}">★</span>`).join('')}
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">当前客流</div>
          <div class="value">${stall.customers}</div>
        </div>
        <div class="stat-card">
          <div class="label">排队容量</div>
          <div class="value">${config.queueCapacity}</div>
        </div>
        <div class="stat-card">
          <div class="label">总营收</div>
          <div class="value">¥${Math.round(totalRevenue)}</div>
        </div>
        <div class="stat-card">
          <div class="label">平均/小时</div>
          <div class="value">¥${Math.round(avgRevenue)}</div>
        </div>
      </div>
      
      <div class="chart-container">
        <div class="title">📈 近24小时营收</div>
        <canvas width="300" height="120"></canvas>
      </div>
      
      <div class="attributes">
        <div class="attribute-row">
          <span class="label">🍽️ 口味评分</span>
          <div class="attribute-bar">
            <div class="fill" style="width: ${config.taste * 20}%"></div>
          </div>
        </div>
        <div class="attribute-row">
          <span class="label">😊 满意度</span>
          <div class="attribute-bar">
            <div class="fill" style="width: ${stall.satisfaction * 100}%"></div>
          </div>
        </div>
        <div class="attribute-row">
          <span class="label">💰 单价</span>
          <div class="attribute-bar">
            <div class="fill" style="width: ${Math.min(100, config.price / 10)}%"></div>
          </div>
        </div>
      </div>
    `;
    
    this.chartCanvas = content.querySelector('canvas')!;
    this.chartCtx = this.chartCanvas.getContext('2d')!;
    this.drawChart(stall.revenuePerHour);
    
    this.detailPanel.classList.add('open');
  }
  
  private drawChart(data: number[]): void {
    const ctx = this.chartCtx;
    const width = this.chartCanvas.width;
    const height = this.chartCanvas.height;
    const padding = { top: 10, right: 10, bottom: 20, left: 35 };
    
    ctx.clearRect(0, 0, width, height);
    
    const maxValue = Math.max(...data, 1);
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxValue * (1 - i / 4)).toString(), padding.left - 5, y + 3);
    }
    
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(255, 127, 80, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 127, 80, 0.0)');
    
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    
    data.forEach((value, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = padding.left + (chartWidth / (data.length - 1)) * (index - 1);
        const prevY = padding.top + chartHeight - (data[index - 1] / maxValue) * chartHeight;
        const cpx = (prevX + x) / 2;
        ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }
    });
    
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = padding.left + (chartWidth / (data.length - 1)) * (index - 1);
        const prevY = padding.top + chartHeight - (data[index - 1] / maxValue) * chartHeight;
        const cpx = (prevX + x) / 2;
        ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }
    });
    ctx.strokeStyle = '#FF7F50';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < data.length; i += 6) {
      const x = padding.left + (chartWidth / (data.length - 1)) * i;
      ctx.fillText(`${i}h`, x, height - 5);
    }
  }
  
  private closeDetailPanel(): void {
    this.detailPanel.classList.remove('open');
    this.state.selectedStall = null;
  }
  
  private showEventBanner(event: GameEvent): void {
    this.eventBanner.querySelector('.icon')!.textContent = event.icon;
    this.eventBanner.querySelector('.title')!.textContent = event.name;
    this.eventBanner.querySelector('.desc')!.textContent = event.description;
    this.eventBanner.style.background = event.color;
    this.eventBanner.classList.add('show');
    
    setTimeout(() => {
      this.eventBanner.classList.remove('show');
    }, 5000);
  }
  
  private setSpeed(speed: number): void {
    this.state.speed = speed;
    const buttons = this.app.querySelectorAll('.speed-btn');
    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', [1, 2, 4][i] === speed);
    });
  }
  
  private updateUI(): void {
    this.hud.money.textContent = `¥${this.state.money.toLocaleString()}`;
    this.hud.day.textContent = `${this.state.day}天`;
    this.hud.hour.textContent = `${String(this.state.hour).padStart(2, '0')}:00`;
    this.hud.fps.textContent = `${this.fps}`;
    
    this.updateBuildMenuSelection();
    
    if (this.state.selectedStall && this.chartCtx) {
      const stall = this.gridManager.stalls.find(s => s.id === this.state.selectedStall!.id);
      if (stall) {
        this.drawChart(stall.revenuePerHour);
        const fillBars = this.detailPanel.querySelectorAll('.attribute-bar .fill');
        if (fillBars[1]) {
          fillBars[1].setAttribute('style', `width: ${stall.satisfaction * 100}%`);
        }
        const statValues = this.detailPanel.querySelectorAll('.stat-card .value');
        if (statValues[0]) statValues[0].textContent = `${stall.customers}`;
        if (statValues[2]) {
          const total = stall.revenuePerHour.reduce((a, b) => a + b, 0);
          statValues[2].textContent = `¥${Math.round(total)}`;
        }
      }
    }
  }
  
  private updateGameLogic(deltaTime: number): void {
    const scaledDelta = deltaTime * this.state.speed;
    
    this.timeAccumulator += scaledDelta;
    const hourDuration = 5;
    
    if (this.timeAccumulator >= hourDuration) {
      this.timeAccumulator -= hourDuration;
      this.state.hour++;
      
      if (this.state.hour >= 24) {
        this.state.hour = 0;
        this.state.day++;
        this.onNewDay();
      }
      
      this.gridManager.resetHourRevenue();
      this.gridManager.updateStallCompetition();
    }
    
    if (Math.random() < 0.02 * this.state.speed) {
      this.trySpawnCustomer();
    }
    
    if (this.state.hour >= 8 && this.state.hour <= 22) {
      if (Math.random() < 0.05 * this.state.speed) {
        this.trySpawnCustomer();
      }
    }
    
    this.gridManager.stalls.forEach(stall => {
      if (stall.customers > 0 && Math.random() < 0.01 * this.state.speed) {
        stall.customers = Math.max(0, stall.customers - 1);
        const revenue = this.gridManager.calculateRevenue(stall) * this.eventSystem.getRevenueModifier(stall);
        if (stall.owner === 'player') {
          this.state.money += revenue;
        }
      }
    });
    
    this.gridManager.update(scaledDelta);
  }
  
  private trySpawnCustomer(): void {
    if (this.gridManager.stalls.length === 0) return;
    
    const availableStalls = this.gridManager.stalls.filter(stall => 
      stall.customers < STALL_CONFIGS[stall.type].queueCapacity
    );
    
    if (availableStalls.length === 0) return;
    
    const targetStall = availableStalls[Math.floor(Math.random() * availableStalls.length)];
    const modifier = this.eventSystem.getCustomerModifier(targetStall);
    
    if (Math.random() < modifier) {
      const fromStall = Math.random() < 0.3 && this.gridManager.stalls.length > 1
        ? this.gridManager.stalls[Math.floor(Math.random() * this.gridManager.stalls.length)]
        : null;
      
      if (fromStall?.id === targetStall.id) return;
      
      this.gridManager.spawnCustomer(fromStall, targetStall);
    }
  }
  
  private onNewDay(): void {
    this.eventSystem.onNewDay();
    this.eventSystem.generateRandomEvent();
    
    if (Math.random() < 0.3 && this.gridManager.stalls.length < 20) {
      const aiStall = this.gridManager.aiBuild();
      if (aiStall) {
        this.gridManager.setOwnerIndicator(aiStall);
        this.gridManager.updatePathLines();
        this.gridManager.updateStallCompetition();
      }
    }
  }
  
  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;
    
    this.frameCount++;
    this.fpsUpdateTime += deltaTime;
    if (this.fpsUpdateTime >= 1) {
      this.fps = Math.round(this.frameCount / this.fpsUpdateTime);
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
    }
    
    this.updateGameLogic(deltaTime);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.updateUI();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
