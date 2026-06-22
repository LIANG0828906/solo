import {
  eventBus,
  EventType,
  CellType,
  CellData,
  RecordData,
  SplitStartPayload,
  DifferentiatePayload,
} from '../eventBus';

const CELL_COLORS: Record<CellType, string> = {
  default: '#8E44AD',
  neuron: '#E91E63',
  muscle: '#4CAF50',
  epithelial: '#2196F3',
};

const CELL_SCALES: Record<CellType, { x: number; y: number; z: number }> = {
  default: { x: 1, y: 1, z: 1 },
  neuron: { x: 1.5, y: 1, z: 1 },
  muscle: { x: 0.7, y: 1.4, z: 0.7 },
  epithelial: { x: 1.3, y: 0.38, z: 1.3 },
};

let idCounter = 0;
function generateId(): string {
  return `cell_${++idCounter}_${Date.now()}`;
}

export class CellSimulator {
  private cells: Map<string, CellData> = new Map();
  private selectedCellId: string | null = null;
  private splitInterval: number = 2;
  private splitCount: number = 0;
  private maxCells: number = 32;
  private isSplitting: boolean = false;
  private records: Map<string, RecordData> = new Map();
  private recordOrder: string[] = [];
  private maxRecords: number = 10;

  constructor() {
    this.initFirstCell();
    this.listenEvents();
  }

  private initFirstCell(): void {
    const firstCell: CellData = {
      id: generateId(),
      position: { x: 0, y: 0, z: 0 },
      color: CELL_COLORS.default,
      type: 'default',
      scale: { ...CELL_SCALES.default },
      parentId: null,
      generation: 0,
    };
    this.cells.set(firstCell.id, firstCell);
    eventBus.emit(EventType.CELL_CREATED, firstCell);
  }

  private listenEvents(): void {
    eventBus.on(EventType.SPLIT_REQUESTED, () => {
      this.splitCell();
    });

    eventBus.on(EventType.DIFFERENTIATE_REQUESTED, (payload) => {
      const p = payload as { cellId: string; cellType: CellType };
      this.differentiateCell(p.cellId, p.cellType);
    });

    eventBus.on(EventType.RECORD_SAVE_REQUESTED, () => {
      this.saveRecord();
    });

    eventBus.on(EventType.RECORD_RESTORE_REQUESTED, (payload) => {
      const p = payload as { recordId: string };
      this.restoreRecord(p.recordId);
    });

    eventBus.on(EventType.SCENE_CELL_CLICKED, (payload) => {
      const p = payload as { cellId: string | null };
      this.selectCell(p.cellId);
    });

    eventBus.on(EventType.STATE_SNAPSHOT_REQUESTED, () => {
      eventBus.emit(EventType.STATE_SNAPSHOT_RESPONSE, {
        cells: this.getCells(),
        selectedCellId: this.selectedCellId,
        splitCount: this.splitCount,
        canSplit: this.canSplit(),
        splitInterval: this.splitInterval,
      });
    });
  }

  private selectCell(cellId: string | null): void {
    this.selectedCellId = cellId;
    eventBus.emit(EventType.CELL_SELECTED, {
      cellId,
      cells: this.getCells(),
    });
  }

