import React, { useMemo, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useLearningStore } from '@/store/useLearningStore';
import UnitCard from './UnitCard';

const PathGenerator: React.FC = () => {
  const { units, isGenerating, isAdjusting } = useLearningStore();

  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => a.order - b.order);
  }, [units]);

  const unitCardList = useMemo(() => {
    return sortedUnits.map((unit, index) => ({
      unit,
      index,
      isLast: index === sortedUnits.length - 1,
    }));
  }, [sortedUnits]);

  const renderUnitCard = useCallback(
    ({ unit, index, isLast }: { unit: typeof sortedUnits[0]; index: number; isLast: boolean }) => (
      <UnitCard key={unit.id} unit={unit} index={index} isLast={isLast} />
    ),
    []
  );

  if (units.length === 0 && !isGenerating) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20"
        style={{
          animation: 'fadeIn 0.5s ease',
        }}
      >
        <Sparkles className="w-16 h-16 text-orange-400 mb-4" />
        <h3
          className="text-xl font-bold mb-2"
          style={{ color: '#1a365d' }}
        >
          选择学科和水平，开始生成学习路径
        </h3>
        <p className="text-gray-500">
          点击生成按钮，系统将为您智能规划个性化学习路径
        </p>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-lg font-medium" style={{ color: '#1a365d' }}>
          正在生成学习路径...
        </p>
        <p className="text-gray-500 mt-2">
          正在为您智能编排学习单元
        </p>
      </div>
    );
  }

  return (
    <div
      className={`
        relative w-full overflow-x-auto py-8 px-4
        transition-opacity duration-300
        ${isAdjusting ? 'opacity-60' : 'opacity-100'}
      `}
    >
      <div className="timeline-container flex items-start justify-center gap-2 min-w-max md:flex-row flex-col md:items-start items-center">
        {unitCardList.map(renderUnitCard)}
      </div>

      {isAdjusting && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
          <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
          <span className="text-sm text-gray-600">正在调整路径...</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(PathGenerator);
