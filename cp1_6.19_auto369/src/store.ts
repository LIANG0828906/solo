import { create } from 'zustand';

export type Vector3Tuple = [number, number, number];

interface CelestialState {
  orbitSpeed: number;
  earthScale: number;
  moonOrbitScale: number;
  targetOrbitSpeed: number;
  targetEarthScale: number;
  targetMoonOrbitScale: number;
  earthOrbitAngle: number;
  moonOrbitAngle: number;
  earthRotation: number;
  sunPosition: Vector3Tuple;
  earthPosition: Vector3Tuple;
  moonPosition: Vector3Tuple;
  get earthOrbitSpeed(): number;
  get moonOrbitSpeed(): number;
  get sunEarthDistance(): number;
  setOrbitSpeed: (v: number) => void;
  setEarthScale: (v: number) => void;
  setMoonOrbitScale: (v: number) => void;
  setPositions: (sun: Vector3Tuple, earth: Vector3Tuple, moon: Vector3Tuple) => void;
  setAngles: (earthOrbit: number, moonOrbit: number, earthRot: number) => void;
  lerpParams: (delta: number) => void;
}

const EARTH_ORBIT_PERIOD = 12;
const MOON_ORBIT_PERIOD = 3;
const EARTH_ORBIT_RADIUS = 10;
const TRANSITION_DURATION = 0.15;

export const useCelestialStore = create<CelestialState>((set, get) => ({
  orbitSpeed: 1,
  earthScale: 1,
  moonOrbitScale: 1,
  targetOrbitSpeed: 1,
  targetEarthScale: 1,
  targetMoonOrbitScale: 1,
  earthOrbitAngle: 0,
  moonOrbitAngle: 0,
  earthRotation: 0,
  sunPosition: [0, 0, 0],
  earthPosition: [EARTH_ORBIT_RADIUS, 0, 0],
  moonPosition: [EARTH_ORBIT_RADIUS + 2.5, 0, 0],

  get earthOrbitSpeed() {
    return (360 / EARTH_ORBIT_PERIOD) * get().orbitSpeed;
  },

  get moonOrbitSpeed() {
    return (360 / MOON_ORBIT_PERIOD) * get().orbitSpeed;
  },

  get sunEarthDistance() {
    const [sx, sy, sz] = get().sunPosition;
    const [ex, ey, ez] = get().earthPosition;
    return Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2 + (ez - sz) ** 2);
  },

  setOrbitSpeed: (v) => set({ targetOrbitSpeed: v }),
  setEarthScale: (v) => set({ targetEarthScale: v }),
  setMoonOrbitScale: (v) => set({ targetMoonOrbitScale: v }),

  setPositions: (sun, earth, moon) => set({
    sunPosition: sun,
    earthPosition: earth,
    moonPosition: moon,
  }),

  setAngles: (earthOrbit, moonOrbit, earthRot) => set({
    earthOrbitAngle: earthOrbit,
    moonOrbitAngle: moonOrbit,
    earthRotation: earthRot,
  }),

  lerpParams: (delta) => {
    const state = get();
    const lerpFactor = Math.min(1, delta / TRANSITION_DURATION);

    const newOrbitSpeed = state.orbitSpeed + (state.targetOrbitSpeed - state.orbitSpeed) * lerpFactor;
    const newEarthScale = state.earthScale + (state.targetEarthScale - state.earthScale) * lerpFactor;
    const newMoonOrbitScale = state.moonOrbitScale + (state.targetMoonOrbitScale - state.moonOrbitScale) * lerpFactor;

    set({
      orbitSpeed: newOrbitSpeed,
      earthScale: newEarthScale,
      moonOrbitScale: newMoonOrbitScale,
    });
  },
}));
