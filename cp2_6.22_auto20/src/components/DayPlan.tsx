import React from 'react';
import { Trip, Activity, DayPlan as DayPlanData, generateId } from '../dataStore';

interface DayPlanProps {
  trip: Trip;
  onTripUpdate: (trip: Trip) => void;
}

const COLORS = {
  primary: '#00BCA4',
  primaryLight: '#e0f7f3',
  primaryDark: '#009688',
  warmGray: '#F5F3F0',
  cardWhite: '#FFFFFF',
  textPrimary: '#2D2D2D',
  textSecondary: '#888888',
  border: '#E0DCD8',
  danger: '#E74C3C',
  dangerLight: '#FDEDEB',
  dragPlaceholder: '#00BCA422',
};

const keyframesStyle = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

interface FormFields {
  time: string;
  location: string;
  description: string;
  notes: string;
}

export default function DayPlan({ trip, onTripUpdate }: DayPlanProps) {
  const [selectedDay, setSelectedDay] = React.useState(0);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editFields, setEditFields] = React.useState<FormFields>({
    time: '',
    location: '',
    description: '',
    notes: '',
  });
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [formFields, setFormFields] = React.useState<FormFields>({
    time: '',
    location: '',
    description: '',
    notes: '',
  });
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = keyframesStyle;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const days = trip.days;

  const formatDate = (dateStr: string, dayIndex: number): string => {
    try {
      const d = new Date(dateStr);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `Day ${dayIndex + 1} - ${mm}/${dd}`;
    } catch {
      return `Day ${dayIndex + 1}`;
    }
  };

  const currentDay = days[selectedDay];
  const activities = currentDay ? currentDay.activities : [];

  const handleAddActivity = () => {
    if (!formFields.time && !formFields.location && !formFields.description) return;
    if (!currentDay) return;

    const newActivity: Activity = {
      id: generateId(),
      time: formFields.time,
      location: formFields.location,
      description: formFields.description,
      notes: formFields.notes,
      mapLocation: null,
    };

    const updatedDays = days.map((day, i) => {
      if (i !== selectedDay) return day;
      return { ...day, activities: [...day.activities, newActivity] };
    });

    onTripUpdate({ ...trip, days: updatedDays });
    setFormFields({ time: '', location: '', description: '', notes: '' });
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!currentDay) return;

    const updatedDays = days.map((day, i) => {
      if (i !== selectedDay) return day;
      return { ...day, activities: day.activities.filter((a) => a.id !== activityId) };
    });

    onTripUpdate({ ...trip, days: updatedDays });
    setDeleteConfirmId(null);
  };

  const handleStartEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditFields({
      time: activity.time,
      location: activity.location,
      description: activity.description,
      notes: activity.notes,
    });
  };

  const handleSaveEdit = (activityId: string) => {
    if (!currentDay) return;

    const updatedDays = days.map((day, i) => {
      if (i !== selectedDay) return day;
      return {
        ...day,
        activities: day.activities.map((a) =>
          a.id === activityId
            ? { ...a, time: editFields.time, location: editFields.location, description: editFields.description, notes: editFields.notes }
            : a
        ),
      };
    });

    onTripUpdate({ ...trip, days: updatedDays });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFields({ time: '', location: '', description: '', notes: '' });
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropIndex(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex || !currentDay) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }

    const updatedActivities = [...activities];
    const [moved] = updatedActivities.splice(dragIndex, 1);
    updatedActivities.splice(dropIndex, 0, moved);

    const updatedDays = days.map((day, i) => {
      if (i !== selectedDay) return day;
      return { ...day, activities: updatedActivities };
    });

    onTripUpdate({ ...trip, days: updatedDays });
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const renderActivity = (activity: Activity, index: number) => {
    const isEditing = editingId === activity.id;
    const isDragging = dragIndex === index;
    const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;

    return (
      <div
        key={activity.id}
        draggable={!isEditing}
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        style={{
          ...styles.activityCard,
          animation: 'fadeInUp 0.3s ease-out',
          opacity: isDragging ? 0.4 : 1,
          borderLeft: isDropTarget ? `3px solid ${COLORS.primary}` : '3px solid transparent',
          backgroundColor: isDropTarget ? COLORS.dragPlaceholder : COLORS.cardWhite,
        }}
      >
        {isEditing ? (
          <div style={styles.editForm}>
            <div style={styles.editRow}>
              <label style={styles.editLabel}>
                时间
                <input
                  type="time"
                  value={editFields.time}
                  onChange={(e) => setEditFields({ ...editFields, time: e.target.value })}
                  style={styles.editInput}
                />
              </label>
              <label style={styles.editLabel}>
                地点
                <input
                  type="text"
                  value={editFields.location}
                  onChange={(e) => setEditFields({ ...editFields, location: e.target.value })}
                  style={styles.editInput}
                  placeholder="地点"
                />
              </label>
            </div>
            <label style={styles.editLabel}>
              描述
              <input
                type="text"
                value={editFields.description}
                onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                style={styles.editInput}
                placeholder="描述"
              />
            </label>
            <label style={styles.editLabel}>
              备注
              <textarea
                value={editFields.notes}
                onChange={(e) => setEditFields({ ...editFields, notes: e.target.value })}
                style={{ ...styles.editInput, ...styles.textarea }}
                placeholder="备注"
                rows={2}
              />
            </label>
            <div style={styles.editActions}>
              <button
                onClick={() => handleSaveEdit(activity.id)}
                style={styles.saveButton}
              >
                保存
              </button>
              <button onClick={handleCancelEdit} style={styles.cancelButton}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.activityContent}>
            <div style={styles.dragHandle} title="拖拽排序">
              ⠿
            </div>
            <div style={styles.activityInfo}>
              <div style={styles.activityHeader}>
                {activity.time && (
                  <span style={styles.activityTime}>{activity.time}</span>
                )}
                {activity.location && (
                  <span style={styles.activityLocation}>{activity.location}</span>
                )}
              </div>
              {activity.description && (
                <div style={styles.activityDescription}>{activity.description}</div>
              )}
              {activity.notes && (
                <div style={styles.activityNotes}>{activity.notes}</div>
              )}
            </div>
            <div style={styles.activityActions}>
              <button
                onClick={() => handleStartEdit(activity)}
                style={styles.iconButton}
                title="编辑"
              >
                ✏️
              </button>
              {deleteConfirmId === activity.id ? (
                <div style={styles.deleteConfirm}>
                  <button
                    onClick={() => handleDeleteActivity(activity.id)}
                    style={styles.confirmDeleteButton}
                  >
                    确认
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    style={styles.cancelDeleteButton}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(activity.id)}
                  style={styles.iconButton}
                  title="删除"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMiniTimeline = () => {
    const maxActivities = Math.max(...days.map((d) => d.activities.length), 1);
    return (
      <div style={styles.timeline}>
        <div style={styles.timelineLabel}>行程概览</div>
        <div style={styles.timelineTrack}>
          {days.map((day, i) => {
            const count = day.activities.length;
            const isSelected = i === selectedDay;
            const dotSize = 12 + Math.round((count / maxActivities) * 12);
            return (
              <div
                key={i}
                style={styles.timelineDotContainer}
                onClick={() => setSelectedDay(i)}
              >
                <div
                  style={{
                    ...styles.timelineDot,
                    width: isSelected ? dotSize + 6 : dotSize,
                    height: isSelected ? dotSize + 6 : dotSize,
                    backgroundColor: isSelected ? COLORS.primary : COLORS.border,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                />
                <span style={styles.timelineCount}>{count}</span>
                <span style={styles.timelineDayLabel}>D{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.dayTabs}>
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            style={{
              ...styles.dayTab,
              backgroundColor: i === selectedDay ? COLORS.primary : COLORS.warmGray,
              color: i === selectedDay ? '#fff' : COLORS.textPrimary,
              fontWeight: i === selectedDay ? 600 : 400,
            }}
          >
            {formatDate(day.date, i)}
          </button>
        ))}
      </div>

      <div style={styles.activityList}>
        {activities.length === 0 && (
          <div style={styles.emptyState}>暂无活动，点击下方添加</div>
        )}
        {activities.map((activity, index) => renderActivity(activity, index))}
      </div>

      <div style={styles.addForm}>
        <div style={styles.addFormTitle}>添加活动</div>
        <div style={styles.editRow}>
          <label style={styles.editLabel}>
            时间
            <input
              type="time"
              value={formFields.time}
              onChange={(e) => setFormFields({ ...formFields, time: e.target.value })}
              style={styles.editInput}
            />
          </label>
          <label style={styles.editLabel}>
            地点
            <input
              type="text"
              value={formFields.location}
              onChange={(e) => setFormFields({ ...formFields, location: e.target.value })}
              style={styles.editInput}
              placeholder="地点"
            />
          </label>
        </div>
        <label style={styles.editLabel}>
          描述
          <input
            type="text"
            value={formFields.description}
            onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
            style={styles.editInput}
            placeholder="描述"
          />
        </label>
        <label style={styles.editLabel}>
          备注
          <textarea
            value={formFields.notes}
            onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}
            style={{ ...styles.editInput, ...styles.textarea }}
            placeholder="备注"
            rows={2}
          />
        </label>
        <button onClick={handleAddActivity} style={styles.addButton}>
          + 添加活动
        </button>
      </div>

      {renderMiniTimeline()}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  dayTabs: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    padding: '4px 0',
  },
  dayTab: {
    padding: '8px 16px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap' as const,
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    minHeight: 60,
  },
  emptyState: {
    textAlign: 'center' as const,
    color: COLORS.textSecondary,
    padding: 24,
    fontSize: 14,
    backgroundColor: COLORS.warmGray,
    borderRadius: 12,
  },
  activityCard: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: 12,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  activityContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  dragHandle: {
    cursor: 'grab',
    color: COLORS.textSecondary,
    fontSize: 16,
    userSelect: 'none' as const,
    padding: '4px 2px',
    lineHeight: 1,
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
  },
  activityHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.primary,
    whiteSpace: 'nowrap' as const,
  },
  activityLocation: {
    fontSize: 14,
    fontWeight: 500,
    color: COLORS.textPrimary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  activityDescription: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  activityNotes: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  activityActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 4,
    borderRadius: 8,
    transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  deleteConfirm: {
    display: 'flex',
    gap: 4,
  },
  confirmDeleteButton: {
    padding: '3px 10px',
    fontSize: 11,
    borderRadius: 12,
    border: 'none',
    backgroundColor: COLORS.danger,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cancelDeleteButton: {
    padding: '3px 10px',
    fontSize: 11,
    borderRadius: 12,
    border: 'none',
    backgroundColor: COLORS.warmGray,
    color: COLORS.textPrimary,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  editRow: {
    display: 'flex',
    gap: 8,
  },
  editLabel: {
    display: 'flex',
    flexDirection: 'column' as const,
    fontSize: 12,
    color: COLORS.textSecondary,
    gap: 4,
    flex: 1,
  },
  editInput: {
    padding: '6px 10px',
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
  },
  textarea: {
    resize: 'vertical' as const,
    minHeight: 48,
  },
  editActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  saveButton: {
    padding: '6px 16px',
    borderRadius: 20,
    border: 'none',
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cancelButton: {
    padding: '6px 16px',
    borderRadius: 20,
    border: 'none',
    backgroundColor: COLORS.warmGray,
    color: COLORS.textPrimary,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  addForm: {
    backgroundColor: COLORS.warmGray,
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  addFormTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  addButton: {
    padding: '8px 20px',
    borderRadius: 20,
    border: 'none',
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    alignSelf: 'flex-end',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  timeline: {
    marginTop: 8,
    padding: 16,
    backgroundColor: COLORS.warmGray,
    borderRadius: 12,
  },
  timelineLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontWeight: 500,
  },
  timelineTrack: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    position: 'relative' as const,
  },
  timelineDotContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  },
  timelineDot: {
    borderRadius: '50%',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  timelineCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: 500,
  },
  timelineDayLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
};
