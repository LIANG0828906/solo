import type {
  AlgorithmType,
  StepSnapshot,
  HighlightItem,
  EightQueensInfo,
  AStarInfo,
  BinaryTreeInfo,
} from '../utils/colorUtils';

interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

export class AlgorithmExecutor {
  private type: AlgorithmType;
  private snapshots: StepSnapshot[] = [];

  constructor(type: AlgorithmType) {
    this.type = type;
    this.generateSnapshots();
  }

  private generateSnapshots(): void {
    this.snapshots = [];
    switch (this.type) {
      case 'eightQueens':
        this.generateEightQueensSnapshots();
        break;
      case 'aStar':
        this.generateAStarSnapshots();
        break;
      case 'binaryTree':
        this.generateBinaryTreeSnapshots();
        break;
    }
  }

  private generateEightQueensSnapshots(): void {
    const snapshots: StepSnapshot[] = [];
    const board: number[] = new Array(8).fill(-1);
    let backtrackCount = 0;

    const isSafe = (row: number, col: number): boolean => {
      for (let i = 0; i < row; i++) {
        if (board[i] === col || Math.abs(board[i] - col) === Math.abs(i - row)) {
          return false;
        }
      }
      return true;
    };

    const addSnapshot = (
      currentRow: number,
      currentCol: number,
      action: 'check' | 'place' | 'backtrack' | 'complete'
    ): void => {
      const highlightedItems: HighlightItem[] = [];
      const completedItems: string[] = [];
      const placedItems: string[] = [];

      for (let r = 0; r < 8; r++) {
        if (board[r] !== -1) {
          placedItems.push(`queen-${r}-${board[r]}`);
          if (r < currentRow || action === 'complete') {
            completedItems.push(`queen-${r}-${board[r]}`);
          }
        }
      }

      if (action === 'check') {
        highlightedItems.push({
          id: `cell-${currentRow}-${currentCol}`,
          type: 'cell',
          position: { row: currentRow, col: currentCol },
          effect: 'border',
        });
      } else if (action === 'place') {
        highlightedItems.push({
          id: `queen-${currentRow}-${currentCol}`,
          type: 'queen',
          position: { row: currentRow, col: currentCol },
          effect: 'pulse',
        });
      } else if (action === 'backtrack') {
        highlightedItems.push({
          id: `cell-${currentRow}-${board[currentRow]}`,
          type: 'cell',
          position: { row: currentRow, col: board[currentRow] },
          effect: 'border',
        });
      }

      const description =
        action === 'check'
          ? `检查第 ${currentRow + 1} 行第 ${currentCol + 1} 列是否可以放置皇后`
          : action === 'place'
            ? `在第 ${currentRow + 1} 行第 ${currentCol + 1} 列放置皇后`
            : action === 'backtrack'
              ? `回溯：移除第 ${currentRow + 1} 行的皇后`
              : `八皇后问题求解完成！`;

      snapshots.push({
        stepIndex: snapshots.length,
        description,
        highlightedItems,
        completedItems,
        placedItems,
        infoData: {
          currentRow,
          placedQueens: board.filter((c) => c !== -1).length,
          backtrackCount,
        } as EightQueensInfo,
      });
    };

    const solve = (row: number): boolean => {
      if (row === 8) {
        addSnapshot(7, 0, 'complete');
        return true;
      }

      for (let col = 0; col < 8; col++) {
        addSnapshot(row, col, 'check');
        if (isSafe(row, col)) {
          board[row] = col;
          addSnapshot(row, col, 'place');
          if (solve(row + 1)) {
            return true;
          }
          addSnapshot(row, col, 'backtrack');
          board[row] = -1;
          backtrackCount++;
        }
      }
      return false;
    };

    solve(0);
    this.snapshots = snapshots.slice(0, 60);
  }

