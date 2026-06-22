import { ReactNode } from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color?: string;
  duration?: number;
}

const colorGradients: Record<string, string> = {
  blue: 'from-blue-400 to-blue-600',
  green: 'from-green-400 to-green-600',
  purple: 'from-purple-400 to-purple-600',
  orange: 'from-orange-400 to-orange-600',
  pink: 'from-pink-400 to-pink-600',
  red: 'from-red-400 to-red-600',
  indigo: 'from-indigo-400 to-indigo-600',
  cyan: 'from-cyan-400 to-cyan-600',
};

export default function StatCard({
  title,
  value,
  icon,
  color = 'blue',
  duration = 1500,
}: StatCardProps) {
  const { value: animatedValue } = useCountUp({ end: value, duration });
  const gradientClass = colorGradients[color] || colorGradients.blue;

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg bg-white p-6 shadow-sm',
        'transition-all duration-300 ease-in-out',
        'hover:-translate-y-0.5 hover:shadow-md'
      )}
      style={{ borderRadius: '8px' }}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-white',
          gradientClass
        )}
      >
        <div className="h-7 w-7">{icon}</div>
      </div>

      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">
          {animatedValue.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
