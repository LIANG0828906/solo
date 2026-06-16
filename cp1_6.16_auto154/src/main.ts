import { ViewportModule } from './module-viewport';
import { runSimulation } from './module-simulation';
import { UIManager } from './ui';
import { useAppStore } from './store';
import type { BuildingBlock, WindParams, SimulationResult } from './types';

const app = document.getElementById('app')!;

const viewportContainer = document.createElement('div');
viewportContainer.style.cssText = `
  flex:1;min-width:0;position:relative;overflow:hidden;
  background:#0A1929;
`;
app.appendChild(viewportContainer);

const viewport = new ViewportModule(viewportContainer);
const ui = new UIManager(app, viewportContainer);
ui.initialize();

viewport.updateWindArrow(useAppStore.getState().windParams);

viewport.setFPSCallback((fps: number) => {
  useAppStore.getState().setFps(fps);
});

viewport.setMouseMoveCallback((x: number, z: number) => {
  useAppStore.getState().setMouseCoord(x, z);
});

viewport.setBuildingChangeCallback((id: string, updates: Partial<BuildingBlock>) => {
  useAppStore.getState().updateBuilding(id, updates);
});

viewport.setBuildingClickCallback((id: string | null) => {
  useAppStore.getState().selectBuilding(id);
  if (id) {
    const b = useAppStore.getState().buildings.find((x) => x.id === id);
    if (b) viewport.setDragStartBuilding(b);
  }
});

viewport.setGroundDblClickCallback((x: number, z: number) => {
  ui.addBuildingAt(x, z);
});

useAppStore.subscribe((state, prev) => {
  if (state.buildings !== prev.buildings) {
    viewport.setBuildings(state.buildings, state.selectedBuildingId);
  }
  if (state.selectedBuildingId !== prev.selectedBuildingId) {
    viewport.setBuildings(state.buildings, state.selectedBuildingId);
    const b = state.buildings.find((x) => x.id === state.selectedBuildingId);
    if (b) viewport.setDragStartBuilding(b);
  }
  if (state.windParams !== prev.windParams) {
    viewport.updateWindArrow(state.windParams);
  }
  if (state.visualizationMode !== prev.visualizationMode) {
    const result = state.simulationResult;
    if (result) {
      viewport.showVisualization(state.visualizationMode, result);
    }
  }
  if (state.simulationResult !== prev.simulationResult) {
    viewport.showVisualization(state.visualizationMode, state.simulationResult);
  }
  if (state.resultPanelOpen !== prev.resultPanelOpen && state.resultPanelOpen) {
    setTimeout(() => {
      const result = useAppStore.getState().simulationResult;
      if (result) {
        viewport.showVisualization(useAppStore.getState().visualizationMode, result);
      }
    }, 50);
  }
});

let simRunning = false;

async function doSimulation(): Promise<void> {
  if (simRunning) return;
  simRunning = true;

  const state = useAppStore.getState();
  useAppStore.getState().setIsSimulating(true);

  const buildings = JSON.parse(JSON.stringify(state.buildings)) as BuildingBlock[];
  const windParams = { ...state.windParams };

  let result: SimulationResult;

  try {
    await new Promise((r) => setTimeout(r, 30));
    result = await new Promise((resolve, reject) => {
      try {
        const r = runSimulation(buildings, windParams);
        resolve(r);
      } catch (e) {
        reject(e);
      }
    });
  } catch (err) {
    console.error('Simulation failed:', err);
    alert('模拟计算失败：' + (err as Error).message);
    useAppStore.getState().setIsSimulating(false);
    simRunning = false;
    return;
  }

  useAppStore.getState().setSimulationResult(result);
  useAppStore.getState().setResultPanelOpen(true);
  useAppStore.getState().setIsSimulating(false);
  simRunning = false;
}

document.addEventListener('trigger-simulation', () => {
  doSimulation();
});

document.addEventListener('rerender-visualization', ((e: CustomEvent) => {
  const mode = e.detail as 'streamline' | 'contour';
  const result = useAppStore.getState().simulationResult;
  if (result) {
    viewport.showVisualization(mode, result);
  }
}) as EventListener);

viewport.setBuildings(useAppStore.getState().buildings, useAppStore.getState().selectedBuildingId);

window.addEventListener('beforeunload', () => {
  viewport.dispose();
});
