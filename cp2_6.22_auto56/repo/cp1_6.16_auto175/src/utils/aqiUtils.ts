export const AQI_MIN = 0;
export const AQI_MAX = 300;
export const HEIGHT_SCALE = 3;

export const aqiToHeight = (aqi: number): number => {
  const clamped = Math.max(AQI_MIN, Math.min(AQI_MAX, aqi));
  return (clamped / AQI_MAX) * HEIGHT_SCALE;
};

export const aqiToColor = (aqi: number): string => {
  if (aqi <= 50) return '#00E676';
  if (aqi <= 100) return '#FFC107';
  if (aqi <= 150) return '#FF9800';
  return '#FF1744';
};

export const aqiToRadius = (aqi: number): number => {
  const clamped = Math.max(AQI_MIN, Math.min(AQI_MAX, aqi));
  return 0.1 + (clamped / AQI_MAX) * 0.4;
};

export const latLngToVector3 = (
  lat: number,
  lng: number,
  radius: number
): [number, number, number] => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
};

export const getTrend = (yearlyData: { year: number; aqi: number }[]): 'up' | 'down' | 'flat' => {
  if (yearlyData.length < 2) return 'flat';
  const first = yearlyData[0].aqi;
  const last = yearlyData[yearlyData.length - 1].aqi;
  const diff = last - first;
  if (Math.abs(diff) < 5) return 'flat';
  return diff > 0 ? 'up' : 'down';
};

export const getAverageAQI = (yearlyData: { year: number; aqi: number }[]): number => {
  if (yearlyData.length === 0) return 0;
  const sum = yearlyData.reduce((acc, d) => acc + d.aqi, 0);
  return Math.round(sum / yearlyData.length);
};
