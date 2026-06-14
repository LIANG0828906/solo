import { SceneManager } from './scene';
import { Drone, RotorAngles } from './drone';
import { ControlPanel } from './controls';
import FlightWorker from './flight.worker?worker';

interface WorkerResponse {
  type: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  speeds?: [number, number, number, number];
  particles?: Array<{ pos: [number, number, number]; alpha: number }>;
  pitch?: number;
  yaw?: number;
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
    this.sceneManager = new SceneManager('canvas-container');
    this.drone = new Drone();
    this.waypoints = this.generateWaypoints(50);
    
    this.controls = new ControlPanel({
      onAngleChange: (angles) => this.handleAngleChange(angles),
      onStart: () => this.handleStart(),
      onReset: () => this.handleReset()
    });
    
    this.flightWorker = new FlightWorker();
    this.flightWorker.onmessage = (e: MessageEvent<WorkerResponse>) => this.handleWorkerMessage(e.data);
    
    this.init();
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
        }
        break;
        
      case 'rotorSpeeds':
        if (data.speeds) {
          this.drone.setRotorSpeeds(data.speeds);
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
    }
  }

  private startMainLoop(): void {
    const animate = (currentTime: number) => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;
      
      this.drone.update(deltaTime, this.isFlying);
      this.sceneManager.render();
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