  private generateAStarSnapshots(): void {
    const snapshots: StepSnapshot[] = [];
    const GRID_SIZE = 20;

    const start = { x: 0, y: 0 };
    const end = { x: 19, y: 19 };

    const obstacles: Set<string> = new Set();
    const obstaclePositions = [
      [5, 2], [5, 3], [5, 4], [5, 5], [5, 6],
      [10, 8], [10, 9], [10, 10], [10, 11], [10, 12],
      [14, 5], [14, 6], [14, 7], [14, 8], [14, 9],
      [3, 10], [4, 10], [5, 10], [6, 10],
      [15, 14], [15, 15], [15, 16], [15, 17],
      [8, 14], [9, 14], [10, 14], [11, 14],
    ];
    obstaclePositions.forEach(([x, y]) => obstacles.add(`${x},${y}`));

    const heuristic = (x: number, y: number): number => {
      return Math.abs(x - end.x) + Math.abs(y - end.y);
    };

    const openSet: Map<string, { x: number; y: number; g: number; h: number; f: number; parent: string | null }> =
      new Map();
    const closedSet: Set<string> = new Set();
    const cameFrom: Map<string, string> = new Map();

    const startKey = `${start.x},${start.y}`;
    openSet.set(startKey, {
      x: start.x,
      y: start.y,
      g: 0,
      h: heuristic(start.x, start.y),
      f: heuristic(start.x, start.y),
      parent: null,
    });

    const completedItems: string[] = [];
    const placedItems = [
      `start-${start.x}-${start.y}`,
      `end-${end.x}-${end.y}`,
      ...obstaclePositions.map(([x, y]) => `obstacle-${x}-${y}`),
    ];

    snapshots.push({
      stepIndex: 0,
      description: 'A*寻路算法初始化：设置起点、终点和障碍物',
      highlightedItems: [
        { id: `start-${start.x}-${start.y}`, type: 'path', position: { x: start.x, y: start.y }, effect: 'pulse' },
      ],
      completedItems,
      placedItems,
      infoData: {
        exploredNodes: 0,
        currentPathLength: 0,
        heuristicEstimate: heuristic(start.x, start.y),
      } as AStarInfo,
    });

    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
    ];

    let exploredCount = 0;
    const pathNodes: string[] = [];

    while (openSet.size > 0 && snapshots.length < 60) {
      let currentKey = '';
      let currentF = Infinity;
      openSet.forEach((node, key) => {
        if (node.f < currentF) {
          currentF = node.f;
          currentKey = key;
        }
      });

      if (!currentKey) break;

      const current = openSet.get(currentKey)!;
      openSet.delete(currentKey);
      closedSet.add(currentKey);
      exploredCount++;
      pathNodes.push(currentKey);

      const highlightedItems: HighlightItem[] = [
        {
          id: `path-${current.x}-${current.y}`,
          type: 'path',
          position: { x: current.x, y: current.y },
          effect: 'pulse',
        },
      ];

      if (current.x === end.x && current.y === end.y) {
        const finalPath: string[] = [];
        let key: string | null = currentKey;
        while (key) {
          finalPath.unshift(key);
          key = cameFrom.get(key) || null;
        }

        snapshots.push({
          stepIndex: snapshots.length,
          description: `A*寻路完成！找到最短路径，共 ${finalPath.length} 步`,
          highlightedItems: [
            { id: `end-${end.x}-${end.y}`, type: 'path', position: { x: end.x, y: end.y }, effect: 'pulse' },
          ],
          completedItems: [...finalPath.map((k) => `path-${k.replace(',', '-')}`)],
          placedItems,
          infoData: {
            exploredNodes: exploredCount,
            currentPathLength: finalPath.length,
            heuristicEstimate: 0,
          } as AStarInfo,
        });
        break;
      }

      for (const [dx, dy] of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const nKey = `${nx},${ny}`;

        if (
          nx < 0 || nx >= GRID_SIZE ||
          ny < 0 || ny >= GRID_SIZE ||
          obstacles.has(nKey) ||
          closedSet.has(nKey)
        ) {
          continue;
        }

        const tentativeG = current.g + 1;

        if (!openSet.has(nKey) || tentativeG < openSet.get(nKey)!.g) {
          cameFrom.set(nKey, currentKey);
          const h = heuristic(nx, ny);
          openSet.set(nKey, {
            x: nx,
            y: ny,
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: currentKey,
          });
        }
      }

      const bestOpen = Array.from(openSet.values()).sort((a, b) => a.f - b.f)[0];

      snapshots.push({
        stepIndex: snapshots.length,
        description: `考察节点 (${current.x}, ${current.y})，已考察 ${exploredCount} 个节点`,
        highlightedItems,
        completedItems: [...pathNodes.map((k) => `path-${k.replace(',', '-')}`)],
        placedItems,
        infoData: {
          exploredNodes: exploredCount,
          currentPathLength: current.g,
          heuristicEstimate: bestOpen ? bestOpen.h : 0,
        } as AStarInfo,
      });
    }

