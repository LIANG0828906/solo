import { create } from 'zustand';
import type {
  SpeciesConfig,
  Organism,
  ActivityState,
  EnvironmentData,
  InfoBubble,
  PopulationStats,
  BioStore,
} from '../../utils/types';

export const SPECIES_CONFIGS: SpeciesConfig[] = [
  {
    id: 'tubeworm',
    name: '管虫',
    color: '#C0392B',
    minCount: 3,
    maxCount: 5,
    minSize: 1,
    maxSize: 6,
    behavior: 'swaying',
    geometryType: 'box',
  },
  {
    id: 'mussel',
    name: '贻贝',
    color: '#8E44AD',
    minCount: 3,
    maxCount: 5,
    minSize: 1,
    maxSize: 4,
    behavior: 'stationary',
    geometryType: 'box',
  },
  {
    id: 'shrimp',
    name: '盲虾',
    color: '#D35400',
    minCount: 3,
    maxCount: 5,
    minSize: 1,
    maxSize: 3,
    behavior: 'wandering',
    geometryType: 'sphere',
  },
  {
    id: 'crab',
    name: '雪人蟹',
    color: '#BDC3C7',
    minCount: 3,
    maxCount: 5,
    minSize: 2,
    maxSize: 5,
    behavior: 'wandering',
    geometryType: 'sphere',
  },
  {
    id: 'fish',
    name: '热泉鱼',
    color: '#F39C12',
    minCount: 3,
    maxCount: 5,
    minSize: 1,
    maxSize: 4,
    behavior: 'wandering',
    geometryType: 'box',
  },
  {
    id: 'anemone',
    name: '海葵',
    color: '#16A085',
    minCount: 3,
    maxCount: 5,
    minSize: 2,
    maxSize: 6,
    behavior: 'swaying',
    geometryType: 'sphere',
  },
];

const ACTIVITY_STATES: ActivityState[] = ['foraging', 'floating', 'moving'];

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomPositionAroundVent(
  ventPosition: [number, number, number],
  minRadius: number,
  maxRadius: number,
): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  const radius = randomRange(minRadius, maxRadius);
  return [
    ventPosition[0] + Math.cos(angle) * radius,
    ventPosition[1] + randomRange(2, 15),
    ventPosition[2] + Math.sin(angle) * radius,
  ];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createOrganism(
  speciesConfig: SpeciesConfig,
  ventPosition: [number, number, number],
): Organism {
  const position = randomPositionAroundVent(ventPosition, 15, 120);
  const scale = randomRange(speciesConfig.minSize, speciesConfig.maxSize);
  const phase = Math.random() * Math.PI * 2;

  let activityState: ActivityState = 'floating';
  if (speciesConfig.behavior === 'wandering') {
    activityState = ACTIVITY_STATES[Math.floor(Math.random() * 3)];
  } else if (speciesConfig.behavior === 'swaying') {
    activityState = Math.random() > 0.5 ? 'foraging' : 'floating';
  }

  return {
    id: generateId(),
    speciesId: speciesConfig.id,
    position,
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    scale,
    activityState,
    basePosition: [...position] as [number, number, number],
    phase,
    velocity: [
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.5,
    ],
    swayPeriod: randomRange(2, 4),
    swayAmplitude: 0.2,
  };
}

function getActivityStateName(state: ActivityState): string {
  const map: Record<ActivityState, string> = {
    foraging: '觅食',
    floating: '悬浮',
    moving: '移动',
  };
  return map[state];
}

export { getActivityStateName };

