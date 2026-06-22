import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import {
  GameState, SonarResult, ChatMessage, SonarPulseAnimation,
  ShipCell, TURN_DURATION, SONAR_DELAY
} from '@/types';
import { generateId } from '@/utils/arrayHelpers';
import { GameEngine } from '@/game/GameEngine';

interface GameStore extends GameState {
  socket: Socket | null;
  gameEngine: GameEngine;
  turnTimer: ReturnType<typeof setInterval> | null;
  
  initSocket: () => void;
  setPlayerName: (name: string) => void;
  createRoom: () => void;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;
  fireSonar: (x: number, y: number) => void;
  sendChatMessage: (content: string) => void;
  setPendingTarget: (target: ShipCell | null) => void;
  confirmSonarAttack: () => void;
  cancelSonarAttack: () => void;
  resetGame: () => void;
  showNotification: (message: string) => void;
  clearNotification: () => void;
  triggerHitEffect: () => void;
  setActivePulse: (pulse: SonarPulseAnimation | null) => void;
  startTurnTimer: () => void;
  stopTurnTimer: () => void;
  addSystemMessage: (content: string) => void;
}

const initialState: GameState = {
  roomCode: null,
  playerId: null,
  playerName: '',
  opponentName: null,
  opponentId: null,
  gamePhase: 'menu',
  currentTurn: 'player',
  turnTimeRemaining: TURN_DURATION,
  myShips: [],
  opponentShips: [],
  mySonarResults: [],
  opponentSonarResults: [],
  mySunkCount: 0,
  opponentSunkCount: 0,
  messages: [],
  opponentConnected: true,
  isReconnecting: false,
  winner: null,
  activePulse: null,
  pendingTarget: null,
  showHitEffect: false,
  notification: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  socket: null,
  gameEngine: new GameEngine(),
  turnTimer: null,

  initSocket: () => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('room_created', ({ roomCode, playerId }) => {
      set({
        roomCode,
        playerId,
        gamePhase: 'waiting',
      });
      get().addSystemMessage('房间创建成功，等待对手加入...');
    });

    socket.on('room_joined', ({ roomCode, playerId, opponentName, myShips, firstPlayer }) => {
      const currentTurn = firstPlayer === playerId ? 'player' : 'opponent';
      set({
        roomCode,
        playerId,
        opponentName,
        myShips,
        gamePhase: 'playing',
        currentTurn,
        turnTimeRemaining: TURN_DURATION,
        opponentConnected: true,
      });
      get().startTurnTimer();
      get().addSystemMessage(`游戏开始！${currentTurn === 'player' ? '你的回合' : '对手回合'}`);
    });

    socket.on('opponent_joined', ({ opponentName, myShips, firstPlayer }) => {
      const playerId = get().playerId;
      const currentTurn = firstPlayer === playerId ? 'player' : 'opponent';
      set({
        opponentName,
        myShips,
        gamePhase: 'playing',
        currentTurn,
        turnTimeRemaining: TURN_DURATION,
        opponentConnected: true,
      });
      get().startTurnTimer();
      get().addSystemMessage(`对手 ${opponentName} 已加入！${currentTurn === 'player' ? '你的回合' : '对手回合'}`);
    });

    socket.on('sonar_result', ({ x, y, result, sunkShip }) => {
      const { mySonarResults } = get();
      const newResult: SonarResult = { x, y, result, timestamp: Date.now() };
      const updatedResults = [...mySonarResults, newResult];
      
      let updatedOpponentShips = [...get().opponentShips];
      let newNotification: string | null = null;

      if (sunkShip) {
        updatedOpponentShips = updatedOpponentShips.map(s => 
          s.id === sunkShip.id ? { ...sunkShip, sunk: true } : s
        );
        const newSunkCount = updatedOpponentShips.filter(s => s.sunk).length;
        set({ opponentShips: updatedOpponentShips, opponentSunkCount: newSunkCount });
        newNotification = `你击沉了对方的${sunkShip.name}！`;
      }

      if (result === 'HIT') {
        get().triggerHitEffect();
      }

      set({
        mySonarResults: updatedResults,
        pendingTarget: null,
      });

      if (newNotification) {
        get().showNotification(newNotification);
      }

      setTimeout(() => {
        set({ activePulse: null });
      }, 500);
    });

    socket.on('opponent_sonar', ({ x, y, result }) => {
      const { myShips, opponentSonarResults, gameEngine } = get();
      const newResult: SonarResult = { x, y, result, timestamp: Date.now() };
      const updatedResults = [...opponentSonarResults, newResult];

      let updatedShips = [...myShips];
      let sunkNotification: string | null = null;

      if (result === 'HIT') {
        const shipIndex = updatedShips.findIndex(s => 
          s.cells.some(c => c.x === x && c.y === y) && !s.sunk
        );
        if (shipIndex !== -1) {
          const updatedShip = gameEngine.processHit(updatedShips[shipIndex], { x, y });
          updatedShips[shipIndex] = updatedShip;
          
          if (updatedShip.sunk) {
            sunkNotification = `对方击沉了你的${updatedShip.name}！`;
          }
        }
      }

      const newSunkCount = updatedShips.filter(s => s.sunk).length;

      set({
        opponentSonarResults: updatedResults,
        myShips: updatedShips,
        mySunkCount: newSunkCount,
      });

      if (sunkNotification) {
        get().showNotification(sunkNotification);
      }
    });

    socket.on('turn_change', ({ currentTurn, timeRemaining }) => {
      const turn = currentTurn === get().playerId ? 'player' : 'opponent';
      set({
        currentTurn: turn,
        turnTimeRemaining: timeRemaining,
      });
      
      if (turn === 'opponent') {
        get().addSystemMessage('等待对手操作...');
      }
    });

    socket.on('chat_message', ({ senderName, content, timestamp }) => {
      const { playerName } = get();
      const sender = senderName === playerName ? 'player' : 'opponent';
      const message: ChatMessage = {
        id: generateId(),
        sender,
        content,
        timestamp,
      };
      set(state => ({ messages: [...state.messages, message] }));
    });

    socket.on('game_over', ({ winner, mySunkCount, opponentSunkCount }) => {
      const isWinner = winner === get().playerId;
      set({
        gamePhase: 'gameover',
        winner: isWinner ? 'player' : 'opponent',
        mySunkCount,
        opponentSunkCount,
      });
      get().stopTurnTimer();
      get().addSystemMessage(isWinner ? '🎉 恭喜你获胜！' : '💔 游戏结束，你输了');
    });

    socket.on('opponent_disconnected', () => {
      set({ opponentConnected: false, isReconnecting: true });
      get().stopTurnTimer();
      get().addSystemMessage('对手断开连接，等待重连...');
    });

    socket.on('opponent_reconnected', ({ opponentName }) => {
      set({ opponentName, opponentConnected: true, isReconnecting: false });
      get().startTurnTimer();
      get().addSystemMessage('对手已重新连接！');
    });

    socket.on('error', ({ message }) => {
      console.error('Server error:', message);
      get().showNotification(message);
    });

    set({ socket });
  },

  setPlayerName: (name: string) => {
    set({ playerName: name });
  },

  createRoom: () => {
    const { socket, playerName } = get();
    if (socket && playerName.length >= 2 && playerName.length <= 12) {
      socket.emit('create_room', { playerName });
    }
  },

  joinRoom: (roomCode: string) => {
    const { socket, playerName } = get();
    if (socket && playerName.length >= 2 && playerName.length <= 12 && roomCode.length === 6) {
      socket.emit('join_room', { roomCode: roomCode.toUpperCase(), playerName });
    }
  },

  leaveRoom: () => {
    const { socket, roomCode, playerId } = get();
    if (socket && roomCode && playerId) {
      socket.emit('leave_room', { roomCode, playerId });
    }
    get().stopTurnTimer();
    set({ ...initialState, socket: get().socket, gameEngine: get().gameEngine });
  },

  fireSonar: (x: number, y: number) => {
    const { currentTurn, activePulse } = get();
    if (currentTurn !== 'player' || activePulse) return;
    set({ pendingTarget: { x, y } });
  },

  confirmSonarAttack: () => {
    const { socket, roomCode, playerId, pendingTarget, currentTurn } = get();
    if (!socket || !roomCode || !playerId || !pendingTarget || currentTurn !== 'player') return;

    const { x, y } = pendingTarget;
    
    const pulseId = generateId();
    const newPulse: SonarPulseAnimation = {
      id: pulseId,
      x,
      y,
      startTime: Date.now(),
      duration: 1500,
      isHit: false,
      particles: [],
    };
    set({ activePulse: newPulse });

    socket.emit('sonar_fire', { roomCode, playerId, x, y });

    get().stopTurnTimer();

    setTimeout(() => {
      const { activePulse: currentPulse } = get();
      if (currentPulse && currentPulse.id === pulseId) {
        set({ activePulse: null });
      }
    }, SONAR_DELAY + 500);
  },

  cancelSonarAttack: () => {
    set({ pendingTarget: null });
  },

  sendChatMessage: (content: string) => {
    const { socket, roomCode, playerId } = get();
    if (socket && roomCode && playerId && content.trim()) {
      socket.emit('chat_message', { roomCode, playerId, content: content.trim() });
      
      const message: ChatMessage = {
        id: generateId(),
        sender: 'player',
        content: content.trim(),
        timestamp: Date.now(),
      };
      set(state => ({ messages: [...state.messages, message] }));
    }
  },

  setPendingTarget: (target: ShipCell | null) => {
    set({ pendingTarget: target });
  },

  setActivePulse: (pulse: SonarPulseAnimation | null) => {
    set({ activePulse: pulse });
  },

  resetGame: () => {
    const { socket, gameEngine } = get();
    get().stopTurnTimer();
    set({
      ...initialState,
      socket,
      gameEngine,
      playerName: get().playerName,
    });
  },

  showNotification: (message: string) => {
    set({ notification: message });
    setTimeout(() => {
      set({ notification: null });
    }, 2000);
  },

  clearNotification: () => {
    set({ notification: null });
  },

  triggerHitEffect: () => {
    set({ showHitEffect: true });
    setTimeout(() => {
      set({ showHitEffect: false });
    }, 300);
  },

  startTurnTimer: () => {
    get().stopTurnTimer();
    set({ turnTimeRemaining: TURN_DURATION });
    
    const timer = setInterval(() => {
      const { turnTimeRemaining, currentTurn, playerId, roomCode, socket } = get();
      
      if (currentTurn !== 'player') {
        return;
      }

      if (turnTimeRemaining <= 1) {
        get().stopTurnTimer();
        if (socket && roomCode && playerId) {
          socket.emit('turn_timeout', { roomCode, playerId });
        }
      } else {
        set({ turnTimeRemaining: turnTimeRemaining - 1 });
      }
    }, 1000);

    set({ turnTimer: timer });
  },

  stopTurnTimer: () => {
    const { turnTimer } = get();
    if (turnTimer) {
      clearInterval(turnTimer);
      set({ turnTimer: null });
    }
  },

  addSystemMessage: (content: string) => {
    const message: ChatMessage = {
      id: generateId(),
      sender: 'system',
      content,
      timestamp: Date.now(),
    };
    set(state => ({ messages: [...state.messages, message] }));
  },

}));
