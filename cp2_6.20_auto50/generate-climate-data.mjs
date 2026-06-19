import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function generateTemperature(lat, lon, year) {
  const latFactor = Math.cos((lat * Math.PI) / 180);
  const baseTemp = -40 + latFactor * 85;
  const yearTrend = (year - 2000) * 0.05;
  const noise = randomInRange(-5, 5);
  const value = baseTemp + yearTrend + noise;
  return Math.max(-40, Math.min(45, value));
}

function generatePrecipitation(lat, lon, year) {
  const latFactor = Math.cos((lat * Math.PI) / 180);
  const equatorFactor = Math.max(0, 1 - Math.abs(lat) / 15);
  const basePrecip = 100 + latFactor * 800 + equatorFactor * 600;
  const noise = randomInRange(-200, 200);
  const value = basePrecip + noise;
  return Math.max(0, Math.min(2000, value));
}

function generateWind(lat, lon, year) {
  const absLat = Math.abs(lat);
  let baseWind;
  if (absLat < 30) {
    baseWind = randomInRange(5, 30);
  } else if (absLat < 60) {
    baseWind = randomInRange(20, 80);
  } else {
    baseWind = randomInRange(10, 50);
  }
  const noise = randomInRange(-10, 10);
  const value = baseWind + noise;
  return Math.max(0, Math.min(120, value));
}

function generateDataPoints(year, type) {
  const points = [];
  const count = 200 + Math.floor(randomInRange(-10, 10));
  
  for (let i = 0; i < count; i++) {
    const lat = randomInRange(-90, 90);
    const lon = randomInRange(-180, 180);
    let value;
    
    switch (type) {
      case 'temperature':
        value = generateTemperature(lat, lon, year);
        break;
      case 'precipitation':
        value = generatePrecipitation(lat, lon, year);
        break;
      case 'wind':
        value = generateWind(lat, lon, year);
        break;
    }
    
    points.push({
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      value: Number(value.toFixed(2))
    });
  }
  
  return points;
}

const climateData = {};

for (let year = 2000; year <= 2020; year++) {
  climateData[year] = {
    temperature: generateDataPoints(year, 'temperature'),
    precipitation: generateDataPoints(year, 'precipitation'),
    wind: generateDataPoints(year, 'wind')
  };
}

const outputPath = path.join(__dirname, 'public', 'data', 'climate.json');
fs.writeFileSync(outputPath, JSON.stringify(climateData, null, 2));

console.log(`Climate data generated at: ${outputPath}`);
console.log(`Years: 2000-2020 (${Object.keys(climateData).length} years)`);
console.log(`Sample year 2020:`);
console.log(`  temperature: ${climateData[2020].temperature.length} points`);
console.log(`  precipitation: ${climateData[2020].precipitation.length} points`);
console.log(`  wind: ${climateData[2020].wind.length} points`);
