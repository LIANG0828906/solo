import { v4 as uuidv4 } from 'uuid';
import type { TableData, CellData } from '../../shared/types';
import { MAX_ROWS, MAX_COLS } from './constants';

export function mergeCells(
  table: TableData,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): TableData {
  if (startRow < 0 || startCol < 0 || endRow >= table.rowCount || endCol >= table.colCount) {
    return table;
  }

  if (startRow > endRow || startCol > endCol) {
    return table;
  }

  const newRows = table.rows.map((row) => row.map((cell) => ({ ...cell })));
  const rows = endRow - startRow + 1;
  const cols = endCol - startCol + 1;

  let mergedText = '';
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = newRows[r][c];
      if (!cell.isHidden && cell.text.trim()) {
        if (mergedText) mergedText += ' ';
        mergedText += cell.text.trim();
      }
    }
  }

  newRows[startRow][startCol] = {
    ...newRows[startRow][startCol],
    text: mergedText,
    rowspan: rows,
    colspan: cols,
    isMerged: true,
    isHidden: false,
  };

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (r !== startRow || c !== startCol) {
        newRows[r][c] = {
          ...newRows[r][c],
          isHidden: true,
        };
      }
    }
  }

  return {
    ...table,
    rows: newRows,
    isEdited: true,
  };
}

export function splitCells(table: TableData, row: number, col: number): TableData {
  const cell = table.rows[row]?.[col];
  if (!cell || !cell.isMerged) return table;

  const newRows = table.rows.map((r) => r.map((c) => ({ ...c })));
  const rowspan = cell.rowspan;
  const colspan = cell.colspan;

  const mainText = cell.text;

  newRows[row][col] = {
    ...cell,
    text: mainText,
    rowspan: 1,
    colspan: 1,
    isMerged: false,
  };

  for (let r = row; r < row + rowspan; r++) {
    for (let c = col; c < col + colspan; c++) {
      if (r !== row || c !== col) {
        if (newRows[r]?.[c]) {
          newRows[r][c] = {
            ...newRows[r][c],
            isHidden: false,
            text: '',
          };
        }
      }
    }
  }

  return {
    ...table,
    rows: newRows,
    isEdited: true,
  };
}

export function updateCellText(table: TableData, row: number, col: number, text: string): TableData {
  if (!table.rows[row]?.[col] || table.rows[row][col].isHidden) {
    return table;
  }

  const newRows = table.rows.map((r) => r.map((c) => ({ ...c })));
  newRows[row][col].text = text;

  return {
    ...table,
    rows: newRows,
    isEdited: true,
  };
}

export function addRow(table: TableData, afterRow: number): TableData {
  if (table.rowCount >= MAX_ROWS) return table;

  const newRows = table.rows.map((r) => r.map((c) => ({ ...c })));
  const insertIndex = afterRow + 1;

  const newRow: CellData[] = [];
  for (let c = 0; c < table.colCount; c++) {
    newRow.push({
      id: uuidv4(),
      text: '',
      row: insertIndex,
      col: c,
      rowspan: 1,
      colspan: 1,
      isMerged: false,
      isHidden: false,
    });
  }

  newRows.splice(insertIndex, 0, newRow);

  for (let r = insertIndex; r < newRows.length; r++) {
    for (let c = 0; c < newRows[r].length; c++) {
      newRows[r][c].row = r;
    }
  }

  return {
    ...table,
    rows: newRows,
    rowCount: newRows.length,
    isEdited: true,
  };
}

