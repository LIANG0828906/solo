import { eventBus, EventType, CellType } from './eventBus';
import { CellSimulator } from './modules/cellSimulator';
import { Renderer3D } from './modules/renderer3d';
import { ControlPanel } from './ui/controlPanel';

const sceneContainer = document.getElementById('scene-container')!;
const controlPanelEl = document.getElementById('control-panel')!;

const simulator = new CellSimulator();
const renderer = new Renderer3D();
const panel = new ControlPanel(controlPanelEl);

renderer.init(sceneContainer);

sceneContainer.addEventListener('click', (e: MouseEvent) => {
  renderer.handleClick(e.clientX, e.clientY);
});

eventBus.on(EventType.SCENE_CELL_CLICKED, (payload) => {
  const { cellId } = payload as { cellId: string | null };
  const selectedType = panel.getSelectedType();

  if (cellId && selectedType) {
    eventBus.emit(EventType.DIFFERENTIATE_REQUESTED, {
      cellId,
      cellType: selectedType,
    });
  }
});

eventBus.on(EventType.STATE_SNAPSHOT_RESPONSE, (payload) => {
  const data = payload as { canSplit: boolean };
  const splitBtn = controlPanelEl.querySelector('button') as HTMLButtonElement;
  if (splitBtn) {
    splitBtn.disabled = !data.canSplit;
    splitBtn.style.opacity = data.canSplit ? '1' : '0.5';
  }
});

eventBus.on(EventType.SPLIT_COMPLETED, () => {
  const splitBtn = controlPanelEl.querySelector('button') as HTMLButtonElement;
  if (splitBtn) {
    splitBtn.disabled = false;
    splitBtn.style.opacity = '1';
  }
});

window.addEventListener('resize', () => {
  renderer.resize();
});
