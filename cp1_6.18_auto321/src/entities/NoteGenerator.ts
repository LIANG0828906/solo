export interface Note {
  id: number;
  x: number;
  y: number;
  z: number;
  color: string;
  speed: number;
  size: number;
  isObstacle: boolean;
  active: boolean;
}

const COLORS = ['#FF3333', '#3333FF', '#33FF33', '#FFFF33'];
const OBSTACLE_COLOR = 'rgba(255, 51, 51, 0.5)';
const NOTE_SIZE = 0.8;
const OBSTACLE_SIZE = 1.0;
const NOTE_SPEED = 6;
const MIN_SPAWN_INTERVAL = 1000;
const MAX_SPAWN_INTERVAL = 2000;
const MAX_ACTIVE_NOTES = 15;
const OBSTACLE_INTERVAL = 10;
const POOL_SIZE = 30;

export class NoteGenerator {
  private pool: Note[] = [];
  private activeNotes: Note[] = [];
  private spawnTimer = 0;
  private nextSpawnInterval = 0;
  private noteCount = 0;
  private idCounter = 0;

  constructor() {
    this.initPool();
    this.reset();
  }

  private initPool(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push({
        id: 0,
        x: 0,
        y: 0,
        z: 0,
        color: COLORS[0],
        speed: NOTE_SPEED,
        size: NOTE_SIZE,
        isObstacle: false,
        active: false,
      });
    }
  }

  private getNextSpawnInterval(): number {
    return MIN_SPAWN_INTERVAL + Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);
  }

  private getRandomColor(): string {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  private getRandomPosition(): { x: number; y: number } {
    const x = (Math.random() - 0.5) * 4;
    const y = (Math.random() - 0.5) * 2 + 1;
    return { x, y };
  }

  update(deltaTime: number): void {
    this.spawnTimer += deltaTime * 1000;

    if (this.spawnTimer >= this.nextSpawnInterval) {
      this.spawnTimer = 0;
      this.nextSpawnInterval = this.getNextSpawnInterval();
      this.spawnNote();
    }

    for (let i = this.activeNotes.length - 1; i >= 0; i--) {
      const note = this.activeNotes[i];
      note.z += note.speed * deltaTime;

      if (note.z > 10) {
        this.deactivateNote(note, i);
      }
    }
  }

  spawnNote(): void {
    if (this.activeNotes.length >= MAX_ACTIVE_NOTES) {
      return;
    }

    const note = this.pool.find(n => !n.active);
    if (!note) {
      return;
    }

    this.noteCount++;
    const isObstacle = this.noteCount % OBSTACLE_INTERVAL === 0 && Math.random() > 0.5;
    const position = this.getRandomPosition();

    note.id = ++this.idCounter;
    note.x = position.x;
    note.y = position.y;
    note.z = -5;
    note.color = isObstacle ? OBSTACLE_COLOR : this.getRandomColor();
    note.speed = NOTE_SPEED;
    note.size = isObstacle ? OBSTACLE_SIZE : NOTE_SIZE;
    note.isObstacle = isObstacle;
    note.active = true;

    this.activeNotes.push(note);
  }

  private deactivateNote(note: Note, index: number): void {
    note.active = false;
    this.activeNotes.splice(index, 1);
  }

  reset(): void {
    for (const note of this.activeNotes) {
      note.active = false;
    }
    this.activeNotes = [];
    this.spawnTimer = 0;
    this.nextSpawnInterval = this.getNextSpawnInterval();
    this.noteCount = 0;
    this.idCounter = 0;
  }

  getActiveNotes(): Note[] {
    return [...this.activeNotes];
  }
}
