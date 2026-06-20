import { ScatterPlot } from './scatterPlot';
import { UIControls } from './uiControls';
import { loadMockData } from './dataParser';
import type { CellData, AxisMapping, SelectionStats } from './types';

let scatterPlot: ScatterPlot | null = null;
let uiControls: UIControls | null = null;

async function init() {
  const app = document.getElementById('app')!;

  uiControls = new UIControls(app, {
    onAxisChange: handleAxisChange,
    onClearSelection: handleClearSelection
  });

  try {
    const { data } = await loadMockData();
    initializeScatterPlot(data);
    uiControls.hideLoading();
  } catch (error) {
    console.error('Failed to load data:', error);
    alert('数据加载失败，请刷新页面重试');
  }
}

function initializeScatterPlot(data: CellData[]) {
  const canvasContainer = document.getElementById('canvas-container')!;

  scatterPlot = new ScatterPlot(canvasContainer, data, {
    onSelectionChange: handleSelectionChange,
    onCellClick: handleCellClick,
    onCellHover: handleCellHover
  });
}

function handleAxisChange(mapping: Partial<AxisMapping>) {
  if (scatterPlot) {
    scatterPlot.updateMapping(mapping);
  }
}

function handleClearSelection() {
  if (scatterPlot) {
    scatterPlot.clearSelection();
  }
}

function handleSelectionChange(stats: SelectionStats | null) {
  if (uiControls) {
    uiControls.updateStats(stats);
  }
}

function handleCellClick(cell: CellData) {
  if (uiControls) {
    uiControls.showModal(cell);
  }
}

function handleCellHover(cell: CellData | null) {
  if (uiControls) {
    uiControls.showHoverTooltip(cell);
  }
}

window.addEventListener('beforeunload', () => {
  if (scatterPlot) {
    scatterPlot.dispose();
  }
});

init();
