import type { Time, TickStyle } from '@/store/clockStore';

export type TickData = {
  x: number;
  y: number;
  type: 'hour' | 'minute';
  label?: string;
};

const ROMAN_NUMERALS = [
  'XII', 'I', 'II', 'III', 'IV', 'V',
  'VI', 'VII', 'VIII', 'IX', 'X', 'XI',
];

export function calculateHandAngles(time: Time): {
  hourAngle: number;
  minuteAngle: number;
} {
  const minuteAngle = (time.minute / 60) * 360;
  const hourAngle = ((time.hour % 12) / 12) * 360 + (time.minute / 60) * 30;
  return { hourAngle, minuteAngle };
}

export function convertTimeToAngle(time: Time): {
  hourAngle: number;
  minuteAngle: number;
} {
  return calculateHandAngles(time);
}

export function convertAngleToTime(angles: {
  hourAngle: number;
  minuteAngle: number;
}): Time {
  const normalizedMinute = ((angles.minuteAngle % 360) + 360) % 360;
  const normalizedHour = ((angles.hourAngle % 360) + 360) % 360;

  const minute = Math.round(normalizedMinute / 6) % 60;
  const hour12 = Math.floor(normalizedHour / 30);
  const hour = hour12 === 0 ? 12 : hour12;

  return { hour, minute };
}

export function generateTickData(tickStyle: TickStyle): TickData[] {
  const ticks: TickData[] = [];
  const centerX = 250;
  const centerY = 250;
  const outerRadius = 220;

  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isHourMark = i % 5 === 0;
    const radius = isHourMark ? outerRadius : outerRadius - 5;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (tickStyle === 'dots') {
      ticks.push({ x, y, type: isHourMark ? 'hour' : 'minute' });
    } else if (tickStyle === 'lines') {
      ticks.push({ x, y, type: isHourMark ? 'hour' : 'minute' });
    } else if (tickStyle === 'roman' || tickStyle === 'arabic') {
      if (isHourMark) {
        const hourIndex = i / 5;
        const label = tickStyle === 'roman'
          ? ROMAN_NUMERALS[hourIndex]
          : String(hourIndex === 0 ? 12 : hourIndex);
        ticks.push({ x, y, type: 'hour', label });
      } else {
        ticks.push({ x, y, type: 'minute' });
      }
    }
  }

  return ticks;
}

export function snapMinuteToFive(minute: number): number {
  return Math.round(minute / 5) * 5;
}

export function angleFromPointer(
  centerX: number,
  centerY: number,
  pointerX: number,
  pointerY: number
): number {
  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (angle < 0) angle += 360;
  return angle;
}
