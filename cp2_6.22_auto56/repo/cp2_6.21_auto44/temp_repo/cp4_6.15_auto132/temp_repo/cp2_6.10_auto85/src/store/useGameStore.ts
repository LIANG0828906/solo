import { create } from 'zustand';

export interface Player {
  id: number;
  team: 'player' | 'ai' | 'goalkeeper';
  number: number;
  position: { x: number; z: number };
  targetPosition: { x: number; z: number };
  velocity: { x: number; z: number };
  energy: number;
  hasBall: boolean;
  isSliding: boolean;
  slideTimer: number;
  defaultFormationX: number;
  defaultFormationZ: number;
}

export interface Ball {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  lastTouchedBy: number | null;
}

export type Tactics = 'defense' | 'midfield' | 'offense';

export interface GameState {
  score: { player: number; ai: number };
  gameTime: number;
  isPaused: boolean;
  pauseTimer: number;
  currentTactics: Tactics;
  tacticsTransition: number;
  ball: Ball;
  players: Player[];
  broadcastMessage: string | null;
  broadcastTimer: number;
  selectedPlayerId: number | null;
  isDragging: boolean;
  dragStartPos: { x: number; z: number } | null;
}

export interface GameActions {
  setSelectedPlayer: (id: number | null) => void;
  setPlayerTargetPosition: (id: number, x: number, z: number) => void;
  setBallVelocity: (x: number, y: number, z: number) => void;
  passOrShoot: (targetX: number, targetZ: number, power: number) => void;
  changeTactics: (tactics: Tactics) => void;
  updateGame: (deltaTime: number) => void;
  setDragging: (dragging: boolean, startPos?: { x: number; z: number }) => void;
  resetBall: () => void;
  scoreGoal: (team: 'player' | 'ai') => void;
  showBroadcast: (message: string) => void;
}

const createInitialPlayers = (): Player[] => {
  const players: Player[] = [];
  
  for (let i = 0; i < 5; i++) {
    players.push({
      id: i,
      team: 'player',
      number: i + 1,
      position: { x: -6 + i * 0.5, z: -3 + i * 1.5 },
      targetPosition: { x: -6 + i * 0.5, z: -3 + i * 1.5 },
      velocity: { x: 0, z: 0 },
      energy: 100,
      hasBall: i === 0,
      isSliding: false,
      slideTimer: 0,
      defaultFormationX: -5,
      defaultFormationZ: -3 + i * 1.5,
    });
  }
  
  for (let i = 0; i < 5; i++) {
    players.push({
      id: i + 5,
      team: 'ai',
      number: i + 1,
      position: { x: 6 - i * 0.5, z: -3 + i * 1.5 },
      targetPosition: { x: 6 - i * 0.5, z: -3 + i * 1.5 },
      velocity: { x: 0, z: 0 },
      energy: 100,
      hasBall: false,
      isSliding: false,
      slideTimer: 0,
      defaultFormationX: 5,
      defaultFormationZ: -3 + i * 1.5,
    });
  }
  
  players.push({
    id: 10,
    team: 'goalkeeper',
    number: 1,
    position: { x: -9.5, z: 0 },
    targetPosition: { x: -9.5, z: 0 },
    velocity: { x: 0, z: 0 },
    energy: 100,
    hasBall: false,
    isSliding: false,
    slideTimer: 0,
    defaultFormationX: -9.5,
    defaultFormationZ: 0,
  });
  
  players.push({
    id: 11,
    team: 'goalkeeper',
    number: 2,
    position: { x: 9.5, z: 0 },
    targetPosition: { x: 9.5, z: 0 },
    velocity: { x: 0, z: 0 },
    energy: 100,
    hasBall: false,
    isSliding: false,
    slideTimer: 0,
    defaultFormationX: 9.5,
    defaultFormationZ: 0,
  });
  
  return players;
};

