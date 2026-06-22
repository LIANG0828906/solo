import { useReducer } from 'react';
import { GameState, GameAction, Player, Effect, GridCell } from '../types/game';
import { generateMap, getRandomSandPosition, generateWind } from '../MapGenerator';
import {
  INITIAL_HEALTH,
  INITIAL_AMMO,
  MIN_ANGLE,
  MAX_ANGLE,
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  DAMAGE_DURATION,
  EXPLOSION_DURATION,
} from '../utils/constants';

const initialState: GameState = {
  map: [],
  players: [],
  currentPlayer: 0,
  wind: { angle: 0, strength: 0 },
  projectile: null,
  gameStatus: 'playing',
  winner: null,
  effects: [],
  screenShake: false,
  mapLoaded: false,
};

function createPlayers(map: GridCell[][]): Player[] {
  const player1Pos = getRandomSandPosition(map, 'left');
  const player2Pos = getRandomSandPosition(map, 'right');

  return [
    {
      id: 0,
      position: player1Pos,
      health: INITIAL_HEALTH,
      maxHealth: INITIAL_HEALTH,
      ammo: INITIAL_AMMO,
      angle: 45,
      color: PLAYER1_COLOR,
      name: '玩家1',
    },
    {
      id: 1,
      position: player2Pos,
      health: INITIAL_HEALTH,
      maxHealth: INITIAL_HEALTH,
      ammo: INITIAL_AMMO,
      angle: 45,
      color: PLAYER2_COLOR,
      name: '玩家2',
    },
  ];
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      const map = generateMap();
      const players = createPlayers(map);
      const wind = generateWind();
      return {
        ...state,
        map,
        players,
        currentPlayer: 0,
        wind,
        projectile: null,
        gameStatus: 'playing',
        winner: null,
        effects: [],
        screenShake: false,
        mapLoaded: true,
      };
    }

    case 'ADJUST_ANGLE': {
      const { playerId, delta } = action;
      const players = state.players.map((player) => {
        if (player.id !== playerId) return player;
        const newAngle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, player.angle + delta));
        return { ...player, angle: newAngle };
      });
      return { ...state, players };
    }

    case 'FIRE_PROJECTILE': {
      const { playerId } = action;
      const players = state.players.map((player) => {
        if (player.id !== playerId) return player;
        return { ...player, ammo: Math.max(0, player.ammo - 1) };
      });
      return { ...state, players };
    }

    case 'UPDATE_PROJECTILE': {
      return { ...state, projectile: action.projectile };
    }

    case 'PROJECTILE_HIT_TRUCK': {
      const { targetId, damage, x, y } = action;
      const players = state.players.map((player) => {
        if (player.id !== targetId) return player;
        return { ...player, health: Math.max(0, player.health - damage) };
      });

      const damageEffect: Effect = {
        id: Date.now(),
        type: 'damage',
        x,
        y,
        value: damage,
        startTime: Date.now(),
        duration: DAMAGE_DURATION,
      };

      const targetPlayer = players.find((p) => p.id === targetId);
      let gameStatus = state.gameStatus;
      let winner = state.winner;

      if (targetPlayer && targetPlayer.health <= 0) {
        gameStatus = 'ended';
        winner = targetId === 0 ? 1 : 0;
      }

      return {
        ...state,
        players,
        projectile: null,
        effects: [...state.effects, damageEffect],
        gameStatus,
        winner,
      };
    }

    case 'PROJECTILE_HIT_DUNE': {
      const { bounceVelocity, x, y } = action;
      if (!state.projectile) return state;

      const bounceEffect: Effect = {
        id: Date.now(),
        type: 'bounce',
        x,
        y,
        startTime: Date.now(),
        duration: 200,
      };

      const updatedProjectile = {
        ...state.projectile,
        vx: bounceVelocity.vx,
        vy: bounceVelocity.vy,
      };

      return {
        ...state,
        projectile: updatedProjectile,
        effects: [...state.effects, bounceEffect],
      };
    }

    case 'PROJECTILE_HIT_ORE': {
      const { x, y } = action;
      const explosionEffect: Effect = {
        id: Date.now(),
        type: 'explosion',
        x,
        y,
        startTime: Date.now(),
        duration: EXPLOSION_DURATION,
      };

      return {
        ...state,
        projectile: null,
        effects: [...state.effects, explosionEffect],
      };
    }

    case 'PROJECTILE_OUT_OF_BOUNDS': {
      return { ...state, projectile: null };
    }

    case 'END_TURN': {
      const nextPlayer = state.currentPlayer === 0 ? 1 : 0;
      const newWind = generateWind();
      return {
        ...state,
        currentPlayer: nextPlayer,
        wind: newWind,
      };
    }

    case 'END_GAME': {
      return {
        ...state,
        gameStatus: 'ended',
        winner: action.winner,
      };
    }

    case 'RESET_GAME': {
      return initialState;
    }

    case 'ADD_EFFECT': {
      return {
        ...state,
        effects: [...state.effects, action.effect],
      };
    }

    case 'REMOVE_EFFECT': {
      const effects = state.effects.filter((e) => e.id !== action.effectId);
      return { ...state, effects };
    }

    case 'SET_SCREEN_SHAKE': {
      return { ...state, screenShake: action.shake };
    }

    case 'SET_MAP_LOADED': {
      return { ...state, mapLoaded: action.loaded };
    }

    default:
      return state;
  }
}

export function useGameState(): [GameState, React.Dispatch<GameAction>] {
  const [state, dispatch] = useReducer(reducer, initialState);
  return [state, dispatch];
}
