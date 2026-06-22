import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Dumbbell } from 'lucide-react';
import './ActionLibrary.css';

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export interface ExerciseAction {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  imagePlaceholder: string;
}

interface ActionLibraryProps {
  actions: ExerciseAction[];
}

const MUSCLE_GROUP_CONFIG: Record<MuscleGroup, { label: string; emoji: string; color: string; bgColor: string }> = {
  chest: { label: '胸部', emoji: '🏋️', color: '#ffffff', bgColor: '#ef4444' },
  back: { label: '背部', emoji: '🔙', color: '#ffffff', bgColor: '#f97316' },
  legs: { label: '腿部', emoji: '🦵', color: '#ffffff', bgColor: '#22c55e' },
  shoulders: { label: '肩部', emoji: '💪', color: '#ffffff', bgColor: '#3b82f6' },
  arms: { label: '手臂', emoji: '🤜', color: '#ffffff', bgColor: '#8b5cf6' },
  core: { label: '核心', emoji: '🔥', color: '#ffffff', bgColor: '#ec4899' },
};

const ALL_GROUPS: { key: MuscleGroup | 'all'; label: string; emoji: string; bgColor: string }[] = [
  { key: 'all', label: '全部', emoji: '📋', bgColor: '#6b7280' },
  { key: 'chest', label: '胸部', emoji: '🏋️', bgColor: MUSCLE_GROUP_CONFIG.chest.bgColor },
  { key: 'back', label: '背部', emoji: '🔙', bgColor: MUSCLE_GROUP_CONFIG.back.bgColor },
  { key: 'legs', label: '腿部', emoji: '🦵', bgColor: MUSCLE_GROUP_CONFIG.legs.bgColor },
  { key: 'shoulders', label: '肩部', emoji: '💪', bgColor: MUSCLE_GROUP_CONFIG.shoulders.bgColor },
  { key: 'arms', label: '手臂', emoji: '🤜', bgColor: MUSCLE_GROUP_CONFIG.arms.bgColor },
  { key: 'core', label: '核心', emoji: '🔥', bgColor: MUSCLE_GROUP_CONFIG.core.bgColor },
];

const getMuscleGroupIcon = (group: MuscleGroup, size: number = 40) => {
  const config = MUSCLE_GROUP_CONFIG[group];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: config.bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px 8px 0 0',
        opacity: 0.9,
        gap: 4,
        position: 'relative',
      }}
    >
      <Dumbbell size={28} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
      <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{config.emoji}</span>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>示范图</span>
    </div>
  );
};

export default function ActionLibrary({ actions }: ActionLibraryProps) {
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'all'>('all');

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      const matchesKeyword = action.name.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesGroup = selectedGroup === 'all' || action.muscleGroup === selectedGroup;
      return matchesKeyword && matchesGroup;
    });
  }, [actions, searchKeyword, selectedGroup]);

  const visibleIds = useMemo(() => new Set(filteredActions.map((a) => a.id)), [filteredActions]);
  const prevVisibleIdsRef = useRef<Set<string>>(new Set());
  const [bouncingIds, setBouncingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prevVisibleIds = prevVisibleIdsRef.current;
    const newIds: string[] = [];

    filteredActions.forEach((action) => {
      if (!prevVisibleIds.has(action.id)) {
        newIds.push(action.id);
      }
    });

    if (newIds.length > 0) {
      setBouncingIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });

      setTimeout(() => {
        setBouncingIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 400);
    }

    prevVisibleIdsRef.current = visibleIds;
  }, [filteredActions, visibleIds]);

  return (
    <div className="action-library">
      <div className="filter-section">
        <input
          type="text"
          className="search-input"
          placeholder="搜索动作名称..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <div className="muscle-tags">
          {ALL_GROUPS.map((group) => (
            <button
              key={group.key}
              type="button"
              className={`muscle-tag-btn ${selectedGroup === group.key ? 'active' : ''}`}
              onClick={() => setSelectedGroup(group.key)}
              style={
                selectedGroup === group.key
                  ? { backgroundColor: group.bgColor, color: '#ffffff', borderColor: group.bgColor }
                  : undefined
              }
            >
              <span className="tag-emoji">{group.emoji}</span>
              {group.label}
            </button>
          ))}
        </div>
      </div>

      <Droppable droppableId="action-library" type="EXERCISE" direction="vertical">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`action-grid ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
          >
            {actions.map((action, index) => {
              const isVisible = visibleIds.has(action.id);
              const config = MUSCLE_GROUP_CONFIG[action.muscleGroup];
              return (
                <Draggable
                  key={action.id}
                  draggableId={`action-${action.id}`}
                  index={index}
                  isDragDisabled={!isVisible}
                >
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`action-card ${!isVisible ? 'scale-out' : ''} ${
                        isVisible && bouncingIds.has(action.id) ? 'animate-bounce' : ''} ${
                        dragSnapshot.isDragging ? 'dragging' : ''
                      }`}
                      style={{
                        ...dragProvided.draggableProps.style,
                      }}
                    >
                      <div className="card-image">
                        {getMuscleGroupIcon(action.muscleGroup)}
                      </div>
                      <div className="card-body">
                        <div className="card-name">{action.name}</div>
                        <span
                          className="muscle-chip"
                          style={{ backgroundColor: config.bgColor, color: config.color }}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {filteredActions.length === 0 && (
        <div className="empty-state">
          <Dumbbell size={48} color="#9ca3af" />
          <p className="empty-text">没有找到匹配的动作</p>
        </div>
      )}
    </div>
  );
}
