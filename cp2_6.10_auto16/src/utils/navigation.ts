export interface ShipMotion {
  rollX: number;
  pitchY: number;
  heaveZ: number;
}

export interface WaveParams {
  direction: number;
  amplitude: number;
  period: number;
}

export interface CompassJitter {
  x: number;
  y: number;
  rotation: number;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

export function calculateActualHeading(
  rudderAngle: number,
  windSpeed: number,
  windDirection: number,
  currentHeading: number,
  timeDelta: number
): number {
  const rudderEffect = rudderAngle * 5 * timeDelta;
  const windAngleDiff = normalizeAngle(windDirection - currentHeading);
  const windEffect = Math.sin(windAngleDiff * DEG_TO_RAD) * windSpeed * 2 * timeDelta;
  const randomDrift = (Math.random() - 0.5) * 0.5 * timeDelta;
  return currentHeading + rudderEffect + windEffect + randomDrift;
}

export function calculateHeadingError(
  actualHeading: number,
  idealHeading: number
): number {
  return normalizeAngle(actualHeading - idealHeading);
}

export function calculateCompassJitter(
  shipRoll: number,
  windSpeed: number,
  isStormMode: boolean
): CompassJitter {
  const baseJitter = shipRoll * 0.3;
  const windJitter = windSpeed * 0.2;
  const stormMultiplier = isStormMode ? 2 : 1;
  const totalJitter = (baseJitter + windJitter) * stormMultiplier;
  
  return {
    x: (Math.random() - 0.5) * totalJitter * 0.5,
    y: (Math.random() - 0.5) * totalJitter * 0.5,
    rotation: (Math.random() - 0.5) * totalJitter * 2
  };
}

export function calculateFlagDeflection(
  windSpeed: number,
  windDirection: number,
  shipHeading: number
): number {
  const angleDiff = normalizeAngle(windDirection - shipHeading);
  const baseDeflection = Math.abs(angleDiff) * (windSpeed / 5);
  return Math.min(90, Math.max(0, baseDeflection));
}

export function generateWindChange(
  currentWindSpeed: number,
  currentWindDirection: number,
  timeDelta: number,
  isStormMode: boolean
): { windSpeed: number; windDirection: number } {
  const maxWindSpeed = isStormMode ? 8 : 5;
  const minWindSpeed = 1;
  
  const speedChange = (Math.random() - 0.5) * 0.5 * timeDelta;
  let newSpeed = currentWindSpeed + speedChange;
  newSpeed = Math.max(minWindSpeed, Math.min(maxWindSpeed, newSpeed));
  
  const directionChange = (Math.random() - 0.5) * 10 * timeDelta;
  let newDirection = currentWindDirection + directionChange;
  newDirection = normalizeAngle(newDirection);
  
  return { windSpeed: newSpeed, windDirection: newDirection };
}

export function generateWaveChange(
  currentParams: WaveParams,
  timeDelta: number,
  isStormMode: boolean
): WaveParams {
  const amplitudeMultiplier = isStormMode ? 1.3 : 1;
  const minAmplitude = 0.5 * amplitudeMultiplier;
  const maxAmplitude = 1.5 * amplitudeMultiplier;
  
  let newAmplitude = currentParams.amplitude + (Math.random() - 0.5) * 0.2 * timeDelta;
  newAmplitude = Math.max(minAmplitude, Math.min(maxAmplitude, newAmplitude));
  
  let newPeriod = currentParams.period + (Math.random() - 0.5) * 0.5 * timeDelta;
  newPeriod = Math.max(3, Math.min(5, newPeriod));
  
  let newDirection = currentParams.direction + (Math.random() - 0.5) * 5 * timeDelta;
  newDirection = normalizeAngle(newDirection);
  
  return {
    direction: newDirection,
    amplitude: newAmplitude,
    period: newPeriod
  };
}

export function calculateShipMotion(
  waveParams: WaveParams,
  time: number,
  windSpeed: number
): ShipMotion {
  const waveInfluence = Math.sin(time / waveParams.period * Math.PI * 2);
  const windInfluence = windSpeed / 5;
  
  const rollX = waveInfluence * 4 * waveParams.amplitude;
  const pitchY = Math.sin(time / waveParams.period * Math.PI * 2 + Math.PI / 4) * 2 * waveParams.amplitude;
  const heaveZ = Math.sin(time / waveParams.period * Math.PI * 2 + Math.PI / 2) * 0.5 * waveParams.amplitude;
  
  return {
    rollX: rollX * (1 + windInfluence * 0.2),
    pitchY: pitchY * (1 + windInfluence * 0.2),
    heaveZ: heaveZ
  };
}

export function getBeaufortScale(windSpeed: number): number {
  const speedKmh = windSpeed * 5;
  if (speedKmh < 1) return 0;
  if (speedKmh < 6) return 1;
  if (speedKmh < 12) return 2;
  if (speedKmh < 20) return 3;
  if (speedKmh < 29) return 4;
  if (speedKmh < 39) return 5;
  if (speedKmh < 50) return 6;
  if (speedKmh < 62) return 7;
  return 8;
}
