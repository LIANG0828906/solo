export const SHICHEN_DATA = [
  { name: '子时', modern: '23:00-01:00', ancient: '夜半', startHour: 23 },
  { name: '丑时', modern: '01:00-03:00', ancient: '鸡鸣', startHour: 1 },
  { name: '寅时', modern: '03:00-05:00', ancient: '平旦', startHour: 3 },
  { name: '卯时', modern: '05:00-07:00', ancient: '日出', startHour: 5 },
  { name: '辰时', modern: '07:00-09:00', ancient: '食时', startHour: 7 },
  { name: '巳时', modern: '09:00-11:00', ancient: '隅中', startHour: 9 },
  { name: '午时', modern: '11:00-13:00', ancient: '日中', startHour: 11 },
  { name: '未时', modern: '13:00-15:00', ancient: '日昳', startHour: 13 },
  { name: '申时', modern: '15:00-17:00', ancient: '哺时', startHour: 15 },
  { name: '酉时', modern: '17:00-19:00', ancient: '日入', startHour: 17 },
  { name: '戌时', modern: '19:00-21:00', ancient: '黄昏', startHour: 19 },
  { name: '亥时', modern: '21:00-23:00', ancient: '人定', startHour: 21 }
] as const;

export const SOLAR_TERMS = [
  { name: '立春', day: 0 },
  { name: '雨水', day: 15 },
  { name: '惊蛰', day: 30 },
  { name: '春分', day: 45 },
  { name: '清明', day: 60 },
  { name: '谷雨', day: 75 },
  { name: '立夏', day: 90 },
  { name: '小满', day: 105 },
  { name: '芒种', day: 120 },
  { name: '夏至', day: 135 },
  { name: '小暑', day: 150 },
  { name: '大暑', day: 165 },
  { name: '立秋', day: 180 },
  { name: '处暑', day: 195 },
  { name: '白露', day: 210 },
  { name: '秋分', day: 225 },
  { name: '寒露', day: 240 },
  { name: '霜降', day: 255 },
  { name: '立冬', day: 270 },
  { name: '小雪', day: 285 },
  { name: '大雪', day: 300 },
  { name: '冬至', day: 315 },
  { name: '小寒', day: 330 },
  { name: '大寒', day: 345 }
] as const;

const LATITUDE = 40;
const OBLIQUITY = 23.44;
const GNOMON_HEIGHT = 4;
const DIAL_RADIUS = 4;

export class ShadowSimulator {
  private dayOfYear: number = 0;
  private timeIndex: number = 0;

  setDate(day: number): void {
    this.dayOfYear = Math.max(0, Math.min(364, day));
  }

  setTime(index: number): void {
    this.timeIndex = Math.max(0, Math.min(95, index));
  }

  getDate(): number {
    return this.dayOfYear;
  }

  getTime(): number {
    return this.timeIndex;
  }

  getSolarDeclination(): number {
    const dayAngle = (2 * Math.PI * (this.dayOfYear - 80)) / 365.25;
    const declination = OBLIQUITY * Math.sin(dayAngle);
    return declination;
  }

  getHourAngle(): number {
    const totalMinutes = this.timeIndex * 15;
    const hours = totalMinutes / 60;
    const solarNoon = 12;
    const hourAngle = (hours - solarNoon) * 15;
    return hourAngle;
  }

  getShadowAngle(): number {
    const hourAngle = this.getHourAngle();
    const latRad = (LATITUDE * Math.PI) / 180;
    const decRad = (this.getSolarDeclination() * Math.PI) / 180;
    
    const tanAzimuth = Math.sin(hourAngle * Math.PI / 180) / 
      (Math.cos(hourAngle * Math.PI / 180) * Math.sin(latRad) - 
       Math.tan(decRad) * Math.cos(latRad));
    
    let azimuth = Math.atan(tanAzimuth) * 180 / Math.PI;
    
    const cosAltitude = Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngle * Math.PI / 180) +
                       Math.sin(latRad) * Math.sin(decRad);
    
    if (cosAltitude < 0) {
      azimuth += 180;
    } else if (Math.sin(hourAngle * Math.PI / 180) > 0 && tanAzimuth < 0) {
      azimuth += 180;
    } else if (Math.sin(hourAngle * Math.PI / 180) < 0 && tanAzimuth > 0) {
      azimuth -= 180;
    }
    
