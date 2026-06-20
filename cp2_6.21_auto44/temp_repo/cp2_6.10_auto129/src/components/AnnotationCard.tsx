import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnnotationCardProps {
  position: number;
  type: string;
  suggestion: string;
  className?: string;
}

export default function AnnotationCard({ position, type, suggestion, className }: AnnotationCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl shadow-md transition-opacity duration-300',
        isFading ? 'opacity-0' : 'opacity-100',
        className
      )}
      style={{
        backgroundColor: '#faf0e6',
        borderRadius: '12px',
        boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="text-sm font-medium text-gray-800">
        位置 {position}：{type}
      </div>
      <div className="text-sm text-gray-600 mt-1">
        推荐修正：<span className="font-semibold text-amber-700">{suggestion}</span>
      </div>
    </div>
  );
}
