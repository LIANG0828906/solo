import { useState, useEffect } from 'react';
import type { MealEntry } from '../../shared/types';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface MealCardProps {
  meal: MealEntry;
  index: number;
  onDelete: (id: string) => void;
}

export default function MealCard({ meal, index, onDelete }: MealCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const totalMacros = meal.protein + meal.carbs + meal.fat || 1;
  const proteinWidth = (meal.protein / totalMacros) * 100;
  const carbsWidth = (meal.carbs / totalMacros) * 100;
  const fatWidth = (meal.fat / totalMacros) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 300 + index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const handleDelete = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(meal.id);
    }, 300);
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: '12px',
        minWidth: '280px',
        maxWidth: '100%',
      }}
    >
      <div
        className="absolute inset-y-0 right-0 w-[60px] flex items-center justify-center cursor-pointer z-10"
        style={{
          backgroundColor: '#FF5252',
          borderRadius: '12px',
        }}
        onClick={handleDelete}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>

      <div
        className={cn(
          'bg-white shadow-sm p-4 relative cursor-default',
          'transition-transform duration-300 ease-out',
          'hover:shadow-md transition-shadow duration-300 ease-out',
        )}
        style={{
          borderRadius: '12px',
          transform: isHovered && !isDeleting
            ? 'translateX(-60px)'
            : isDeleting
              ? 'scale(0.8) translateX(-60px)'
              : 'translateX(0)',
          opacity: isDeleting ? 0 : 1,
          transition: isDeleting
            ? 'transform 300ms ease-out, opacity 300ms ease-out'
            : 'transform 300ms ease-out, box-shadow 300ms ease-out',
          animation: !hasAnimated ? `fadeInUp 300ms ease-out ${index * 80}ms both` : undefined,
        }}
        onMouseEnter={() => !isDeleting && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-3">
            <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">{meal.foodName}</h4>
            <p className="text-xs text-gray-400">
              {meal.quantity}克
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold" style={{ color: '#7CB342' }}>
              {meal.calories}
              <span className="text-xs font-normal ml-0.5 text-gray-400">kcal</span>
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-8 text-gray-400">蛋白</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${proteinWidth}%`, backgroundColor: '#FF6B9D' }}
              />
            </div>
            <span className="text-[10px] w-10 text-right font-medium" style={{ color: '#FF6B9D' }}>
              {meal.protein.toFixed(1)}g
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-8 text-gray-400">碳水</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${carbsWidth}%`, backgroundColor: '#FFB74D' }}
              />
            </div>
            <span className="text-[10px] w-10 text-right font-medium" style={{ color: '#FFB74D' }}>
              {meal.carbs.toFixed(1)}g
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-8 text-gray-400">脂肪</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${fatWidth}%`, backgroundColor: '#64B5F6' }}
              />
            </div>
            <span className="text-[10px] w-10 text-right font-medium" style={{ color: '#64B5F6' }}>
              {meal.fat.toFixed(1)}g
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
