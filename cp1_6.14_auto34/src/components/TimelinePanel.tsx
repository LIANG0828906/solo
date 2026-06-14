import React, { useState, useCallback, useRef } from 'react';
import { MapPin, Clock, GripVertical, Trash2 } from 'lucide-react';
import { DragPayload } from '@/types';
import { UseRouteStateReturn } from '@/hooks/useRouteState';

interface TimelinePanelProps {
  routeState: UseRouteStateReturn;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({ routeState }) => {
  const {
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
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1);
  const [draggedItem, setDraggedItem] = useState<DragPayload | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const dragCounterRef = useRef(0);

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

  const parseDragPayload = (e: React.DragEvent): DragPayload | null => {
    const raw = e.dataTransfer.getData('application/travel-node');
    if (raw) {
      try {
        return JSON.parse(raw) as DragPayload;
      } catch {
        return null;
      }
    }
    const plainNodeId = e.dataTransfer.getData('text/plain');
    if (plainNodeId) {
      return { type: 'canvas-node', nodeId: plainNodeId };
    }
    return null;
  };

  const handleDragEnter = useCallback((e: React.DragEvent, dayNumber: number) => {
    e.preventDefault();
    dragCounterRef.current++;
    setDragOverDay(dayNumber);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayNumber: number, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(dayNumber);
    if (index !== undefined) {
      setDragOverIndex(index);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragOverDay(null);
      setDragOverIndex(-1);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dayNumber: number, targetIndex?: number) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragOverDay(null);
      setDragOverIndex(-1);

      const payload = parseDragPayload(e);

      if (payload) {
        if (payload.type === 'canvas-node') {
          assignNodeToDay(payload.nodeId, dayNumber, targetIndex);
          setTimeout(() => updateConnectionHighlight(), 50);
          return;
        }

        if (payload.type === 'timeline-item' && payload.sourceDayNumber !== undefined && payload.sourceIndex !== undefined) {
          if (payload.sourceDayNumber === dayNumber) {
            const toIdx = targetIndex !== undefined ? targetIndex : itineraries.find(i => i.dayNumber === dayNumber)?.nodeIds.length || 0;
            if (payload.sourceIndex !== toIdx) {
              reorderNodesInDay(dayNumber, payload.sourceIndex, toIdx);
              setTimeout(() => updateConnectionHighlight(), 50);
            }
          } else {
            assignNodeToDay(payload.nodeId, dayNumber, targetIndex);
            setTimeout(() => updateConnectionHighlight(), 50);
          }
          return;
        }
      }

      if (draggedItem) {
        if (draggedItem.type === 'timeline-item' && draggedItem.sourceDayNumber !== undefined && draggedItem.sourceIndex !== undefined) {
          if (draggedItem.sourceDayNumber === dayNumber) {
            const toIdx = targetIndex !== undefined ? targetIndex : itineraries.find(i => i.dayNumber === dayNumber)?.nodeIds.length || 0;
            if (draggedItem.sourceIndex !== toIdx) {
              reorderNodesInDay(dayNumber, draggedItem.sourceIndex, toIdx);
              setTimeout(() => updateConnectionHighlight(), 50);
            }
          } else {
            assignNodeToDay(draggedItem.nodeId, dayNumber, targetIndex);
            setTimeout(() => updateConnectionHighlight(), 50);
          }
        } else {
          assignNodeToDay(draggedItem.nodeId, dayNumber, targetIndex);
          setTimeout(() => updateConnectionHighlight(), 50);
        }
        setDraggedItem(null);
      }
    },
    [draggedItem, assignNodeToDay, reorderNodesInDay, updateConnectionHighlight, itineraries]
  );

  const handleItemDragStart = useCallback(
    (e: React.DragEvent, dayNumber: number, index: number) => {
      e.stopPropagation();
      const itinerary = itineraries.find((i) => i.dayNumber === dayNumber);
      if (!itinerary) return;
      const nodeId = itinerary.nodeIds[index];
      const payload: DragPayload = {
        type: 'timeline-item',
        nodeId,
        sourceDayNumber: dayNumber,
        sourceIndex: index,
      };
      e.dataTransfer.setData('application/travel-node', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
      setDraggedItem(payload);
    },
    [itineraries]
  );

  const handleItemDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverDay(null);
    setDragOverIndex(-1);
    dragCounterRef.current = 0;
  }, []);

