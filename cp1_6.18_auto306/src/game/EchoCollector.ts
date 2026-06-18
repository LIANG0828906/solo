import { EchoShard, DungeonMap, Room } from '@/types';

export class EchoCollector {
  private shards: EchoShard[] = [];
  private totalShards: number = 5;
  private map: DungeonMap | null = null;
  private onCollectionComplete: (() => void) | null = null;
  private onShardCollected: ((shard: EchoShard) => void) | null = null;

  constructor(totalShards: number = 5) {
    this.totalShards = totalShards;
  }

  setMap(map: DungeonMap): void {
    this.map = map;
  }

  setOnCollectionComplete(callback: () => void): void {
    this.onCollectionComplete = callback;
  }

  setOnShardCollected(callback: (shard: EchoShard) => void): void {
    this.onShardCollected = callback;
  }

  generateShards(): EchoShard[] {
    if (!this.map) return [];

    this.shards = [];
    const rooms = this.map.rooms;
    const availableRooms = rooms.filter(
      (r) => r.id !== this.map!.startRoom.id && r.id !== this.map!.endRoom.id
    );

    const shardCount = Math.min(this.totalShards, availableRooms.length);
    const shuffledRooms = this.shuffleArray([...availableRooms]);

    for (let i = 0; i < shardCount; i++) {
      const room = shuffledRooms[i];
      const shard = this.createShard(i, room);
      this.shards.push(shard);
    }

    return this.shards;
  }

  private createShard(id: number, room: Room): EchoShard {
    const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
    const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

    return {
      id,
      x,
      y,
      collected: false,
      flickerTimer: Math.random() * Math.PI * 2,
      flickerSpeed: 0.5 + Math.random() * 1.0,
      rotation: 0,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  update(deltaTime: number): void {
    for (const shard of this.shards) {
      if (!shard.collected) {
        shard.flickerTimer += deltaTime * shard.flickerSpeed;
        shard.rotation += deltaTime * Math.PI;
      }
    }
  }

  checkCollection(playerX: number, playerY: number): boolean {
    for (const shard of this.shards) {
      if (!shard.collected) {
        const distance = Math.sqrt(
          Math.pow(playerX - shard.x, 2) + Math.pow(playerY - shard.y, 2)
        );
        if (distance < 0.8) {
          this.collectShard(shard);
          return true;
        }
      }
    }
    return false;
  }

  private collectShard(shard: EchoShard): void {
    shard.collected = true;
    if (this.onShardCollected) {
      this.onShardCollected(shard);
    }
    if (this.areAllCollected() && this.onCollectionComplete) {
      this.onCollectionComplete();
    }
  }

  areAllCollected(): boolean {
    return this.shards.length > 0 && this.shards.every((s) => s.collected);
  }

  getCollectedCount(): number {
    return this.shards.filter((s) => s.collected).length;
  }

  getTotalCount(): number {
    return this.totalShards;
  }

  getShards(): EchoShard[] {
    return this.shards;
  }

  reset(): void {
    this.shards = [];
  }
}