    this.snapshots = snapshots;
  }

  private generateBinaryTreeSnapshots(): void {
    const snapshots: StepSnapshot[] = [];

    const buildSampleTree = (): TreeNode => {
      return {
        value: 1,
        left: {
          value: 2,
          left: { value: 4, left: null, right: null },
          right: { value: 5, left: null, right: null },
        },
        right: {
          value: 3,
          left: { value: 6, left: null, right: null },
          right: { value: 7, left: null, right: null },
        },
      };
    };

    const root = buildSampleTree();
    const nodePositions: Map<number, { depth: number; offset: number }> = new Map();

    const calculatePositions = (node: TreeNode | null, depth: number, offset: number): void => {
      if (!node) return;
      nodePositions.set(node.value, { depth, offset });
      calculatePositions(node.left, depth + 1, offset - 1);
      calculatePositions(node.right, depth + 1, offset + 1);
    };
    calculatePositions(root, 0, 0);

    const placedItems: string[] = [];
    nodePositions.forEach((_, val) => {
      placedItems.push(`node-${val}`);
    });

    const inorderTraversal = (node: TreeNode | null, visitOrder: number[]): void => {
      if (!node) return;

      snapshots.push({
        stepIndex: snapshots.length,
        description: `到达节点 ${node.value}，先遍历左子树`,
        highlightedItems: [
          { id: `node-${node.value}`, type: 'node', position: { id: String(node.value) }, effect: 'border' },
        ],
        completedItems: visitOrder.map((v) => `node-${v}`),
        placedItems,
        infoData: {
          currentNodeValue: node.value,
          visitOrderIndex: visitOrder.length,
        } as BinaryTreeInfo,
      });

      inorderTraversal(node.left, visitOrder);

      visitOrder.push(node.value);

      snapshots.push({
        stepIndex: snapshots.length,
        description: `访问节点 ${node.value}（第 ${visitOrder.length} 个访问）`,
        highlightedItems: [
          { id: `node-${node.value}`, type: 'node', position: { id: String(node.value) }, effect: 'scale' },
        ],
        completedItems: visitOrder.map((v) => `node-${v}`),
        placedItems,
        infoData: {
          currentNodeValue: node.value,
          visitOrderIndex: visitOrder.length,
        } as BinaryTreeInfo,
      });

      inorderTraversal(node.right, visitOrder);
    };

    snapshots.push({
      stepIndex: 0,
      description: '二叉树中序遍历初始化',
      highlightedItems: [],
      completedItems: [],
      placedItems,
      infoData: {
        currentNodeValue: null,
        visitOrderIndex: 0,
      } as BinaryTreeInfo,
    });

    inorderTraversal(root, []);

    this.snapshots = snapshots;
  }

  getTotalSteps(): number {
    return this.snapshots.length;
  }

  getAllSnapshots(): StepSnapshot[] {
    return this.snapshots;
  }

  getSnapshot(index: number): StepSnapshot | null {
    if (index < 0 || index >= this.snapshots.length) return null;
    return this.snapshots[index];
  }

  reset(): void {
    this.generateSnapshots();
  }
}
