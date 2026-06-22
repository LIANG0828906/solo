import React from 'react';
import { useAppContext } from '@/AppContext';
import { getCivilizationById } from '@/data/events';
import { Civilization } from '@/types';
import { cn } from '@/lib/utils';

interface OverlapInterval {
  start: number;
  end: number;
}

const ComparisonPanel: React.FC = () => {
  const { selectedCivilizationIds, toggleComparisonCivilization, clearComparisonCivilizations } = useAppContext();

  const selectedCivilizations = selectedCivilizationIds
    .map((id) => getCivilizationById(id))
    .filter((c): c is Civilization => c !== undefined);

  const getOverallTimeRange = () => {
    if (selectedCivilizations.length === 0) return { min: 0, max: 0 };
    const allStarts = selectedCivilizations.map((c) => c.startYear);
    const allEnds = selectedCivilizations.map((c) => c.endYear);
    return {
      min: Math.min(...allStarts),
      max: Math.max(...allEnds),
    };
  };

  const calculateOverlaps = (): OverlapInterval[] => {
    if (selectedCivilizations.length < 2) return [];
    
    const overlaps: OverlapInterval[] = [];
    
    for (let i = 0; i < selectedCivilizations.length; i++) {
      for (let j = i + 1; j < selectedCivilizations.length; j++) {
        const c1 = selectedCivilizations[i];
        const c2 = selectedCivilizations[j];
        const overlapStart = Math.max(c1.startYear, c2.startYear);
        const overlapEnd = Math.min(c1.endYear, c2.endYear);
        if (overlapStart < overlapEnd) {
          overlaps.push({ start: overlapStart, end: overlapEnd });
        }
      }
    }
    
    if (overlaps.length === 0) return [];
    
    overlaps.sort((a, b) => a.start - b.start);
    const merged: OverlapInterval[] = [overlaps[0]];
    for (let i = 1; i < overlaps.length; i++) {
      const current = overlaps[i];
      const last = merged[merged.length - 1];
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  };

  const overlaps = calculateOverlaps();
  const { min: globalMin, max: globalMax } = getOverallTimeRange();
  const timeRange = globalMax - globalMin;

  const yearToPosition = (year: number): number => {
    if (timeRange === 0) return 0;
    return ((year - globalMin) / timeRange) * 100;
  };

  const renderTimeline = (civilization: Civilization) => {
    const civStartPercent = yearToPosition(civilization.startYear);
    const civEndPercent = yearToPosition(civilization.endYear);
    const civWidth = civEndPercent - civStartPercent;

    return (
      <div className="relative w-full h-10 bg-slate-900 rounded-lg overflow-hidden">
        <div
          className="absolute top-0 h-full transition-all duration-300 ease-out"
          style={{
            left: `${civStartPercent}%`,
            width: `${civWidth}%`,
            backgroundColor: civilization.color,
            opacity: 0.8,
          }}
        />
        
        {overlaps.map((overlap, index) => {
          const overlapStart = Math.max(overlap.start, civilization.startYear);
          const overlapEnd = Math.min(overlap.end, civilization.endYear);
          if (overlapStart >= overlapEnd) return null;
          
          const overlapStartPercent = yearToPosition(overlapStart);
          const overlapEndPercent = yearToPosition(overlapEnd);
          const overlapWidth = overlapEndPercent - overlapStartPercent;
          
          return (
            <div
              key={index}
              className="absolute top-0 h-full transition-all duration-300 ease-out"
              style={{
                left: `${overlapStartPercent}%`,
                width: `${overlapWidth}%`,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderLeft: '1px dashed #3B82F6',
                borderRight: '1px dashed #3B82F6',
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 transition-all duration-300 ease-out'
      )}
      style={{ backgroundColor: '#1A1F2E' }}
    >
      {selectedCivilizations.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          点击时间轴上的文明区块进行添加（最多3个）
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-sm font-bold">文明对比</h3>
            <button
              onClick={clearComparisonCivilizations}
              className="text-gray-400 hover:text-white text-xs px-3 py-1 rounded-md hover:bg-slate-700 transition-all duration-300 ease-out"
            >
              清空
            </button>
          </div>
          
          <div className="flex gap-4">
            {selectedCivilizations.map((civilization) => (
              <div
                key={civilization.id}
                className={cn(
                  'rounded-xl p-3 flex flex-col transition-all duration-300 ease-out'
                )}
                style={{
                  width: '30%',
                  backgroundColor: '#1F2937',
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-full"
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: civilization.color,
                      }}
                    />
                    <span className="text-white font-bold" style={{ fontSize: '13px' }}>
                      {civilization.name}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleComparisonCivilization(civilization.id)}
                    className="text-gray-400 hover:text-white text-lg leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-slate-600 transition-all duration-300 ease-out"
                  >
                    ×
                  </button>
                </div>
                
                {renderTimeline(civilization)}
                
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>
                    {civilization.startYear < 0
                      ? `${Math.abs(civilization.startYear)}BC`
                      : `${civilization.startYear}AD`}
                  </span>
                  <span>
                    {civilization.endYear < 0
                      ? `${Math.abs(civilization.endYear)}BC`
                      : `${civilization.endYear}AD`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ComparisonPanel;
