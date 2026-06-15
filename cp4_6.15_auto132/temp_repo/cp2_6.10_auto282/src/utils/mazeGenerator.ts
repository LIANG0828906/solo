import type { Crystal, LightBeam, MazeConfig } from '@/types/game';

const generateId = (): string => Math.random().toString(36).substring(2, 11);

export const getMazeConfig = (level: number): MazeConfig => {
  const baseSize = 10;
  const baseRotationSpeed = 0.05;
  const baseBeamCount = 6;
  const baseCrystalCount = 5;

  return {
    size: baseSize + Math.floor(level / 2),
    rotationSpeed: baseRotationSpeed + level * 0.008,
    beamCount: baseBeamCount + level * 2,
    crystalCount: baseCrystalCount + Math.floor(level / 2),
    minFlashFrequency: 0.5 + level * 0.15,
    maxFlashFrequency: 1.5 + level * 0.2,
  };
};

export const generateCrystals = (config: MazeConfig): Crystal[] => {
  const crystals: Crystal[] = [];
  const halfSize = config.size / 2;

  for (let i = 0; i < config.crystalCount; i++) {
    crystals.push({
      id: generateId(),
      position: [
        (Math.random() - 0.5) * (config.size - 2),
        Math.random() * (halfSize - 1) + 0.5,
        (Math.random() - 0.5) * (config.size - 2),
      ],
      collected: false,
    });
  }

  return crystals;
};

export const generateLightBeams = (config: MazeConfig): LightBeam[] => {
  const beams: LightBeam[] = [];
  const halfSize = config.size / 2;

  for (let i = 0; i < config.beamCount; i++) {
    const isHorizontal = Math.random() > 0.5;
    const height = Math.random() * (halfSize * 0.8) + 0.5;

    beams.push({
      id: generateId(),
      position: [
        (Math.random() - 0.5) * (config.size - 2),
        height,
        (Math.random() - 0.5) * (config.size - 2),
      ],
      rotation: [
        0,
        Math.random() * Math.PI,
        isHorizontal ? Math.PI / 2 : 0,
      ],
      scale: isHorizontal ? [config.size * 0.8, 0.15, 0.15] : [0.15, height * 2, 0.15],
      flashFrequency:
        config.minFlashFrequency +
        Math.random() * (config.maxFlashFrequency - config.minFlashFrequency),
      phase: Math.random() * Math.PI * 2,
    });
  }

  return beams;
};

export const generatePlatform = (config: MazeConfig): [number, number, number][] => {
  const platforms: [number, number, number][] = [];
  const halfSize = config.size / 2;

  platforms.push([0, -0.25, 0]);

  const platformCount = 3 + Math.floor(config.size / 4);
  for (let i = 0; i < platformCount; i++) {
    platforms.push([
      (Math.random() - 0.5) * (config.size - 3),
      Math.random() * (halfSize - 1) + 1,
      (Math.random() - 0.5) * (config.size - 3),
    ]);
  }

  return platforms;
};
