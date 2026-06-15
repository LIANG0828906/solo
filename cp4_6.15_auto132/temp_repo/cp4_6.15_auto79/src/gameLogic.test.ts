import { describe, it, expect, beforeEach } from 'vitest';
import { SweeperGame, Cell } from './gameLogic';

describe('SweeperGame', () => {
  let game: SweeperGame;
  const ROWS = 16;
  const COLS = 16;
  const MINES = 40;

  beforeEach(() => {
    game = new SweeperGame(ROWS, COLS, MINES);
  });

  describe('初始化', () => {
    it('应该创建正确尺寸的网格', () => {
      const grid = game.getGrid();
      expect(grid.length).toBe(ROWS);
      expect(grid[0].length).toBe(COLS);
    });

    it('初始化时所有格子都未揭开且不是地雷', () => {
      const grid = game.getGrid();
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          expect(grid[row][col].isRevealed).toBe(false);
          expect(grid[row][col].isMine).toBe(false);
          expect(grid[row][col].isMarked).toBe(false);
          expect(grid[row][col].adjacentMines).toBe(0);
        }
      }
    });

    it('每个格子都有唯一的ID', () => {
      const grid = game.getGrid();
      const ids = new Set<string>();
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          expect(ids.has(grid[row][col].id)).toBe(false);
          ids.add(grid[row][col].id);
        }
      }
      expect(ids.size).toBe(ROWS * COLS);
    });

    it('应该正确返回安全格子总数', () => {
      expect(game.getTotalSafeCells()).toBe(ROWS * COLS - MINES);
    });
  });

  describe('地雷生成', () => {
    it('首次点击后生成正确数量的地雷', () => {
      game.revealCell(8, 8);
      const grid = game.getGrid();
      let mineCount = 0;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (grid[row][col].isMine) mineCount++;
        }
      }
      expect(mineCount).toBe(MINES);
    });

    it('首次点击的位置及其周围不会有地雷', () => {
      const clickRow = 8;
      const clickCol = 8;
      game.revealCell(clickRow, clickCol);
      const grid = game.getGrid();

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = clickRow + dr;
          const c = clickCol + dc;
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            expect(grid[r][c].isMine).toBe(false);
          }
        }
      }
    });

    it('正确计算相邻地雷数', () => {
      game.revealCell(0, 0);
      const grid = game.getGrid();

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (!grid[row][col].isMine) {
            let expectedCount = 0;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                  if (grid[r][c].isMine) expectedCount++;
                }
              }
            }
            expect(grid[row][col].adjacentMines).toBe(expectedCount);
          }
        }
      }
    });
  });

  describe('揭开格子', () => {
    it('揭开安全格子应该标记为已揭开', () => {
      game.revealCell(8, 8);
      const grid = game.getGrid();
      expect(grid[8][8].isRevealed).toBe(true);
    });

    it('揭开地雷应该返回hitMine为true', () => {
      game.revealCell(8, 8);
      const grid = game.getGrid();

      let mineRow = -1, mineCol = -1;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (grid[row][col].isMine && !grid[row][col].isRevealed) {
            mineRow = row;
            mineCol = col;
            break;
          }
        }
        if (mineRow !== -1) break;
      }

      const result = game.revealCell(mineRow, mineCol);
      expect(result.hitMine).toBe(true);
    });

    it('揭开地雷后所有地雷都应该被揭开', () => {
      game.revealCell(8, 8);
      const grid = game.getGrid();

      let mineRow = -1, mineCol = -1;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (grid[row][col].isMine && !grid[row][col].isRevealed) {
            mineRow = row;
            mineCol = col;
            break;
          }
        }
        if (mineRow !== -1) break;
      }

      game.revealCell(mineRow, mineCol);
      const newGrid = game.getGrid();

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (newGrid[row][col].isMine) {
            expect(newGrid[row][col].isRevealed).toBe(true);
          }
        }
      }
    });

    it('揭开空白格子应该递归揭开周围的空白格子', () => {
      const smallGame = new SweeperGame(5, 5, 1);
      smallGame.revealCell(2, 2);
      const grid = smallGame.getGrid();
      const revealedCount = smallGame.getRevealedCount();
      expect(revealedCount).toBeGreaterThan(1);
    });

    it('揭开已标记的格子不会生效', () => {
      game.revealCell(8, 8);
      game.markCell(0, 0);
      const result = game.revealCell(0, 0);
      expect(result.hitMine).toBe(false);
      expect(result.cellsRevealed.length).toBe(0);
    });

    it('揭开已揭开的格子不会重复揭开', () => {
      const result1 = game.revealCell(8, 8);
      const result2 = game.revealCell(8, 8);
      expect(result1.cellsRevealed.length).toBeGreaterThan(0);
      expect(result2.cellsRevealed.length).toBe(0);
    });
  });

  describe('标记格子', () => {
    it('可以标记未揭开的格子', () => {
      const result = game.markCell(0, 0);
      expect(result).toBe(true);
      expect(game.getGrid()[0][0].isMarked).toBe(true);
    });

    it('可以取消已标记的格子', () => {
      game.markCell(0, 0);
      game.markCell(0, 0);
      expect(game.getGrid()[0][0].isMarked).toBe(false);
    });

    it('不能标记已揭开的格子', () => {
      game.revealCell(8, 8);
      const result = game.markCell(8, 8);
      expect(result).toBe(false);
      expect(game.getGrid()[8][8].isMarked).toBe(false);
    });
  });

  describe('区域揭开（侦察兵技能）', () => {
    it('应该揭开3x3范围内的所有格子', () => {
      const revealed = game.revealArea(8, 8, 3);
      expect(revealed.length).toBe(9);

      const grid = game.getGrid();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          expect(grid[8 + dr][8 + dc].isRevealed).toBe(true);
        }
      }
    });

    it('边界位置的区域揭开不会越界', () => {
      const revealed = game.revealArea(0, 0, 3);
      expect(revealed.length).toBe(4);
    });

    it('不会重复揭开已揭开的格子', () => {
      game.revealCell(8, 8);
      const revealed = game.revealArea(8, 8, 3);
      expect(revealed.length).toBeLessThan(9);
    });
  });

  describe('疑似标记（工兵技能）', () => {
    it('可以标记疑似地雷', () => {
      const result = game.suspectCell(0, 0);
      expect(result.success).toBe(true);
      expect(game.getGrid()[0][0].isSuspected).toBe(true);
    });

    it('可以取消疑似标记', () => {
      game.suspectCell(0, 0);
      const result = game.suspectCell(0, 0);
      expect(result.success).toBe(true);
      expect(game.getGrid()[0][0].isSuspected).toBe(false);
    });

    it('不能疑似标记已揭开的格子', () => {
      game.revealCell(8, 8);
      const result = game.suspectCell(8, 8);
      expect(result.success).toBe(false);
      expect(game.getGrid()[8][8].isSuspected).toBe(false);
    });

    it('正确返回标记是否正确', () => {
      game.revealCell(8, 8);
      const grid = game.getGrid();

      let mineRow = -1, mineCol = -1;
      let safeRow = -1, safeCol = -1;

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (grid[row][col].isMine && !grid[row][col].isRevealed && mineRow === -1) {
            mineRow = row;
            mineCol = col;
          }
          if (!grid[row][col].isMine && !grid[row][col].isRevealed && safeRow === -1) {
            safeRow = row;
            safeCol = col;
          }
        }
      }

      const correctResult = game.suspectCell(mineRow, mineCol);
      expect(correctResult.isCorrect).toBe(true);

      const wrongResult = game.suspectCell(safeRow, safeCol);
      expect(wrongResult.isCorrect).toBe(false);
    });
  });

  describe('邻居获取', () => {
    it('获取正确的邻居数量', () => {
      const neighbors = game.getNeighbors(8, 8);
      expect(neighbors.length).toBe(8);
    });

    it('角落格子只有3个邻居', () => {
      const neighbors = game.getNeighbors(0, 0);
      expect(neighbors.length).toBe(3);
    });

    it('边缘格子只有5个邻居', () => {
      const neighbors = game.getNeighbors(0, 8);
      expect(neighbors.length).toBe(5);
    });
  });

  describe('胜利判定', () => {
    it('初始状态不应该胜利', () => {
      expect(game.checkWin()).toBe(false);
    });

    it('揭开所有安全格子后应该胜利', () => {
      const smallGame = new SweeperGame(3, 3, 1);
      smallGame.revealCell(1, 1);

      const grid = smallGame.getGrid();
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (!grid[row][col].isMine && !grid[row][col].isRevealed) {
            smallGame.revealCell(row, col);
          }
        }
      }

      expect(smallGame.checkWin()).toBe(true);
    });

    it('有未揭开的安全格子时不应该胜利', () => {
      const smallGame = new SweeperGame(3, 3, 1);
      smallGame.revealCell(0, 0);
      expect(smallGame.checkWin()).toBe(false);
    });
  });

  describe('失败判定', () => {
    it('初始状态不应该失败', () => {
      expect(game.checkLose()).toBe(false);
    });

    it('揭开地雷后应该失败', () => {
      game.revealCell(8, 8);
      const grid = game.getGrid();

      let mineRow = -1, mineCol = -1;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (grid[row][col].isMine && !grid[row][col].isRevealed) {
            mineRow = row;
            mineCol = col;
            break;
          }
        }
        if (mineRow !== -1) break;
      }

      game.revealCell(mineRow, mineCol);
      expect(game.checkLose()).toBe(true);
    });

    it('未揭开地雷时不应该失败', () => {
      game.revealCell(8, 8);
      expect(game.checkLose()).toBe(false);
    });
  });

  describe('已揭开计数', () => {
    it('初始状态已揭开数为0', () => {
      expect(game.getRevealedCount()).toBe(0);
    });

    it('揭开格子后计数正确', () => {
      game.revealCell(8, 8);
      const count = game.getRevealedCount();
      expect(count).toBeGreaterThan(0);

      const grid = game.getGrid();
      let actualCount = 0;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (grid[row][col].isRevealed && !grid[row][col].isMine) {
            actualCount++;
          }
        }
      }
      expect(count).toBe(actualCount);
    });

    it('揭开的地雷不计入已揭开数', () => {
      game.revealCell(8, 8);
      const grid = game.getGrid();

      let mineRow = -1, mineCol = -1;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (grid[row][col].isMine && !grid[row][col].isRevealed) {
            mineRow = row;
            mineCol = col;
            break;
          }
        }
        if (mineRow !== -1) break;
      }

      const countBefore = game.getRevealedCount();
      game.revealCell(mineRow, mineCol);
      const countAfter = game.getRevealedCount();
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('重置游戏', () => {
    it('重置后应该恢复初始状态', () => {
      game.revealCell(8, 8);
      game.markCell(0, 0);
      game.reset();

      const grid = game.getGrid();
      expect(game.getRevealedCount()).toBe(0);
      expect(grid[0][0].isMarked).toBe(false);
      expect(grid[8][8].isRevealed).toBe(false);

      let mineCount = 0;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (grid[row][col].isMine) mineCount++;
        }
      }
      expect(mineCount).toBe(0);
    });
  });

  describe('格子状态设置', () => {
    it('可以设置动画延迟', () => {
      game.setCellAnimationDelay(0, 0, 100);
      expect(game.getGrid()[0][0].animationDelay).toBe(100);
    });

    it('可以设置燃烧状态', () => {
      game.setCellBurning(0, 0, true);
      expect(game.getGrid()[0][0].isBurning).toBe(true);
      game.setCellBurning(0, 0, false);
      expect(game.getGrid()[0][0].isBurning).toBe(false);
    });

    it('可以设置涟漪状态', () => {
      game.setCellRippling(0, 0, true);
      expect(game.getGrid()[0][0].isRippling).toBe(true);
      game.setCellRippling(0, 0, false);
      expect(game.getGrid()[0][0].isRippling).toBe(false);
    });
  });

  describe('getCell', () => {
    it('返回正确的格子', () => {
      const cell = game.getCell(8, 8);
      expect(cell).not.toBeNull();
      expect(cell?.row).toBe(8);
      expect(cell?.col).toBe(8);
    });

    it('越界返回null', () => {
      expect(game.getCell(-1, 0)).toBeNull();
      expect(game.getCell(ROWS, 0)).toBeNull();
      expect(game.getCell(0, -1)).toBeNull();
      expect(game.getCell(0, COLS)).toBeNull();
    });
  });
});
