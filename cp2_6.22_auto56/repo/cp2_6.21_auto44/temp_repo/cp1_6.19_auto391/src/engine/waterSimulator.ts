export interface HumidityField {
  size: [number, number, number];
  resolution: number;
  data: Float32Array;
}

const GRID_SIZE_X = 16;
const GRID_SIZE_Y = 20;
const GRID_SIZE_Z = 16;
const DIFFUSION_RATE = 0.15;
const BOTTOM_HUMIDITY = 0.9;
const TOP_HUMIDITY = 0.3;

export function createHumidityField(initialHumidity: number): HumidityField {
  const size: [number, number, number] = [GRID_SIZE_X, GRID_SIZE_Y, GRID_SIZE_Z];
  const data = new Float32Array(GRID_SIZE_X * GRID_SIZE_Y * GRID_SIZE_Z);
  const normalizedHumidity = initialHumidity / 100;

  for (let y = 0; y < GRID_SIZE_Y; y++) {
    const t = y / (GRID_SIZE_Y - 1);
    const baseHumidity = TOP_HUMIDITY + (BOTTOM_HUMIDITY - TOP_HUMIDITY) * t;
    const humidity = baseHumidity * normalizedHumidity * 1.5;
    
    for (let x = 0; x < GRID_SIZE_X; x++) {
      for (let z = 0; z < GRID_SIZE_Z; z++) {
        const idx = y * GRID_SIZE_X * GRID_SIZE_Z + x * GRID_SIZE_Z + z;
        const noise = (Math.random() - 0.5) * 0.1;
        data[idx] = Math.max(0, Math.min(1, humidity + noise));
      }
    }
  }

  return { size, resolution: 1, data };
}

function getIndex(x: number, y: number, z: number): number {
  return y * GRID_SIZE_X * GRID_SIZE_Z + x * GRID_SIZE_Z + z;
}

function inBounds(x: number, y: number, z: number): boolean {
  return x >= 0 && x < GRID_SIZE_X && y >= 0 && y < GRID_SIZE_Y && z >= 0 && z < GRID_SIZE_Z;
}

export function updateHumidityField(
  field: HumidityField,
  rootPositions: Array<[number, number, number]>,
  deltaTime: number,
  baseHumidity: number
): HumidityField {
  const newData = new Float32Array(field.data);
  const normalizedBase = baseHumidity / 100;

  for (let y = 1; y < GRID_SIZE_Y - 1; y++) {
    for (let x = 1; x < GRID_SIZE_X - 1; x++) {
      for (let z = 1; z < GRID_SIZE_Z - 1; z++) {
        const idx = getIndex(x, y, z);
        const current = field.data[idx];

        const laplacian = (
          field.data[getIndex(x + 1, y, z)] +
          field.data[getIndex(x - 1, y, z)] +
          field.data[getIndex(x, y + 1, z)] +
          field.data[getIndex(x, y - 1, z)] +
          field.data[getIndex(x, y, z + 1)] +
          field.data[getIndex(x, y, z - 1)] -
          6 * current
        );

        newData[idx] = current + DIFFUSION_RATE * laplacian * deltaTime;
      }
    }
  }

  for (let x = 0; x < GRID_SIZE_X; x++) {
    for (let z = 0; z < GRID_SIZE_Z; z++) {
      const bottomIdx = getIndex(x, 0, z);
      newData[bottomIdx] = BOTTOM_HUMIDITY * normalizedBase * 1.2;

      const topIdx = getIndex(x, GRID_SIZE_Y - 1, z);
      newData[topIdx] = TOP_HUMIDITY * normalizedBase * 0.8;
    }
  }

  for (const pos of rootPositions) {
    const gx = Math.floor((pos[0] + GRID_SIZE_X / 2) / 1);
    const gy = Math.floor(-pos[1] / 1);
    const gz = Math.floor((pos[2] + GRID_SIZE_Z / 2) / 1);

    if (inBounds(gx, gy, gz)) {
      const idx = getIndex(gx, gy, gz);
      newData[idx] = Math.max(0, newData[idx] - 0.02 * deltaTime * 60);
    }
  }

  for (let i = 0; i < newData.length; i++) {
    newData[i] = Math.max(0, Math.min(1, newData[i]));
  }

  return { ...field, data: newData };
}

export function getHumidityAtPosition(field: HumidityField, pos: [number, number, number]): number {
  const gx = Math.floor((pos[0] + GRID_SIZE_X / 2));
  const gy = Math.floor(-pos[1]);
  const gz = Math.floor((pos[2] + GRID_SIZE_Z / 2));

  if (!inBounds(gx, gy, gz)) return 0.5;

  const idx = getIndex(gx, gy, gz);
  return field.data[idx];
}

export function getAverageHumidity(field: HumidityField): number {
  let sum = 0;
  for (let i = 0; i < field.data.length; i++) {
    sum += field.data[i];
  }
  return sum / field.data.length;
}
