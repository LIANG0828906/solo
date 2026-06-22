import { HatchParams, HatchProgress, HatchResult, WorkerMessage } from '../types';
import { generatePetName, generatePetSkill } from '../data/eggs';

let intervalId: number | null = null;
let startTime = 0;
let totalDuration = 0;

function calculateOptimalHatchRate(element: string, temp: number, humidity: number): number {
  let optimalTemp: number;
  let optimalHumidity: number;

  switch (element) {
    case 'fire':
      optimalTemp = 35;
      optimalHumidity = 40;
      break;
    case 'water':
      optimalTemp = 25;
      optimalHumidity = 70;
      break;
    case 'grass':
      optimalTemp = 30;
      optimalHumidity = 60;
      break;
    default:
      optimalTemp = 30;
      optimalHumidity = 50;
  }

  const tempDiff = Math.abs(temp - optimalTemp);
  const humidityDiff = Math.abs(humidity - optimalHumidity);

  const tempFactor = Math.max(0.5, 1 - tempDiff * 0.03);
  const humidityFactor = Math.max(0.5, 1 - humidityDiff * 0.015);

  return tempFactor * humidityFactor;
}

function startHatching(params: HatchParams) {
  stopHatching();
  startTime = performance.now();

  const baseTime = 10000;
  const rarityMult = params.rarity === 1 ? 1 : params.rarity === 2 ? 1.5 : 2;
  const rate = calculateOptimalHatchRate(params.element, params.temperature, params.humidity);
  totalDuration = (baseTime * rarityMult) / rate;

  intervalId = self.setInterval(() => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(100, (elapsed / totalDuration) * 100);

    const progressMsg: WorkerMessage = {
      type: 'progress',
      data: { progress, eggId: params.eggId } as HatchProgress,
    };
    self.postMessage(progressMsg);

    if (progress >= 100) {
      stopHatching();

      const successRate = calculateOptimalHatchRate(
        params.element,
        params.temperature,
        params.humidity
      );
      const success = Math.random() < successRate;

      let pet;
      if (success) {
        pet = {
          id: `pet-${Date.now()}`,
          name: generatePetName(params.element),
          element: params.element,
          rarity: params.rarity,
          mood: 80,
          skill: generatePetSkill(params.element),
          hatchTime: Date.now(),
        };
      }

      const resultMsg: WorkerMessage = {
        type: 'complete',
        data: { success, pet, eggId: params.eggId } as HatchResult,
      };
      self.postMessage(resultMsg);
    }
  }, 33);
}

function stopHatching() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

self.onmessage = (e: MessageEvent) => {
  const message = e.data as WorkerMessage;

  switch (message.type) {
    case 'start':
      if (message.params) {
        startHatching(message.params);
      }
      break;
    case 'stop':
      stopHatching();
      break;
  }
};

export {};
