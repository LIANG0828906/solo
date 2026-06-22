export interface GameData {
  highScore: number;
  playCount: number;
}

const STORAGE_KEY = 'voice_runner_data';

const defaultData: GameData = {
  highScore: 0,
  playCount: 0
};

export async function save(data: Partial<GameData>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const current = loadSync();
      const updated = { ...current, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

export async function load(): Promise<GameData> {
  return new Promise((resolve, reject) => {
    try {
      resolve(loadSync());
    } catch (e) {
      reject(e);
    }
  });
}

function loadSync(): GameData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { ...defaultData };
  }
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
  } catch {
    return { ...defaultData };
  }
}
