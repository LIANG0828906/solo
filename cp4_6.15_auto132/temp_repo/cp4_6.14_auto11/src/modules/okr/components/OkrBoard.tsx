import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Pencil, Plus, Trash2, ArrowRight, Link2Off } from 'lucide-react';
import KeyResultCard from './KeyResultCard';
import { useOkrStore } from '@/store/useOkrStore';
import type { Objective, KeyResult, Dependency } from '@/types';
import { getProgressInfo, getColorForPercentage } from '@/modules/okr/utils/progressCalculator';

interface LineCoords {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function ObjectiveCard({
  objective,
  keyResults,
  isEditing,
  editTitle,
  setEditTitle,
  onTitleSave,
  onStartEdit,
  onDelete,
  onAddKR,
  isDragSource,
  activeId,
  avgProgress,
}: {
  objective: Objective;
  keyResults: KeyResult[];
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (v: string) => void;
  onTitleSave: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onAddKR: () => void;
  isDragSource: boolean;
  activeId: string | null;
  avgProgress: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `obj-${objective.id}`,
    data: { objectiveId: objective.id },
  });
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `drop-${objective.id}`,
    data: { objectiveId: objective.id },
  });

  const progressColor = getColorForPercentage(avgProgress);
  const isHighlighted = isOver && activeId && activeId !== `obj-${objective.id}`;

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        setDropRef(el);
      }}
      data-obj-id={objective.id}
      className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
        isDragging ? 'opacity-50' : ''
      } ${isHighlighted ? 'ring-2 ring-teal-400 border-teal-300 shadow-md' : 'border-gray-100'}`}
    >
      <div
        className="h-1 transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: progressColor }}
      />
      <div className="p-4">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-50 flex-shrink-0"
            title="拖拽到其他目标建立依赖"
          >
            <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                autoFocus
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={onTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onTitleSave();
                  if (e.key === 'Escape') onTitleSave();
                }}
                className="w-full text-[15px] font-bold text-gray-800 bg-transparent border-b-2 border-teal-500 focus:outline-none pb-0.5"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              />
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <h3
                  className="text-[15px] font-bold text-gray-800 truncate cursor-text"
                  onClick={onStartEdit}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {objective.title}
                </h3>
                <button
                  onClick={onStartEdit}
                  className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100"
                >
                  <Pencil className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${avgProgress}%`,
                    backgroundColor: progressColor,
                    transition: 'width 1000ms ease-in-out, background-color 1000ms ease-in-out',
                  }}
                />
              </div>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{
                  color: progressColor,
                  transition: 'color 1000ms ease-in-out',
                }}
              >
                {avgProgress}%
              </span>
            </div>
          </div>

          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {keyResults.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {keyResults.map((kr) => (
              <KeyResultCard key={kr.id} kr={kr} />
            ))}
          </div>
        )}

        <button
          onClick={onAddKR}
          className="mt-4 w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-[12px] text-gray-400 hover:border-teal-300 hover:text-teal-500 hover:bg-teal-50/30 transition-all flex items-center justify-center gap-1.5"
          disabled={keyResults.length >= 5}
          style={keyResults.length >= 5 ? { cursor: 'not-allowed', opacity: 0.5 } : undefined}
        >
          <Plus className="w-3.5 h-3.5" />
          {keyResults.length >= 5 ? '已达上限（最多5个）' : '添加关键成果'}
        </button>

        {isDragSource && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: '#0d9488' }}
          >
            拖拽源
          </div>
        )}
      </div>
    </div>
  );
}

