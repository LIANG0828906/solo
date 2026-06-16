export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Anchor {
  x: number;
  y: number;
  radius: number;
  type: 'fixed' | 'moving';
  moveAxis?: 'horizontal' | 'vertical';
  moveRange?: number;
  moveSpeed?: number;
  baseX?: number;
  baseY?: number;
  phase?: number;
}

export interface EnergyBall {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  collectAnim: number;
}

export interface Spike {
  x: number;
  y: number;
  size: number;
}

export interface Checkpoint {
  x: number;
  y: number;
  radius: number;
  height: number;
  activated: boolean;
}

export interface Goal {
  x: number;
  y: number;
  w: number;
  h: number;
  openProgress: number;
  opened: boolean;
}

export class Level {
  width: number;
  height: number;
  platforms: Platform[];
  anchors: Anchor[];
  energyBalls: EnergyBall[];
  spikes: Spike[];
  checkpoints: Checkpoint[];
  goal: Goal;

  constructor() {
    this.width = 3200;
    this.height = 900;

    this.platforms = [
      { x: 0, y: 820, w: 600, h: 80 },
      { x: 700, y: 720, w: 200, h: 40 },
      { x: 1000, y: 620, w: 180, h: 40 },
      { x: 1300, y: 520, w: 150, h: 40 },
      { x: 1550, y: 420, w: 200, h: 40 },
      { x: 1850, y: 380, w: 150, h: 40 },
      { x: 2100, y: 480, w: 200, h: 40 },
      { x: 2400, y: 580, w: 180, h: 40 },
      { x: 2680, y: 680, w: 200, h: 40 },
      { x: 2950, y: 820, w: 250, h: 80 },
      { x: 500, y: 400, w: 120, h: 30 },
      { x: 800, y: 300, w: 100, h: 30 },
      { x: 1100, y: 220, w: 120, h: 30 },
      { x: 1700, y: 180, w: 100, h: 30 },
      { x: 2000, y: 150, w: 150, h: 30 },
      { x: 2300, y: 250, w: 120, h: 30 },
      { x: 2550, y: 350, w: 100, h: 30 },
    ];

    this.anchors = [
      { x: 650, y: 580, radius: 8, type: 'fixed' },
      { x: 920, y: 480, radius: 8, type: 'fixed' },
      { x: 1220, y: 400, radius: 8, type: 'fixed' },
      { x: 1480, y: 300, radius: 8, type: 'fixed' },
      { x: 1780, y: 250, radius: 8, type: 'fixed' },
      { x: 2030, y: 300, radius: 8, type: 'fixed' },
      { x: 2300, y: 380, radius: 8, type: 'fixed' },
      { x: 2580, y: 480, radius: 8, type: 'fixed' },
      { x: 2850, y: 580, radius: 8, type: 'fixed' },
      { x: 400, y: 250, radius: 8, type: 'moving', moveAxis: 'horizontal', moveRange: 120, moveSpeed: 40, baseX: 400, baseY: 250, phase: 0 },
      { x: 1400, y: 180, radius: 8, type: 'moving', moveAxis: 'vertical', moveRange: 100, moveSpeed: 40, baseX: 1400, baseY: 180, phase: 1 },
      { x: 2150, y: 200, radius: 8, type: 'moving', moveAxis: 'horizontal', moveRange: 100, moveSpeed: 40, baseX: 2150, baseY: 200, phase: 2 },
    ];

    this.energyBalls = this.generateEnergyBalls(30);

    this.spikes = [
      { x: 620, y: 800, size: 20 },
      { x: 640, y: 800, size: 20 },
      { x: 660, y: 800, size: 20 },
      { x: 910, y: 700, size: 20 },
      { x: 930, y: 700, size: 20 },
      { x: 1190, y: 600, size: 20 },
      { x: 1460, y: 500, size: 20 },
      { x: 1760, y: 400, size: 20 },
      { x: 2010, y: 360, size: 20 },
      { x: 2310, y: 460, size: 20 },
      { x: 2590, y: 560, size: 20 },
      { x: 2890, y: 800, size: 20 },
      { x: 2910, y: 800, size: 20 },
    ];

    this.checkpoints = [
      { x: 100, y: 760, radius: 20, height: 60, activated: true },
      { x: 1100, y: 560, radius: 20, height: 60, activated: false },
      { x: 2100, y: 420, radius: 20, height: 60, activated: false },
    ];

    this.goal = {
      x: 3050,
      y: 620,
      w: 120,
      h: 200,
      openProgress: 0,
      opened: false,
    };
  }

  generateEnergyBalls(count: number): EnergyBall[] {
    const balls: EnergyBall[] = [];
    const positions = [
      { x: 300, y: 750 }, { x: 450, y: 680 }, { x: 550, y: 350 },
      { x: 720, y: 650 }, { x: 780, y: 520 }, { x: 850, y: 250 },
      { x: 1020, y: 550 }, { x: 1080, y: 450 }, { x: 1150, y: 170 },
      { x: 1350, y: 450 }, { x: 1420, y: 360 }, { x: 1500, y: 120 },
      { x: 1600, y: 350 }, { x: 1720, y: 280 }, { x: 1900, y: 310 },
      { x: 1920, y: 110 }, { x: 2050, y: 250 }, { x: 2150, y: 410 },
      { x: 2200, y: 130 }, { x: 2350, y: 330 }, { x: 2420, y: 510 },
      { x: 2500, y: 200 }, { x: 2600, y: 440 }, { x: 2620, y: 300 },
      { x: 2720, y: 610 }, { x: 2800, y: 520 }, { x: 2900, y: 750 },
      { x: 380, y: 500 }, { x: 1800, y: 200 }, { x: 2450, y: 400 },
    ];
    for (let i = 0; i < count && i < positions.length; i++) {
      balls.push({
        x: positions[i].x,
        y: positions[i].y,
        radius: 6,
        collected: false,
        collectAnim: 0,
      });
    }
    return balls;
  }

  updateAnchors(dt: number): void {
    for (const a of this.anchors) {
      if (a.type === 'moving' && a.moveAxis && a.moveRange && a.moveSpeed && a.baseX !== undefined && a.baseY !== undefined && a.phase !== undefined) {
        a.phase += dt * (a.moveSpeed / a.moveRange);
        if (a.moveAxis === 'horizontal') {
          a.x = a.baseX + Math.sin(a.phase) * a.moveRange;
        } else {
          a.y = a.baseY + Math.sin(a.phase) * a.moveRange;
        }
      }
    }
  }

  getNearestCheckpoint(px: number, py: number): Checkpoint {
    let nearest = this.checkpoints[0];
    let minDist = Infinity;
    for (const cp of this.checkpoints) {
      if (!cp.activated) continue;
      const d = Math.hypot(cp.x - px, cp.y - py);
      if (d < minDist) {
        minDist = d;
        nearest = cp;
      }
    }
    return nearest;
  }

  updateCheckpoints(px: number, py: number): void {
    for (const cp of this.checkpoints) {
      if (!cp.activated && Math.hypot(cp.x - px, cp.y - py) < cp.radius + 30) {
        cp.activated = true;
      }
    }
  }
}
