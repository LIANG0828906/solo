export interface TimeSlot {
  id: string;
  name: string;
  emoji: string;
  startTime: string;
  endTime: string;
  color: string;
  recommendedTypes: string[];
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

function calculateSunTimes(lat: number, lng: number, date: Date): { sunrise: number; sunset: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const N1 = Math.floor((275 * month) / 9);
  const N2 = Math.floor((month + 9) / 12);
  const N3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
  const dayOfYear = N1 - N2 * N3 + day - 30;

  const lngHour = lng / 15;

  const tRise = dayOfYear + (6 - lngHour) / 24;
  const tSet = dayOfYear + (18 - lngHour) / 24;

  const calcSunTime = (t: number): number => {
    const M = (0.9856 * t) - 3.289;
    let L = M + (1.916 * Math.sin(toRadians(M))) + (0.020 * Math.sin(toRadians(2 * M))) + 282.634;
    L = L % 360;
    if (L < 0) L += 360;

    let RA = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(L))));
    RA = RA % 360;
    if (RA < 0) RA += 360;

    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = RA + (Lquadrant - RAquadrant);
    RA = RA / 15;

    const sinDec = 0.39782 * Math.sin(toRadians(L));
    const cosDec = Math.cos(Math.asin(sinDec));

    const cosH = (Math.sin(toRadians(-0.833)) - sinDec * Math.sin(toRadians(lat))) / (cosDec * Math.cos(toRadians(lat)));

    if (cosH > 1 || cosH < -1) {
      return -1;
    }

    let H = toDegrees(Math.acos(cosH));
    H = 360 - H;
    H = H / 15;

    const T = H + RA - (0.06571 * t) - 6.622;

    let UT = T - lngHour;
    UT = UT % 24;
    if (UT < 0) UT += 24;

    return UT;
  };

  const sunriseUT = calcSunTime(tRise);
  const sunsetUT = calcSunTime(tSet);

  const timezoneOffset = -date.getTimezoneOffset() / 60;

  return {
    sunrise: sunriseUT + timezoneOffset,
    sunset: sunsetUT + timezoneOffset,
  };
}

function formatTime(hours: number): string {
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  if (m === 60) {
    h += 1;
    m = 0;
  }
  h = h % 24;
  if (h < 0) h += 24;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function calculateTimeSlots(lat: number, lng: number, date: string): TimeSlot[] {
  const targetDate = new Date(date + 'T00:00:00');
  const { sunrise, sunset } = calculateSunTimes(lat, lng, targetDate);

  const morningGoldenStart = sunrise - 0.5;
  const morningGoldenEnd = sunrise + 1;
  const eveningGoldenStart = sunset - 1;
  const eveningGoldenEnd = sunset + 0.5;
  const blueMorningStart = sunrise - 1;
  const blueMorningEnd = sunrise - 0.5;
  const blueEveningStart = sunset + 0.5;
  const blueEveningEnd = sunset + 1.5;

  const slots: TimeSlot[] = [
    {
      id: 'dawn',
      name: '清晨',
      emoji: '🌅',
      startTime: formatTime(Math.max(blueMorningStart, 4)),
      endTime: formatTime(morningGoldenEnd),
      color: 'linear-gradient(135deg, #1a1a3e 0%, #ff7e5f 50%, #feb47b 100%)',
      recommendedTypes: ['风景', '剪影', '长曝光'],
    },
    {
      id: 'noon',
      name: '正午',
      emoji: '☀️',
      startTime: formatTime(morningGoldenEnd),
      endTime: formatTime(eveningGoldenStart),
      color: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      recommendedTypes: ['建筑', '街头', '纪实'],
    },
    {
      id: 'dusk',
      name: '黄昏',
      emoji: '🌇',
      startTime: formatTime(eveningGoldenStart),
      endTime: formatTime(blueEveningEnd),
      color: 'linear-gradient(135deg, #f12711 0%, #f5af19 50%, #1a1a3e 100%)',
      recommendedTypes: ['人像', '风景', '剪影'],
    },
    {
      id: 'night',
      name: '夜晚',
      emoji: '🌙',
      startTime: formatTime(blueEveningEnd),
      endTime: formatTime(Math.min(blueMorningStart + 24, 28)),
      color: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      recommendedTypes: ['星空', '光绘', '城市夜景'],
    },
  ];

  return slots;
}
