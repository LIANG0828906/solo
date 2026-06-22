import type { EnvironmentSnapshot, WeatherType } from '@/types';
import { WEATHER_CONFIG, DAY_DURATION_SEC, DAY_TRANSITION_SEC, DAY_BRIGHTNESS, NIGHT_BRIGHTNESS, DAY_COLOR_TEMP, NIGHT_COLOR_TEMP } from '@/config/constants';
import { randRange, clamp, lerp } from '@/utils/random';
import { useGameStore } from '@/store/useGameStore';
import { lerpColor } from '@/utils/color';

const WEATHER_TRANSITIONS: Record<WeatherType, WeatherType[]> = {
  sunny: ['sunny', 'cloudy', 'drought'],
  cloudy: ['sunny', 'cloudy', 'rain'],
  rain: ['cloudy', 'rain', 'thunderstorm'],
  thunderstorm: ['cloudy', 'rain'],
  drought: ['sunny', 'drought'],
};

export function updateEnvironment(dt: number): void {
  const state = useGameStore.getState();
  const now = Date.now();

  let newCycle = (state.dayNightCycle + dt / DAY_DURATION_SEC) % 1;
  const { brightness, colorTemp } = computeDayNightValues(newCycle);

  useGameStore.getState().setDayNight(newCycle, brightness, colorTemp);

  let newProgress = state.weatherProgress + dt;
  if (newProgress >= state.weatherDuration) {
    const nextWeather = pickNextWeather(state.currentWeather);
    const nextCfg = WEATHER_CONFIG[nextWeather];
    const nextDuration = randRange(nextCfg.duration[0], nextCfg.duration[1]);
    useGameStore.getState().setWeather(nextWeather, nextDuration, 0);
    if (nextWeather === 'thunderstorm' || state.currentWeather === 'thunderstorm') {
      useGameStore.getState().triggerScreenShake(3, 0.5);
    }
  } else {
    useGameStore.setState({ weatherProgress: newProgress });
  }

  const cfg = WEATHER_CONFIG[state.currentWeather];
  let moistureChange = cfg.humidityChangePerSec * dt;
  if (cfg.precipitation !== 'none') {
    for (const plant of state.plants) {
      const amount = cfg.precipitation === 'heavy' ? 3 : 1.5;
      useGameStore.getState().updatePlant(plant.id, {
        water: clamp(plant.water + amount * dt, 0, 100),
      });
    }
  }
  useGameStore.getState().setSoilMoisture(state.soilMoisture + moistureChange);

  if (state.screenShake && now - state.screenShake.startTime >= state.screenShake.duration * 1000) {
    useGameStore.getState().clearScreenShake();
  }
}

function pickNextWeather(current: WeatherType): WeatherType {
  const options = WEATHER_TRANSITIONS[current];
  const idx = Math.floor(Math.random() * options.length);
  return options[idx];
}

export function computeDayNightValues(cycle: number): { brightness: number; colorTemp: { r: number; g: number; b: number } } {
  const transitionRatio = DAY_TRANSITION_SEC / DAY_DURATION_SEC;
  const dawnStart = 0.25 - transitionRatio / 2;
  const dawnEnd = 0.25 + transitionRatio / 2;
  const duskStart = 0.75 - transitionRatio / 2;
  const duskEnd = 0.75 + transitionRatio / 2;

  let brightness: number;
  let dayFactor: number;

  if (cycle < dawnStart) {
    brightness = NIGHT_BRIGHTNESS;
    dayFactor = 0;
  } else if (cycle < dawnEnd) {
    const t = (cycle - dawnStart) / transitionRatio;
    brightness = lerp(NIGHT_BRIGHTNESS, DAY_BRIGHTNESS, t);
    dayFactor = t;
  } else if (cycle < duskStart) {
    brightness = DAY_BRIGHTNESS;
    dayFactor = 1;
  } else if (cycle < duskEnd) {
    const t = (cycle - duskStart) / transitionRatio;
    brightness = lerp(DAY_BRIGHTNESS, NIGHT_BRIGHTNESS, t);
    dayFactor = 1 - t;
  } else {
    brightness = NIGHT_BRIGHTNESS;
    dayFactor = 0;
  }

  const colorTemp = lerpColor(NIGHT_COLOR_TEMP, DAY_COLOR_TEMP, dayFactor);
  return { brightness, colorTemp };
}

export function computeLightIntensity(): number {
  const state = useGameStore.getState();
  const weatherCfg = WEATHER_CONFIG[state.currentWeather];
  return clamp(state.brightness * weatherCfg.lightMultiplier, 0, 1);
}

export function getEnvironmentSnapshot(): EnvironmentSnapshot {
  const state = useGameStore.getState();
  const cfg = WEATHER_CONFIG[state.currentWeather];
  return {
    brightness: state.brightness,
    colorTemp: state.colorTemp,
    lightIntensity: computeLightIntensity(),
    soilMoisture: state.soilMoisture,
    currentWeather: state.currentWeather,
    precipitation: cfg.precipitation,
    tempMultiplier: cfg.tempMultiplier,
  };
}

export function getGameTimeString(): string {
  const cycle = useGameStore.getState().dayNightCycle;
  const totalSec = cycle * 24 * 60 * 60;
  const hours = Math.floor(totalSec / 3600) % 24;
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = Math.floor(totalSec % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
