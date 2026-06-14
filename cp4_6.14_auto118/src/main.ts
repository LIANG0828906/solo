console.log('[Main] main.ts loaded, initializing app...');

import { SceneManager } from './scene';
import { Drone, RotorAngles } from './drone';
import { ControlPanel } from './controls';
import FlightWorker from './flight.worker?worker';

interface WorkerResponse {
  type: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  matrix?: number[];
  speeds?: [number, number, number, number];
  rotations?: [number, number, number, number];
  particles?: Array<{ pos: [number, number, number]; alpha: number; lifeProgress?: number }>;
  pitch?: number;
  yaw?: number;
  message?: string;
  data?: unknown;
}

class App {
  private sceneManager: SceneManager;
  private drone: Drone;
  private controls: ControlPanel;
  private flightWorker: Worker;
  private isFlying: boolean = false;
  private lastTime: number = 0;
  private workerFrameId: number = 0;
  private animationFrameId: number = 0;
  private waypoints: Array<[number, number, number]>;

  constructor() {
    try {
      console.log('[Main] Creating SceneManager...');
      this.sceneManager = new SceneManager('canvas-container');
      console.log('[Main] SceneManager created successfully');
      
      console.log('[Main] Creating Drone...');
      this.drone = new Drone();
      console.log('[Main] Drone created successfully');
      
      console.log('[Main] Generating waypoints...');
      this.waypoints = this.generateWaypoints(50);
      console.log(`[Main] Generated ${this.waypoints.length} waypoints`);
      
      console.log('[Main] Creating ControlPanel...');
      this.controls = new ControlPanel({
        onAngleChange: (angles) => this.handleAngleChange(angles),
        onStart: () => this.handleStart(),
        onReset: () => this.handleReset()
      });
      console.log('[Main] ControlPanel created successfully');
      
      console.log('[Main] Creating FlightWorker...');
      this.flightWorker = new FlightWorker();
      this.flightWorker.onmessage = (e: MessageEvent<WorkerResponse>) => this.handleWorkerMessage(e.data);
      this.flightWorker.onerror = (error) => {
        console.error('[Main] Worker error:', error);
      };
      console.log('[Main] FlightWorker created successfully');
      
      console.log('[Main] Calling init()...');
      this.init();
      console.log('[Main] App initialization complete');
    } catch (error) {
      console.error('[Main] Error during initialization:', error);
      throw error;
    }
  }

  private generateWaypoints(count: number): Array<[number, number, number]> {
    const waypoints: Array<[number, number, number]> = [];
    const radius = 6;
    
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = t * Math.PI * 4;
      const height = 3 + Math.sin(t * Math.PI * 3) * 1.5;
      const r = radius + Math.sin(t * Math.PI * 2) * 2;
      
      waypoints.push([
        Math.cos(angle) * r,
        height,
        Math.sin(angle) * r
      ]);
    }
    
    return waypoints;
  }

  private init(): void {
    this.sceneManager.addObject(this.drone.group);
    this.sceneManager.initTrailParticles(250);
    this.sceneManager.showPath(this.waypoints);
    
    this.flightWorker.postMessage({
      type: 'init',
      waypoints: this.waypoints
    });
    
    this.startMainLoop();
    this.startWorkerLoop();
  }

  private handleAngleChange(angles: RotorAngles): void {
    this.drone.setAllRotorAngles(angles);
    
    this.flightWorker.postMessage({
      type: 'updateAngles',
      angles
    });
  }

  private handleStart(): void {
    this.isFlying = true;
    this.controls.setFlyingState(true);
    
    const angles = this.drone.getRotorAngles();
    this.flightWorker.postMessage({
      type: 'start',
      angles
    });
  }

  private handleReset(): void {
    this.isFlying = false;
    this.controls.setFlyingState(false);
    this.drone.reset();
    this.sceneManager.clearTrailParticles();
    
    this.flightWorker.postMessage({
      type: 'reset'
    });
  }

  private handleWorkerMessage(data: WorkerResponse): void {
    switch (data.type) {
      case 'transform':
        if (data.position && data.rotation) {
          this.drone.setPosition(data.position[0], data.position[1], data.position[2]);
          this.drone.setRotation(data.rotation[0], data.rotation[1], data.rotation[2]);
          
          if (data.matrix) {
            console.debug(`[Main] Transform matrix received: [${data.matrix.slice(0, 4).join(', ')}...]`);
          }
        }
        break;
        
      case 'rotorSpeeds':
        if (data.speeds) {
          this.drone.setRotorSpeeds(data.speeds);
          
          if (data.rotations) {
            console.debug(`[Main] Rotor rotations: FL=${(data.rotations[0] * 180 / Math.PI).toFixed(1)}°`);
          }
        }
        break;
        
      case 'trailParticles':
        if (data.particles) {
          this.sceneManager.updateTrailParticles(data.particles);
        }
        break;
        
      case 'attitude':
        if (data.pitch !== undefined && data.yaw !== undefined) {
          this.controls.updateAttitude(data.pitch, data.yaw);
        }
        break;
        
      case 'debug':
        console.log(`[Worker Debug] ${data.message}`, data.data);
        break;
    }
  }

  private startMainLoop(): void {
    let frameCount = 0;
    
    const animate = (currentTime: number) => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;
      
      this.drone.update(deltaTime, this.isFlying);
      
      const attitude = this.drone.getAttitude();
      this.controls.updateAttitude(attitude.pitch, attitude.yaw);
      
      this.sceneManager.render();
      
      frameCount++;
      if (frameCount % 60 === 0) {
        console.log(`[Main] Frame update: pitch=${attitude.pitch.toFixed(1)}°, yaw=${attitude.yaw.toFixed(1)}°, isFlying=${this.isFlying}`);
        console.log(`[Main] Drone position: (${this.drone.group.position.x.toFixed(2)}, ${this.drone.group.position.y.toFixed(2)}, ${this.drone.group.position.z.toFixed(2)})`);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private startWorkerLoop(): void {
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = performance.now();
    
    const update = () => {
      this.workerFrameId = window.setTimeout(update, frameInterval);
      
      const now = performance.now();
      const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;
      
      this.flightWorker.postMessage({
        type: 'frame',
        delta
      });
    };
    
    this.workerFrameId = window.setTimeout(update, frameInterval);
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.workerFrameId) {
      clearTimeout(this.workerFrameId);
    }
    this.flightWorker.terminate();
    this.sceneManager.dispose();
  }
}

const app = new App();

window.addEventListener('beforeunload', () => {
  app.dispose();
});
