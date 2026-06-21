import type { LevelEntity } from '../../shared/types';

export class EntityManager {
  private entities: LevelEntity[] = [];

  addEntity(entity: LevelEntity): void {
    this.entities.push(entity);
  }

  removeEntity(id: string): void {
    this.entities = this.entities.filter(e => e.id !== id);
  }

  getEntities(): LevelEntity[] {
    return [...this.entities];
  }

  getEntityById(id: string): LevelEntity | undefined {
    return this.entities.find(e => e.id === id);
  }

  updateEntity(id: string, updates: Partial<LevelEntity>): void {
    const idx = this.entities.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.entities[idx] = { ...this.entities[idx], ...updates };
    }
  }

  clear(): void {
    this.entities = [];
  }

  setEntities(entities: LevelEntity[]): void {
    this.entities = [...entities];
  }
}
