import type { WeatherMode, SunData } from '../types';

interface CalcRequest {
  month: number;
  day: number;
  hour: number;
  latitude: number;
  longitude: number;
  weather: WeatherMode;
}

function calculateSunPosition(
  month: number,
  day: number,
  hour: number,
  latitude: number,
  longitude: number
): { altitude: number; azimuth: number } {
  const dayOfYear = (month - 1) * 30 + day;

  const declination = 23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);

  const declRad = (declination * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;

  const hourAngle = (hour - 12) * 15 + longitude / 15 * 0;
  const haRad = (hourAngle * Math.PI) / 180;

  const sinAltitude =
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(haRad);

  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));

  const cosAzimuth =
    (Math.sin(declRad) - Math.sin(latRad) * sinAltitude) /
    (Math.cos(latRad) * Math.cos(altitude));

  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));
  if (hour > 12) {
    azimuth = 2 * Math.PI - azimuth;
  }

  return {
    altitude: (altitude * 180) / Math.PI,
    azimuth: (azimuth * 180) / Math.PI,
  };
}

function calculateColorTemperature(altitude: number): number {
  if (altitude < 0) return 2000;
  if (altitude < 10) return 2500 + (altitude / 10) * 1500;
  if (altitude < 30) return 4000 + ((altitude - 10) / 20) * 1500;
  return 5500 + Math.min(altitude - 30, 30) * 10;
}

function applyWeatherFactors(
  base: { direct: number; ambient: number },
  weather: WeatherMode,
  altitude: number
): { directIntensity: number; ambientIntensity: number } {
  const dayFactor = Math.max(0, Math.min(1, (altitude + 5) / 30));

  switch (weather) {
    case 'sunny':
      return {
        directIntensity: base.direct * dayFactor,
        ambientIntensity: base.ambient * dayFactor,
      };
    case 'cloudy':
      return {
        directIntensity: base.direct * 0.6 * dayFactor,
        ambientIntensity: base.ambient * 1.3 * dayFactor,
      };
    case 'overcast':
      return {
        directIntensity: base.direct * 0.3 * dayFactor,
        ambientIntensity: base.ambient * 2.0 * dayFactor,
      };
  }
}

self.onmessage = (e: MessageEvent<CalcRequest>) => {
  const { month, day, hour, latitude, longitude, weather } = e.data;

  const { altitude, azimuth } = calculateSunPosition(
    month,
    day,
    hour,
    latitude,
    longitude
  );

  const baseDirect = 1.5;
  const baseAmbient = 0.3;

  const { directIntensity, ambientIntensity } = applyWeatherFactors(
    { direct: baseDirect, ambient: baseAmbient },
    weather,
    altitude
  );

  const colorTemperature = calculateColorTemperature(altitude);

  const result: SunData = {
    altitude,
    azimuth,
    directIntensity,
    ambientIntensity,
    colorTemperature,
  };

  self.postMessage(result);
};

export {};