export const useBioStore = create<BioStore>((set, get) => ({
  organisms: [],
  environmentData: {
    temperature: 500,
    h2s: 1.25,
    o2: 0.3,
  },
  infoBubbles: [],
  speciesConfigs: SPECIES_CONFIGS,

  initOrganisms: (ventPosition: [number, number, number]) => {
    const organisms: Organism[] = [];
    SPECIES_CONFIGS.forEach((config) => {
      const count = Math.floor(randomRange(config.minCount, config.maxCount + 1));
      for (let i = 0; i < count; i++) {
        organisms.push(createOrganism(config, ventPosition));
      }
    });
    set({ organisms });
  },

  updateOrganisms: (delta: number, bounds: { width: number; depth: number }) => {
    const state = get();
    const halfWidth = bounds.width / 2;
    const halfDepth = bounds.depth / 2;

    const updatedOrganisms = state.organisms.map((org) => {
      const config = SPECIES_CONFIGS.find((c) => c.id === org.speciesId);
      if (!config) return org;

      const newOrg = { ...org };
      const time = Date.now() / 1000;

      switch (config.behavior) {
        case 'swaying': {
          const sway = Math.sin(time * (Math.PI * 2 / org.swayPeriod) + org.phase) * org.swayAmplitude;
          newOrg.position = [
            org.basePosition[0] + sway,
            org.basePosition[1] + Math.sin(time * 0.8 + org.phase) * org.swayAmplitude * 0.5,
            org.basePosition[2] + Math.cos(time * (Math.PI * 2 / org.swayPeriod) + org.phase) * org.swayAmplitude,
          ];
          newOrg.rotation = [
            org.rotation[0],
            Math.sin(time + org.phase) * 0.2,
            Math.cos(time * 0.7 + org.phase) * 0.2,
          ];
          break;
        }
        case 'wandering': {
          const speed = 0.5 * delta * 60;
          let [x, y, z] = newOrg.position;
          let [vx, vy, vz] = newOrg.velocity;

          x += vx * speed;
          y += vy * speed;
          z += vz * speed;

          if (x < -halfWidth + 10 || x > halfWidth - 10) {
            vx = -vx;
            x = Math.max(-halfWidth + 10, Math.min(halfWidth - 10, x));
          }
          if (y < 5 || y > 80) {
            vy = -vy;
            y = Math.max(5, Math.min(80, y));
          }
          if (z < -halfDepth + 10 || z > halfDepth - 10) {
            vz = -vz;
            z = Math.max(-halfDepth + 10, Math.min(halfDepth - 10, z));
          }

          if (Math.random() < 0.01) {
            vx = (Math.random() - 0.5) * 0.5;
            vy = (Math.random() - 0.5) * 0.1;
            vz = (Math.random() - 0.5) * 0.5;
          }

          newOrg.position = [x, y, z];
          newOrg.velocity = [vx, vy, vz];
          newOrg.rotation = [
            newOrg.rotation[0],
            Math.atan2(vx, vz),
            newOrg.rotation[2],
          ];
          newOrg.activityState = Math.random() < 0.005
            ? ACTIVITY_STATES[Math.floor(Math.random() * 3)]
            : newOrg.activityState;
          break;
        }
        case 'stationary':
        default:
          newOrg.activityState = 'floating';
          break;
      }

      return newOrg;
    });

    set({ organisms: updatedOrganisms });
  },

  updateEnvironmentData: () => {
    set({
      environmentData: {
        temperature: randomRange(400, 600),
        h2s: randomRange(0.5, 2.0),
        o2: randomRange(0.1, 0.5),
      },
    });
  },

  addInfoBubble: (organismId: string) => {
    const state = get();
    const organism = state.organisms.find((o) => o.id === organismId);
    if (!organism) return;

    const species = SPECIES_CONFIGS.find((s) => s.id === organism.speciesId);
    if (!species) return;

    const count = state.organisms.filter((o) => o.speciesId === organism.speciesId).length;

    const existingBubbleIndex = state.infoBubbles.findIndex((b) => b.organismId === organismId);
    let newBubbles = [...state.infoBubbles];
    if (existingBubbleIndex >= 0) {
      newBubbles.splice(existingBubbleIndex, 1);
    }

    const newBubble: InfoBubble = {
      id: generateId(),
      organismId,
      position: [...organism.position] as [number, number, number],
      content: {
        name: species.name,
        count,
        activityState: organism.activityState,
      },
      opacity: 1,
      createdAt: Date.now(),
    };

    newBubbles.push(newBubble);
    set({ infoBubbles: newBubbles });
  },

  updateInfoBubbles: () => {
    const state = get();
    const now = Date.now();
    const DURATION = 3000;

    const updatedBubbles = state.infoBubbles
      .map((bubble) => {
        const age = now - bubble.createdAt;
        if (age > DURATION) return null;
        const fadeStart = DURATION - 500;
        const opacity = age > fadeStart ? 1 - (age - fadeStart) / 500 : 1;
        const organism = state.organisms.find((o) => o.id === bubble.organismId);
        return {
          ...bubble,
          opacity,
          position: organism
            ? ([organism.position[0], organism.position[1] + organism.scale * 1.5 + 3, organism.position[2]] as [number, number, number])
            : bubble.position,
        };
      })
      .filter((b): b is InfoBubble => b !== null);

    set({ infoBubbles: updatedBubbles });
  },

  getPopulationStats: (): PopulationStats[] => {
    const state = get();
    return SPECIES_CONFIGS.map((config) => ({
      speciesId: config.id,
      count: state.organisms.filter((o) => o.speciesId === config.id).length,
    }));
  },

  getSpeciesConfig: (speciesId: string): SpeciesConfig | undefined => {
    return SPECIES_CONFIGS.find((c) => c.id === speciesId);
  },
}));
