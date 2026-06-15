import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Fragment, Artifact, Note, GridCell, Particle, CERAMIC_COLORS, ARTIFACT_PRESETS } from './types';

interface AppState {
  grid: GridCell[][];
  fragments: Fragment[];
  pickedFragments: Fragment[];
  artifacts: Artifact[];
  notes: Note[];
  particles: Particle[];
  currentArtifact: Artifact | null;
  selectedTag: string | null;
  isMobile: boolean;
  isJournalExpanded: boolean;
  viewingArtifact: Artifact | null;
  initGrid: () => void;
  excavateCell: (x: number, y: number) => void;
  pickFragment: (fragment: Fragment) => void;
  rotateFragment: (fragmentId: string) => void;
  placeFragment: (fragmentId: string, x: number, y: number) => void;
  addNote: (title: string, content: string, tags: string[]) => void;
  setSelectedTag: (tag: string | null) => void;
  addParticles: (particles: Particle[]) => void;
  updateParticles: () => void;
  setIsMobile: (isMobile: boolean) => void;
  toggleJournal: () => void;
  setViewingArtifact: (artifact: Artifact | null) => void;
  resetExcavation: () => void;
}

const GRID_SIZE = 10;

const generateFragmentShape = (): number[][] => {
  const points: number[][] = [];
  const sides = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const radius = 0.5 + Math.random() * 0.5;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return points;
};

const generateFragments = (artifact: Artifact, count: number, grid: GridCell[][]): Fragment[] => {
  const fragments: Fragment[] = [];
  const color = CERAMIC_COLORS[Math.floor(Math.random() * CERAMIC_COLORS.length)];
  
  const availableCells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!grid[y][x].isExcavated && !grid[y][x].fragment) {
        availableCells.push({ x, y });
      }
    }
  }
  
  for (let i = 0; i < count && i < availableCells.length; i++) {
    const idx = Math.floor(Math.random() * availableCells.length);
    const cell = availableCells.splice(idx, 1)[0];
    const angle = (i / count) * Math.PI * 2;
    const radius = 30 + Math.random() * 20;
    
    fragments.push({
      id: uuidv4(),
      artifactId: artifact.id,
      shape: generateFragmentShape(),
      color,
      size: 20 + Math.random() * 10,
      rotation: Math.floor(Math.random() * 4) * 90,
      targetX: 50 + Math.cos(angle) * radius,
      targetY: 50 + Math.sin(angle) * radius,
      targetRotation: i * (360 / count),
      currentX: 0,
      currentY: 0,
      isPlaced: false,
      isPicked: false,
      gridX: cell.x,
      gridY: cell.y,
    });
  }
  
  return fragments;
};

