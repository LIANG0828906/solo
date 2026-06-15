import { useEffect, useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface NutrientData {
  current: number;
  target: number;
}

interface NutrientRingProps {
  protein: NutrientData;
  carbs: NutrientData;
  fat: NutrientData;
  size?: number;
  strokeWidth?: number;
}

const COLORS = {
  protein: '#FF6B9D',
  carbs: '#FFB74D',
  fat: '#64B5F6',
};

export default function NutrientRing({
  protein,
  carbs,
  fat,
  size = 240,
  strokeWidth = 14,
}: NutrientRingProps) {
  const totalCalories = (protein.current + carbs.current + fat.current) * 4;
  const totalTargetCalories = (protein.target + carbs.target + fat.target) * 4;

  const { value: displayedCalories } = useCountUp(Math.round(totalCalories), {
    duration: 1500,
    decimals: 0,
  });

  const [animProgress, setAnimProgress] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  useEffect(() => {
    const delays = [50, 125, 200];
    const duration = 1500;
    const keys: ('protein' | 'carbs' | 'fat')[] = ['protein', 'carbs', 'fat'];
    const data = [protein, carbs, fat];

    keys.forEach((key, i) => {
      const target = data[i].target > 0 ? Math.min(data[i].current / data[i].target, 1) : 0;
      const start = performance.now() + delays[i];

      const animate = (now: number) => {
        if (now < start) {
          requestAnimationFrame(animate);
          return;
        }
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        setAnimProgress((prev) => ({
          ...prev,
          [key]: target * easeOut,
        }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  }, [protein.current, protein.target, carbs.current, carbs.target, fat.current, fat.target]);

  const center = size / 2;
  const gap = 6;

  const radii = {
    protein: center - strokeWidth / 2 - 10,
    carbs: center - strokeWidth / 2 - 10 - strokeWidth - gap,
    fat: center - strokeWidth / 2 - 10 - (strokeWidth + gap) * 2,
  };

  const renderRing = (
    key: 'protein' | 'carbs' | 'fat',
    progress: number,
    color: string,
    radius: number
  ) => {
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    return (
      <circle
        key={key}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${center} ${center})`}
      />
    );
  };

  const renderBackgroundRing = (radius: number) => (
    <circle
      cx={center}
      cy={center}
      r={radius}
      fill="none"
      stroke="#E5E7EB"
      strokeWidth={strokeWidth}
    />
  );

  const proteinPct = protein.target > 0 ? Math.round((protein.current / protein.target) * 100) : 0;
  const carbsPct = carbs.target > 0 ? Math.round((carbs.current / carbs.target) * 100) : 0;
  const fatPct = fat.target > 0 ? Math.round((fat.current / fat.target) * 100) : 0;

  const { value: dispProteinPct } = useCountUp(proteinPct, { duration: 1500, delay: 50 });
  const { value: dispCarbsPct } = useCountUp(carbsPct, { duration: 1500, delay: 125 });
  const { value: dispFatPct } = useCountUp(fatPct, { duration: 1500, delay: 200 });

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {renderBackgroundRing(radii.protein)}
          {renderBackgroundRing(radii.carbs)}
          {renderBackgroundRing(radii.fat)}

          {renderRing('protein', animProgress.protein, COLORS.protein, radii.protein)}
          {renderRing('carbs', animProgress.carbs, COLORS.carbs, radii.carbs)}
          {renderRing('fat', animProgress.fat, COLORS.fat, radii.fat)}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-800">{displayedCalories}</span>
          <span className="text-xs text-gray-500">kcal</span>
          <span className="mt-1 text-xs text-gray-400">目标 {totalTargetCalories}</span>
        </div>
      </div>

      <div className="mt-6 grid w-full grid-cols-3 gap-4">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.protein }} />
            <span className="text-sm font-medium text-gray-700">蛋白质</span>
          </div>
          <span className="mt-1 text-lg font-bold" style={{ color: COLORS.protein }}>
            {dispProteinPct}%
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(protein.current)}/{Math.round(protein.target)}g
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.carbs }} />
            <span className="text-sm font-medium text-gray-700">碳水</span>
          </div>
          <span className="mt-1 text-lg font-bold" style={{ color: COLORS.carbs }}>
            {dispCarbsPct}%
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(carbs.current)}/{Math.round(carbs.target)}g
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.fat }} />
            <span className="text-sm font-medium text-gray-700">脂肪</span>
          </div>
          <span className="mt-1 text-lg font-bold" style={{ color: COLORS.fat }}>
            {dispFatPct}%
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(fat.current)}/{Math.round(fat.target)}g
          </span>
        </div>
      </div>
    </div>
  );
}
