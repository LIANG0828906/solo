import { state, CELL_SIZE, MAZE_SIZE } from './state';

const PLAYER_RADIUS = 0.3;
const MOVE_SPEED = 3.5;
const MOUSE_SENSITIVITY = 0.003;

export class Controls {
  private keys: Set<string> = new Set();
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private yaw: number = Math.PI;
  private pitch: number = -0.2;
  private container: HTMLElement;
  private onRotationChange?: (yaw: number, pitch: number) => void;
  private collisionCooldown: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initInitialYaw();
    this.setupEventListeners();
  }

  private initInitialYaw(): void {
    const s = state.getState();
    const startCell = s.maze[s.startCell.z][s.startCell.x];
    if (!startCell.walls.south) {
      this.yaw = Math.PI;
    } else if (!startCell.walls.east) {
      this.yaw = -Math.PI / 2;
    } else if (!startCell.walls.north) {
      this.yaw = 0;
    } else if (!startCell.walls.west) {
      this.yaw = Math.PI / 2;
    }
    state.setPlayerRotation(this.yaw);
  }

  setOnRotationChange(callback: (yaw: number, pitch: number) => void): void {
    this.onRotationChange = callback;
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key.toLowerCase());
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.container.style.cursor = 'grabbing';
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.container.style.cursor = 'grab';
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    this.yaw -= deltaX * MOUSE_SENSITIVITY;
    this.pitch -= deltaY * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 3, this.pitch));

    state.setPlayerRotation(this.yaw);

    if (this.onRotationChange) {
      this.onRotationChange(this.yaw, this.pitch);
    }
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;
    e.preventDefault();

    const deltaX = e.touches[0].clientX - this.lastMouseX;
    const deltaY = e.touches[0].clientY - this.lastMouseY;

    this.lastMouseX = e.touches[0].clientX;
    this.lastMouseY = e.touches[0].clientY;

    this.yaw -= deltaX * MOUSE_SENSITIVITY * 1.5;
    this.pitch -= deltaY * MOUSE_SENSITIVITY * 1.5;
    this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 3, this.pitch));

    state.setPlayerRotation(this.yaw);

    if (this.onRotationChange) {
      this.onRotationChange(this.yaw, this.pitch);
    }
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  update(deltaTime: number): { collided: boolean } {
    const currentState = state.getState();
    if (!currentState.isPlaying) {
      return { collided: false };
    }

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) moveZ -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) moveZ += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) moveX -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) moveX += 1;

    let collided = false;

    if (moveX === 0 && moveZ === 0) {
      if (this.collisionCooldown > 0) {
        this.collisionCooldown -= deltaTime;
      }
      return { collided: false };
    }

    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    moveX /= length;
    moveZ /= length;

    const cos = Math.cos(this.yaw);
    const sin = Math.sin(this.yaw);
    const worldMoveX = moveX * cos - moveZ * sin;
    const worldMoveZ = moveX * sin + moveZ * cos;

    const speed = MOVE_SPEED * deltaTime;
    let newX = currentState.player.x + worldMoveX * speed;
    let newZ = currentState.player.z + worldMoveZ * speed;

    const canMoveX = this.checkCollision(newX, currentState.player.z);
    const canMoveZ = this.checkCollision(currentState.player.x, newZ);

    if (!canMoveX || !canMoveZ) {
      collided = true;
      if (this.collisionCooldown <= 0) {
        this.collisionCooldown = 0.3;
      }
    }

    if (canMoveX) {
      currentState.player.x = newX;
    }
    if (canMoveZ) {
      currentState.player.z = newZ;
    }

    if (canMoveX || canMoveZ) {
      state.setPlayerPosition(currentState.player.x, currentState.player.z);
    }

    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= deltaTime;
    }

    return { collided };
  }

  private checkCollision(x: number, z: number): boolean {
    const cellX = Math.floor(x / CELL_SIZE);
    const cellZ = Math.floor(z / CELL_SIZE);

    if (cellX < 0 || cellX >= 10 || cellZ < 0 || cellZ >= 10) {
      return false;
    }

    const maze = state.getState().maze;
    const cell = maze[cellZ][cellX];

    const localX = x - cellX * CELL_SIZE;
    const localZ = z - cellZ * CELL_SIZE;

    if (localX < PLAYER_RADIUS && cell.walls.west) return false;
    if (localX > CELL_SIZE - PLAYER_RADIUS && cell.walls.east) return false;
    if (localZ < PLAYER_RADIUS && cell.walls.north) return false;
    if (localZ > CELL_SIZE - PLAYER_RADIUS && cell.walls.south) return false;

    return true;
  }

  reset(): void {
    this.keys.clear();
    this.initInitialYaw();
    this.pitch = -0.2;
  }

  getYaw(): number {
    return this.yaw;
  }

  getPitch(): number {
    return this.pitch;
  }

  isMoving(): boolean {
    return (
      this.keys.has('w') ||
      this.keys.has('s') ||
      this.keys.has('a') ||
      this.keys.has('d') ||
      this.keys.has('arrowup') ||
      this.keys.has('arrowdown') ||
      this.keys.has('arrowleft') ||
      this.keys.has('arrowright')
    );
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
    this.container.removeEventListener('mousedown', this.onMouseDown.bind(this));
    window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.removeEventListener('touchstart', this.onTouchStart.bind(this));
    window.removeEventListener('touchmove', this.onTouchMove.bind(this));
    window.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
}
