import * as THREE from 'three';

export interface City {
  name: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export const CITIES: Record<string, City> = {
  '北京': { name: '北京', latitude: 39.9042, longitude: 116.4074, timezone: 8 },
  '上海': { name: '上海', latitude: 31.2304, longitude: 121.4737, timezone: 8 },
  '迪拜': { name: '迪拜', latitude: 25.2048, longitude: 55.2708, timezone: 4 },
  '奥斯陆': { name: '奥斯陆', latitude: 59.9139, longitude: 10.7522, timezone: 1 },
};

export interface SunPositionResult {
  direction: THREE.Vector3;
  altitude: number;
  azimuth: number;
  intensity: number;
  sunriseHour: number;
  sunsetHour: number;
  daylightHours: number;
  averageSunHours: number;
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function rad2deg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function calculateSunPosition(
  city: City,
  date: Date,
  hour: number
): SunPositionResult {
  const dayOfYear = getDayOfYear(date);
  const latitudeRad = deg2rad(city.latitude);

  const declination = 23.45 * Math.sin(deg2rad((360 / 365) * (dayOfYear - 81)));
  const declinationRad = deg2rad(declination);

  const equationOfTime =
    9.87 * Math.sin(deg2rad(2 * (dayOfYear - 81))) -
    7.53 * Math.cos(deg2rad((dayOfYear - 81))) -
    1.5 * Math.sin(deg2rad((dayOfYear - 81)));

  const solarNoon = 12 - (city.longitude / 15 - city.timezone) - equationOfTime / 60;
  const hourAngle = 15 * (hour - solarNoon);
  const hourAngleRad = deg2rad(hourAngle);

  const sinAltitude =
    Math.sin(latitudeRad) * Math.sin(declinationRad) +
    Math.cos(latitudeRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
  const altitudeRad = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
  const altitude = rad2deg(altitudeRad);

  let azimuth: number;
  if (altitudeRad === Math.PI / 2) {
    azimuth = 180;
  } else {
    const cosAzimuth =
      (Math.sin(declinationRad) - Math.sin(latitudeRad) * Math.sin(altitudeRad)) /
      (Math.cos(latitudeRad) * Math.cos(altitudeRad));
    const azimuthRad = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));
    azimuth = hour < solarNoon ? rad2deg(azimuthRad) : 360 - rad2deg(azimuthRad);
  }

  const cosHourAngle = -Math.tan(latitudeRad) * Math.tan(declinationRad);
  const clampedCosHourAngle = Math.max(-1, Math.min(1, cosHourAngle));
  const hourAngleSunriseSunset = rad2deg(Math.acos(clampedCosHourAngle));
  const sunriseHour = solarNoon - hourAngleSunriseSunset / 15;
  const sunsetHour = solarNoon + hourAngleSunriseSunset / 15;
  const daylightHours = sunsetHour - sunriseHour;

  const usefulSunrise = Math.max(sunriseHour, 8);
  const usefulSunset = Math.min(sunsetHour, 17);
  const averageSunHours = Math.max(0, usefulSunset - usefulSunrise);

  const intensity = altitude > 0 ? Math.max(0, Math.sin(altitudeRad)) : 0;

  const altitudeForDirection = Math.max(0, altitude);
  const direction = new THREE.Vector3();
  direction.y = Math.sin(deg2rad(altitudeForDirection));
  const horizontalLength = Math.cos(deg2rad(altitudeForDirection));
  const azimuthFromSouth = azimuth - 180;
  direction.x = horizontalLength * Math.sin(deg2rad(azimuthFromSouth));
  direction.z = horizontalLength * Math.cos(deg2rad(azimuthFromSouth));
  direction.normalize();

  return {
    direction,
    altitude,
    azimuth,
    intensity,
    sunriseHour,
    sunsetHour,
    daylightHours,
    averageSunHours,
  };
}

export function createSunLight(): {
  directionalLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  sunSphere: THREE.Mesh;
} {
  const ambientLight = new THREE.AmbientLight(0x404060, 0.4);

  const directionalLight = new THREE.DirectionalLight(0xfff5e0, 1.5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.bias = -0.001;

  const sunGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd00,
    transparent: true,
    opacity: 0.9,
  });
  const sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);

  return { directionalLight, ambientLight, sunSphere };
}

export function updateSunLight(
  lights: {
    directionalLight: THREE.DirectionalLight;
    sunSphere: THREE.Mesh;
  },
  sunResult: SunPositionResult,
  distance: number = 30
): void {
  const { directionalLight, sunSphere } = lights;
  const { direction, intensity, altitude } = sunResult;

  const sunDistance = distance;
  directionalLight.position.set(
    direction.x * sunDistance,
    Math.max(0.1, direction.y) * sunDistance,
    direction.z * sunDistance
  );

  directionalLight.intensity = 0.3 + intensity * 2.0;

  const ambientFactor = Math.max(0.1, intensity * 0.6);
  directionalLight.color.setHSL(0.12, 0.6, 0.5 + intensity * 0.3);

  sunSphere.position.copy(directionalLight.position);
  sunSphere.scale.setScalar(0.3 + intensity * 0.8);
  const sunMat = sunSphere.material as THREE.MeshBasicMaterial;
  sunMat.opacity = altitude > 0 ? 0.6 + intensity * 0.4 : 0;
  sunMat.color.setHSL(0.12, 0.9, 0.4 + intensity * 0.3);
}