  async splitCell(): Promise<void> {
    if (this.isSplitting || this.cells.size >= this.maxCells) return;
    this.isSplitting = true;

    const parent = this.selectedCellId
      ? this.cells.get(this.selectedCellId)
      : this.findSplitCandidate();

    if (!parent) {
      this.isSplitting = false;
      return;
    }

    const offsetRange = 1 + Math.random();
    const angle = Math.random() * Math.PI * 2;
    const angleV = (Math.random() - 0.5) * Math.PI * 0.6;

    const offset1 = {
      x: Math.cos(angle) * Math.cos(angleV) * offsetRange,
      y: Math.sin(angleV) * offsetRange,
      z: Math.sin(angle) * Math.cos(angleV) * offsetRange,
    };
    const offset2 = {
      x: -offset1.x,
      y: -offset1.y,
      z: -offset1.z,
    };

    const child1: CellData = {
      id: generateId(),
      position: {
        x: parent.position.x + offset1.x,
        y: parent.position.y + offset1.y,
        z: parent.position.z + offset1.z,
      },
      color: parent.color,
      type: 'default',
      scale: { ...CELL_SCALES.default },
      parentId: parent.id,
      generation: parent.generation + 1,
    };

    const child2: CellData = {
      id: generateId(),
      position: {
        x: parent.position.x + offset2.x,
        y: parent.position.y + offset2.y,
        z: parent.position.z + offset2.z,
      },
      color: parent.color,
      type: 'default',
      scale: { ...CELL_SCALES.default },
      parentId: parent.id,
      generation: parent.generation + 1,
    };

    const payload: SplitStartPayload = {
      parentId: parent.id,
      parentPosition: { ...parent.position },
      parentColor: parent.color,
      child1,
      child2,
    };

    this.cells.delete(parent.id);
    eventBus.emit(EventType.CELL_REMOVED, { cellId: parent.id });
    eventBus.emit(EventType.SPLIT_STARTED, payload);

    await new Promise<void>(resolve => setTimeout(resolve, 2000));

    this.cells.set(child1.id, child1);
    this.cells.set(child2.id, child2);
    this.splitCount++;
    this.selectedCellId = null;

    eventBus.emit(EventType.CELL_CREATED, child1);
    eventBus.emit(EventType.CELL_CREATED, child2);
    eventBus.emit(EventType.SPLIT_COMPLETED, {
      child1,
      child2,
      cells: this.getCells(),
      splitCount: this.splitCount,
    });

    this.isSplitting = false;
  }

  private findSplitCandidate(): CellData | undefined {
    const arr = Array.from(this.cells.values());
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  differentiateCell(cellId: string, type: CellType): void {
    const cell = this.cells.get(cellId);
    if (!cell || cell.type === type) return;

    cell.type = type;
    cell.color = CELL_COLORS[type];
    cell.scale = { ...CELL_SCALES[type] };

    const payload: DifferentiatePayload = {
      cellId,
      cellType: type,
      targetColor: CELL_COLORS[type],
      targetScale: { ...CELL_SCALES[type] },
    };

    eventBus.emit(EventType.CELL_UPDATED, { cell: { ...cell } });
    eventBus.emit(EventType.DIFFERENTIATE_COMPLETED, payload);
  }

  saveRecord(): string {
    const id = `rec_${Date.now()}`;

    const allCells = this.getCells();
    const simplified = allCells.map(c => ({
      id: c.id,
      position: { x: c.position.x, y: c.position.y, z: c.position.z },
      color: c.color,
      type: c.type,
      scale: { x: c.scale.x, y: c.scale.y, z: c.scale.z },
      parentId: c.parentId,
      generation: c.generation,
    }));

    const record: RecordData = {
      id,
      timestamp: Date.now(),
      cells: simplified,
      splitCount: this.splitCount,
      thumbnail: '',
    };

    this.records.set(id, record);
    this.recordOrder.push(id);

    if (this.recordOrder.length > this.maxRecords) {
      const oldest = this.recordOrder.shift()!;
      this.records.delete(oldest);
    }

    eventBus.emit(EventType.RECORD_SAVED, {
      recordId: id,
      record: { ...record, cells: [...record.cells] },
    });

    return id;
  }

  async restoreRecord(recordId: string): Promise<void> {
    const record = this.records.get(recordId);
    if (!record) return;

    this.cells.clear();
    this.selectedCellId = null;

    eventBus.emit(EventType.RECORD_RESTORE_REQUESTED, { recordId });

    await new Promise<void>(resolve => setTimeout(resolve, 500));

    this.splitCount = record.splitCount;

    for (const cellData of record.cells) {
      const restored: CellData = {
        id: cellData.id,
        position: { ...cellData.position },
        color: cellData.color,
        type: cellData.type,
        scale: { ...cellData.scale },
        parentId: cellData.parentId,
        generation: cellData.generation,
      };
      this.cells.set(restored.id, restored);
    }

    eventBus.emit(EventType.RECORD_RESTORED, {
      cells: this.getCells(),
      splitCount: this.splitCount,
    });
  }

  getCells(): CellData[] {
    return Array.from(this.cells.values());
  }

  getSelectedCellId(): string | null {
    return this.selectedCellId;
  }

  getRecords(): RecordData[] {
    return this.recordOrder.map(id => this.records.get(id)!).filter(Boolean);
  }

  getSplitInterval(): number {
    return this.splitInterval;
  }

  setSplitInterval(seconds: number): void {
    this.splitInterval = Math.max(1, Math.min(5, seconds));
  }

  canSplit(): boolean {
    return !this.isSplitting && this.cells.size < this.maxCells;
  }
}
