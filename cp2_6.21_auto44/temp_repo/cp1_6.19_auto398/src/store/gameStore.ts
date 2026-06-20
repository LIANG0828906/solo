import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  type GameState,
  type Position,
  type BattleAnimation,
  type MonsterState
} from '../types';
import {
  createInitialGameState,
  isWalkable,
  checkBattle,
  resolveBattle,
  checkVictory,
  updatePlayerStateFromLighting,
  updateBubbleTimers,
  updateBattleAnimation
} from '../game/engine';
import { calculateLighting, getLightIntensityAt } from '../game/lighting';
import { makeMonsterDecision } from '../game/ai';

export interface AudioContextState {
  context: AudioContext | null;
}

const audioCtx: AudioContextState = { context: null };

export function getAudioContext(): AudioContext {
  if (!audioCtx.context) {
    audioCtx.context = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx.context;
}

export function playSound(type: 'move' | 'battle' | 'victory' | 'defeat' | 'stateChange' | 'monsterDeath'): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    
    switch (type) {
      case 'move':
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
        break;
      case 'battle':
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        break;
      case 'victory':
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        break;
      case 'defeat':
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.9);
        break;
      case 'stateChange':
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
        break;
      case 'monsterDeath':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
        break;
    }
  } catch (e) {
    // ignore audio errors
  }
}

interface GameStore {
  state: GameState;
  lightingDirty: boolean;
  defeatTransition: number;
  lastAiUpdate: number;
  
  movePlayer: (direction: 'up' | 'down' | 'left' | 'right') => void;
  tick: (dt: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    state: createInitialGameState(),
    lightingDirty: true,
    defeatTransition: 0,
    lastAiUpdate: 0,
    
    movePlayer: (direction) => {
      set((s) => {
        const { state } = s;
        if (state.phase !== 'playing') return;
        if (state.player.targetPosition !== null) return;
        if (state.battleAnimation && state.battleAnimation.active) return;
        
        let newPos: Position = { ...state.player.position };
        switch (direction) {
          case 'up': newPos.y -= 1; break;
          case 'down': newPos.y += 1; break;
          case 'left': newPos.x -= 1; break;
          case 'right': newPos.x += 1; break;
        }
        
        if (!isWalkable(state.map, newPos)) return;
        if (state.monsters.some(m => m.alive && m.position.x === newPos.x && m.position.y === newPos.y)) return;
        
        state.player.targetPosition = newPos;
        state.player.movingProgress = 0;
        s.lightingDirty = true;
        playSound('move');
      });
    },
    
    tick: (dt) => {
      set((s) => {
        const { state } = s;
        if (state.phase === 'defeat') {
          s.defeatTransition = Math.min(1, s.defeatTransition + dt);
          return;
        }
        if (state.phase !== 'playing') return;
        
        state.time += dt;
        
        updateBubbleTimers(state.monsters, dt);
        state.battleAnimation = updateBattleAnimation(state.battleAnimation, dt);
        
        const lighting = calculateLighting(state.torches, state.player.position, state.player.hasLantern);
        s.lightingDirty = false;
        
        const oldPlayerState = state.player.state;
        const playerLight = getLightIntensityAt(lighting, state.player.position);
        updatePlayerStateFromLighting(state.player, playerLight);
        if (oldPlayerState !== state.player.state) {
          playSound('stateChange');
        }
        
        if (state.player.targetPosition) {
          state.player.movingProgress += dt * state.player.speed;
          if (state.player.movingProgress >= 1) {
            state.player.position = state.player.targetPosition;
            state.player.targetPosition = null;
            state.player.movingProgress = 0;
            
            const battleCheck = checkBattle(state.player, state.monsters);
            if (battleCheck.triggered && battleCheck.monsterId) {
              playSound('battle');
              state.battleAnimation = {
                active: true,
                progress: 0,
                monsterId: battleCheck.monsterId,
                playerShake: 0,
                monsterShake: 0
              };
              const result = resolveBattle(state.player, state.monsters, battleCheck.monsterId);
              if (result.monsterDied) {
                playSound('monsterDeath');
              }
              if (result.playerDied) {
                state.phase = 'defeat';
                playSound('defeat');
              }
            }
          }
        }
        
        s.lastAiUpdate += dt;
        if (s.lastAiUpdate >= 0.2 && state.phase === 'playing') {
          s.lastAiUpdate = 0;
          
          for (const monster of state.monsters) {
            if (!monster.alive) continue;
            if (monster.targetPosition !== null) continue;
            
            const decision = makeMonsterDecision(monster, state.player, state.map, state.torches, lighting);
            if (decision.nextPosition) {
              const occupied = state.monsters.some(m => 
                m.alive && m.id !== monster.id && 
                m.position.x === decision.nextPosition!.x && m.position.y === decision.nextPosition!.y
              );
              const playerThere = state.player.position.x === decision.nextPosition.x && 
                                 state.player.position.y === decision.nextPosition.y;
              const targetThere = state.player.targetPosition && 
                                  state.player.targetPosition.x === decision.nextPosition.x && 
                                  state.player.targetPosition.y === decision.nextPosition.y;
              if (!occupied && !playerThere && !targetThere) {
                monster.targetPosition = decision.nextPosition;
                monster.movingProgress = 0;
              }
            }
          }
        }
        
        for (const monster of state.monsters) {
          if (!monster.alive) continue;
          if (!monster.targetPosition) continue;
          
          let speed = monster.speed;
          if (monster.state === 'chasing') {
            speed = monster.type === 'lightChaser' ? state.player.speed * 1.2 : state.player.speed * 1.5;
          } else if (monster.state === 'retreating') {
            speed = state.player.speed;
          }
          
          monster.movingProgress += dt * speed;
          if (monster.movingProgress >= 1) {
            monster.position = monster.targetPosition;
            monster.targetPosition = null;
            monster.movingProgress = 0;
            
            const battleCheck = checkBattle(state.player, state.monsters);
            if (battleCheck.triggered && battleCheck.monsterId && state.phase === 'playing') {
              playSound('battle');
              state.battleAnimation = {
                active: true,
                progress: 0,
                monsterId: battleCheck.monsterId,
                playerShake: 0,
                monsterShake: 0
              };
              const result = resolveBattle(state.player, state.monsters, battleCheck.monsterId);
              if (result.monsterDied) {
                playSound('monsterDeath');
              }
              if (result.playerDied) {
                state.phase = 'defeat';
                playSound('defeat');
              }
            }
          }
        }
        
        if (state.phase === 'playing' && checkVictory(state.player, state.monsters, state.exitPosition)) {
          state.phase = 'victory';
          playSound('victory');
        }
      });
    },
    
    resetGame: () => {
      set((s) => {
        s.state = createInitialGameState();
        s.lightingDirty = true;
        s.defeatTransition = 0;
        s.lastAiUpdate = 0;
      });
    }
  }))
);