export default function OkrBoard() {
  const { quarterId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const quarters = useOkrStore((s) => s.quarters);
  const allObjectives = useOkrStore((s) => s.objectives);
  const allKeyResults = useOkrStore((s) => s.keyResults);
  const allDependencies = useOkrStore((s) => s.dependencies);
  const selectedDependencyId = useOkrStore((s) => s.selectedDependencyId);
  const setSelectedDependencyId = useOkrStore((s) => s.setSelectedDependencyId);
  const addObjective = useOkrStore((s) => s.addObjective);
  const updateObjective = useOkrStore((s) => s.updateObjective);
  const deleteObjective = useOkrStore((s) => s.deleteObjective);
  const addKeyResult = useOkrStore((s) => s.addKeyResult);
  const addDependency = useOkrStore((s) => s.addDependency);
  const removeDependency = useOkrStore((s) => s.removeDependency);

  const [editingObjId, setEditingObjId] = useState<string | null>(null);
  const [editObjTitle, setEditObjTitle] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [lineCoords, setLineCoords] = useState<LineCoords[]>([]);
  const [showAddKRModal, setShowAddKRModal] = useState<string | null>(null);
  const [newKRTitle, setNewKRTitle] = useState('');
  const [newKRType, setNewKRType] = useState<'numeric' | 'boolean' | 'percentage'>('numeric');
  const [newKRTarget, setNewKRTarget] = useState('100');
  const [newKRInitial, setNewKRInitial] = useState('0');
  const [newKRAssignee, setNewKRAssignee] = useState('');

  const currentQuarterId = quarterId || quarters[0]?.id;
  const currentQuarter = quarters.find((q) => q.id === currentQuarterId);
  const objectives = useMemo(
    () =>
      allObjectives
        .filter((o) => o.quarterId === currentQuarterId)
        .sort((a, b) => a.order - b.order),
    [allObjectives, currentQuarterId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const objectiveMap = useMemo(() => {
    const map = new Map<string, Objective>();
    allObjectives.forEach((o) => map.set(o.id, o));
    return map;
  }, [allObjectives]);

  const krsByObjective = useMemo(() => {
    const map = new Map<string, KeyResult[]>();
    allKeyResults.forEach((kr) => {
      const arr = map.get(kr.objectiveId) || [];
      arr.push(kr);
      map.set(kr.objectiveId, arr);
    });
    return map;
  }, [allKeyResults]);

  const avgProgressMap = useMemo(() => {
    const map = new Map<string, number>();
    objectives.forEach((obj) => {
      const krs = krsByObjective.get(obj.id) || [];
      if (krs.length === 0) {
        map.set(obj.id, 0);
        return;
      }
      let total = 0;
      krs.forEach((kr) => {
        const p = getProgressInfo(kr.type, kr.initialValue, kr.targetValue, kr.currentValue);
        total += p.percentage;
      });
      map.set(obj.id, Math.round(total / krs.length));
    });
    return map;
  }, [objectives, krsByObjective]);

  const dependencies = useMemo(
    () =>
      allDependencies.filter(
        (d) => objectiveMap.has(d.sourceId) && objectiveMap.has(d.targetId)
      ),
    [allDependencies, objectiveMap]
  );

  const lastLineCoordsRef = useRef<string>('');

  useEffect(() => {
    function updateLines() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const coords: LineCoords[] = dependencies.map((dep) => {
        const srcEl = containerRef.current!.querySelector(`[data-obj-id="${dep.sourceId}"]`);
        const tgtEl = containerRef.current!.querySelector(`[data-obj-id="${dep.targetId}"]`);
        if (!srcEl || !tgtEl) return { id: dep.id, x1: 0, y1: 0, x2: 0, y2: 0 };
        const srcRect = srcEl.getBoundingClientRect();
        const tgtRect = tgtEl.getBoundingClientRect();
        return {
          id: dep.id,
          x1: srcRect.right - rect.left,
          y1: srcRect.top + srcRect.height / 2 - rect.top,
          x2: tgtRect.left - rect.left,
          y2: tgtRect.top + tgtRect.height / 2 - rect.top,
        };
      });
      const sig = JSON.stringify(coords);
      if (sig !== lastLineCoordsRef.current) {
        lastLineCoordsRef.current = sig;
        setLineCoords(coords);
      }
    }
    updateLines();
    window.addEventListener('resize', updateLines);
    const t = setTimeout(updateLines, 150);
    return () => {
      window.removeEventListener('resize', updateLines);
      clearTimeout(t);
    };
  }, [dependencies]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveDragId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const activeId = String(event.active.id).replace('obj-', '');
    const overId = event.over ? String(event.over.id).replace('drop-', '') : null;
    if (activeId && overId && activeId !== overId) {
      const exists = dependencies.some(
        (d) =>
          (d.sourceId === activeId && d.targetId === overId) ||
          (d.sourceId === overId && d.targetId === activeId)
      );
      if (!exists) {
        const newDep: Dependency = {
          id: `dep-${Date.now()}`,
          sourceId: activeId,
          targetId: overId,
          threshold: 60,
        };
        addDependency(newDep);
      }
    }
  };

  const handleAddObjective = () => {
    if (!currentQuarterId) return;
    const newObj: Objective = {
      id: `obj-${Date.now()}`,
      quarterId: currentQuarterId,
      title: `新目标 ${objectives.length + 1}`,
      order: objectives.length,
      dependencyIds: [],
      dependencyThreshold: 60,
    };
    addObjective(newObj);
    setEditingObjId(newObj.id);
    setEditObjTitle(newObj.title);
  };

  const handleSaveTitle = (objId: string) => {
    if (editObjTitle.trim()) {
      updateObjective(objId, { title: editObjTitle.trim() });
    }
    setEditingObjId(null);
  };

  const handleAddKR = (objId: string) => {
    if (!newKRTitle.trim()) return;
    const targetNum = parseFloat(newKRTarget);
    const initialNum = parseFloat(newKRInitial);
    if (isNaN(targetNum) || isNaN(initialNum)) return;

    addKeyResult({
      id: `kr-${Date.now()}`,
      objectiveId: objId,
      title: newKRTitle.trim(),
      type: newKRType,
      initialValue: initialNum,
      targetValue: targetNum,
      currentValue: initialNum,
      assignee: newKRAssignee.trim() || '未分配',
    });

    setShowAddKRModal(null);
    setNewKRTitle('');
    setNewKRTarget('100');
    setNewKRInitial('0');
    setNewKRAssignee('');
  };

  const activeObjective = activeDragId
    ? allObjectives.find((o) => `obj-${o.id}` === activeDragId)
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2
              className="text-[22px] font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {currentQuarter?.name || '季度 OKR'}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">
              拖拽目标卡片到另一个目标上可建立依赖关系 · 点击连接线可选中/删除
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => currentQuarterId && navigate(`/report/${currentQuarterId}`)}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              查看复盘报告
            </button>
            <button
              onClick={handleAddObjective}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0d9488' }}
            >
              <Plus className="w-4 h-4" />
              新建目标
            </button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-6 py-6 relative"
          style={{ backgroundColor: '#fafafa' }}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
              setSelectedDependencyId(null);
            }
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
              </marker>
              <marker
                id="arrowhead-active"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#0d9488" />
              </marker>
            </defs>
            {lineCoords.map((line) => {
              const dep = dependencies.find((d) => d.id === line.id);
              if (!dep) return null;
              const isActive = selectedDependencyId === line.id;
              const dx = line.x2 - line.x1;
              const dy = line.y2 - line.y1;
              const cp1x = line.x1 + dx * 0.5;
              const cp1y = line.y1;
              const cp2x = line.x2 - dx * 0.5;
              const cp2y = line.y2;
              const pathD = `M ${line.x1} ${line.y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${line.x2} ${line.y2}`;
              const midX = (line.x1 + line.x2) / 2;
              const midY = (line.y1 + line.y2) / 2;
              return (
                <g key={line.id} className="pointer-events-auto cursor-pointer">
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={isActive ? 18 : 14}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDependencyId(isActive ? null : line.id);
                    }}
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isActive ? '#0d9488' : '#9ca3af'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    markerEnd={`url(#${isActive ? 'arrowhead-active' : 'arrowhead'})`}
                    style={{
                      transition: 'stroke 200ms ease, stroke-width 200ms ease',
                      strokeDashoffset: 0,
                      animation: 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDependencyId(isActive ? null : line.id);
                    }}
                  />
                  <g transform={`translate(${midX}, ${midY - 12})`}>
                    <rect
                      x="-34"
                      y="-10"
                      width="68"
                      height="20"
                      rx="10"
                      fill={isActive ? '#0d9488' : '#ffffff'}
                      stroke={isActive ? '#0d9488' : '#e5e7eb'}
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill={isActive ? '#ffffff' : '#6b7280'}
                    >
                      ≥{dep.threshold}%
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {selectedDependencyId && (
            <div
              className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex items-center gap-2"
            >
              <span className="text-[12px] text-gray-600">已选中连接线</span>
              <button
                onClick={() => {
                  removeDependency(selectedDependencyId);
                  setSelectedDependencyId(null);
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-1"
              >
                <Link2Off className="w-3 h-3" />
                删除依赖
              </button>
            </div>
          )}

          {objectives.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ArrowRight className="w-8 h-8" />
              </div>
              <p className="text-[14px]">还没有目标，点击右上角新建目标</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 relative">
              {objectives.map((obj) => (
                <ObjectiveCard
                  key={obj.id}
                  objective={obj}
                  keyResults={krsByObjective.get(obj.id) || []}
                  isEditing={editingObjId === obj.id}
                  editTitle={editObjTitle}
                  setEditTitle={setEditObjTitle}
                  onTitleSave={() => handleSaveTitle(obj.id)}
                  onStartEdit={() => {
                    setEditingObjId(obj.id);
                    setEditObjTitle(obj.title);
                  }}
                  onDelete={() => deleteObjective(obj.id)}
                  onAddKR={() => {
                    setShowAddKRModal(obj.id);
                    setNewKRType('numeric');
                  }}
                  isDragSource={activeDragId === `obj-${obj.id}`}
                  activeId={activeDragId}
                  avgProgress={avgProgressMap.get(obj.id) || 0}
                />
              ))}
            </div>
          )}

          {showAddKRModal && (
            <div
              className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
              onClick={() => setShowAddKRModal(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-[16px] font-bold text-gray-800 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  添加关键成果
                </h3>
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[12px] font-medium text-gray-600 block mb-1">标题</label>
                    <input
                      autoFocus
                      type="text"
                      value={newKRTitle}
                      onChange={(e) => setNewKRTitle(e.target.value)}
                      placeholder="输入关键成果标题..."
                      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-gray-600 block mb-1">类型</label>
                      <select
                        value={newKRType}
                        onChange={(e) => setNewKRType(e.target.value as 'numeric' | 'boolean' | 'percentage')}
                        className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 bg-white"
                      >
                        <option value="numeric">数值型</option>
                        <option value="boolean">布尔型</option>
                        <option value="percentage">百分比型</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-gray-600 block mb-1">负责人</label>
                      <input
                        type="text"
                        value={newKRAssignee}
                        onChange={(e) => setNewKRAssignee(e.target.value)}
                        placeholder="如：张三"
                        className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>
                  {newKRType !== 'boolean' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[12px] font-medium text-gray-600 block mb-1">初始值</label>
                        <input
                          type="number"
                          value={newKRInitial}
                          onChange={(e) => setNewKRInitial(e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400"
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-gray-600 block mb-1">目标值</label>
                        <input
                          type="number"
                          value={newKRTarget}
                          onChange={(e) => setNewKRTarget(e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button
                    onClick={() => setShowAddKRModal(null)}
                    className="px-4 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleAddKR(showAddKRModal)}
                    className="px-4 py-2 rounded-lg text-[13px] font-medium text-white"
                    style={{ backgroundColor: '#0d9488' }}
                  >
                    确认添加
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeObjective ? (
            <div className="bg-white rounded-2xl border-2 border-teal-400 shadow-2xl p-5 w-[320px] opacity-90">
              <h4 className="text-[14px] font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {activeObjective.title}
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">拖拽到目标卡片上建立依赖</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