  const handleRemoveNode = useCallback(
    (nodeId: string, dayNumber: number) => {
      removeNodeFromDay(nodeId, dayNumber);
      setTimeout(() => updateConnectionHighlight(), 50);
    },
    [removeNodeFromDay, updateConnectionHighlight]
  );

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2] border-l border-[#E8DCC4]">
      <div className="p-4 border-b border-[#E8DCC4] bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] flex-shrink-0">
        <h2 className="text-lg font-semibold text-[#4A3728]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          行程时间轴
        </h2>
        <p className="text-xs text-[#8B7355] mt-1">拖拽画布节点到日期槽位中</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {itineraries.map((itinerary, idx) => {
          const dayNodes = itinerary.nodeIds
            .map((id) => getNodeById(id))
            .filter((n): n is NonNullable<typeof n> => n !== undefined);
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
              style={{
                animation: `slideInDay 0.3s ease-out ${idx * 50}ms both`,
              }}
              onDragEnter={(e) => handleDragEnter(e, itinerary.dayNumber)}
              onDragOver={(e) => handleDragOver(e, itinerary.dayNumber)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, itinerary.dayNumber)}
            >
              <div
                className={`relative rounded-xl overflow-hidden transition-all duration-200 border-2 ${
                  isDragOver
                    ? 'border-[#6B7F5E] shadow-lg scale-[1.01]'
                    : 'border-transparent'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${itinerary.gradientStart}15 0%, ${itinerary.gradientEnd}08 100%)`,
                }}
              >
                <div
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => setActiveDay(isActive ? 0 : itinerary.dayNumber)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
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

                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: isActive ? `${dayNodes.length * 60 + 80}px` : '0px',
                    opacity: isActive ? 1 : 0,
                  }}
                >
                  <div className="px-3 pb-3 space-y-1">
                    {dayNodes.length === 0 && (
                      <div
                        className={`h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition-all ${
                          isDragOver
                            ? 'border-[#6B7F5E] bg-[#6B7F5E]/10 text-[#6B7F5E] scale-105'
                            : 'border-[#E8DCC4] text-[#A08060]'
                        }`}
                      >
                        {isDragOver ? '松开添加到此日期' : '拖拽地点节点到这里'}
                      </div>
                    )}

                    {dayNodes.map((node, index) => {
                      const isItemDragOver = dragOverDay === itinerary.dayNumber && dragOverIndex === index;

                      return (
                        <React.Fragment key={node.id}>
                          {isItemDragOver && (
                            <div
                              className="h-10 border-2 border-dashed rounded-lg transition-all"
                              style={{ borderColor: itinerary.gradientStart + '80' }}
                            />
                          )}
                          <div
                            draggable
                            onDragStart={(e) => handleItemDragStart(e, itinerary.dayNumber, index)}
                            onDragEnd={handleItemDragEnd}
                            onDragOver={(e) => handleDragOver(e, itinerary.dayNumber, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => { e.stopPropagation(); handleDrop(e, itinerary.dayNumber, index); }}
                            className="group bg-white rounded-lg p-2 shadow-sm border border-[#E8DCC4] flex items-center gap-2 cursor-move hover:shadow-md hover:border-[#6B7F5E]/30 transition-all"
                          >
                            <GripVertical size={14} className="text-[#A08060] flex-shrink-0 opacity-50 group-hover:opacity-100" />
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
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-500 transition-all flex-shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </React.Fragment>
                      );
                    })}

                    {dragOverDay === itinerary.dayNumber && dragOverIndex >= dayNodes.length && dayNodes.length > 0 && (
                      <div
                        className="h-10 border-2 border-dashed rounded-lg transition-all"
                        style={{ borderColor: itinerary.gradientStart + '80' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
