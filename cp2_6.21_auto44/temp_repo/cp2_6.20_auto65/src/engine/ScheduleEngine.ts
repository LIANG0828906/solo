import type { Ship, Berth, YardColumn, Crane, Container, SimulationStats, HistoryEvent } from '../types';

export class ScheduleEngine {
  private ships: Ship[] = [];
  private berthes: Berth[] = [];
  private yardColumns: YardColumn[] = [];
  private cranes: Crane[] = [];
  private history: HistoryEvent[] = [];
  private stats: SimulationStats = {
    shipsInPort: 0,
    usedBerthes: 0,
    totalBerthes: 0,
    yardOccupancy: 0,
    avgLoadingTime: 0,
    totalContainersLoaded: 0,
    totalContainers: 0,
    loadingEfficiency: 0,
  };

  constructor() {}

  setBerthes(berthes: Berth[]) {
    this.berthes = berthes;
    this.stats.totalBerthes = berthes.length;
  }

  setYardColumns(columns: YardColumn[]) {
    this.yardColumns = columns;
  }

  setCranes(cranes: Crane[]) {
    this.cranes = cranes;
  }

  getShips(): Ship[] {
    return this.ships;
  }

  getBerthes(): Berth[] {
    return this.berthes;
  }

  getYardColumns(): YardColumn[] {
    return this.yardColumns;
  }

  getCranes(): Crane[] {
    return this.cranes;
  }

  getStats(): SimulationStats {
    return this.stats;
  }

  getHistory(): HistoryEvent[] {
    return this.history;
  }

  addShip(ship: Ship) {
    this.ships.push(ship);
    this.addHistoryEvent('ship_arrival', { shipId: ship.id, shipName: ship.name });
    this.calculateStats();
  }

  assignShipToBerth(shipId: string, berthId: string): boolean {
    const ship = this.ships.find(s => s.id === shipId);
    const berth = this.berthes.find(b => b.id === berthId);

    if (!ship || !berth) return false;
    if (berth.shipId) return false;
    if (berth.type === 'maintenance') return false;
    if (berth.depth < ship.draft) return false;

    ship.berthId = berthId;
    ship.status = 'docked';
    berth.shipId = shipId;

    this.calculateStats();
    return true;
  }

  departShip(shipId: string) {
    const ship = this.ships.find(s => s.id === shipId);
    if (!ship || !ship.berthId) return;

    const berth = this.berthes.find(b => b.id === ship.berthId);
    if (berth) {
      berth.shipId = undefined;
    }

    ship.status = 'departed';
    this.addHistoryEvent('ship_departure', { shipId, shipName: ship.name });
    this.calculateStats();
  }

  moveCrane(craneId: string, targetX: number) {
    const crane = this.cranes.find(c => c.id === craneId);
    if (!crane) return;

    crane.status = 'moving';
    crane.targetX = targetX;
  }

  grabContainer(craneId: string, columnId: string): Container | null {
    const crane = this.cranes.find(c => c.id === craneId);
    const column = this.yardColumns.find(c => c.id === columnId);

    if (!crane || !column || crane.carriedContainer) return null;

    const topContainerIndex = column.containers.findIndex(c => c !== null);
    if (topContainerIndex === -1) return null;

    const container = column.containers[topContainerIndex];
    column.containers[topContainerIndex] = null;

    crane.status = 'grabbing';
    crane.carriedContainer = container!;

    this.addHistoryEvent('container_move', { craneId, columnId, containerId: container!.id });
    this.calculateStats();

    return container;
  }

  placeContainerOnShip(craneId: string, shipId: string): boolean {
    const crane = this.cranes.find(c => c.id === craneId);
    const ship = this.ships.find(s => s.id === shipId);

    if (!crane || !ship || !crane.carriedContainer) return false;
    if (ship.loadedContainers >= ship.containerCount) return false;

    const container = crane.carriedContainer;
    const containerId = container?.id;

    ship.loadedContainers++;
    crane.carriedContainer = undefined;
    crane.status = 'idle';

    this.stats.totalContainersLoaded++;
    this.addHistoryEvent('container_move', {
      craneId,
      shipId,
      containerId,
    });
    this.calculateStats();

    return true;
  }

  calculateStats() {
    const activeShips = this.ships.filter(s => s.status !== 'departed');
    const usedBerthes = this.berthes.filter(b => b.shipId).length;

    let totalSlots = 0;
    let usedSlots = 0;
    this.yardColumns.forEach(col => {
      totalSlots += col.maxHeight;
      usedSlots += col.containers.filter(c => c !== null).length;
    });

    const dockedShips = this.ships.filter(s => s.status === 'docked' || s.status === 'loading');
    const totalShipContainers = dockedShips.reduce((sum, s) => sum + s.containerCount, 0);
    const loadedContainers = dockedShips.reduce((sum, s) => sum + s.loadedContainers, 0);

    const efficiency = totalShipContainers > 0
      ? Math.round((loadedContainers / totalShipContainers) * 100)
      : 0;

    this.stats = {
      ...this.stats,
      shipsInPort: activeShips.length,
      usedBerthes,
      yardOccupancy: totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0,
      totalContainers: totalShipContainers,
      loadingEfficiency: efficiency,
    };
  }

  addHistoryEvent(type: HistoryEvent['type'], data: any) {
    this.history.push({
      timestamp: Date.now(),
      type,
      data,
    });
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }
  }

  getOptimizationSuggestion(): string | null {
    const suggestions: string[] = [];

    const busyBerthes = this.berthes.filter(b => b.shipId);
    const idleCranes = this.cranes.filter(c => c.status === 'idle');

    if (idleCranes.length > 2 && busyBerthes.length < 3) {
      suggestions.push('当前岸桥利用率偏低，可增加作业船舶');
    }

    const deepBerthes = this.berthes.filter(b => b.type === 'deep' && !b.shipId);
    if (deepBerthes.length > 0) {
      suggestions.push(`${deepBerthes[0].name}空闲中，可优先分配大型船舶`);
    }

    return suggestions.length > 0 ? suggestions[Math.floor(Math.random() * suggestions.length)] : null;
  }
}
