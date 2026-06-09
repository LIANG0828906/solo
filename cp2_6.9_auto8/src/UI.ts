import * as THREE from 'three';
import { CollisionSimulator, SimulatorState } from './CollisionSimulator';

export interface UIParams {
  simulator: CollisionSimulator;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  onStartStop: () => void;
  onReset: () => void;
}

interface SliderAnimation {
  element: HTMLInputElement;
  startValue: number;
  endValue: number;
  startTime: number;
  duration: number;
}

export class UI {
  private simulator: CollisionSimulator;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private onStartStop: () => void;
  private onReset: () => void;
  
  private panel: HTMLElement;
  private handle1: HTMLElement;
  private handle2: HTMLElement;
  private arrow1: HTMLElement;
  private arrow2: HTMLElement;
  private lockLabel1: HTMLElement;
  private lockLabel2: HTMLElement;
  private velocitySlider1: HTMLInputElement;
  private velocitySlider2: HTMLInputElement;
  private startButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private fpsDisplay: HTMLElement;
  private timeDisplay: HTMLElement;
  private particleCountDisplay: HTMLElement;
  private stageDisplay: HTMLElement;
  private velocityValue1: HTMLElement;
  private velocityValue2: HTMLElement;
  
  private dragging: { handle: number; isArrow: boolean } | null = null;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private sliderAnimations: SliderAnimation[] = [];
  
  private galaxy1Velocity: THREE.Vector3 = new THREE.Vector3(1, 0, 0.5);
  private galaxy2Velocity: THREE.Vector3 = new THREE.Vector3(-1, 0, -0.5);
  private velocityMagnitude1: number = 2;
  private velocityMagnitude2: number = 2;

  constructor(params: UIParams) {
    this.simulator = params.simulator;
    this.camera = params.camera;
    this.renderer = params.renderer;
    this.onStartStop = params.onStartStop;
    this.onReset = params.onReset;
    
    this.panel = this.createPanel();
    this.handle1 = this.createHandle(1);
    this.handle2 = this.createHandle(2);
    this.arrow1 = this.createArrow(1);
    this.arrow2 = this.createArrow(2);
    this.lockLabel1 = this.createLockLabel(this.handle1);
    this.lockLabel2 = this.createLockLabel(this.handle2);
    
    this.velocitySlider1 = this.panel.querySelector('#velocity1') as HTMLInputElement;
    this.velocitySlider2 = this.panel.querySelector('#velocity2') as HTMLInputElement;
    this.startButton = this.panel.querySelector('#startButton') as HTMLButtonElement;
    this.resetButton = this.panel.querySelector('#resetButton') as HTMLButtonElement;
    this.fpsDisplay = this.panel.querySelector('#fps') as HTMLElement;
    this.timeDisplay = this.panel.querySelector('#time') as HTMLElement;
    this.particleCountDisplay = this.panel.querySelector('#particles') as HTMLElement;
    this.stageDisplay = this.panel.querySelector('#stage') as HTMLElement;
    this.velocityValue1 = this.panel.querySelector('#velocityValue1') as HTMLElement;
    this.velocityValue2 = this.panel.querySelector('#velocityValue2') as HTMLElement;
    
    this.bindEvents();
    this.updateHandlePositions();
    this.updateArrowRotations();
    
    setTimeout(() => {
      this.handle1.style.opacity = '1';
      this.handle2.style.opacity = '1';
    }, 100);
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'control-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 280px;
      background-color: #1a1a2ecc;
      border-radius: 8px;
      padding: 12px;
      color: #ffffff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      z-index: 1000;
    `;
    
    panel.innerHTML = `
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #ffaa00; text-align: center;">星系碰撞模拟器</h3>
      
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>帧率:</span>
          <span id="fps">60 FPS</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>模拟时间:</span>
          <span id="time">0.00s</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>粒子数量:</span>
          <span id="particles">0</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>碰撞阶段:</span>
          <span id="stage">待机</span>
        </div>
      </div>
      
      <hr style="border: none; border-top: 1px solid #333344; margin: 12px 0;">
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px;">星系1质量: <span id="mass1Value">5.0</span></label>
        <input type="range" id="mass1" min="1" max="10" step="0.5" value="5" 
               style="width: 100%; accent-color: #ffaa00;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px;">星系2质量: <span id="mass2Value">3.0</span></label>
        <input type="range" id="mass2" min="1" max="10" step="0.5" value="3" 
               style="width: 100%; accent-color: #ffaa00;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px;">引力常数 G: <span id="gValue">0.05</span></label>
        <input type="range" id="g" min="0.01" max="0.1" step="0.005" value="0.05" 
               style="width: 100%; accent-color: #ffaa00;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px;">模拟速度: <span id="speedValue">1.0</span>x</label>
        <input type="range" id="speed" min="0.1" max="2" step="0.1" value="1" 
               style="width: 100%; accent-color: #ffaa00;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px;">粒子大小: <span id="sizeValue">0.08</span></label>
        <input type="range" id="size" min="0.05" max="0.2" step="0.01" value="0.08" 
               style="width: 100%; accent-color: #ffaa00;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px;">星系1速度: <span id="velocityValue1">2.00</span></label>
        <input type="range" id="velocity1" min="0" max="5" step="0.1" value="2" 
               style="width: 100%; accent-color: #ffaa00;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 6px;">星系2速度: <span id="velocityValue2">2.00</span></label>
        <input type="range" id="velocity2" min="0" max="5" step="0.1" value="2" 
               style="width: 100%; accent-color: #ffaa00;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="showTrails" 
                 style="margin-right: 8px; accent-color: #ffaa00;">
          <span>显示粒子轨迹</span>
        </label>
      </div>
      
      <hr style="border: none; border-top: 1px solid #333344; margin: 12px 0;">
      
      <div style="display: flex; gap: 8px;">
        <button id="startButton" 
                style="flex: 1; padding: 10px; background: linear-gradient(135deg, #ff6b35, #f7931e); 
                       border: none; border-radius: 6px; color: white; font-weight: bold; 
                       cursor: pointer; transition: all 0.2s; font-size: 14px;">
          开始模拟
        </button>
        <button id="resetButton" 
                style="flex: 1; padding: 10px; background: #333344; 
                       border: none; border-radius: 6px; color: white; font-weight: bold; 
                       cursor: pointer; transition: all 0.2s; font-size: 14px;">
          重置
        </button>
      </div>
      
      <div style="margin-top: 12px; font-size: 11px; color: #8888aa;">
        <p style="margin: 4px 0;">• 拖拽圆环移动星系位置</p>
        <p style="margin: 4px 0;">• 拖拽箭头调整速度方向</p>
        <p style="margin: 4px 0;">• 距离 < 1.5 时触发引力锁定</p>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    this.addSliderStyles();
    this.addButtonStyles();
    
    return panel;
  }

