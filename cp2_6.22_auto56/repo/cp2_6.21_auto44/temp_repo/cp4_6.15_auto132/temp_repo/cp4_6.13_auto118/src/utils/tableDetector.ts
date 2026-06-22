import { v4 as uuidv4 } from 'uuid';
import type { TextItem, TableData, CellData } from '../../shared/types';
import { MAX_ROWS, MAX_COLS } from './constants';

interface Cluster {
  items: TextItem[];
  y: number;
  height: number;
}

interface ColumnBoundary {
  x: number;
  width: number;
}

function clusterByY(items: TextItem[], epsFactor = 0.5): Cluster[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => a.y - b.y);
  const clusters: Cluster[] = [];
  let currentCluster: TextItem[] = [sorted[0]];
  let avgHeight = sorted[0].height;

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];
    const gap = current.y - (prev.y + prev.height);
    const eps = avgHeight * epsFactor;

    if (gap < eps) {
      currentCluster.push(current);
      avgHeight = currentCluster.reduce((sum, item) => sum + item.height, 0) / currentCluster.length;
    } else {
      const clusterY = Math.min(...currentCluster.map((item) => item.y));
      const clusterHeight = Math.max(...currentCluster.map((item) => item.y + item.height)) - clusterY;
      clusters.push({ items: currentCluster, y: clusterY, height: clusterHeight });
      currentCluster = [current];
      avgHeight = current.height;
    }
  }

  if (currentCluster.length > 0) {
    const clusterY = Math.min(...currentCluster.map((item) => item.y));
    const clusterHeight = Math.max(...currentCluster.map((item) => item.y + item.height)) - clusterY;
    clusters.push({ items: currentCluster, y: clusterY, height: clusterHeight });
  }

  return clusters;
}

function detectColumns(rows: Cluster[], pageWidth: number): ColumnBoundary[] {
  const allXPositions: number[] = [];
  const allWidths: number[] = [];

  rows.forEach((row) => {
    row.items.forEach((item) => {
      allXPositions.push(item.x);
      allWidths.push(item.width);
    });
  });

  if (allXPositions.length === 0) return [];

  const sortedX = [...new Set(allXPositions)].sort((a, b) => a - b);
  const avgWidth = allWidths.reduce((a, b) => a + b, 0) / allWidths.length;
  const eps = avgWidth * 0.3;

  const columns: ColumnBoundary[] = [];
  let currentX = sortedX[0];
  let currentMaxRight = sortedX[0] + (allWidths[allXPositions.indexOf(sortedX[0])] || avgWidth);

  for (let i = 1; i < sortedX.length; i++) {
    const x = sortedX[i];
    if (x - currentX < eps) {
      const idx = allXPositions.indexOf(x);
      const right = x + (allWidths[idx] || avgWidth);
      currentMaxRight = Math.max(currentMaxRight, right);
    } else {
      columns.push({ x: currentX, width: currentMaxRight - currentX });
      currentX = x;
      const idx = allXPositions.indexOf(x);
      currentMaxRight = x + (allWidths[idx] || avgWidth);
    }
  }

  columns.push({ x: currentX, width: currentMaxRight - currentX });

  if (columns.length > 1) {
    for (let i = 0; i < columns.length - 1; i++) {
      const gap = columns[i + 1].x - (columns[i].x + columns[i].width);
      if (gap > 0) {
        columns[i].width += gap / 2;
        columns[i + 1].x -= gap / 2;
        columns[i + 1].width += gap / 2;
      }
    }
  }

  const pageMargin = pageWidth * 0.05;
  return columns.filter((col) => col.x > pageMargin && col.x + col.width < pageWidth - pageMargin);
}

function findColumnIndex(x: number, columns: ColumnBoundary[]): number {
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    if (x >= col.x - col.width * 0.3 && x < col.x + col.width * 1.3) {
      return i;
    }
  }
  return -1;
}

function generateCellGrid(rows: Cluster[], columns: ColumnBoundary[]): (TextItem | null)[][] {
  const grid: (TextItem | null)[][] = [];

  for (let r = 0; r < rows.length; r++) {
    const row: (TextItem | null)[] = new Array(columns.length).fill(null);
    for (const item of rows[r].items) {
      const colIdx = findColumnIndex(item.x, columns);
      if (colIdx >= 0 && colIdx < columns.length) {
        if (row[colIdx] === null || item.str.length > row[colIdx]!.str.length) {
          row[colIdx] = item;
        }
      }
    }
    grid.push(row);
  }

  return grid;
}

