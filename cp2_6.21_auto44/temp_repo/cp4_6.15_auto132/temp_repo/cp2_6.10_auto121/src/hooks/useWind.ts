import { useEffect, useRef } from 'react';
import { WindData, WindLevel } from '../types';

const LEVELS: WindLevel[] = ['微风', '和风', '大风'];
const WIND_EFFECTS: Record<WindLevel, number> = {
  '微风': 0.05,
  '和风': 0.15,
  '大风': 0.30,
};

function getRandomWindChangeInterval(): number {
  return (10 + Math.random() * 5) * 1000;
}

function generateWind(): WindData {
  const levelIndex = Math.floor(Math.random() * LEVELS.length);
  const level = LEVELS[levelIndex];
  const angle = (Math.random() - 0.5) * 180;
  const speed = WIND_EFFECTS[level];
  return { angle, level, speed };
}

export function useWind(): React.MutableRefObject<WindData> {
  const windRef = useRef<WindData>(generateWind());

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    const scheduleWindChange = () => {
      timerId = setTimeout(() => {
        windRef.current = generateWind();
        scheduleWindChange();
      }, getRandomWindChangeInterval());
    };

    scheduleWindChange();

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  return windRef;
}