  private addSliderStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: #333344;
        border-radius: 3px;
        outline: none;
        transition: all 0.2s;
      }
      
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #ffaa00;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.15s ease-out;
        box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
      }
      
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 15px rgba(255, 170, 0, 0.8);
      }
      
      input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #ffaa00;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: all 0.15s ease-out;
        box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
      }
      
      input[type="range"]:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      input[type="range"]:disabled::-webkit-slider-thumb {
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  private addButtonStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #startButton:hover {
        filter: brightness(1.2);
        box-shadow: 0 0 20px rgba(255, 107, 53, 0.4);
      }
      
      #resetButton:hover {
        background: #444455;
        box-shadow: 0 0 15px rgba(100, 100, 150, 0.4);
      }
      
      #startButton:disabled, #resetButton:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  private createHandle(galaxyNumber: number): HTMLElement {
    const handle = document.createElement('div');
    handle.className = 'galaxy-handle';
    handle.dataset.galaxy = galaxyNumber.toString();
    
    const color = galaxyNumber === 1 ? '#ffdd55' : '#4488ff';
    
    handle.style.cssText = `
      position: absolute;
      width: 60px;
      height: 60px;
      border: 3px solid ${color};
      border-radius: 50%;
      background: radial-gradient(circle, ${color}33 0%, transparent 70%);
      cursor: move;
      transition: all 0.3s ease-out;
      opacity: 0;
      z-index: 100;
      pointer-events: auto;
      box-shadow: 0 0 20px ${color}66;
    `;
    
    handle.innerHTML = `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  width: 8px; height: 8px; background: ${color}; border-radius: 50%;"></div>
    `;
    
    document.body.appendChild(handle);
    return handle;
  }

  private createArrow(galaxyNumber: number): HTMLElement {
    const arrow = document.createElement('div');
    arrow.className = 'velocity-arrow';
    arrow.dataset.galaxy = galaxyNumber.toString();
    
    const color = galaxyNumber === 1 ? '#ffdd55' : '#4488ff';
    
    arrow.style.cssText = `
      position: absolute;
      width: 50px;
      height: 20px;
      cursor: pointer;
      transition: all 0.15s ease-out;
      z-index: 101;
      pointer-events: auto;
    `;
    
    arrow.innerHTML = `
      <svg width="50" height="20" viewBox="0 0 50 20">
        <defs>
          <linearGradient id="arrowGrad${galaxyNumber}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:${color};stop-opacity:1" />
          </linearGradient>
        </defs>
        <line x1="0" y1="10" x2="35" y2="10" stroke="url(#arrowGrad${galaxyNumber})" stroke-width="3"/>
        <polygon points="35,5 50,10 35,15" fill="${color}"/>
      </svg>
    `;
    
    document.body.appendChild(arrow);
    return arrow;
  }

  private createLockLabel(parent: HTMLElement): HTMLElement {
    const label = document.createElement('div');
    label.className = 'lock-label';
    label.style.cssText = `
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      color: #ff4444;
      font-size: 12px;
      font-weight: bold;
      text-shadow: 0 0 10px #ff0000;
      opacity: 0;
      transition: opacity 0.3s;
      white-space: nowrap;
    `;
    label.textContent = 'LOCK';
    parent.appendChild(label);
    return label;
  }

  private bindEvents(): void {
    this.handle1.addEventListener('mousedown', (e) => this.startDrag(e, 1, false));
    this.handle2.addEventListener('mousedown', (e) => this.startDrag(e, 2, false));
    this.arrow1.addEventListener('mousedown', (e) => this.startDrag(e, 1, true));
    this.arrow2.addEventListener('mousedown', (e) => this.startDrag(e, 2, true));
    
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
    
    const mass1 = this.panel.querySelector('#mass1') as HTMLInputElement;
    const mass2 = this.panel.querySelector('#mass2') as HTMLInputElement;
    const g = this.panel.querySelector('#g') as HTMLInputElement;
    const speed = this.panel.querySelector('#speed') as HTMLInputElement;
    const size = this.panel.querySelector('#size') as HTMLInputElement;
    const showTrails = this.panel.querySelector('#showTrails') as HTMLInputElement;
    
    mass1.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.panel.querySelector('#mass1Value')!.textContent = value.toFixed(1);
      this.animateSlider(mass1, parseFloat(mass1.value), value);
      this.simulator.setGalaxy1Mass(value);
    });
    
    mass2.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.panel.querySelector('#mass2Value')!.textContent = value.toFixed(1);
      this.animateSlider(mass2, parseFloat(mass2.value), value);
      this.simulator.setGalaxy2Mass(value);
    });
    
    g.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.panel.querySelector('#gValue')!.textContent = value.toFixed(3);
      this.animateSlider(g, parseFloat(g.value), value);
      this.simulator.setG(value);
    });
    
    speed.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.panel.querySelector('#speedValue')!.textContent = value.toFixed(1);
      this.animateSlider(speed, parseFloat(speed.value), value);
      this.simulator.setSimulationSpeed(value);
    });
    
    size.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.panel.querySelector('#sizeValue')!.textContent = value.toFixed(2);
      this.animateSlider(size, parseFloat(size.value), value);
      this.simulator.setParticleSize(value);
    });
    
    this.velocitySlider1.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.velocityMagnitude1 = value;
      this.velocityValue1.textContent = value.toFixed(2);
      this.updateVelocityFromMagnitude(1);
    });
    
    this.velocitySlider2.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.velocityMagnitude2 = value;
      this.velocityValue2.textContent = value.toFixed(2);
      this.updateVelocityFromMagnitude(2);
    });
    
    showTrails.addEventListener('change', (e) => {
      this.simulator.setShowTrails((e.target as HTMLInputElement).checked);
    });
    
    this.startButton.addEventListener('click', () => this.onStartStop());
    this.resetButton.addEventListener('click', () => this.onReset());
  }

  private animateSlider(element: HTMLInputElement, oldValue: number, newValue: number): void {
    this.sliderAnimations.push({
      element,
      startValue: oldValue,
      endValue: newValue,
      startTime: performance.now(),
      duration: 150
    });
  }

  public updateSliderAnimations(): void {
    const now = performance.now();
    for (let i = this.sliderAnimations.length - 1; i >= 0; i--) {
      const anim = this.sliderAnimations[i];
      const elapsed = now - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = anim.startValue + (anim.endValue - anim.startValue) * easeOut;
      
      anim.element.value = currentValue.toString();
      
      if (progress >= 1) {
        this.sliderAnimations.splice(i, 1);
      }
    }
  }

  private startDrag(e: MouseEvent, galaxyNumber: number, isArrow: boolean): void {
    if (this.simulator.isRunning) return;
    
    e.preventDefault();
    e.stopPropagation();
    this.dragging = { handle: galaxyNumber, isArrow };
    this.lastMousePos = { x: e.clientX, y: e.clientY };
    
    const handle = galaxyNumber === 1 ? this.handle1 : this.handle2;
    handle.style.transform = 'translate(-50%, -50%) scale(1.1)';
  }

  private onDrag(e: MouseEvent): void {
    if (!this.dragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - this.lastMousePos.x;
    const deltaY = e.clientY - this.lastMousePos.y;
    this.lastMousePos = { x: e.clientX, y: e.clientY };
    
    if (this.dragging.isArrow) {
      this.rotateVelocityArrow(this.dragging.handle, deltaX * 0.01);
    } else {
      this.moveGalaxyHandle(this.dragging.handle, deltaX, deltaY);
    }
  }

  private stopDrag(): void {
    if (!this.dragging) return;
    
    const handle = this.dragging.handle === 1 ? this.handle1 : this.handle2;
    handle.style.transform = 'translate(-50%, -50%) scale(1)';
    
    this.dragging = null;
  }

  private moveGalaxyHandle(galaxyNumber: number, deltaX: number, deltaY: number): void {
    const galaxy = galaxyNumber === 1 ? this.simulator.galaxy1 : this.simulator.galaxy2;
    
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    
    const moveFactor = 0.02;
    const newPos = galaxy.position.clone();
    newPos.add(right.multiplyScalar(deltaX * moveFactor));
    newPos.add(forward.multiplyScalar(-deltaY * moveFactor));
    newPos.y += deltaY * moveFactor * 0.5;
    
    newPos.x = THREE.MathUtils.clamp(newPos.x, -10, 10);
    newPos.y = THREE.MathUtils.clamp(newPos.y, -10, 10);
    newPos.z = THREE.MathUtils.clamp(newPos.z, -10, 10);
    
    if (galaxyNumber === 1) {
      this.simulator.setGalaxy1Position(newPos);
    } else {
      this.simulator.setGalaxy2Position(newPos);
    }
    
    this.updateHandlePositions();
  }

  private rotateVelocityArrow(galaxyNumber: number, deltaAngle: number): void {
    const velocity = galaxyNumber === 1 ? this.galaxy1Velocity : this.galaxy2Velocity;
    
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(deltaAngle);
    velocity.applyMatrix4(rotationMatrix);
    
    this.updateVelocityFromMagnitude(galaxyNumber);
    this.updateArrowRotations();
  }

  private updateVelocityFromMagnitude(galaxyNumber: number): void {
    const velocity = galaxyNumber === 1 ? this.galaxy1Velocity : this.galaxy2Velocity;
    const magnitude = galaxyNumber === 1 ? this.velocityMagnitude1 : this.velocityMagnitude2;
    
    if (velocity.length() > 0) {
      velocity.normalize().multiplyScalar(magnitude);
    } else {
      velocity.set(magnitude, 0, 0);
    }
    
    if (galaxyNumber === 1) {
      this.simulator.setGalaxy1Velocity(velocity);
    } else {
      this.simulator.setGalaxy2Velocity(velocity);
    }
  }

  public updateHandlePositions(): void {
    const pos1 = this.projectToScreen(this.simulator.galaxy1.position);
    const pos2 = this.projectToScreen(this.simulator.galaxy2.position);
    
    this.handle1.style.left = pos1.x + 'px';
    this.handle1.style.top = pos1.y + 'px';
    this.handle1.style.transform = 'translate(-50%, -50%)';
    
    this.handle2.style.left = pos2.x + 'px';
    this.handle2.style.top = pos2.y + 'px';
    this.handle2.style.transform = 'translate(-50%, -50%)';
    
    this.updateArrowRotations();
  }

  private updateArrowRotations(): void {
    const updateArrow = (arrow: HTMLElement, handlePos: { x: number; y: number }, velocity: THREE.Vector3) => {
      const screenVel = this.projectDirectionToScreen(velocity);
      const angle = Math.atan2(screenVel.y, screenVel.x) * (180 / Math.PI);
      
      arrow.style.left = handlePos.x + 'px';
      arrow.style.top = handlePos.y + 'px';
      arrow.style.transform = `translate(-10%, -50%) rotate(${angle}deg)`;
    };
    
    const pos1 = this.projectToScreen(this.simulator.galaxy1.position);
    const pos2 = this.projectToScreen(this.simulator.galaxy2.position);
    
    updateArrow(this.arrow1, pos1, this.galaxy1Velocity);
    updateArrow(this.arrow2, pos2, this.galaxy2Velocity);
  }

  private projectToScreen(position: THREE.Vector3): { x: number; y: number } {
    const vector = position.clone();
    vector.project(this.camera);
    
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    
    return {
      x: (vector.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-vector.y * 0.5 + 0.5) * rect.height + rect.top
    };
  }

  private projectDirectionToScreen(direction: THREE.Vector3): { x: number; y: number } {
    const start = new THREE.Vector3(0, 0, 0);
    const end = direction.clone().multiplyScalar(5);
    
    const startScreen = this.projectToScreen(start);
    const endScreen = this.projectToScreen(end);
    
    return {
      x: endScreen.x - startScreen.x,
      y: endScreen.y - startScreen.y
    };
  }

  public updateState(state: SimulatorState): void {
    this.fpsDisplay.textContent = `${state.fps} FPS`;
    this.timeDisplay.textContent = `${state.simulationTime.toFixed(2)}s`;
    this.particleCountDisplay.textContent = state.particleCount.toString();
    
    const stageMap: Record<string, string> = {
      'idle': '待机',
      'approaching': '靠近中',
      'colliding': '碰撞中',
      'merging': '融合中',
      'merged': '已合并'
    };
    this.stageDisplay.textContent = stageMap[state.stage] || state.stage;
    
    this.setLockState(state.isLocked);
    this.setButtonState(this.simulator.isRunning);
    this.setSlidersEnabled(!this.simulator.isRunning);
    
    if (!this.simulator.isRunning) {
      this.updateHandlePositions();
    }
  }

  public setLockState(locked: boolean): void {
    const color1 = locked ? '#ff4444' : '#ffdd55';
    const color2 = locked ? '#ff4444' : '#4488ff';
    
    this.handle1.style.borderColor = color1;
    this.handle1.style.boxShadow = locked ? `0 0 30px ${color1}` : `0 0 20px ${color1}66`;
    
    this.handle2.style.borderColor = color2;
    this.handle2.style.boxShadow = locked ? `0 0 30px ${color2}` : `0 0 20px ${color2}66`;
    
    this.lockLabel1.style.opacity = locked ? '1' : '0';
    this.lockLabel2.style.opacity = locked ? '1' : '0';
    
    const dot1 = this.handle1.querySelector('div');
    const dot2 = this.handle2.querySelector('div');
    if (dot1) dot1.style.background = color1;
    if (dot2) dot2.style.background = color2;
  }

  public setButtonState(running: boolean): void {
    this.startButton.textContent = running ? '暂停模拟' : '开始模拟';
    this.resetButton.disabled = running;
  }

  private setSlidersEnabled(enabled: boolean): void {
    const sliders = this.panel.querySelectorAll('input[type="range"]');
    const checkbox = this.panel.querySelector('#showTrails') as HTMLInputElement;
    
    sliders.forEach(slider => {
      (slider as HTMLInputElement).disabled = !enabled;
    });
    checkbox.disabled = !enabled;
  }

  public setHandlesVisible(visible: boolean): void {
    const opacity = visible ? '1' : '0';
    const pointerEvents = visible ? 'auto' : 'none';
    
    this.handle1.style.opacity = opacity;
    this.handle2.style.opacity = opacity;
    this.arrow1.style.opacity = opacity;
    this.arrow2.style.opacity = opacity;
    
    this.handle1.style.pointerEvents = pointerEvents;
    this.handle2.style.pointerEvents = pointerEvents;
    this.arrow1.style.pointerEvents = pointerEvents;
    this.arrow2.style.pointerEvents = pointerEvents;
  }

  public resetVelocitySliders(): void {
    this.velocityMagnitude1 = 2;
    this.velocityMagnitude2 = 2;
    this.galaxy1Velocity.set(1, 0, 0.5).normalize().multiplyScalar(2);
    this.galaxy2Velocity.set(-1, 0, -0.5).normalize().multiplyScalar(2);
    
    this.velocitySlider1.value = '2';
    this.velocitySlider2.value = '2';
    this.velocityValue1.textContent = '2.00';
    this.velocityValue2.textContent = '2.00';
    
    this.updateArrowRotations();
  }

  public dispose(): void {
    document.body.removeChild(this.panel);
    document.body.removeChild(this.handle1);
    document.body.removeChild(this.handle2);
    document.body.removeChild(this.arrow1);
    document.body.removeChild(this.arrow2);
  }
}