export function deleteRow(table: TableData, rowIndex: number): TableData {
  if (table.rowCount <= 1) return table;
  if (rowIndex < 0 || rowIndex >= table.rowCount) return table;

  const newRows = table.rows.map((r) => r.map((c) => ({ ...c })));

  for (let c = 0; c < table.colCount; c++) {
    const cell = newRows[rowIndex][c];
    if (cell.isMerged && cell.rowspan > 1) {
      const endRow = rowIndex + cell.rowspan - 1;
      if (endRow < table.rowCount - 1) {
        newRows[endRow + 1][c] = {
          ...newRows[endRow + 1][c],
          text: cell.text,
          rowspan: cell.rowspan - 1,
          colspan: cell.colspan,
          isMerged: cell.rowspan - 1 > 1 || cell.colspan > 1,
          isHidden: false,
        };
        for (let r = rowIndex + 1; r <= endRow; r++) {
          newRows[r][c].isHidden = true;
        }
      }
    }
  }

  newRows.splice(rowIndex, 1);

  for (let r = rowIndex; r < newRows.length; r++) {
    for (let c = 0; c < newRows[r].length; c++) {
      newRows[r][c].row = r;
    }
  }

  return {
    ...table,
    rows: newRows,
    rowCount: newRows.length,
    isEdited: true,
  };
}

export function addColumn(table: TableData, afterCol: number): TableData {
  if (table.colCount >= MAX_COLS) return table;

  const newRows = table.rows.map((r) => r.map((c) => ({ ...c })));
  const insertIndex = afterCol + 1;

  for (let r = 0; r < newRows.length; r++) {
    const newCell: CellData = {
      id: uuidv4(),
      text: '',
      row: r,
      col: insertIndex,
      rowspan: 1,
      colspan: 1,
      isMerged: false,
      isHidden: false,
    };
    newRows[r].splice(insertIndex, 0, newCell);

    for (let c = insertIndex; c < newRows[r].length; c++) {
      newRows[r][c].col = c;
    }
  }

  return {
    ...table,
    rows: newRows,
    colCount: newRows[0].length,
    isEdited: true,
  };
}

export function deleteColumn(table: TableData, colIndex: number): TableData {
  if (table.colCount <= 1) return table;
  if (colIndex < 0 || colIndex >= table.colCount) return table;

  const newRows = table.rows.map((r) => r.map((c) => ({ ...c })));

  for (let r = 0; r < table.rowCount; r++) {
    const cell = newRows[r][colIndex];
    if (cell.isMerged && cell.colspan > 1) {
      const endCol = colIndex + cell.colspan - 1;
      if (endCol < table.colCount - 1) {
        newRows[r][endCol + 1] = {
          ...newRows[r][endCol + 1],
          text: cell.text,
          rowspan: cell.rowspan,
          colspan: cell.colspan - 1,
          isMerged: cell.rowspan > 1 || cell.colspan - 1 > 1,
          isHidden: false,
        };
        for (let c = colIndex + 1; c <= endCol; c++) {
          newRows[r][c].isHidden = true;
        }
      }
    }
  }

  for (let r = 0; r < newRows.length; r++) {
    newRows[r].splice(colIndex, 1);
    for (let c = colIndex; c < newRows[r].length; c++) {
      newRows[r][c].col = c;
    }
  }

  return {
    ...table,
    rows: newRows,
    colCount: newRows[0].length,
    isEdited: true,
  };
}

export function getCellDisplayPosition(
  table: TableData,
  row: number,
  col: number
): { displayRow: number; displayCol: number } | null {
  const cell = table.rows[row]?.[col];
  if (!cell) return null;

  if (cell.isHidden) {
    for (let r = row; r >= 0; r--) {
      for (let c = col; c >= 0; c--) {
        const possibleMaster = table.rows[r]?.[c];
        if (
          possibleMaster &&
          possibleMaster.isMerged &&
          r + possibleMaster.rowspan > row &&
          c + possibleMaster.colspan > col
        ) {
          return { displayRow: r, displayCol: c };
        }
      }
    }
    return null;
  }

  return { displayRow: row, displayCol: col };
}

export function validateSelection(
  table: TableData,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): boolean {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = table.rows[r]?.[c];
      if (!cell) return false;

      if (cell.isMerged) {
        const cellEndRow = r + cell.rowspan - 1;
        const cellEndCol = c + cell.colspan - 1;
        if (cellEndRow > endRow || cellEndCol > endCol) {
          return false;
        }
        if (r < startRow || c < startCol) {
          return false;
        }
      }
    }
  }
  return true;
}
