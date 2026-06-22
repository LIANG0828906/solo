import { useRef } from 'react';
import { solarTerms } from '@/data/regionData';
import { useAppStore } from '@/store/appStore';
import type { SolarTerm } from '@/types';
import { cn } from '@/lib/utils';

const specialTerms: Record<string, string> = {
  chunfen: '🌱',
  xiazhi: '☀️',
  qiufen: '🍂',
  dongzhi: '❄️',
};

export default function Timeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const currentSolarTerm = useAppStore((state) => state.currentSolarTerm);
  const setCurrentSolarTerm = useAppStore((state) => state.setCurrentSolarTerm);

  const handleTermClick = (term: SolarTerm) => {
    setCurrentSolarTerm(term.id);

    const scrollContainer = scrollRef.current;
    const nodeElement = nodeRefs.current.get(term.id);

    if (scrollContainer && nodeElement) {
      const containerWidth = scrollContainer.clientWidth;
      const nodeLeft = nodeElement.offsetLeft;
      const nodeWidth = nodeElement.offsetWidth;
      const scrollLeft = nodeLeft - containerWidth / 2 + nodeWidth / 2;

      scrollContainer.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  };

  const getTermIcon = (term: SolarTerm) => {
    return specialTerms[term.id] || term.icon;
  };

  return (
    <div
      className={cn(
        'sidebar-panel w-[30%] h-full flex flex-col overflow-hidden',
        'md:relative md:w-[30%] md:h-full'
      )}
      style={{
        backgroundColor: '#fef9ef',
        borderRight: '1px solid rgba(93, 64, 55, 0.1)',
      }}
    >
      <div className="px-6 py-4 border-b border-[rgba(93,64,55,0.1)]">
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: 'serif', color: '#5d4037' }}
        >
          二十四节气
        </h2>
        <p className="text-xs text-gray-500 mt-1">点击节气查看当季风物</p>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          'flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar',
          'snap-x snap-mandatory',
          'px-6 py-5'
        )}
        style={{ padding: '20px 24px' }}
      >
        <div className="flex items-center gap-8 min-w-max pb-4">
          {solarTerms.map((term, index) => {
            const isSelected = currentSolarTerm === term.id;
            return (
              <div
                key={term.id}
                ref={(el) => {
                  if (el) {
                    nodeRefs.current.set(term.id, el);
                  }
                }}
                className="flex flex-col items-center cursor-pointer snap-start"
                onClick={() => handleTermClick(term)}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full',
                    'transition-all duration-300 ease-out',
                    'hover:scale-105'
                  )}
                  style={{
                    width: '48px',
                    height: '48px',
                    background: term.color,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: isSelected ? '3px solid #ff6b35' : '2px solid transparent',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>
                    {getTermIcon(term)}
                  </span>
                </div>

                <div className="mt-3 flex flex-col items-center gap-1">
                  <span
                    className="transition-colors duration-300 ease-out"
                    style={{
                      fontFamily: 'serif',
                      fontWeight: 600,
                      color: isSelected ? '#ff6b35' : '#5d4037',
                      fontSize: '14px',
                    }}
                  >
                    {term.name}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {term.month}月
                  </span>
                </div>

                {index < solarTerms.length - 1 && (
                  <div
                    className="hidden md:block absolute"
                    style={{
                      left: '100%',
                      top: '24px',
                      width: '32px',
                      height: '2px',
                      backgroundColor: 'rgba(93, 64, 55, 0.15)',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
