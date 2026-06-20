import { create } from 'zustand';
import { produce } from 'immer';
import { Block, GravityDirection, Position, TargetArea, BlockType, BLOCK_COLORS, GRAVITY_ORDER } from '../types';
import { applyGravity, checkComplete, rotateBlockShape, canPlaceBlock, getBlockCells } from '../game/gravityEngine';
import { puzzleLevels } from '../game/puzzleData';

interface GameState {
  currentLevel: number;
  blocks: Block[];
  obstacles: Position[];
  targetArea: TargetArea;
  gridSize: number;
  steps: number;
  gravityDirection: GravityDirection;
  isComplete: boolean;
  isAnimating: boolean;
  showParticles: boolean;
  totalLevels: number;
  reset: () => void;
  nextLevel: () => void;
  setGravity: (dir: GravityDirection) => void;
  cycleGravity: () => void;
  rotateBlock: (blockId: string) => void;
  moveBlock: (blockId: string, dx: number, dy: number) => void;
  triggerParticles: () => void;
  hideParticles: () => void;
}

function createBlocksFromLevel(
  levelBlocks: { type: BlockType; position: Position; rotation: number }[]
): Block[] {
  return levelBlocks.map((lb, index) => ({
    id: `block-${index}-${Date.now()}`,
    type: lb.type,
    position: { ...lb.position },
    rotation: lb.rotation,
    color: BLOCK_COLORS[lb.type],
  }));
}

function loadLevel(levelIndex: number): {
  blocks: Block[];
  obstacles: Position[];
  targetArea: TargetArea;
  gridSize: number;
} {
  const level = puzzleLevels[levelIndex];
  return {
    blocks: createBlocksFromLevel(level.blocks),
    obstacles: level.obstacles.map((o) => ({ ...o })),
    targetArea: { ...level.targetArea },
    gridSize: level.gridSize,
  };
}

