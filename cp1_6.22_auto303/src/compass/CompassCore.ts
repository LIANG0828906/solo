import { Cell, CompassState, Direction, MarkerType, PathMarker, Position } from '../types';
import { MazeGenerator, positionKey } from '../maze/MazeGenerator';

export class CompassCore {
  private maze: Cell[][];
  private generator: MazeGenerator;
  private state: CompassState;
  private listeners: Set<(state: CompassState) => void>;
  private markerCycle: MarkerType[] = ['minecart', 'chest', 'exit'];
  private currentMarkerIndex: number = 0;

  constructor(maze: Cell[][], generator: MazeGenerator) {
    this.maze = maze;
    this.generator = generator;
    this.listeners = new Set();
    this.state = this.createInitialState();
  }

  private createInitialState(): CompassState {
    const entrance: Position = { x: 0, y: 0 };
    return {
      currentPosition: { ...entrance },
      pathStack: [{ ...entrance }],
      markers: [],
      exploredCells: new Set([positionKey(entrance)]),
      isBacktracking: false,
      steps: 0,
    };
  }

  public reset(maze?: Cell[][]): void {
    if (maze) {
      this.maze = maze;
    }
    this.currentMarkerIndex = 0;
    this.state = this.createInitialState();
    this.notifyListeners();
  }

  public getState(): CompassState {
    return {
      ...this.state,
      exploredCells: new Set(this.state.exploredCells),
      pathStack: [...this.state.pathStack],
      markers: [...this.state.markers],
    };
  }

  public subscribe(listener: (state: CompassState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  public move(direction: Direction): boolean {
    if (this.state.isBacktracking) return false;

    const { currentPosition } = this.state;

    if (!this.generator.canMove(this.maze, currentPosition, direction)) {
      return false;
    }

    const newPos = this.generator.getNeighborPosition(currentPosition, direction);

    this.state.currentPosition = newPos;
    this.state.pathStack.push({ ...newPos });
    this.state.exploredCells.add(positionKey(newPos));
    this.state.steps += 1;

    this.notifyListeners();
    return true;
  }

  public addMarker(): PathMarker | null {
    const { currentPosition } = this.state;
    const type = this.markerCycle[this.currentMarkerIndex];
    this.currentMarkerIndex = (this.currentMarkerIndex + 1) % this.markerCycle.length;

    const existingIndex = this.state.markers.findIndex(
      (m) => m.position.x === currentPosition.x && m.position.y === currentPosition.y
    );

    if (existingIndex !== -1) {
      this.state.markers[existingIndex] = {
        position: { ...currentPosition },
        type,
        createdAt: Date.now(),
      };
    } else {
      this.state.markers.push({
        position: { ...currentPosition },
        type,
        createdAt: Date.now(),
      });
    }

    this.notifyListeners();
    return this.state.markers[this.state.markers.length - 1];
  }

  public getNextMarkerType(): MarkerType {
    return this.markerCycle[this.currentMarkerIndex];
  }

  public getMarkers(): PathMarker[] {
    return [...this.state.markers];
  }

  public isAtExit(): boolean {
    const { x, y } = this.state.currentPosition;
    return this.maze[y][x].isExit === true;
  }

  public isAtEntrance(): boolean {
    const { currentPosition } = this.state;
    return currentPosition.x === 0 && currentPosition.y === 0;
  }

  public canBacktrack(): boolean {
    return !this.state.isBacktracking && this.state.pathStack.length > 1;
  }

  public async backtrack(
    stepDelay: number = 200,
    onStep?: (position: Position, step: number, total: number) => void
  ): Promise<void> {
    if (!this.canBacktrack()) return;

    this.state.isBacktracking = true;
    this.notifyListeners();

    const totalSteps = this.state.pathStack.length - 1;

    for (let i = totalSteps; i > 0; i--) {
      await new Promise((resolve) => setTimeout(resolve, stepDelay));
      this.state.pathStack.pop();
      const prevPos = this.state.pathStack[this.state.pathStack.length - 1];
      this.state.currentPosition = { ...prevPos };
      this.state.steps += 1;

      if (onStep) {
        onStep(prevPos, totalSteps - i + 1, totalSteps);
      }
      this.notifyListeners();
    }

    this.state.isBacktracking = false;
    this.notifyListeners();
  }

  public getMaze(): Cell[][] {
    return this.maze;
  }
}
