import { RuneShard, RuneType, RUNE_DEFINITIONS } from '../types';

let shardCounter = 0;

function generateShardId(): string {
  return `shard_${++shardCounter}_${Date.now()}`;
}

export function createRandomShard(): RuneShard {
  const types: RuneType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
  const type = types[Math.floor(Math.random() * types.length)];
  const def = RUNE_DEFINITIONS[type];
  return {
    id: generateShardId(),
    type,
    color: def.color,
    symbol: def.symbol,
  };
}

export function createInitialShards(): RuneShard[] {
  return [createRandomShard(), createRandomShard(), createRandomShard()];
}

const MAX_SAME_TYPE = 3;

export class RuneCollector {
  inventory: RuneShard[] = [];

  constructor(initial?: RuneShard[]) {
    this.inventory = initial ? [...initial] : createInitialShards();
    shardCounter = this.inventory.length;
  }

  canAddShard(type: RuneType): boolean {
    const count = this.inventory.filter(s => s.type === type).length;
    return count < MAX_SAME_TYPE;
  }

  addShard(shard: RuneShard): boolean {
    if (!this.canAddShard(shard.type)) return false;
    this.inventory.push(shard);
    return true;
  }

  removeShard(shardId: string): RuneShard | null {
    const idx = this.inventory.findIndex(s => s.id === shardId);
    if (idx === -1) return null;
    const [removed] = this.inventory.splice(idx, 1);
    return removed;
  }

  getShardById(shardId: string): RuneShard | null {
    return this.inventory.find(s => s.id === shardId) ?? null;
  }

  getCountByType(type: RuneType): number {
    return this.inventory.filter(s => s.type === type).length;
  }

  loadState(shards: RuneShard[]) {
    this.inventory = [...shards];
    shardCounter = shards.length;
  }
}
