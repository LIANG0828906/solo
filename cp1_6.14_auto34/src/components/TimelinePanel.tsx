import React, { useState, useCallback } from 'react';
import { MapPin, Clock, GripVertical, Trash2 } from 'lucide-react';
import { UseRouteStateReturn } from '@/hooks/useRouteState';

interface TimelinePanelProps {
  routeState: UseRouteStateReturn;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({ routeState }) => {
  const {
    nodes,
    itineraries,
    getNodeById,
    assignNodeToDay,
    removeNodeFromDay,
    reorderNodesInDay,
    calculateDayDistance,
    calculateDayDuration,
    updateConnectionHighlight,
  } = routeState;

  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ dayNumber: number; index: number } | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1);

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    }
    return `${minutes}分钟`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const handleDragOver = useCallback((e: React.DragEvent, dayNumber: number, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(dayNumber);
    if (index !== undefined) {
      setDragOverIndex(index);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDay(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dayNumber: number, targetIndex?: number) => {
      e.preventDefault();
      setDragOverDay(null);
      setDragOverIndex(null);

      const nodeId = e.dataTransfer.getData('nodeId');
      if (nodeId) {
        assignNodeToDay(nodeId, dayNumber, targetIndex);
        setTimeout(() => updateConnectionHighlight(), 50);
        return;
      }

      if (draggedItem) {
        const { dayNumber: fromDay, index: fromIndex } = draggedItem;
        if (fromDay === dayNumber) {
          const toIndex = targetIndex !== undefined ? targetIndex : itineraries.find(i => i.dayNumber === dayNumber)?.nodeIds.length || 0;
          if (fromIndex !== toIndex) {
            reorderNodesInDay(dayNumber, fromIndex, toIndex);
            setTimeout(() => updateConnectionHighlight(), 50);
          }
        } else {
          const nodeIdToMove = itineraries.find(i => i.dayNumber === fromDay)?.nodeIds[fromIndex];
          if (nodeIdToMove) {
            assignNodeToDay(nodeIdToMove, dayNumber, targetIndex);
            setTimeout(() => updateConnectionHighlight(), 50);
          }
        }
        setDraggedItem(null);
      }
    },
    [draggedItem, assignNodeToDay, reorderNodesInDay, updateConnectionHighlight, itineraries]
  );

  const handleItemDragStart = useCallback(
    (e: React.DragEvent, dayNumber: number, index: number) => {
      e.dataTransfer.effectAllowed = 'move';
      setDraggedItem({ dayNumber, index });
      const itinerary = itineraries.find((i) => i.dayNumber === dayNumber);
      if (itinerary) {
        const nodeId = itinerary.nodeIds[index];
        e.dataTransfer.setData('nodeId', nodeId);
      }
    },
    [itineraries]
  );

  const handleRemoveNode = useCallback(
    (nodeId: string, dayNumber: number) => {
      removeNodeFromDay(nodeId, dayNumber);
      setTimeout(() => updateConnectionHighlight(), 50);
    },
    [removeNodeFromDay, updateConnectionHighlight]
  );

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2] border-l border-[#E8DCC4]">
      <div className="p-4 border-b border-[#E8DCC4] bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8]">
        <h2 className="text-lg font-semibold text-[#4A3728]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          行程时间轴
        </h2>
        <p className="text-xs text-[#8B7355] mt-1">拖拽画布节点到日期槽位中</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {itineraries.map((itinerary, idx) => {
          const dayNodes = itinerary.nodeIds
            .map((id) => getNodeById(id))
            .filter((n) => n !== undefined);
          const distance = calculateDayDistance(itinerary.dayNumber);
          const duration = calculateDayDuration(itinerary.dayNumber);
          const isActive = activeDay === itinerary.dayNumber;
          const isDragOver = dragOverDay === itinerary.dayNumber;

          return (
            <div
              key={itinerary.dayNumber}
              className={`transition-all duration-300 ease-out ${
                isActive ? 'opacity-100 translate-y-0' : 'opacity-90'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div
                className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                  isDragOver ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{
                  background: `linear-gradient(135deg, ${itinerary.gradientStart}15 0%, ${itinerary.gradientEnd}08 100%)`,
                  ringColor: itinerary.gradientStart,
                }}
                onDragOver={(e) => handleDragOver(e, itinerary.dayNumber)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, itinerary.dayNumber)}
              >
                <div
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => setActiveDay(isActive ? 0 : itinerary.dayNumber)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: itinerary.gradientStart }}
                      >
                        {itinerary.dayNumber}
                      </div>
                      <div>
                        <div className="font-medium text-[#4A3728] text-sm">
                          第 {itinerary.dayNumber} 天
                        </div>
                        <div className="text-xs text-[#8B7355]">
                          {dayNodes.length} 个景点
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6B7F5E]">
                      {distance > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {formatDistance(distance)}
                        </span>
                      )}
                      {duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDuration(duration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isActive && (
                  <div className="px-3 pb-3 space-y-2">
                    {dayNodes.length === 0 && (
                      <div
                        className={`h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition-all ${
                          isDragOver
                            ? 'border-[#6B7F5E] bg-[#6B7F5E]/10 text-[#6B7F5E]'
                            : 'border-[#E8DCC4] text-[#A08060]'
                        }`}
                      >
                        {isDragOver ? '松开添加到此日期' : '拖拽地点节点到这里'}
                      </div>
                    )}

                    {dayNodes.map((node, index) => {
                      if (!node) return null;
                      const isItemDragOver = dragOverDay === itinerary.dayNumber && dragOverIndex === index;

                      return (
                        <React.Fragment key={node.id}>
                          {isItemDragOver && (
                            <div
                              className="h-12 border-2 border-dashed rounded-lg"
                              style={{ borderColor: itinerary.gradientStart }}
                            />
                          )}
                          <div
                            draggable
                            onDragStart={(e) => handleItemDragStart(e, itinerary.dayNumber, index)}
                            onDragOver={(e) => handleDragOver(e, itinerary.dayNumber, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, itinerary.dayNumber, index)}
                            className="group bg-white rounded-lg p-2 shadow-sm border border-[#E8DCC4] flex items-center gap-2 cursor-move hover:shadow-md transition-all"
                          >
                            <GripVertical size={14} className="text-[#A08060] flex-shrink-0" />
                            <div
                              className="w-2 h-8 rounded-full flex-shrink-0"
                              style={{ backgroundColor: itinerary.gradientStart }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-[#4A3728] text-sm truncate">
                                {node.name}
                              </div>
                              <div className="text-xs text-[#8B7355] flex items-center gap-1">
                                <Clock size={10} />
                                {formatDuration(node.estimatedDuration)}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveNode(node.id, itinerary.dayNumber);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </React.Fragment>
                      );
                    })}

                    {dragOverDay === itinerary.dayNumber && dragOverIndex === dayNodes.length && dayNodes.length > 0 && (
                      <div
                        className="h-12 border-2 border-dashed rounded-lg"
                        style={{ borderColor: itinerary.gradientStart }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