const createInitialBall = (): Ball => ({
  position: { x: -6, y: 0.3, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  lastTouchedBy: 0,
});

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  score: { player: 0, ai: 0 },
  gameTime: 0,
  isPaused: false,
  pauseTimer: 0,
  currentTactics: 'midfield',
  tacticsTransition: 1,
  ball: createInitialBall(),
  players: createInitialPlayers(),
  broadcastMessage: null,
  broadcastTimer: 0,
  selectedPlayerId: null,
  isDragging: false,
  dragStartPos: null,

  setSelectedPlayer: (id) => set({ selectedPlayerId: id }),

  setPlayerTargetPosition: (id, x, z) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, targetPosition: { x, z } } : p
      ),
    })),

  setBallVelocity: (x, y, z) =>
    set((state) => ({
      ball: { ...state.ball, velocity: { x, y, z } },
    })),

  setDragging: (dragging, startPos) =>
    set({ isDragging: dragging, dragStartPos: startPos || null }),

  passOrShoot: (targetX, targetZ, power) => {
    const state = get();
    const playerWithBall = state.players.find((p) => p.hasBall);
    if (!playerWithBall) return;

    const dx = targetX - playerWithBall.position.x;
    const dz = targetZ - playerWithBall.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist === 0) return;

    const speed = Math.min(power * 0.8, 25);
    const vx = (dx / dist) * speed;
    const vz = (dz / dist) * speed;

    set((state) => ({
      ball: {
        ...state.ball,
        velocity: { x: vx, y: 0, z: vz },
        lastTouchedBy: playerWithBall.id,
      },
      players: state.players.map((p) =>
        p.id === playerWithBall.id ? { ...p, hasBall: false } : p
      ),
    }));
  },

  changeTactics: (tactics) => {
    const state = get();
    if (state.currentTactics === tactics) return;

    const tacticsXOffset: Record<Tactics, number> = {
      defense: -8,
      midfield: -2,
      offense: 4,
    };

    set((state) => ({
      currentTactics: tactics,
      tacticsTransition: 0,
      players: state.players.map((p) => {
        if (p.team === 'player') {
          const newX = tacticsXOffset[tactics] + (p.defaultFormationX + 5);
          return {
            ...p,
            targetPosition: { x: newX, z: p.defaultFormationZ },
          };
        }
        return p;
      }),
    }));
  },

  resetBall: () =>
    set((state) => ({
      ball: createInitialBall(),
      players: state.players.map((p) => ({
        ...p,
        hasBall: p.id === 0,
        position: {
          x: p.team === 'player' ? -6 + (p.id % 5) * 0.5 : 6 - (p.id % 5) * 0.5,
          z: -3 + (p.id % 5) * 1.5,
        },
        targetPosition: {
          x: p.team === 'player' ? -6 + (p.id % 5) * 0.5 : 6 - (p.id % 5) * 0.5,
          z: -3 + (p.id % 5) * 1.5,
        },
      })),
    })),

  scoreGoal: (team) => {
    const state = get();
    const newScore = { ...state.score };
    if (team === 'player') {
      newScore.player += 1;
    } else {
      newScore.ai += 1;
    }
    set({ score: newScore });
    get().showBroadcast(`进球！黄队 ${newScore.player} : ${newScore.ai} 红队`);
    setTimeout(() => get().resetBall(), 2000);
  },

  showBroadcast: (message) =>
    set({ broadcastMessage: message, broadcastTimer: 3 }),

  updateGame: (deltaTime) => {
    const state = get();
    if (state.isPaused) {
      const newPauseTimer = state.pauseTimer - deltaTime;
      if (newPauseTimer <= 0) {
        set({ isPaused: false, pauseTimer: 0 });
      } else {
        set({ pauseTimer: newPauseTimer });
      }
      return;
    }

    const dt = Math.min(deltaTime, 0.05);
    let newGameTime = state.gameTime + dt;

    let newBroadcastMessage = state.broadcastMessage;
    let newBroadcastTimer = state.broadcastTimer;
    if (newBroadcastTimer > 0) {
      newBroadcastTimer -= dt;
      if (newBroadcastTimer <= 0) {
        newBroadcastMessage = null;
      }
    }

    let newTacticsTransition = Math.min(state.tacticsTransition + dt * 2, 1);

    const players = [...state.players];
    const ball = { ...state.ball };

    const playerWithBall = players.find((p) => p.hasBall);

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const newP = { ...p };

      if (newP.isSliding) {
        newP.slideTimer -= dt;
        if (newP.slideTimer <= 0) {
          newP.isSliding = false;
        }
      }

      const speedMultiplier = newP.energy < 10 ? 0.7 : 1;

      const dx = newP.targetPosition.x - newP.position.x;
      const dz = newP.targetPosition.z - newP.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.1) {
        const maxSpeed = newP.team === 'goalkeeper' ? 4 : 3;
        const speed = Math.min(dist / 0.2, maxSpeed) * speedMultiplier;
        const vx = (dx / dist) * speed;
        const vz = (dz / dist) * speed;

        newP.velocity = { x: vx, z: vz };
        newP.position = {
          x: newP.position.x + vx * dt,
          z: newP.position.z + vz * dt,
        };

        newP.energy = Math.max(0, newP.energy - 5 * dt);
      } else {
        newP.velocity = { x: 0, z: 0 };
        newP.energy = Math.min(100, newP.energy + 2 * dt);
      }

      if (newP.energy < 10 && !state.isPaused) {
        set({ isPaused: true, pauseTimer: 5 });
        get().showBroadcast('球员疲劳，比赛暂停恢复中...');
      }

      if (newP.team === 'ai' && playerWithBall && playerWithBall.team === 'player') {
        const ballDist = Math.sqrt(
          Math.pow(ball.position.x - newP.position.x, 2) +
          Math.pow(ball.position.z - newP.position.z, 2)
        );

        if (ballDist < 3) {
          const targetX = ball.position.x;
          const targetZ = ball.position.z;
          newP.targetPosition = { x: targetX, z: targetZ };
        } else {
          newP.targetPosition = {
            x: newP.defaultFormationX,
            z: newP.defaultFormationZ,
          };
        }

        if (ballDist < 2 && !newP.isSliding && playerWithBall) {
          const relativeSpeed = Math.sqrt(
            Math.pow(newP.velocity.x - playerWithBall.velocity.x, 2) +
            Math.pow(newP.velocity.z - playerWithBall.velocity.z, 2)
          );
          const successRate = Math.min(relativeSpeed / 10, 0.8);
          
          if (Math.random() < successRate * dt * 10) {
            newP.isSliding = true;
            newP.slideTimer = 0.3;
            
            if (playerWithBall.hasBall) {
              const kickVx = (ball.position.x - newP.position.x) * 5;
              const kickVz = (ball.position.z - newP.position.z) * 5;
              ball.velocity = { x: kickVx, y: 0, z: kickVz };
              players[playerWithBall.id].hasBall = false;
              ball.lastTouchedBy = newP.id;
            }
          }
        }
      }

      if (newP.team === 'goalkeeper') {
        const goalX = newP.id === 10 ? -9.5 : 9.5;
        const predictedZ = ball.position.z + ball.velocity.z * 0.3;
        const targetZ = Math.max(-1.5, Math.min(1.5, predictedZ));
        newP.targetPosition = { x: goalX, z: targetZ };

        const ballToGoalDist = Math.abs(ball.position.x - goalX);
        if (ballToGoalDist < 1 && ball.velocity.x !== 0) {
          const saveDist = Math.sqrt(
            Math.pow(ball.position.x - newP.position.x, 2) +
            Math.pow(ball.position.z - newP.position.z, 2)
          );
          if (saveDist < 1.2) {
            const ballSpeed = Math.sqrt(
              ball.velocity.x ** 2 + ball.velocity.z ** 2
            );
            if (ballSpeed > 15) {
            } else {
              const deflectX = newP.id === 10 ? 5 : -5;
              ball.velocity = { x: deflectX, y: 0, z: (Math.random() - 0.5) * 5 };
            }
          }
        }
      }

      if (!newP.hasBall && ball.velocity.x !== 0) {
        const touchDist = Math.sqrt(
          Math.pow(ball.position.x - newP.position.x, 2) +
          Math.pow(ball.position.z - newP.position.z, 2)
        );
        if (touchDist < 0.8 && Math.abs(ball.velocity.x) < 8) {
          newP.hasBall = true;
          ball.velocity = { x: 0, y: 0, z: 0 };
          ball.lastTouchedBy = newP.id;
          for (let j = 0; j < players.length; j++) {
            if (j !== i && players[j].hasBall) {
              players[j] = { ...players[j], hasBall: false };
            }
          }
        }
      }

      players[i] = newP;
    }

    if (ball.velocity.x !== 0 || ball.velocity.y !== 0 || ball.velocity.z !== 0) {
      ball.position = {
        x: ball.position.x + ball.velocity.x * dt,
        y: Math.max(0.3, ball.position.y + ball.velocity.y * dt),
        z: ball.position.z + ball.velocity.z * dt,
      };

      ball.rotation = {
        x: ball.rotation.x + ball.velocity.z * dt * 2,
        y: ball.rotation.y + ball.velocity.x * dt * 2,
        z: ball.rotation.z,
      };

      ball.velocity = {
        x: ball.velocity.x * 0.98,
        y: ball.velocity.y * 0.98 - 9.8 * dt,
        z: ball.velocity.z * 0.98,
      };

      if (ball.position.y <= 0.3) {
        ball.position.y = 0.3;
        ball.velocity.y = -ball.velocity.y * 0.3;
      }

      if (ball.position.z < -4.5 || ball.position.z > 4.5) {
        ball.velocity.z *= -0.8;
        ball.position.z = Math.max(-4.5, Math.min(4.5, ball.position.z));
      }

      if (ball.position.x < -9.5 || ball.position.x > 9.5) {
        const inGoal = ball.position.z > -2 && ball.position.z < 2 && ball.position.y < 2;
        
        if (inGoal) {
          const scoringTeam = ball.position.x > 9.5 ? 'player' : 'ai';
          const ballSpeed = Math.sqrt(
            ball.velocity.x ** 2 + ball.velocity.z ** 2
          );
          
          const keeperId = ball.position.x > 9.5 ? 11 : 10;
          const keeper = players.find((p) => p.id === keeperId);
          let scored = true;
          
          if (keeper && ballSpeed <= 15) {
            scored = false;
          }
          
          if (scored) {
            get().scoreGoal(scoringTeam);
            ball.velocity = { x: 0, y: 0, z: 0 };
          } else {
            ball.velocity.x *= -0.8;
            ball.position.x = Math.max(-9.5, Math.min(9.5, ball.position.x));
          }
        } else {
          ball.velocity.x *= -0.8;
          ball.position.x = Math.max(-9.5, Math.min(9.5, ball.position.x));
        }
      }

      const speed = Math.sqrt(
        ball.velocity.x ** 2 + ball.velocity.y ** 2 + ball.velocity.z ** 2
      );
      if (speed < 0.5) {
        ball.velocity = { x: 0, y: 0, z: 0 };
      }
    } else {
      const carrier = players.find((p) => p.hasBall);
      if (carrier) {
        ball.position = {
          x: carrier.position.x + 0.3,
          y: 0.3,
          z: carrier.position.z,
        };
      }
    }

    set({
      players,
      ball,
      gameTime: newGameTime,
      broadcastMessage: newBroadcastMessage,
      broadcastTimer: newBroadcastTimer,
      tacticsTransition: newTacticsTransition,
    });
  },
}));
