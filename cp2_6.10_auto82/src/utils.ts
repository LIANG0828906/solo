import { StoneColor, Position, Move, ShapeAnalysis, GameRecord, ChessManual } from './types';

const BOARD_SIZE = 19;

export const createEmptyBoard = (): StoneColor[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

export const getAdjacentPositions = (pos: Position): Position[] => {
  const adjacent: Position[] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    const newRow = pos.row + dr;
    const newCol = pos.col + dc;
    if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
      adjacent.push({ row: newRow, col: newCol });
    }
  }
  return adjacent;
};

export const getGroup = (board: StoneColor[][], pos: Position): Position[] => {
  const color = board[pos.row][pos.col];
  if (!color) return [];
  
  const group: Position[] = [];
  const visited = new Set<string>();
  const stack: Position[] = [pos];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.row},${current.col}`;
    
    if (visited.has(key)) continue;
    if (board[current.row][current.col] !== color) continue;
    
    visited.add(key);
    group.push(current);
    
    for (const adj of getAdjacentPositions(current)) {
      stack.push(adj);
    }
  }
  
  return group;
};

export const getLiberties = (board: StoneColor[][], group: Position[]): Position[] => {
  const liberties: Position[] = [];
  const visited = new Set<string>();
  
  for (const pos of group) {
    for (const adj of getAdjacentPositions(pos)) {
      const key = `${adj.row},${adj.col}`;
      if (!visited.has(key) && board[adj.row][adj.col] === null) {
        visited.add(key);
        liberties.push(adj);
      }
    }
  }
  
  return liberties;
};

export const hasLiberties = (board: StoneColor[][], group: Position[]): boolean => {
  return getLiberties(board, group).length > 0;
};

export const captureStones = (
  board: StoneColor[][],
  pos: Position,
  capturedColor: StoneColor
): { newBoard: StoneColor[][]; capturedCount: number; capturedPositions: Position[] } => {
  const newBoard = board.map(row => [...row]);
  const capturedPositions: Position[] = [];
  let capturedCount = 0;
  
  const adjacent = getAdjacentPositions(pos);
  for (const adj of adjacent) {
    if (newBoard[adj.row][adj.col] === capturedColor) {
      const group = getGroup(newBoard, adj);
      if (!hasLiberties(newBoard, group)) {
        for (const stone of group) {
          newBoard[stone.row][stone.col] = null;
          capturedPositions.push(stone);
          capturedCount++;
        }
      }
    }
  }
  
  return { newBoard, capturedCount, capturedPositions };
};

export const placeStone = (
  board: StoneColor[][],
  pos: Position,
  color: 'black' | 'white'
): { success: boolean; newBoard: StoneColor[][]; capturedCount: number; capturedPositions: Position[] } => {
  if (board[pos.row][pos.col] !== null) {
    return { success: false, newBoard: board, capturedCount: 0, capturedPositions: [] };
  }
  
  const newBoard = board.map(row => [...row]);
  newBoard[pos.row][pos.col] = color;
  
  const opponentColor = color === 'black' ? 'white' : 'black';
  const { newBoard: afterCapture, capturedCount, capturedPositions } = captureStones(
    newBoard,
    pos,
    opponentColor
  );
  
  const ownGroup = getGroup(afterCapture, pos);
  if (!hasLiberties(afterCapture, ownGroup) && capturedCount === 0) {
    return { success: false, newBoard: board, capturedCount: 0, capturedPositions: [] };
  }
  
  return { success: true, newBoard: afterCapture, capturedCount, capturedPositions };
};

export const findDeadBlocks = (board: StoneColor[][]): Position[][] => {
  const deadBlocks: Position[][] = [];
  const visited = new Set<string>();
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const color = board[row][col];
      if (!color) continue;
      
      const key = `${row},${col},${color}`;
      if (visited.has(key)) continue;
      
      const group = getGroup(board, { row, col });
      const liberties = getLiberties(board, group);
      
      if (liberties.length <= 1) {
        const hasFalseEye = liberties.length === 1 && checkFalseEye(board, liberties[0], color);
        if (hasFalseEye || liberties.length === 0) {
          deadBlocks.push(group);
        }
      }
      
      for (const pos of group) {
        visited.add(`${pos.row},${pos.col},${color}`);
      }
    }
  }
  
  return deadBlocks;
};

export const checkFalseEye = (board: StoneColor[][], eyePos: Position, eyeColor: StoneColor): boolean => {
  const adjacent = getAdjacentPositions(eyePos);
  let enemyCount = 0;
  
  for (const adj of adjacent) {
    if (board[adj.row][adj.col] !== eyeColor && board[adj.row][adj.col] !== null) {
      enemyCount++;
    }
  }
  
  return enemyCount >= 2;
};

export const analyzeShape = (
  board: StoneColor[][],
  lastMove: Position,
  color: StoneColor
): ShapeAnalysis => {
  const patterns = [
    { name: '拆二', detect: () => isSplitTwo(board, lastMove, color) },
    { name: '立二拆三', detect: () => isStandTwoSplitThree(board, lastMove, color) },
    { name: '小飞', detect: () => isSmallFly(board, lastMove, color) },
    { name: '大飞', detect: () => isBigFly(board, lastMove, color) },
    { name: '尖', detect: () => isPoint(board, lastMove, color) },
    { name: '跳', detect: () => isJump(board, lastMove, color) },
    { name: '虎', detect: () => isTiger(board, lastMove, color) },
    { name: '双', detect: () => isDouble(board, lastMove, color) },
  ];
  
  for (const pattern of patterns) {
    if (pattern.detect()) {
      return {
        patternName: pattern.name,
        description: generatePositionDescription(lastMove),
        suggestion: generateSuggestion(pattern.name, color)
      };
    }
  }
  
  return {
    patternName: '普通着法',
    description: generatePositionDescription(lastMove),
    suggestion: '静观其变，寻找对手破绽。'
  };
};

const generatePositionDescription = (pos: Position): string => {
  const rows = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', 
                '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九'];
  const cols = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
                '11', '12', '13', '14', '15', '16', '17', '18', '19'];
  return `横${cols[pos.col]}路直${rows[pos.row]}路`;
};

const generateSuggestion = (patternName: string, _color: StoneColor): string => {
  const suggestions: Record<string, string> = {
    '拆二': '拆二生根，棋形稳固，可考虑后续打入或扩张。',
    '立二拆三': '立二拆三是效率与安全的平衡，注意对手打入。',
    '小飞': '小飞守角，兼顾实地与外势，可考虑大飞扩张。',
    '大飞': '大飞展开迅速，需防备对手跨断。',
    '尖': '尖形坚实，无被跨断之忧，适合防守。',
    '跳': '跳跃轻灵，快速展开，注意连接。',
    '虎': '虎形有弹性，暗藏反击，需警惕对手点眼。',
    '双': '双形厚实，连接牢固，虽缓但稳。',
    '普通着法': '静观其变，寻找对手破绽。'
  };
  return suggestions[patternName] || suggestions['普通着法'];
};

const isSplitTwo = (board: StoneColor[][], pos: Position, color: StoneColor): boolean => {
  return checkLinearPattern(board, pos, color, 2, 1);
};

const isStandTwoSplitThree = (board: StoneColor[][], pos: Position, color: StoneColor): boolean => {
  return checkLinearPattern(board, pos, color, 3, 2);
};

const checkLinearPattern = (
  board: StoneColor[][],
  pos: Position,
  color: StoneColor,
  distance: number,
  standCount: number
): boolean => {
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [dr, dc] of directions) {
    let count = 0;
    for (let i = 1; i <= standCount; i++) {
      const r = pos.row - dr * i;
      const c = pos.col - dc * i;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
        count++;
      }
    }
    if (count >= standCount) {
      const targetR = pos.row + dr * distance;
      const targetC = pos.col + dc * distance;
      if (targetR >= 0 && targetR < BOARD_SIZE && targetC >= 0 && targetC < BOARD_SIZE) {
        let empty = true;
        for (let i = 1; i < distance; i++) {
          const r = pos.row + dr * i;
          const c = pos.col + dc * i;
          if (board[r][c] !== null) {
            empty = false;
            break;
          }
        }
        if (empty) return true;
      }
    }
  }
  return false;
};

const isSmallFly = (board: StoneColor[][], pos: Position, color: StoneColor): boolean => {
  const diagonals = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]];
  for (const [dr, dc] of diagonals) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
      return true;
    }
  }
  return false;
};

const isBigFly = (board: StoneColor[][], pos: Position, color: StoneColor): boolean => {
  const diagonals = [[-3, -1], [-3, 1], [3, -1], [3, 1], [-1, -3], [1, -3], [-1, 3], [1, 3]];
  for (const [dr, dc] of diagonals) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
      return true;
    }
  }
  return false;
};

const isPoint = (board: StoneColor[][], pos: Position, color: StoneColor): boolean => {
  const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of diagonals) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
      return true;
    }
  }
  return false;
};

const isJump = (board: StoneColor[][], pos: Position, color: StoneColor): boolean => {
  const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
  for (const [dr, dc] of directions) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    const midR = pos.row + dr / 2;
    const midC = pos.col + dc / 2;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
        board[r][c] === color && board[midR][midC] === null) {
      return true;
    }
  }
  return false;
};

const isTiger = (board: StoneColor[][], pos: Position, color: StoneColor): boolean => {
  const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  let count = 0;
  for (const [dr, dc] of diagonals) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
      count++;
    }
  }
  return count >= 2;
};

const isDouble = (board: StoneColor[][], pos: Position, color: StoneColor): boolean => {
  const jumps = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of jumps) {
    const r1 = pos.row + dr;
    const c1 = pos.col + dc;
    const r2 = pos.row + dr * 2;
    const c2 = pos.col + dc * 2;
    if (r2 >= 0 && r2 < BOARD_SIZE && c2 >= 0 && c2 < BOARD_SIZE &&
        board[r1][c1] === color && board[r2][c2] === color) {
      return true;
    }
  }
  return false;
};

export const calculateAccuracy = (userMoves: Move[], manual: ChessManual): number => {
  if (userMoves.length === 0) return 0;
  
  let correct = 0;
  const compareLength = Math.min(userMoves.length, manual.moves.length);
  
  for (let i = 0; i < compareLength; i++) {
    const userPos = userMoves[i].position;
    const manualPos = manual.moves[i];
    if (userPos.row === manualPos.row && userPos.col === manualPos.col) {
      correct++;
    }
  }
  
  return Math.round((correct / compareLength) * 1000) / 10;
};

export const calculateTerritory = (board: StoneColor[][]): { black: number; white: number } => {
  const visited = new Set<string>();
  let blackTerritory = 0;
  let whiteTerritory = 0;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row},${col}`;
      if (visited.has(key) || board[row][col] !== null) continue;
      
      const { territory, owner } = floodFillTerritory(board, { row, col }, visited);
      if (owner === 'black') blackTerritory += territory;
      else if (owner === 'white') whiteTerritory += territory;
    }
  }
  
  return { black: blackTerritory, white: whiteTerritory };
};

