import type { EarthquakeEvent } from '@/types';

const citiesNearFaults = [
  { name: 'Tokyo, Japan', lat: 35.68, lon: 139.69 },
  { name: 'San Francisco, USA', lat: 37.77, lon: -122.42 },
  { name: 'Los Angeles, USA', lat: 34.05, lon: -118.24 },
  { name: 'Mexico City, Mexico', lat: 19.43, lon: -99.13 },
  { name: 'Lima, Peru', lat: -12.05, lon: -77.04 },
  { name: 'Santiago, Chile', lat: -33.45, lon: -70.67 },
  { name: 'Jakarta, Indonesia', lat: -6.21, lon: 106.85 },
  { name: 'Manila, Philippines', lat: 14.60, lon: 120.98 },
  { name: 'Wellington, NZ', lat: -41.29, lon: 174.78 },
  { name: 'Anchorage, Alaska', lat: 61.22, lon: -149.90 },
  { name: 'Kathmandu, Nepal', lat: 27.72, lon: 85.32 },
  { name: 'Istanbul, Turkey', lat: 41.01, lon: 28.98 },
  { name: 'Rome, Italy', lat: 41.90, lon: 12.50 },
  { name: 'Tehran, Iran', lat: 35.69, lon: 51.42 },
  { name: 'Chengdu, China', lat: 30.57, lon: 104.07 },
  { name: 'Reykjavik, Iceland', lat: 64.15, lon: -21.94 },
  { name: 'Honolulu, Hawaii', lat: 21.31, lon: -157.86 },
  { name: 'Seattle, USA', lat: 47.61, lon: -122.33 },
  { name: 'Bogota, Colombia', lat: 4.71, lon: -74.07 },
  { name: 'Taipei, Taiwan', lat: 25.03, lon: 121.56 }
];

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const seed = () => Math.random() < 0.5;

export const generateMockEarthquakes = (days: number = 30): EarthquakeEvent[] => {
  const events: EarthquakeEvent[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let d = 0; d < days; d++) {
    const dayStart = now - d * dayMs;
    const eventsPerDay = randInt(8, 25);

    for (let i = 0; i < eventsPerDay; i++) {
      const baseCity = citiesNearFaults[randInt(0, citiesNearFaults.length - 1)];
      const latOffset = rand(-5, 5);
      const lonOffset = rand(-8, 8);
      const magnitude = Math.round(rand(4.5, 8.2) * 10) / 10;

      events.push({
        id: `eq-${d}-${i}`,
        magnitude,
        latitude: Math.max(-85, Math.min(85, baseCity.lat + latOffset)),
        longitude: baseCity.lon + lonOffset,
        depth: Math.round(rand(5, 600)),
        time: dayStart - rand(0, dayMs),
        nearestCity: baseCity.name
      });
    }
  }

  return events.sort((a, b) => b.time - a.time);
};
