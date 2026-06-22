interface PetStats {
  hunger: number;
  cleanliness: number;
  happiness: number;
}

interface DecayMessage {
  type: 'decay';
  stats: PetStats;
}

interface InitMessage {
  type: 'init';
  stats: PetStats;
}

type WorkerMessage = DecayMessage | InitMessage;

let currentStats: PetStats = {
  hunger: 50,
  cleanliness: 50,
  happiness: 50,
};

const DECAY_RATE = 0.5;
const DECAY_INTERVAL = 2000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function decayStats(): PetStats {
  return {
    hunger: clamp(currentStats.hunger - DECAY_RATE, 0, 100),
    cleanliness: clamp(currentStats.cleanliness - DECAY_RATE, 0, 100),
    happiness: clamp(currentStats.happiness - DECAY_RATE, 0, 100),
  };
}

self.onmessage = (event: MessageEvent) => {
  const data = event.data as WorkerMessage;
  if (data.type === 'init') {
    currentStats = { ...data.stats };
  }
};

setInterval(() => {
  currentStats = decayStats();
  self.postMessage({
    type: 'decay',
    stats: { ...currentStats },
  } as DecayMessage);
}, DECAY_INTERVAL);

export {};
