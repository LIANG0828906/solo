import { create } from 'zustand';
import type { Gear, Store, Particle, Glow } from './types';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useGearStore = create<Store>((set, get) => ({
  gears: [],
  particles: [],
  glows: [],
  rotationSpeed: 2,
  gaugeValue: 0,
  isRunning: false,

  addGear: (gearData) => {
    const newGear: Gear = {
      ...gearData,
      id: generateId(),
      rotationAngle: 0,
      isActive: false,
      linkedTo: []
    };
    set((state) => ({ gears: [...state.gears, newGear] }));
  },

  removeGear: (id) => {
    set((state) => ({
      gears: state.gears
        .filter((g) => g.id !== id)
        .map((g) => ({
          ...g,
          linkedTo: g.linkedTo.filter((linkId) => linkId !== id)
        }))
    }));
  },

  updateGearPosition: (id, x, y) => {
    set((state) => ({
      gears: state.gears.map((g) =>
        g.id === id ? { ...g, x, y, linkedTo: [] } : g
      )
    }));
  },

  checkMeshing: () => {
    const { gears, addParticles, addGlow, setGearError } = get();
    const newGears = [...gears];
    let hasNewConnection = false;

    for (let i = 0; i < newGears.length; i++) {
      for (let j = i + 1; j < newGears.length; j++) {
        const gear1 = newGears[i];
        const gear2 = newGears[j];

        const dx = gear2.x - gear1.x;
        const dy = gear2.y - gear1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const idealDistance = gear1.radius + gear2.radius;

        if (distance < 80 && distance > 0) {
          const teethMatch = Math.abs(gear1.teeth - gear2.teeth) <= 4;
          const distanceOk = Math.abs(distance - idealDistance) < 30;

          if (teethMatch && distanceOk) {
            if (!gear1.linkedTo.includes(gear2.id)) {
              gear1.linkedTo = [...gear1.linkedTo, gear2.id];
              gear2.linkedTo = [...gear2.linkedTo, gear1.id];
              hasNewConnection = true;

              const midX = (gear1.x + gear2.x) / 2;
              const midY = (gear1.y + gear2.y) / 2;
              addParticles(midX, midY, 10);
              addGlow(midX, midY, Math.max(gear1.radius, gear2.radius) + 20);
            }
          } else {
            if (!gear1.linkedTo.includes(gear2.id) && distance < 50) {
              setGearError(gear1.id);
              setGearError(gear2.id);
            }
          }
        }
      }
    }

    if (hasNewConnection) {
      set({ gears: newGears });
    }
  },

  startEngine: () => {
    const { gears } = get();
    if (gears.length === 0) return;

    const updatedGears = gears.map((g, index) => ({
      ...g,
      isActive: index === 0 || g.linkedTo.length > 0
    }));

    set({ gears: updatedGears, isRunning: true });
  },

  stopEngine: () => {
    set((state) => ({
      isRunning: false,
      gears: state.gears.map((g) => ({ ...g, isActive: false }))
    }));
  },

  updateRotation: (deltaTime) => {
    const { gears, isRunning, rotationSpeed } = get();
    if (!isRunning || gears.length === 0) return;

    const visited = new Set<string>();
    const rotationMap = new Map<string, { speed: number; direction: number }>();

    const propagateRotation = (gearId: string, speed: number, direction: number) => {
      if (visited.has(gearId)) return;
      visited.add(gearId);

      const gear = gears.find((g) => g.id === gearId);
      if (!gear) return;

      rotationMap.set(gearId, { speed, direction });

      gear.linkedTo.forEach((linkedId) => {
        if (!visited.has(linkedId)) {
          const linkedGear = gears.find((g) => g.id === linkedId);
          if (linkedGear) {
            const ratio = gear.teeth / linkedGear.teeth;
            const newSpeed = speed * ratio * 0.95;
            propagateRotation(linkedId, newSpeed, -direction);
          }
        }
      });
    };

    if (gears[0].isActive) {
      propagateRotation(gears[0].id, rotationSpeed, 1);
    }

    const updatedGears = gears.map((gear) => {
      const rotation = rotationMap.get(gear.id);
      if (rotation && gear.isActive) {
        const rpmToRadPerMs = (rotation.speed * Math.PI * 2) / 60000;
        return {
          ...gear,
          rotationAngle: gear.rotationAngle + rotation.direction * rpmToRadPerMs * deltaTime
        };
      }
      return gear;
    });

    set({ gears: updatedGears });
  },

  addParticles: (x, y, count) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      newParticles.push({
        id: generateId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 800,
        maxLife: 800,
        size: 3,
        color: '#FFD700'
      });
    }
    set((state) => ({ particles: [...state.particles, ...newParticles] }));
  },

  addGlow: (x, y, radius) => {
    const newGlow: Glow = {
      id: generateId(),
      x,
      y,
      radius,
      life: 3000,
      maxLife: 3000
    };
    set((state) => ({ glows: [...state.glows, newGlow] }));
  },

  updateEffects: (deltaTime) => {
    const { particles, glows, gears } = get();

    const updatedParticles = particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - deltaTime
      }))
      .filter((p) => p.life > 0);

    const updatedGlows = glows
      .map((g) => ({ ...g, life: g.life - deltaTime }))
      .filter((g) => g.life > 0);

    const now = Date.now();
    const updatedGears = gears.map((g) => {
      if (g.isError && g.errorStartTime && now - g.errorStartTime > 1000) {
        return { ...g, isError: false, errorStartTime: undefined };
      }
      return g;
    });

    set({ particles: updatedParticles, glows: updatedGlows, gears: updatedGears });
  },

  updateGauge: () => {
    const { gears, isRunning } = get();
    if (!isRunning) {
      set({ gaugeValue: 0 });
      return;
    }

    const activeGears = gears.filter((g) => g.isActive);
    const totalTeeth = activeGears.reduce((sum, g) => sum + g.teeth, 0);
    const newValue = Math.min(20, (totalTeeth / 10) * 2);
    set({ gaugeValue: newValue });
  },

  setGearError: (id) => {
    set((state) => ({
      gears: state.gears.map((g) =>
        g.id === id ? { ...g, isError: true, errorStartTime: Date.now() } : g
      )
    }));
  }
}));
