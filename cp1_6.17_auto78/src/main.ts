import * as THREE from 'three';
import { SceneController } from './sceneController';
import { UIController, CellDetailData } from './uiController';
import { DisplayMode } from './heatmapCalculator';
import { generateMockData, TIME_SLOTS, TrafficDataset } from './dataProcessor';

let dataset: TrafficDataset;
let sceneCtrl: SceneController;
let uiCtrl: UIController;

function getHistoryForCell(x: number, z: number, currentIdx: number): { label: string; value: number }[] {
  const history: { label: string; value: number }[] = [];
  for (let i = 3; i >= 1; i--) {
    const idx = Math.max(0, currentIdx - i);
    const slot = dataset.timeSlots[idx];
    history.push({
      label: slot.time,
      value: slot.grid[z][x]
    });
  }
  return history;
}

function init(): void {
  dataset = generateMockData();

  const canvasContainer = document.getElementById('canvas-container') as HTMLElement;

  uiCtrl = new UIController({
    onTimeChange: (idx) => {
      sceneCtrl.setTimeSlot(idx, true);
    },
    onModeChange: (mode: DisplayMode) => {
      sceneCtrl.setDisplayMode(mode);
    },
    onGainChange: (gain) => {
      sceneCtrl.setGain(gain);
    },
    onDetailClose: () => {
      sceneCtrl.setSelectedCell(null, null);
    }
  });

  sceneCtrl = new SceneController(canvasContainer, dataset, {
    onCellClick: (x: number, z: number, _worldPos: THREE.Vector3) => {
      const currentTimeIdx = parseInt(
        (document.getElementById('timeSlider') as HTMLInputElement).value,
        10
      );
      const slot = dataset.timeSlots[currentTimeIdx];
      const density = sceneCtrl.getDensityAt(x, z);
      const roadName = slot?.roadNames[z]?.[x] || '';

      const detail: CellDetailData = {
        roadName,
        density,
        gridX: x,
        gridZ: z,
        history: getHistoryForCell(x, z, currentTimeIdx)
      };

      sceneCtrl.setSelectedCell(x, z);
      uiCtrl.showDetail(detail);
    }
  });

  sceneCtrl.setDisplayMode(DisplayMode.HEATMAP);
  uiCtrl.setTime(0);
  uiCtrl.setMode(DisplayMode.HEATMAP);
  uiCtrl.setGain(1.0);
  sceneCtrl.start();
}

document.addEventListener('DOMContentLoaded', init);
