import React, { useState, useCallback, useRef } from 'react';
import { Bookmark, X, GitCompare, Trash2, GripVertical } from 'lucide-react';
import type { GradientScheme } from '@/utils/history';
import { generateColorStops, formatTimestamp } from '@/utils/history';

interface CollectionPanelProps {
  collections: GradientScheme[];
  selectedForCompare: string[];
  isCompareMode: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onSelectForCompare: (id: string) => void;
  onToggleCompareMode: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onLoadScheme: (scheme: GradientScheme) => void;
}

const GradientThumbnail: React.FC<{ scheme: GradientScheme; className?: string; onClick?: () => void }> = ({
  scheme,
  className = '',
  onClick,
}) => {
  const stops = generateColorStops(scheme.startColor, scheme.endColor, scheme.steps);
  const style: React.CSSProperties = {
    background:
      scheme.gradientType === 'linear'
        ? `linear-gradient(${scheme.direction}deg, ${stops})`
        : scheme.gradientType === 'radial'
        ? `radial-gradient(circle, ${stops})`
        : `conic-gradient(from ${scheme.direction}deg, ${stops})`,
  };
  return <div className={`rounded-lg ${className}`} style={style} onClick={onClick} />;
};

const CompareView: React.FC<{
  left: GradientScheme;
  right: GradientScheme;
  onClose: () => void;
  leftScrollRef: React.RefObject<HTMLDivElement>;
  rightScrollRef: React.RefObject<HTMLDivElement>;
}> = ({ left, right, onClose, leftScrollRef, rightScrollRef }) => {
  const handleScroll = useCallback(
    (source: 'left' | 'right') => {
      const src = source === 'left' ? leftScrollRef.current : rightScrollRef.current;
      const target = source === 'left' ? rightScrollRef.current : leftScrollRef.current;
      if (src && target) {
        target.scrollTop = src.scrollTop;
      }
    },
    [leftScrollRef, rightScrollRef]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-10"
      >
        <X size={28} />
      </button>
      <div className="flex w-[90vw] max-w-5xl h-[80vh] gap-0">
        <div
          ref={leftScrollRef}
          onScroll={() => handleScroll('left')}
          className="flex-1 overflow-y-auto glass-card rounded-l-3xl p-6"
        >
          <h4 className="font-display font-semibold text-gray-800 mb-4">{left.name}</h4>
          <GradientThumbnail scheme={left} className="w-full aspect-[4/3] rounded-2xl mb-4" />
          <div className="space-y-2 text-sm text-gray-600 font-body">
            <p>起始: <span className="font-mono">{left.startColor}</span></p>
            <p>结束: <span className="font-mono">{left.endColor}</span></p>
            <p>类型: {left.gradientType === 'linear' ? '线性' : left.gradientType === 'radial' ? '径向' : '锥形'}</p>
            <p>角度: {left.direction}°</p>
            <p>步数: {left.steps}</p>
          </div>
        </div>
        <div className="w-0.5 bg-gradient-to-b from-brand-400/30 via-brand-500 to-violet-500/30 self-stretch" />
        <div
          ref={rightScrollRef}
          onScroll={() => handleScroll('right')}
          className="flex-1 overflow-y-auto glass-card rounded-r-3xl p-6"
        >
          <h4 className="font-display font-semibold text-gray-800 mb-4">{right.name}</h4>
          <GradientThumbnail scheme={right} className="w-full aspect-[4/3] rounded-2xl mb-4" />
          <div className="space-y-2 text-sm text-gray-600 font-body">
            <p>起始: <span className="font-mono">{right.startColor}</span></p>
            <p>结束: <span className="font-mono">{right.endColor}</span></p>
            <p>类型: {right.gradientType === 'linear' ? '线性' : right.gradientType === 'radial' ? '径向' : '锥形'}</p>
            <p>角度: {right.direction}°</p>
            <p>步数: {right.steps}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CollectionPanel: React.FC<CollectionPanelProps> = ({
  collections,
  selectedForCompare,
  isCompareMode,
  onToggle,
  onAdd,
  onRemove,
  onSelectForCompare,
  onToggleCompareMode,
  onReorder,
  onLoadScheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null!);
  const rightScrollRef = useRef<HTMLDivElement>(null!);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
    onToggle();
  }, [onToggle]);

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      onReorder(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  }, [onReorder]);

  const comparedSchemes = collections.filter((c) => selectedForCompare.includes(c.id));
  const canCompare = selectedForCompare.length === 2;

  return (
    <>
      <button
        onClick={togglePanel}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 btn-gradient rounded-full w-10 h-10 flex items-center justify-center shadow-lg animate-glow"
        title="收藏面板"
      >
        <Bookmark size={18} />
      </button>

      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-[320px] z-40 glass-card rounded-l-2xl shadow-2xl animate-slide-in-right flex flex-col">
          <div className="p-4 border-b border-gray-200/30 flex items-center justify-between">
            <h3 className="font-display font-semibold text-gray-800 text-base flex items-center gap-2">
              <Bookmark size={16} className="text-brand-500" />
              收藏方案
            </h3>
            <button onClick={togglePanel} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-3 border-b border-gray-200/30 flex gap-2">
            <button onClick={onAdd} className="btn-gradient text-xs flex-1 py-2">
              + 收藏当前方案
            </button>
            <button
              onClick={onToggleCompareMode}
              disabled={!canCompare}
              className={`text-xs px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1 ${
                canCompare
                  ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 interactive-element'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <GitCompare size={14} />
              对比
            </button>
          </div>

          {selectedForCompare.length > 0 && (
            <div className="px-3 py-2 bg-brand-50/50 text-xs text-brand-600 font-medium">
              已选择 {selectedForCompare.length}/2 个方案进行对比
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {collections.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bookmark size={32} className="mx-auto mb-3 opacity-40" />
                <p className="font-body text-sm">还没有收藏方案</p>
                <p className="text-xs mt-1">点击"收藏当前方案"开始收藏</p>
              </div>
            ) : (
              collections.map((scheme, index) => (
                <div
                  key={scheme.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`glass-card rounded-xl p-3 cursor-grab active:cursor-grabbing group transition-all duration-200 ${
                    selectedForCompare.includes(scheme.id)
                      ? 'ring-2 ring-brand-400 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-300 group-hover:text-gray-500 transition-colors">
                      <GripVertical size={14} />
                    </div>
                    <GradientThumbnail
                      scheme={scheme}
                      className="w-16 h-8 shrink-0 cursor-pointer"
                      onClick={() => onLoadScheme(scheme)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{scheme.name}</p>
                      <p className="text-xs text-gray-400">{formatTimestamp(scheme.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSelectForCompare(scheme.id)}
                        className={`p-1 rounded-md transition-colors ${
                          selectedForCompare.includes(scheme.id)
                            ? 'bg-brand-100 text-brand-600'
                            : 'hover:bg-gray-100 text-gray-400'
                        }`}
                        title="选择对比"
                      >
                        <GitCompare size={12} />
                      </button>
                      <button
                        onClick={() => onRemove(scheme.id)}
                        className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isCompareMode && comparedSchemes.length === 2 && (
        <CompareView
          left={comparedSchemes[0]}
          right={comparedSchemes[1]}
          onClose={onToggleCompareMode}
          leftScrollRef={leftScrollRef}
          rightScrollRef={rightScrollRef}
        />
      )}
    </>
  );
};

export default CollectionPanel;
