import React, { useState, useCallback } from 'react';
import type { Objective, User, KeyResult } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { okrApi } from '../api';
import KeyResultDetail from './KeyResultDetail';

interface OKRBoardProps {
  objectives: Objective[];
  users: User[];
  currentUserId?: string;
  userRole?: 'member' | 'manager';
  onKRUpdate?: (objectiveId: string, kr: KeyResult) => void;
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'var(--color-success)';
  if (progress >= 50) return 'var(--color-warning)';
  return 'var(--color-danger)';
};

const getScoreColor = (score?: number): string => {
  if (score === undefined) return 'var(--color-primary)';
  if (score <= 2) return '#ef4444';
  if (score <= 3) return '#eab308';
  return '#22c55e';
};

const getUserById = (users: User[], id: string) => users.find((u) => u.id === id);

interface SortableKRCardProps {
  kr: KeyResult;
  users: User[];
  onClick: () => void;
  isDragging?: boolean;
}

const SortableKRCard: React.FC<SortableKRCardProps> = ({ kr, users, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: kr.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const owner = getUserById(users, kr.ownerId);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'relative',
      }}
    >
      <div
        {...attributes}
        {...listeners}
        onClick={onClick}
        style={{
          padding: '12px 14px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          cursor: isDragging ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
          boxShadow: isDragging
            ? '0 12px 24px rgba(99, 102, 241, 0.2)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          cursor: 'grab',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease',
          transform: isDragging ? 'scale(1.03)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 6px 16px rgba(99, 102, 241, 0.12)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 1px 3px rgba(0,0,0,0.06)';
          }
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: '2px', color: 'var(--color-text)', fontSize: '14px' }}>
              <span style={{ color: 'var(--color-text-secondary)', marginRight: '6px', fontWeight: 500 }}>
                #{kr.priority
              </span>
              {kr.title}
            </div>
            {kr.description && (
              <p style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {kr.description}
              </p>
            )}
          </div>
          {kr.score !== undefined && (
            <div
              style={{
                padding: '2px 8px',
                backgroundColor: getScoreColor(kr.score),
                color: '#fff',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                animation: 'badgeBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              ★ {kr.score}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>进度</span>
            <span style={{ fontWeight: 600, color: getProgressColor(kr.progress) }}>
              {kr.progress}%
            </span>
          </div>
          <div
            style={{
              height: '4px',
              backgroundColor: 'var(--color-border)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${kr.progress}%`,
                backgroundColor: getScoreColor(kr.score),
                borderRadius: '2px',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>
              {owner?.avatar || '👤'}
            </span>
            <span style={{ fontSize: '11px' }}>{owner?.name || '未知'}</span>
          </div>
          <span style={{ fontSize: '11px' }}>
            {new Date(kr.deadline).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ObjectiveCardProps {
  objective: Objective;
  users: User[];
  onKRClick: (kr: KeyResult) => void;
  onReorder: (objectiveId: string, newOrder: string[]) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  users,
  onKRClick,
  onReorder,
  activeId,
  setActiveId,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