const floodFillTerritory = (
  board: StoneColor[][],
  start: Position,
  visited: Set<string>
): { territory: number; owner: StoneColor } => {
  const emptyPoints: Position[] = [];
  let touchesBlack = false;
  let touchesWhite = false;
  const stack: Position[] = [start];
  
  while (stack.length > 0) {
    const pos = stack.pop()!;
    const key = `${pos.row},${pos.col}`;
    
    if (visited.has(key)) continue;
    
    const cell = board[pos.row][pos.col];
    if (cell === 'black') {
      touchesBlack = true;
      continue;
    }
    if (cell === 'white') {
      touchesWhite = true;
      continue;
    }
    
    visited.add(key);
    emptyPoints.push(pos);
    
    for (const adj of getAdjacentPositions(pos)) {
      stack.push(adj);
    }
  }
  
  let owner: StoneColor = null;
  if (touchesBlack && !touchesWhite) owner = 'black';
  else if (touchesWhite && !touchesBlack) owner = 'white';
  
  return { territory: emptyPoints.length, owner };
};

export const calculateWinRate = (
  blackTerritory: number,
  whiteTerritory: number,
  capturedBlack: number,
  capturedWhite: number,
  komi: number = 6.5
): number => {
  const blackScore = blackTerritory + capturedWhite;
  const whiteScore = whiteTerritory + capturedBlack + komi;
  const total = blackScore + whiteScore;
  
  if (total === 0) return 50;
  return Math.round((blackScore / total) * 1000) / 10;
};

export const generateAccuracyComment = (accuracy: number): string => {
  if (accuracy >= 95) return '媲美国手';
  if (accuracy >= 85) return '出神入化';
  if (accuracy >= 75) return '登堂入室';
  if (accuracy >= 60) return '略有小成';
  if (accuracy >= 40) return '初窥门径';
  return '仍需努力';
};

const STORAGE_KEY = '围棋记录';
const MAX_RECORDS = 5;

export const saveGameRecord = (record: GameRecord): void => {
  try {
    const records = loadGameRecords();
    records.unshift(record);
    if (records.length > MAX_RECORDS) {
      records.pop();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('保存记录失败:', e);
  }
};

export const loadGameRecords = (): GameRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('加载记录失败:', e);
    return [];
  }
};

export const getPositionKey = (pos: Position): string => `${pos.row},${pos.col}`;
