import { MapPin, Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export const EmptyState = ({ onCreateClick }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
        <MapPin className="w-12 h-12 text-primary-500" />
      </div>
      <h3 className="text-2xl font-bold text-warm-800 mb-3">
        还没有旅行计划
      </h3>
      <p className="text-warm-500 mb-8 max-w-md">
        开始规划您的下一次冒险吧！创建旅行计划，添加每日行程，在地图上标注目的地。
      </p>
      <button
        onClick={onCreateClick}
        className="btn-primary inline-flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        创建第一个旅行
      </button>
    </div>
  );
};