export const useStore = create<AppState>((set, get) => ({
  grid: [],
  fragments: [],
  pickedFragments: [],
  artifacts: [],
  notes: [],
  particles: [],
  currentArtifact: null,
  selectedTag: null,
  isMobile: false,
  isJournalExpanded: false,
  viewingArtifact: null,

  initGrid: () => {
    const grid: GridCell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[y][x] = { x, y, isExcavated: false };
      }
    }

    const preset = ARTIFACT_PRESETS[Math.floor(Math.random() * ARTIFACT_PRESETS.length)];
    const newArtifact: Artifact = {
      id: uuidv4(),
      name: preset.name,
      dynasty: preset.dynasty,
      year: preset.year,
      fragments: [],
      color: CERAMIC_COLORS[Math.floor(Math.random() * CERAMIC_COLORS.length)],
    };

    const fragments = generateFragments(newArtifact, preset.fragmentCount, grid);
    fragments.forEach((f) => {
      grid[f.gridY][f.gridX].fragment = f;
    });
    newArtifact.fragments = fragments;

    set({ grid, fragments, currentArtifact: newArtifact });
  },

  excavateCell: (x: number, y: number) => {
    const { grid, particles } = get();
    if (grid[y][x].isExcavated) return;

    const newGrid = grid.map((row) => [...row]);
    newGrid[y][x] = { ...newGrid[y][x], isExcavated: true };

    const newParticles: Particle[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      newParticles.push({
        id: uuidv4(),
        x: x * 41 + 20,
        y: y * 41 + 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: '#8B7355',
        size: 4 + Math.random() * 4,
        opacity: 1,
        life: 0,
        maxLife: 30,
      });
    }

    set({ grid: newGrid, particles: [...particles, ...newParticles] });
  },

  pickFragment: (fragment: Fragment) => {
    const { fragments, pickedFragments } = get();
    
    const updatedFragments = fragments.map((f) =>
      f.id === fragment.id ? { ...f, isPicked: true } : f
    );
    
    const picked = { ...fragment, isPicked: true };
    
    set({
      fragments: updatedFragments,
      pickedFragments: [...pickedFragments, picked],
    });
  },

  rotateFragment: (fragmentId: string) => {
    const { pickedFragments } = get();
    const updated = pickedFragments.map((f) =>
      f.id === fragmentId ? { ...f, rotation: (f.rotation + 90) % 360 } : f
    );
    set({ pickedFragments: updated });
  },

  placeFragment: (fragmentId: string, x: number, y: number) => {
    const { pickedFragments, currentArtifact, artifacts, particles } = get();
    const fragment = pickedFragments.find((f) => f.id === fragmentId);
    if (!fragment) return;

    const posError = Math.sqrt(
      Math.pow(x - fragment.targetX, 2) + Math.pow(y - fragment.targetY, 2)
    );
    const rotDiff = Math.abs(
      ((fragment.rotation - fragment.targetRotation + 540) % 360) - 180
    );
    const rotError = Math.min(rotDiff, 360 - rotDiff);

    if (posError <= 10 && rotError <= 15) {
      const updatedFragments = pickedFragments.map((f) =>
        f.id === fragmentId
          ? { ...f, isPlaced: true, currentX: fragment.targetX, currentY: fragment.targetY, rotation: fragment.targetRotation }
          : f
      );

      const glowParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        glowParticles.push({
          id: uuidv4(),
          x: 200 + (fragment.targetX - 50) * 2,
          y: 200 + (fragment.targetY - 50) * 2,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          color: i % 2 === 0 ? '#FFD700' : '#FFA500',
          size: 3,
          opacity: 1,
          life: 0,
          maxLife: 60,
        });
      }

      const allPlaced = updatedFragments.every((f) => f.isPlaced);
      let newArtifacts = artifacts;
      let completionParticles: Particle[] = [];

      if (allPlaced && currentArtifact) {
        const completedArtifact = {
          ...currentArtifact,
          fragments: updatedFragments,
          completedAt: Date.now(),
        };
        newArtifacts = [...artifacts, completedArtifact];

        for (let i = 0; i < 100; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          completionParticles.push({
            id: uuidv4(),
            x: 200,
            y: 200,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E64'][Math.floor(Math.random() * 4)],
            size: 1.5,
            opacity: 1,
            life: 0,
            maxLife: 90,
          });
        }
      }

      set({
        pickedFragments: updatedFragments,
        particles: [...particles, ...glowParticles, ...completionParticles],
        artifacts: newArtifacts,
      });
    }
  },

  addNote: (title: string, content: string, tags: string[]) => {
    const { notes } = get();
    const newNote: Note = {
      id: uuidv4(),
      title,
      content,
      timestamp: Date.now(),
      tags,
    };
    set({ notes: [newNote, ...notes] });
  },

  setSelectedTag: (tag: string | null) => {
    set({ selectedTag: tag });
  },

  addParticles: (newParticles: Particle[]) => {
    const { particles } = get();
    set({ particles: [...particles, ...newParticles] });
  },

  updateParticles: () => {
    const { particles } = get();
    const updated = particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.1,
        life: p.life + 1,
        opacity: 1 - p.life / p.maxLife,
      }))
      .filter((p) => p.life < p.maxLife);
    set({ particles: updated });
  },

  setIsMobile: (isMobile: boolean) => {
    set({ isMobile });
  },

  toggleJournal: () => {
    const { isJournalExpanded } = get();
    set({ isJournalExpanded: !isJournalExpanded });
  },

  setViewingArtifact: (artifact: Artifact | null) => {
    set({ viewingArtifact: artifact });
  },

  resetExcavation: () => {
    get().initGrid();
    set({ pickedFragments: [], viewingArtifact: null });
  },
}));
