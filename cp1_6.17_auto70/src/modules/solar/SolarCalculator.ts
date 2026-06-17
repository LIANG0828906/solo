export interface SolarPosition {
  azimuth: number;
  altitude: number;
}

export class SolarCalculator {
  calculate(dayOfYear: number, hour: number, latitude: number, longitude: number): SolarPosition {
    const latRad = (latitude * Math.PI) / 180;
    const declination = (23.45 * Math.PI) / 180 * Math.sin(((2 * Math.PI) / 365) * (284 + dayOfYear));
    const hourAngle = ((15 * (hour - 12)) * Math.PI) / 180 + ((longitude - 120) * Math.PI) / 180;
    const sinAltitude = Math.sin(latRad) * Math.sin(declination) +
      Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
    const cosAzimuth = (Math.sin(declination) - Math.sin(altitude) * Math.sin(latRad)) /
      (Math.cos(altitude) * Math.cos(latRad) + 1e-10);
    let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));
    if (hourAngle > 0) {
      azimuth = 2 * Math.PI - azimuth;
    }
    return { azimuth, altitude };
  }

  calculateDayProfile(dayOfYear: number, latitude: number, longitude: number): { hour: number; intensity: number }[] {
    const result: { hour: number; intensity: number }[] = [];
    for (let h = 6; h <= 18; h++) {
      const pos = this.calculate(dayOfYear, h, latitude, longitude);
      const intensity = pos.altitude > 0 ? Math.sin(pos.altitude) : 0;
      result.push({ hour: h, intensity: Math.round(intensity * 1000) / 1000 });
    }
    return result;
  }
}