function detectMergedCells(grid: (TextItem | null)[][]): { grid: (TextItem | null)[][]; merges: Map<string, { rowspan: number; colspan: number }> } {
  const merges = new Map<string, { rowspan: number; colspan: number }>();
  const visited = new Set<string>();
  const newGrid = grid.map((row) => [...row]);

  for (let r = 0; r < newGrid.length; r++) {
    for (let c = 0; c < newGrid[r].length; c++) {
      const key = `${r}-${c}`;
      if (visited.has(key)) continue;

      if (newGrid[r][c] !== null) {
        let rowspan = 1;
        let colspan = 1;

        while (r + rowspan < newGrid.length && newGrid[r + rowspan][c] === null) {
          rowspan++;
        }

        while (c + colspan < newGrid[r].length && newGrid[r][c + colspan] === null) {
          let allEmptyInCol = true;
          for (let rr = r; rr < r + rowspan; rr++) {
            if (newGrid[rr]?.[c + colspan] !== null) {
              allEmptyInCol = false;
              break;
            }
          }
          if (allEmptyInCol) {
            colspan++;
          } else {
            break;
          }
        }

        if (rowspan > 1 || colspan > 1) {
          merges.set(key, { rowspan, colspan });
          for (let rr = r; rr < r + rowspan; rr++) {
            for (let cc = c; cc < c + colspan; cc++) {
              visited.add(`${rr}-${cc}`);
              if (rr !== r || cc !== c) {
                newGrid[rr][cc] = newGrid[r][c];
              }
            }
          }
        }
      }
      visited.add(key);
    }
  }

  return { grid: newGrid, merges };
}

function convertToTableData(
  grid: (TextItem | null)[][],
  merges: Map<string, { rowspan: number; colspan: number }>,
  pageNumber: number
): TableData[] {
  if (grid.length === 0 || grid[0].length === 0) return [];

  const tables: TableData[] = [];
  let currentTableRows: (TextItem | null)[][] = [];

  for (const row of grid) {
    const hasContent = row.some((cell) => cell !== null);
    if (hasContent) {
      currentTableRows.push(row);
    } else if (currentTableRows.length > 0) {
      const table = createTableFromRows(currentTableRows, merges, pageNumber);
      if (table.rowCount >= 2 && table.colCount >= 2) {
        tables.push(table);
      }
      currentTableRows = [];
    }
  }

  if (currentTableRows.length > 0) {
    const table = createTableFromRows(currentTableRows, merges, pageNumber);
    if (table.rowCount >= 2 && table.colCount >= 2) {
      tables.push(table);
    }
  }

  return tables;
}

function createTableFromRows(
  rows: (TextItem | null)[][],
  merges: Map<string, { rowspan: number; colspan: number }>,
  pageNumber: number
): TableData {
  const rowCount = Math.min(rows.length, MAX_ROWS);
  const colCount = Math.min(rows[0].length, MAX_COLS);

  const tableRows: CellData[][] = [];
  const hiddenCells = new Set<string>();

  for (let r = 0; r < rowCount; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < colCount; c++) {
      const key = `${r}-${c}`;
      const item = rows[r]?.[c];
      const mergeInfo = merges.get(key);

      if (hiddenCells.has(key)) {
        row.push({
          id: uuidv4(),
          text: '',
          row: r,
          col: c,
          rowspan: 1,
          colspan: 1,
          isMerged: false,
          isHidden: true,
        });
        continue;
      }

      const cell: CellData = {
        id: uuidv4(),
        text: item?.str || '',
        row: r,
        col: c,
        rowspan: mergeInfo?.rowspan || 1,
        colspan: mergeInfo?.colspan || 1,
        isMerged: !!(mergeInfo && (mergeInfo.rowspan > 1 || mergeInfo.colspan > 1)),
        isHidden: false,
      };

      if (mergeInfo && (mergeInfo.rowspan > 1 || mergeInfo.colspan > 1)) {
        for (let rr = r; rr < r + mergeInfo.rowspan; rr++) {
          for (let cc = c; cc < c + mergeInfo.colspan; cc++) {
            if (rr !== r || cc !== c) {
              hiddenCells.add(`${rr}-${cc}`);
            }
          }
        }
      }

      row.push(cell);
    }
    tableRows.push(row);
  }

  const filledCells = tableRows.flat().filter((cell) => !cell.isHidden && cell.text.trim().length > 0).length;
  const totalCells = rowCount * colCount;
  const confidence = totalCells > 0 ? filledCells / totalCells : 0;

  return {
    id: uuidv4(),
    pageNumber,
    rows: tableRows,
    rowCount,
    colCount,
    confidence,
    isEdited: false,
  };
}

export function detectTables(items: TextItem[], pageWidth: number, pageHeight: number, pageNumber: number): TableData[] {
  if (items.length < 4) return [];

  const sortedByY = [...items].sort((a, b) => a.y - b.y);
  const rows = clusterByY(sortedByY);

  if (rows.length < 2) return [];

  const columns = detectColumns(rows, pageWidth);

  if (columns.length < 2) return [];

  const grid = generateCellGrid(rows, columns);
  const { grid: mergedGrid, merges } = detectMergedCells(grid);

  return convertToTableData(mergedGrid, merges, pageNumber);
}

export function createEmptyTable(rowCount: number, colCount: number, pageNumber: number): TableData {
  const rows: CellData[][] = [];
  for (let r = 0; r < rowCount; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < colCount; c++) {
      row.push({
        id: uuidv4(),
        text: '',
        row: r,
        col: c,
        rowspan: 1,
        colspan: 1,
        isMerged: false,
        isHidden: false,
      });
    }
    rows.push(row);
  }

  return {
    id: uuidv4(),
    pageNumber,
    rows,
    rowCount,
    colCount,
    confidence: 0,
    isEdited: false,
  };
}
