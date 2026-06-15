const { v4: uuidv4 } = require('uuid');

const STREET_NAMES = ['中山路', '人民路', '建设路', '解放路', '和平路', '文化路', '科技路', '长江路', '黄河路', '珠江路', '清华路', '创新路', '兴业路', '富民路', '安康路'];
const CITY_PREFIX = ['市中区', '高新区', '开发区', '新城区', '朝阳区', '海淀区', '浦东新区', '南山区', '天河区', '西湖区'];

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateBuildings() {
  const buildings = [];
  const gridSize = 10;
  const spacing = 8;
  const offset = -(gridSize * spacing) / 2 + spacing / 2;
  let seed = 42;

  for (let gx = 0; gx < gridSize; gx++) {
    for (let gz = 0; gz < gridSize; gz++) {
      seed++;
      if (seededRandom(seed) < 0.25) continue;

      const id = uuidv4();
      const width = 2 + seededRandom(seed * 2) * 3;
      const depth = 2 + seededRandom(seed * 3) * 3;
      const height = 2 + seededRandom(seed * 5) * 10;
      const baseTemperature = 16 + seededRandom(seed * 7) * 14;

      const streetIdx = Math.floor(seededRandom(seed * 11) * STREET_NAMES.length);
      const prefixIdx = Math.floor(seededRandom(seed * 13) * CITY_PREFIX.length);
      const number = Math.floor(seededRandom(seed * 17) * 999) + 1;
      const address = `${CITY_PREFIX[prefixIdx]}${STREET_NAMES[streetIdx]}${number}号`;

      const x = offset + gx * spacing + (seededRandom(seed * 19) - 0.5) * 2;
      const z = offset + gz * spacing + (seededRandom(seed * 23) - 0.5) * 2;

      buildings.push({
        id,
        address,
        position: { x, y: height / 2, z },
        size: { width, height, depth },
        baseTemperature,
      });
    }
  }
  return buildings;
}

const BUILDINGS = generateBuildings();

function calculateTemperature(baseTemperature, time, seed = 0) {
  const dailyAmplitude = 10 + ((baseTemperature - 16) / 14) * 8;
  let tempDelta = 0;

  if (time >= 5 && time <= 15) {
    const phase = Math.PI * (time - 5) / 10;
    tempDelta = dailyAmplitude * Math.sin(phase);
  } else if (time > 15 && time <= 22) {
    const phase = Math.PI * (time - 15) / 7;
    tempDelta = dailyAmplitude * Math.cos(phase * 0.5);
  } else {
    if (time <= 5) {
      tempDelta = -dailyAmplitude * 0.5 * (1 - time / 5);
    } else {
      tempDelta = -dailyAmplitude * 0.5 * ((time - 22) / 2);
    }
  }

  const heightFactor = seededRandom(seed + 999) * 3;
  const randomness = (seededRandom(seed + time * 1000) - 0.5) * 2;
  return Math.max(12, Math.min(44, baseTemperature + tempDelta + heightFactor + randomness));
}

function getBuildingTemperatures(time) {
  return BUILDINGS.map((b, idx) => ({
    id: b.id,
    temperature: calculateTemperature(b.baseTemperature, time, idx),
  }));
}

function getBuildingHistory(id) {
  const building = BUILDINGS.find((b) => b.id === id);
  if (!building) return null;
  const idx = BUILDINGS.indexOf(building);
  const hours = [];
  const temperatures = [];
  for (let h = 0; h < 24; h++) {
    hours.push(h);
    temperatures.push(calculateTemperature(building.baseTemperature, h, idx));
  }
  return { id, hours, temperatures };
}

function getBuildingById(id) {
  return BUILDINGS.find((b) => b.id === id) || null;
}

function getAllBuildings() {
  return BUILDINGS;
}

module.exports = {
  getAllBuildings,
  getBuildingTemperatures,
  getBuildingHistory,
  getBuildingById,
  calculateTemperature,
};
