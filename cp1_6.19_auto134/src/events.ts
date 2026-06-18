import { dataState, Nebula, Wormhole, GravityWave } from './dataspace';
import { FleetManager } from './fleet';

const WORMHOLE_TRIGGER_DISTANCE = 50;
const WORMHOLE_ROTATION_PERIOD = 1200;
const GRAVITY_WAVE_DURATION = 1000;
const GRAVITY_WAVE_RADIUS = 70;

export class EventManager {
  private nextGravityTime: number = 0;
  private lastWarpTime: number = 0;
  private warpCooldown: number = 2000;
  private fleetManager: FleetManager;

  constructor(fleetManager: FleetManager) {
    this.fleetManager = fleetManager;
  }

  generateNebulas(width: number, height: number): void {
    const count = 20 + Math.floor(Math.random() * 11);
    const nebulas: Nebula[] = [];
    let attempts = 0;
    const maxAttempts = count * 50;

    while (nebulas.length < count && attempts < maxAttempts) {
      attempts++;
      const radius = 15 + Math.random() * 25;
      const x = radius + 20 + Math.random() * (width - 2 * radius - 40);
      const y = radius + 60 + Math.random() * (height - 2 * radius - 80);

      let overlapping = false;
      for (const nebula of nebulas) {
        const dx = x - nebula.x;
        const dy = y - nebula.y;
        const minDist = radius + nebula.radius + 5;
        if (dx * dx + dy * dy < minDist * minDist) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        nebulas.push({ x, y, radius });
      }
    }

    dataState.setNebulas(nebulas);
  }

  generateWormholes(width: number, height: number): void {
    const nebulas = dataState.getNebulas();
    const count = 2 + Math.floor(Math.random() * 2);
    const wormholes: Wormhole[] = [];
    let attempts = 0;
    const maxAttempts = count * 50;

    while (wormholes.length < count && attempts < maxAttempts) {
      attempts++;
      const x = 80 + Math.random() * (width - 160);
      const y = 80 + Math.random() * (height - 160);

      let valid = true;

      let tooCloseToNebula = false;
      for (const nebula of nebulas) {
        const dx = x - nebula.x;
        const dy = y - nebula.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nebula.radius + 30) {
          tooCloseToNebula = true;
          break;
        }
      }
      if (tooCloseToNebula) {
        valid = false;
      }

      if (valid) {
        for (const wh of wormholes) {
          const dx = x - wh.x;
          const dy = y - wh.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            valid = false;
            break;
          }
        }
      }

      if (valid) {
        wormholes.push({ x, y, rotation: 0 });
      }
    }

    dataState.setWormholes(wormholes);
  }

  update(_deltaTime: number, currentTime: number, width: number, _height: number): void {
    const wormholes = dataState.getWormholes();
    wormholes.forEach(wh => {
      wh.rotation = (currentTime % WORMHOLE_ROTATION_PERIOD) / WORMHOLE_ROTATION_PERIOD * Math.PI * 2;
    });

    this.checkWormholeTrigger(currentTime, width, _height);

    if (this.nextGravityTime === 0) {
      this.scheduleNextGravity(currentTime);
    }

    if (currentTime >= this.nextGravityTime) {
      this.triggerGravityEvent(currentTime);
      this.scheduleNextGravity(currentTime);
    }

    const waves = dataState.getGravityWaves();
    for (let i = waves.length - 1; i >= 0; i--) {
      const wave = waves[i];
      if (currentTime - wave.startTime > wave.duration) {
        dataState.removeGravityWave(i);
      }
    }
  }

  private checkWormholeTrigger(currentTime: number, width: number, _height: number): void {
    if (currentTime - this.lastWarpTime < this.warpCooldown) return;

    const fleetCenter = dataState.getFleetCenter();
    const wormholes = dataState.getWormholes();

    for (const wormhole of wormholes) {
      const dx = fleetCenter.x - wormhole.x;
      const dy = fleetCenter.y - wormhole.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < WORMHOLE_TRIGGER_DISTANCE) {
        this.lastWarpTime = currentTime;
        const disrupt = Math.random() < 0.2;
        const newX = width - 150 - Math.random() * 50;
        const newY = 100 + Math.random() * 80;
        this.fleetManager.warpFleet(newX, newY, disrupt);
        dataState.addLog(
          `虫洞跃迁完成！${disrupt ? '阵型受干扰' : '阵型保持完整'}`
        );
        break;
      }
    }
  }

  private scheduleNextGravity(currentTime: number): void {
    const delay = 8000 + Math.random() * 7000;
    this.nextGravityTime = currentTime + delay;
  }

  private triggerGravityEvent(currentTime: number): void {
    const nebulas = dataState.getNebulas();
    if (nebulas.length === 0) return;

    const nebulaIndex = Math.floor(Math.random() * nebulas.length);
    const nebula = nebulas[nebulaIndex];

    const wave: GravityWave = {
      x: nebula.x,
      y: nebula.y,
      startTime: currentTime,
      duration: GRAVITY_WAVE_DURATION,
      maxRadius: GRAVITY_WAVE_RADIUS,
      nebulaIndex
    };
    dataState.addGravityWave(wave);

    this.fleetManager.applyGravityDisturbance(nebula.x, nebula.y, currentTime);
    dataState.addLog(`检测到引力波动 @ (${nebula.x.toFixed(0)}, ${nebula.y.toFixed(0)})`);
  }

  resetSchedule(): void {
    this.nextGravityTime = 0;
    this.lastWarpTime = 0;
  }

  getGravityWaveProgress(wave: GravityWave, currentTime: number): number {
    return Math.min(1, (currentTime - wave.startTime) / wave.duration);
  }
}