    return azimuth;
  }

  getShadowLength(): number {
    const latRad = (LATITUDE * Math.PI) / 180;
    const decRad = (this.getSolarDeclination() * Math.PI) / 180;
    const hourRad = (this.getHourAngle() * Math.PI) / 180;
    
    const sinAltitude = Math.sin(latRad) * Math.sin(decRad) + 
                        Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad);
    
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
    
    if (altitude <= 0) {
      return DIAL_RADIUS * 2;
    }
    
    const shadowLength = GNOMON_HEIGHT / Math.tan(altitude);
    return Math.min(shadowLength, DIAL_RADIUS * 2);
  }

  getSunriseAzimuth(): number {
    const latRad = (LATITUDE * Math.PI) / 180;
    const decRad = (this.getSolarDeclination() * Math.PI) / 180;
    
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
    
    if (Math.abs(cosHourAngle) > 1) {
      return 0;
    }
    
    const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
    const tanAzimuth = Math.sin(-hourAngle * Math.PI / 180) /
      (Math.cos(-hourAngle * Math.PI / 180) * Math.sin(latRad) -
       Math.tan(decRad) * Math.cos(latRad));
    
    let azimuth = Math.atan(tanAzimuth) * 180 / Math.PI;
    if (azimuth > 0) azimuth -= 180;
    
    return azimuth;
  }

  getSunsetAzimuth(): number {
    const latRad = (LATITUDE * Math.PI) / 180;
    const decRad = (this.getSolarDeclination() * Math.PI) / 180;
    
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
    
    if (Math.abs(cosHourAngle) > 1) {
      return 180;
    }
    
    const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
    const tanAzimuth = Math.sin(hourAngle * Math.PI / 180) /
      (Math.cos(hourAngle * Math.PI / 180) * Math.sin(latRad) -
       Math.tan(decRad) * Math.cos(latRad));
    
    let azimuth = Math.atan(tanAzimuth) * 180 / Math.PI;
    if (azimuth < 0) azimuth += 180;
    
    return azimuth;
  }

  getCurrentShichen(): typeof SHICHEN_DATA[number] {
    const shichenIndex = Math.floor(this.timeIndex / 8) % 12;
    return SHICHEN_DATA[shichenIndex];
  }

  getCurrentKe(): string {
    const keIndex = Math.floor(this.timeIndex % 8 / 2);
    const keNames = ['初刻', '一刻', '二刻', '三刻'];
    return keNames[keIndex];
  }

  getCurrentSolarTerm(): (typeof SOLAR_TERMS)[number] {
    let nearestTerm: (typeof SOLAR_TERMS)[number] = SOLAR_TERMS[0];
    let minDiff = Infinity;
    
    for (const term of SOLAR_TERMS) {
      const diff = Math.abs(this.dayOfYear - term.day);
      if (diff < minDiff) {
        minDiff = diff;
        nearestTerm = term;
      }
    }
    
    return nearestTerm;
  }

  getShichenAngle(index: number): number {
    const baseHour = SHICHEN_DATA[index].startHour;
    let hourAngle = (baseHour + 1 - 12) * 15;
    
    const latRad = (LATITUDE * Math.PI) / 180;
    const decRad = (this.getSolarDeclination() * Math.PI) / 180;
    
    const tanAzimuth = Math.sin(hourAngle * Math.PI / 180) / 
      (Math.cos(hourAngle * Math.PI / 180) * Math.sin(latRad) - 
       Math.tan(decRad) * Math.cos(latRad));
    
    let azimuth = Math.atan(tanAzimuth) * 180 / Math.PI;
    
    const cosAltitude = Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngle * Math.PI / 180) +
                       Math.sin(latRad) * Math.sin(decRad);
    
    if (cosAltitude < 0) {
      azimuth += 180;
    } else if (Math.sin(hourAngle * Math.PI / 180) > 0 && tanAzimuth < 0) {
      azimuth += 180;
    } else if (Math.sin(hourAngle * Math.PI / 180) < 0 && tanAzimuth > 0) {
      azimuth -= 180;
    }
    
    return azimuth;
  }

  isOnShichenMark(): { isOn: boolean; shichenIndex: number } {
    const currentAngle = this.getShadowAngle();
    
    for (let i = 0; i < 12; i++) {
      const markAngle = this.getShichenAngle(i);
      let diff = Math.abs(currentAngle - markAngle);
      
      if (diff > 180) {
        diff = 360 - diff;
      }
      
      if (diff < 2) {
        return { isOn: true, shichenIndex: i };
      }
    }
    
    return { isOn: false, shichenIndex: -1 };
  }
}
