import { useEffect, useCallback, useRef } from 'react';
import {
  useGameStore,
  usePlayer,
  useOpponent,
  useGamePhase,
  useCurrentPlayerId,
  useIsMyTurn,
  useTurnTimeLeft,
  useAttackHistory,
  useWinnerId,
  useEmotes,
  usePlacingShip,
  useConnectionStatus,
  useHighlightedCell,
  useReplayState,
} from '../store/gameStore';
import { GameEngine } from '../engine/GameEngine';
import { NetworkManager } from '../network/NetworkManager';
import { NetworkEventType, NetworkMessage } from '../network/NetworkEvents';
import {
  GamePhase,
  ConnectionStatus,
  AttackResult,
  AttackHistoryEntry,
  EmoteBubble,
  Ship,
  Position,
  TURN_DURATION,
  EMOTES,
} from '../engine/types';

let networkManagerInstance: NetworkManager | null = null;

const getNetworkManager = (playerId: string, playerName: string): NetworkManager => {
  if (!networkManagerInstance) {
    networkManagerInstance = new NetworkManager(playerId, playerName);
  }
  return networkManagerInstance;
};

export const useGame = () => {
  const player = usePlayer();
  const opponent = useOpponent();
  const phase = useGamePhase();
  const currentPlayerId = useCurrentPlayerId();
  const isMyTurn = useIsMyTurn();
  const turnTimeLeft = useTurnTimeLeft();
  const attackHistory = useAttackHistory();
  const winnerId = useWinnerId();
  const emotes = useEmotes();
  const placingShip = usePlacingShip();
  const connectionStatus = useConnectionStatus();
  const highlightedCell = useHighlightedCell();
  const { isReplayPlaying, replayIndex } = useReplayState();

  const {
    setPhase,
    setPlayer,
    setOpponent,
    setCurrentPlayerId,
    setTurnTimeLeft,
    setWinnerId,
    setConnectionStatus,
    setRoomId,
    setPlacingShip,
    setHighlightedCell,
    addAttackHistory,
    addEmote,
    removeEmote,
    applyAttackResult,
    startReplay,
    stopReplay,
    setReplayIndex,
    resetGame,
    initializeGame,
  } = useGameStore();

  const turnTimerRef = useRef<number | null>(null);
  const networkManagerRef = useRef<NetworkManager | null>(null);
  const replayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const nm = getNetworkManager(player.id, player.name);
    networkManagerRef.current = nm;

    nm.setConnectionStatusCallback((status) => {
      setConnectionStatus(status);
    });

    const handleMatchFound = (message: NetworkMessage) => {
      const payload = message.payload as {
        roomId: string;
        player1: { id: string; name: string };
        player2: { id: string; name: string };
        yourTurn: boolean;
      };

      const isPlayer1 = payload.player1.id === player.id;
      const myData = isPlayer1 ? payload.player1 : payload.player2;
      const opponentData = isPlayer1 ? payload.player2 : payload.player1;

      setRoomId(payload.roomId);
      nm.setRoomId(payload.roomId);
      initializeGame(myData.id, myData.name, opponentData.name);
      setOpponent({ ...opponent, id: opponentData.id, name: opponentData.name });

      if (payload.yourTurn) {
        setCurrentPlayerId(player.id);
      } else {
        setCurrentPlayerId(opponentData.id);
      }
    };

    const handlePlayerReady = (message: NetworkMessage) => {
      const payload = message.payload as { playerId: string; player: typeof opponent };
      if (payload.playerId !== player.id) {
        setOpponent({ ...payload.player, id: payload.playerId });
        if (player.isReady && payload.player.isReady) {
          setPhase(GamePhase.BATTLE);
          startTurnTimer();
        }
      }
    };

    const handleAttack = async (message: NetworkMessage) => {
      const payload = message.payload as {
        row: number;
        col: number;
        attackerId: string;
        messageId: string;
      };

      if (payload.attackerId !== player.id) {
        const { defender, result } = GameEngine.processAttack(
          player,
          payload.attackerId,
          payload.row,
          payload.col
        );

        setPlayer(defender);

        const entry: AttackHistoryEntry = {
          playerId: payload.attackerId,
          row: payload.row,
          col: payload.col,
          result,
          timestamp: Date.now(),
        };
        addAttackHistory(entry);

        const nextPlayerId = result.isGameOver ? payload.attackerId : player.id;

        nm.sendAttackResult(result, payload.attackerId, payload.messageId, nextPlayerId);

        if (result.isGameOver) {
          setWinnerId(payload.attackerId);
          setPhase(GamePhase.GAME_OVER);
          stopTurnTimer();
        } else {
          setCurrentPlayerId(player.id);
          resetTurnTimer();
        }
      }
    };

    const handleAttackResult = (message: NetworkMessage) => {
      nm.handleAttackResult(message);
    };

    const handleEmote = (message: NetworkMessage) => {
      const payload = message.payload as { emote: string; label: string; playerId: string };
      const bubble: EmoteBubble = {
        id: `emote-${Date.now()}-${Math.random()}`,
        playerId: payload.playerId,
        emote: payload.emote,
        label: payload.label,
        timestamp: Date.now(),
      };
      addEmote(bubble);

      setTimeout(() => {
        removeEmote(bubble.id);
      }, 3000);
    };

    const handleReconnect = () => {
      nm.reconnect();
    };

    const handleTurnTimeout = (message: NetworkMessage) => {
      const payload = message.payload as { timedOutPlayerId: string; nextPlayerId: string };
      if (payload.timedOutPlayerId !== player.id) {
        setCurrentPlayerId(payload.nextPlayerId);
        resetTurnTimer();
      }
    };

    nm.on(NetworkEventType.MATCH_FOUND, handleMatchFound);
    nm.on(NetworkEventType.PLAYER_READY, handlePlayerReady);
    nm.on(NetworkEventType.ATTACK, handleAttack);
    nm.on(NetworkEventType.ATTACK_RESULT, handleAttackResult);
    nm.on(NetworkEventType.EMOTE, handleEmote);
    nm.on(NetworkEventType.RECONNECT, handleReconnect);
    nm.on(NetworkEventType.TURN_TIMEOUT, handleTurnTimeout);

    return () => {
      nm.off(NetworkEventType.MATCH_FOUND, handleMatchFound);
      nm.off(NetworkEventType.PLAYER_READY, handlePlayerReady);
      nm.off(NetworkEventType.ATTACK, handleAttack);
      nm.off(NetworkEventType.ATTACK_RESULT, handleAttackResult);
      nm.off(NetworkEventType.EMOTE, handleEmote);
      nm.off(NetworkEventType.RECONNECT, handleReconnect);
      nm.off(NetworkEventType.TURN_TIMEOUT, handleTurnTimeout);
      stopTurnTimer();
      stopReplayTimer();
    };
  }, []);

  useEffect(() => {
    if (phase === GamePhase.REPLAY && isReplayPlaying) {
      startReplayTimer();
    } else {
      stopReplayTimer();
    }

    return () => stopReplayTimer();
  }, [phase, isReplayPlaying]);

  const startTurnTimer = useCallback(() => {
    stopTurnTimer();
    setTurnTimeLeft(TURN_DURATION);

    turnTimerRef.current = window.setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          stopTurnTimer();
          if (networkManagerRef.current && isMyTurn) {
            const nextPlayerId = opponent.id;
            networkManagerRef.current.sendTurnTimeout(player.id, nextPlayerId);
            setCurrentPlayerId(nextPlayerId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isMyTurn, opponent.id, player.id, setCurrentPlayerId, setTurnTimeLeft]);

  const stopTurnTimer = useCallback(() => {
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current);
      turnTimerRef.current = null;
    }
  }, []);

  const resetTurnTimer = useCallback(() => {
    startTurnTimer();
  }, [startTurnTimer]);

  const startReplayTimer = useCallback(() => {
    stopReplayTimer();

    replayTimerRef.current = window.setInterval(() => {
      const history = useGameStore.getState().attackHistory;
      const currentIndex = useGameStore.getState().replayIndex;

      if (currentIndex < history.length) {
        const entry = history[currentIndex];
        setHighlightedCell({ row: entry.row, col: entry.col });
        setReplayIndex(currentIndex + 1);

        setTimeout(() => {
          setHighlightedCell(null);
        }, 300);
      } else {
        stopReplayTimer();
        stopReplay();
      }
    }, 500);
  }, [setHighlightedCell, setReplayIndex, stopReplay]);

  const stopReplayTimer = useCallback(() => {
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  }, []);

  const startMatch = useCallback(async () => {
    setPhase(GamePhase.MATCHING);
    try {
      await networkManagerRef.current?.findMatch();
    } catch (error) {
      setPhase(GamePhase.IDLE);
      console.error('Match failed:', error);
    }
  }, [setPhase]);

  const placeShip = useCallback(
    (shipId: string, row: number, col: number, orientation: 'horizontal' | 'vertical') => {
      const result = GameEngine.placeShip(player, shipId, row, col, orientation);
      if (result) {
        setPlayer(result);
      }
      return result !== null;
    },
    [player, setPlayer]
  );

  const removeShip = useCallback(
    (shipId: string) => {
      const result = GameEngine.removeShip(player, shipId);
      setPlayer(result);
    },
    [player, setPlayer]
  );

  const rotateShip = useCallback(
    (ship: Ship): Ship => {
      return GameEngine.rotateShip(ship);
    },
    []
  );

  const canPlaceShip = useCallback(
    (ship: Ship, row: number, col: number, orientation: 'horizontal' | 'vertical'): boolean => {
      return GameEngine.canPlaceShip(player.board, ship, row, col, orientation);
    },
    [player.board]
  );

  const getPreviewPositions = useCallback(
    (ship: Ship, row: number, col: number, orientation: 'horizontal' | 'vertical'): Position[] => {
      return GameEngine.getPreviewPositions(ship, row, col, orientation);
    },
    []
  );

  const setPlayerReady = useCallback(() => {
    if (!GameEngine.areAllShipsPlaced(player)) return;

    const updatedPlayer = { ...player, isReady: true };
    setPlayer(updatedPlayer);
    networkManagerRef.current?.sendPlayerReady(updatedPlayer);

    if (opponent.isReady) {
      setPhase(GamePhase.BATTLE);
      startTurnTimer();
    } else {
      setPhase(GamePhase.WAITING_OPPONENT);
    }
  }, [player, opponent.isReady, setPlayer, setPhase, startTurnTimer]);

  const attack = useCallback(
    async (row: number, col: number): Promise<AttackResult | null> => {
      if (phase !== GamePhase.BATTLE || !isMyTurn) return null;

      const cell = opponent.board[row][col];
      if (cell === 'hit' || cell === 'miss' || cell === 'sunk') return null;

      try {
        stopTurnTimer();

        const result = await networkManagerRef.current!.sendAttack(row, col);

        const entry: AttackHistoryEntry = {
          playerId: player.id,
          row,
          col,
          result,
          timestamp: Date.now(),
        };
        addAttackHistory(entry);

        applyAttackResult(result, true);

        if (!result.isGameOver) {
          setCurrentPlayerId(opponent.id);
          resetTurnTimer();
        } else {
          stopTurnTimer();
        }

        return result;
      } catch (error) {
        console.error('Attack failed:', error);
        return null;
      }
    },
    [
      phase,
      isMyTurn,
      opponent.board,
      opponent.id,
      player.id,
      addAttackHistory,
      applyAttackResult,
      setCurrentPlayerId,
      stopTurnTimer,
      resetTurnTimer,
    ]
  );

  const sendEmote = useCallback(
    (emoteIndex: number) => {
      const emote = EMOTES[emoteIndex];
      if (emote && networkManagerRef.current) {
        networkManagerRef.current.sendEmote(emote.emoji, emote.label);

        const bubble: EmoteBubble = {
          id: `emote-${Date.now()}-${Math.random()}`,
          playerId: player.id,
          emote: emote.emoji,
          label: emote.label,
          timestamp: Date.now(),
        };
        addEmote(bubble);

        setTimeout(() => {
          removeEmote(bubble.id);
        }, 3000);
      }
    },
    [player.id, addEmote, removeEmote]
  );

  const playAgain = useCallback(() => {
    resetGame();
    networkManagerRef.current?.reset();
  }, [resetGame]);

  const reconnect = useCallback(() => {
    networkManagerRef.current?.reconnect();
  }, []);

  const areAllShipsPlaced = useCallback((): boolean => {
    return GameEngine.areAllShipsPlaced(player);
  }, [player]);

  const getSunkenShips = useCallback((target: 'player' | 'opponent') => {
    const targetPlayer = target === 'player' ? player : opponent;
    return GameEngine.getSunkenShips(targetPlayer);
  }, [player, opponent]);

  return {
    player,
    opponent,
    phase,
    currentPlayerId,
    isMyTurn,
    turnTimeLeft,
    attackHistory,
    winnerId,
    emotes,
    placingShip,
    connectionStatus,
    highlightedCell,
    isReplayPlaying,
    replayIndex,

    setPlacingShip,
    setHighlightedCell,

    startMatch,
    placeShip,
    removeShip,
    rotateShip,
    canPlaceShip,
    getPreviewPositions,
    setPlayerReady,
    attack,
    sendEmote,
    playAgain,
    startReplay,
    stopReplay,
    reconnect,
    areAllShipsPlaced,
    getSunkenShips,
  };
};
