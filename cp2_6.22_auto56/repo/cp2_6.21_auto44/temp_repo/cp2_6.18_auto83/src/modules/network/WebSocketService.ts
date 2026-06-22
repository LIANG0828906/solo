import { eventBus } from '@/modules/EventBus';
import { useGameStore, createEmptyGrid } from '@/store/GameStore';
import {
  generateOpponentShips,
  generateOpponentAttack,
  processAttack,
} from '@/modules/game/GameLogic';
import { GRID_SIZE, SHIP_DEFINITIONS, LogEntry, ShipType } from '@/types';

let matchTimeout: ReturnType<typeof setTimeout> | null = null;
let opponentMoveTimeout: ReturnType<typeof setTimeout> | null = null;
let countdownInterval: ReturnType<typeof setInterval> | null = null;

function addLog(type: LogEntry['type'], message: string) {
  const store = useGameStore.getState();
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    timestamp: Date.now(),
  };
  useGameStore.setState({
    battleLog: [...store.battleLog, entry],
  });
}

function startCountdown() {
  stopCountdown();
  useGameStore.setState({ countdown: 20 });

  countdownInterval = setInterval(() => {
    const state = useGameStore.getState();
    if (state.phase !== 'battle' || state.currentTurn !== 'player') {
      stopCountdown();
      return;
    }
    const newCountdown = state.countdown - 1;
    if (newCountdown <= 0) {
      stopCountdown();
      const newTimeoutCount = state.timeoutCount + 1;
      addLog('timeout', `超时违规！(${newTimeoutCount}/${3})`);
      useGameStore.setState({
        countdown: 0,
        timeoutCount: newTimeoutCount,
        attackPending: false,
      });
      if (newTimeoutCount >= 3) {
        useGameStore.setState({
          phase: 'gameover',
          winner: 'opponent',
          showGameOverModal: true,
        });
        eventBus.emit('gameOver', { winner: 'opponent' });
        return;
      }
      switchToOpponentTurn();
      return;
    }
    useGameStore.setState({ countdown: newCountdown });
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function switchToOpponentTurn() {
  const state = useGameStore.getState();
  useGameStore.setState({
    currentTurn: 'opponent',
    attackPending: false,
  });
  eventBus.emit('turnUpdate', {
    currentTurn: 'opponent',
    turnNumber: state.turnNumber,
  });
  scheduleOpponentMove();
}

function switchToPlayerTurn() {
  const state = useGameStore.getState();
  const newTurnNumber = state.turnNumber + 1;
  useGameStore.setState({
    currentTurn: 'player',
    turnNumber: newTurnNumber,
    attackPending: false,
    lastAttackCell: null,
    lastAttackResult: null,
  });
  eventBus.emit('turnUpdate', {
    currentTurn: 'player',
    turnNumber: newTurnNumber,
  });
  startCountdown();
}

function scheduleOpponentMove() {
  const delay = 800 + Math.random() * 1200;
  opponentMoveTimeout = setTimeout(() => {
    const state = useGameStore.getState();
    if (state.phase !== 'battle') return;

    const target = generateOpponentAttack(state.playerGrid);
    if (!target) return;

    const [row, col] = target;
    const { grid, ships, result } = processAttack(
      state.playerGrid,
      state.playerShips,
      row,
      col
    );

    const shipLabel = result.sunkShipType
      ? SHIP_DEFINITIONS.find((d) => d.type === result.sunkShipType)?.label
      : null;

    let sinkingCells: [number, number][] = [];
    if (result.sunk && result.sunkShipType) {
      const sunkShip = ships.find((s) => s.type === result.sunkShipType);
      if (sunkShip) {
        sinkingCells = sunkShip.cells.map((c) => [...c] as [number, number]);
      }
      addLog('sunk', `对方击沉了你的${shipLabel}！`);
    } else if (result.hit) {
      addLog('hit', `对方命中了你的舰艇！`);
    } else {
      addLog('miss', `对方攻击未命中。`);
    }

    useGameStore.setState({
      playerGrid: grid,
      playerShips: ships,
      sinkingCells,
      lastAttackCell: [row, col],
      lastAttackResult: result.hit ? 'hit' : 'miss',
    });

    setTimeout(() => {
      useGameStore.setState({ sinkingCells: [] });
    }, 800);

    eventBus.emit('hitResult', { ...result, attacker: 'opponent' });

    if (result.gameOver) {
      stopCountdown();
      useGameStore.setState({
        phase: 'gameover',
        winner: 'opponent',
        showGameOverModal: true,
      });
      eventBus.emit('gameOver', { winner: 'opponent' });
      return;
    }

    setTimeout(() => switchToPlayerTurn(), 600);
  }, delay);
}

function handleMatchRequest(data: { playerId: string }) {
  const state = useGameStore.getState();
  if (state.phase !== 'matching') return;

  matchTimeout = setTimeout(() => {
    const opponentId = `opponent-${Date.now()}`;
    const firstTurn: 'player' | 'opponent' =
      Math.random() < 0.5 ? 'player' : 'opponent';

    const { ships: opponentShips, grid: opponentRealGrid } =
      generateOpponentShips();

    const opponentVisibleGrid = createEmptyGrid();

    useGameStore.setState({
      opponentId,
      opponentShips,
      opponentGrid: opponentVisibleGrid,
      phase: 'battle',
      currentTurn: firstTurn,
      turnNumber: 1,
      attackPending: false,
      lastAttackCell: null,
      lastAttackResult: null,
    });

    (useGameStore.getState() as Record<string, unknown>)._opponentRealGrid =
      opponentRealGrid;

    addLog('system', `匹配成功！${firstTurn === 'player' ? '你先手' : '对方先手'}`);

    eventBus.emit('playerJoined', {
      playerId: data.playerId,
      opponentId,
      firstTurn,
    });

    if (firstTurn === 'player') {
      startCountdown();
    } else {
      scheduleOpponentMove();
    }
  }, 1500 + Math.random() * 1000);
}

function handleAttackEvent(data: {
  row: number;
  col: number;
  attacker: 'player' | 'opponent';
}) {
  const state = useGameStore.getState();
  if (state.phase !== 'battle' || state.currentTurn !== 'player') return;

  const realGrid =
    (useGameStore.getState() as Record<string, unknown>)._opponentRealGrid ??
    state.opponentGrid;
  const { grid: newRealGrid, ships, result } = processAttack(
    realGrid as import('@/types').Grid,
    state.opponentShips,
    data.row,
    data.col
  );

  (useGameStore.getState() as Record<string, unknown>)._opponentRealGrid =
    newRealGrid;

  const newVisibleGrid = {
    cells: state.opponentGrid.cells.map((r: string[]) => [...r]),
    shipMap: state.opponentGrid.shipMap.map((r: (string | null)[]) => [...r]),
  };
  if (result.hit) {
    newVisibleGrid.cells[data.row][data.col] = 'hit';
  } else {
    newVisibleGrid.cells[data.row][data.col] = 'miss';
  }

  if (result.sunk && result.sunkShipType) {
    const sunkShip = ships.find((s) => s.type === result.sunkShipType);
    if (sunkShip) {
      for (const [r, c] of sunkShip.cells) {
        newVisibleGrid.cells[r][c] = 'sunk';
      }
    }
  }

  const shipLabel = result.sunkShipType
    ? SHIP_DEFINITIONS.find((d) => d.type === result.sunkShipType)?.label
    : null;

  let sinkingCells: [number, number][] = [];
  if (result.sunk && result.sunkShipType) {
    const sunkShip = ships.find((s) => s.type === result.sunkShipType);
    if (sunkShip) {
      sinkingCells = sunkShip.cells.map((c) => [...c] as [number, number]);
    }
    addLog('sunk', `击沉对方${shipLabel}！`);
  } else if (result.hit) {
    addLog('hit', `命中对方舰艇！`);
  } else {
    addLog('miss', `攻击未命中。`);
  }

  useGameStore.setState({
    opponentGrid: newVisibleGrid,
    opponentShips: ships,
    lastAttackCell: [data.row, data.col],
    lastAttackResult: result.hit ? 'hit' : 'miss',
    attackPending: false,
    sinkingCells,
  });

  setTimeout(() => {
    useGameStore.setState({ sinkingCells: [] });
  }, 800);

  eventBus.emit('hitResult', { ...result, attacker: 'player' });

  stopCountdown();

  if (result.gameOver) {
    useGameStore.setState({
      phase: 'gameover',
      winner: 'player',
      showGameOverModal: true,
    });
    eventBus.emit('gameOver', { winner: 'player' });
    return;
  }

  setTimeout(() => switchToOpponentTurn(), 600);
}

export function initWebSocketService() {
  eventBus.on('matchRequest', handleMatchRequest);
  eventBus.on('attackEvent', handleAttackEvent);
}

export function cleanupWebSocketService() {
  stopCountdown();
  if (matchTimeout) {
    clearTimeout(matchTimeout);
    matchTimeout = null;
  }
  if (opponentMoveTimeout) {
    clearTimeout(opponentMoveTimeout);
    opponentMoveTimeout = null;
  }
  eventBus.off('matchRequest', handleMatchRequest);
  eventBus.off('attackEvent', handleAttackEvent);
}
