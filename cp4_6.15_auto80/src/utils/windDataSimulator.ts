import { WindTurbineData, useWindStore } from '@/store/windStore';

export function windSpeedToRotationSpeed(windSpeed: number): number {
  if (windSpeed <= 5) return 0.5;
  if (windSpeed >= 15) return 10;
  return 0.5 + ((windSpeed - 5) / 10) * 9.5;
}

export function windSpeedToPowerOutput(windSpeed: number): number {
  return Math.min(100, Math.max(0, windSpeed * 6));
}

export function generateHourOffset(hour: number): number {
  const normalizedHour = hour / 24;
  return Math.sin(normalizedHour * Math.PI * 2) * 3;
}

let baseUpdateTimer: ReturnType<typeof setInterval> | null = null;
let fluctuationTimer: ReturnType<typeof setTimeout> | null = null;
let fluctuationActive = false;

export function startWindDataSimulation() {
  stopWindDataSimulation();

  const applyUpdate = (withFluctuation: boolean) => {
    const { turbines } = useWindStore.getState();
    const hour = (Date.now() / 3600000) % 24;
    const hourOffset = generateHourOffset(hour);

    const updated = turbines.map((t) => {
      let newWindSpeed = t.windSpeed + (Math.random() - 0.5) * 2 + hourOffset * 0.05;
      if (withFluctuation) {
        newWindSpeed += (Math.random() - 0.5) * 6;
      }
      newWindSpeed = Math.max(0, Math.min(25, newWindSpeed));

      const newTargetSpeed = windSpeedToRotationSpeed(newWindSpeed);
      const lerpedSpeed = t.rotationSpeed + (newTargetSpeed - t.rotationSpeed) * 0.15;

      return {
        ...t,
        windSpeed: newWindSpeed,
        powerOutput: windSpeedToPowerOutput(newWindSpeed),
        targetRotationSpeed: newTargetSpeed,
        rotationSpeed: lerpedSpeed,
      } as WindTurbineData;
    });

    useWindStore.getState().updateTurbines(updated);
  };

  baseUpdateTimer = setInterval(() => {
    applyUpdate(false);
  }, 1000);

  const scheduleFluctuation = () => {
    fluctuationTimer = setTimeout(() => {
      fluctuationActive = true;
      useWindStore.getState().setWindFluctuation(true);

      const fluctuationInterval = setInterval(() => {
        if (!fluctuationActive) {
          clearInterval(fluctuationInterval);
          return;
        }
        applyUpdate(true);
      }, 400);

      setTimeout(() => {
        fluctuationActive = false;
        useWindStore.getState().setWindFluctuation(false);
        clearInterval(fluctuationInterval);
        scheduleFluctuation();
      }, 10000);
    }, 30000);
  };

  scheduleFluctuation();
}

export function stopWindDataSimulation() {
  if (baseUpdateTimer) {
    clearInterval(baseUpdateTimer);
    baseUpdateTimer = null;
  }
  if (fluctuationTimer) {
    clearTimeout(fluctuationTimer);
    fluctuationTimer = null;
  }
  fluctuationActive = false;
}