export const useGameStore = create<GameState>((set, get) => {
  const initialLevel = loadLevel(0);

  return {
    currentLevel: 0,
    blocks: initialLevel.blocks,
    obstacles: initialLevel.obstacles,
    targetArea: initialLevel.targetArea,
    gridSize: initialLevel.gridSize,
    steps: 0,
    gravityDirection: 'down',
    isComplete: false,
    isAnimating: false,
    showParticles: false,
    totalLevels: puzzleLevels.length,

    reset: () => {
      const state = get();
      const levelData = loadLevel(state.currentLevel);
      set(
        produce((draft) => {
          draft.blocks = levelData.blocks;
          draft.obstacles = levelData.obstacles;
          draft.targetArea = levelData.targetArea;
          draft.gridSize = levelData.gridSize;
          draft.steps = 0;
          draft.gravityDirection = 'down';
          draft.isComplete = false;
          draft.isAnimating = false;
          draft.showParticles = false;
        })
      );
    },

    nextLevel: () => {
      const state = get();
      const nextLevelIndex = state.currentLevel + 1;
      if (nextLevelIndex < puzzleLevels.length) {
        const levelData = loadLevel(nextLevelIndex);
        set(
          produce((draft) => {
            draft.currentLevel = nextLevelIndex;
            draft.blocks = levelData.blocks;
            draft.obstacles = levelData.obstacles;
            draft.targetArea = levelData.targetArea;
            draft.gridSize = levelData.gridSize;
            draft.steps = 0;
            draft.gravityDirection = 'down';
            draft.isComplete = false;
            draft.isAnimating = false;
            draft.showParticles = false;
          })
        );
      }
    },

    setGravity: (dir: GravityDirection) => {
      const state = get();
      if (state.isAnimating || state.isComplete) return;

      set(
        produce((draft) => {
          draft.isAnimating = true;
          draft.gravityDirection = dir;
          draft.steps += 1;
        })
      );

      requestAnimationFrame(() => {
        const currentState = get();
        const result = applyGravity(
          currentState.blocks,
          currentState.obstacles,
          currentState.gridSize,
          dir
        );

        set(
          produce((draft) => {
            draft.blocks = result.blocks;
            draft.isAnimating = false;
          })
        );

        setTimeout(() => {
          const afterState = get();
          const complete = checkComplete(afterState.blocks, afterState.targetArea);
          if (complete) {
            set(
              produce((draft) => {
                draft.isComplete = true;
                draft.showParticles = true;
              })
            );
          }
        }, 50);
      });
    },

    cycleGravity: () => {
      const state = get();
      const currentIndex = GRAVITY_ORDER.indexOf(state.gravityDirection);
      const nextIndex = (currentIndex + 1) % GRAVITY_ORDER.length;
      get().setGravity(GRAVITY_ORDER[nextIndex]);
    },

    rotateBlock: (blockId: string) => {
      const state = get();
      if (state.isAnimating || state.isComplete) return;

      const block = state.blocks.find((b) => b.id === blockId);
      if (!block) return;

      const rotated = rotateBlockShape(
        block,
        state.blocks,
        state.obstacles,
        state.gridSize
      );

      if (rotated) {
        set(
          produce((draft) => {
            const index = draft.blocks.findIndex((b: Block) => b.id === blockId);
            if (index !== -1) {
              draft.blocks[index] = rotated;
              draft.steps += 1;
              draft.isAnimating = true;
            }
          })
        );

        requestAnimationFrame(() => {
          const currentState = get();
          const result = applyGravity(
            currentState.blocks,
            currentState.obstacles,
            currentState.gridSize,
            currentState.gravityDirection
          );

          set(
            produce((draft) => {
              draft.blocks = result.blocks;
              draft.isAnimating = false;
            })
          );

          setTimeout(() => {
            const afterState = get();
            const complete = checkComplete(afterState.blocks, afterState.targetArea);
            if (complete) {
              set(
                produce((draft) => {
                  draft.isComplete = true;
                  draft.showParticles = true;
                })
              );
            }
          }, 50);
        });
      }
    },

    moveBlock: (blockId: string, dx: number, dy: number) => {
      const state = get();
      if (state.isAnimating || state.isComplete) return;

      const block = state.blocks.find((b) => b.id === blockId);
      if (!block) return;

      const movedBlock: Block = {
        ...block,
        position: {
          x: block.position.x + dx,
          y: block.position.y + dy,
        },
      };

      const obstacleSet = new Set(state.obstacles.map((o) => `${o.x},${o.y}`));
      const otherBlocks = state.blocks.filter((b) => b.id !== blockId);
      const otherOccupied = new Set<string>();
      otherBlocks.forEach((b) => {
        getBlockCells(b).forEach((cell) => {
          otherOccupied.add(`${cell.x},${cell.y}`);
        });
      });

      if (canPlaceBlock(movedBlock, otherOccupied, obstacleSet, state.gridSize)) {
        set(
          produce((draft) => {
            const index = draft.blocks.findIndex((b: Block) => b.id === blockId);
            if (index !== -1) {
              draft.blocks[index] = movedBlock;
              draft.steps += 1;
              draft.isAnimating = true;
            }
          })
        );

        requestAnimationFrame(() => {
          const currentState = get();
          const result = applyGravity(
            currentState.blocks,
            currentState.obstacles,
            currentState.gridSize,
            currentState.gravityDirection
          );

          set(
            produce((draft) => {
              draft.blocks = result.blocks;
              draft.isAnimating = false;
            })
          );

          setTimeout(() => {
            const afterState = get();
            const complete = checkComplete(afterState.blocks, afterState.targetArea);
            if (complete) {
              set(
                produce((draft) => {
                  draft.isComplete = true;
                  draft.showParticles = true;
                })
              );
            }
          }, 50);
        });
      }
    },

    triggerParticles: () => {
      set(
        produce((draft) => {
          draft.showParticles = true;
        })
      );
    },

    hideParticles: () => {
      set(
        produce((draft) => {
          draft.showParticles = false;
        })
      );
    },
  };
});
