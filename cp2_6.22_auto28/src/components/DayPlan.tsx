import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import type { Trip, Activity, DayPlan } from '../types';
import { dataStore } from '../dataStore';
import '../styles/day-plan.css';

interface DayPlanViewProps {
  trip: Trip;
  onUpdate: () => void;
}

function DayPlanView({ trip, onUpdate }: DayPlanViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    trip.days.length > 0 ? trip.days[0].date : ''
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState({
    time: '09:00',
    place: '',
    description: '',
    notes: '',
    lat: 35.6762,
    lng: 139.6503
  });

  const sortedDays = useMemo(() => {
    return [...trip.days].sort((a, b) => a.date.localeCompare(b.date));
  }, [trip.days]);

  const currentDay = sortedDays.find(d => d.date === selectedDate);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !currentDay) return;

    const items = Array.from(currentDay.activities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedDays = sortedDays.map(day =>
      day.date === selectedDate ? { ...day, activities: items } : day
    );

    try {
      await dataStore.updateDays(trip.id, updatedDays);
      onUpdate();
    } catch (error) {
      console.error('Failed to reorder activities:', error);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.place || !selectedDate) return;

    try {
      await dataStore.addActivity(trip.id, selectedDate, newActivity);
      setShowAddModal(false);
      setNewActivity({
        time: '09:00',
        place: '',
        description: '',
        notes: '',
        lat: 35.6762,
        lng: 139.6503
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  };

  const handleEditActivity = async () => {
    if (!editingActivity) return;

    try {
      await dataStore.updateActivity(trip.id, editingActivity.id, editingActivity);
      setEditingActivity(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('确定要删除这个行程吗？')) return;

    try {
      await dataStore.deleteActivity(trip.id, activityId);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      month: date.getMonth() + 1,
      day: date.getDate(),
      weekday: weekDays[date.getDay()]
    };
  };

  const allActivitiesTimeline = useMemo(() => {
    const activities: Array<Activity & { date: string }> = [];
    sortedDays.forEach(day => {
      day.activities.forEach(act => {
        activities.push({ ...act, date: day.date });
      });
    });
    return activities.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  }, [sortedDays]);

  return (
    <div className="day-plan-container">
      <div className="trip-info fade-in">
        <div className="trip-info-header">
          <h2 className="trip-name">{trip.title}</h2>
          <p className="trip-dest">📍 {trip.destination}</p>
        </div>
        <div className="trip-dates-info">
          <span>{trip.startDate}</span>
          <span className="date-divider">—</span>
          <span>{trip.endDate}</span>
          <span className="trip-duration">
            ({sortedDays.length} 天)
          </span>
        </div>
      </div>

      <div className="day-tabs">
        {sortedDays.map((day) => {
          const dateInfo = formatDate(day.date);
          return (
            <button
              key={day.date}
              className={`day-tab ${selectedDate === day.date ? 'active' : ''}`}
              onClick={() => setSelectedDate(day.date)}
            >
              <span className="tab-date">{dateInfo.month}/{dateInfo.day}</span>
              <span className="tab-weekday">{dateInfo.weekday}</span>
              <span className="tab-count">{day.activities.length}项</span>
            </button>
          );
        })}
        <button
          className="day-tab add-day-tab"
          onClick={() => alert('请在地图页面添加行程地点')}
        >
          <span>+ 添加日期</span>
        </button>
      </div>

      <div className="day-content">
        <div className="activities-section">
          <div className="section-header">
            <h3>当日行程</h3>
            <button
              className="add-activity-btn"
              onClick={() => setShowAddModal(true)}
              disabled={!selectedDate}
            >
              <span>+</span> 添加行程
            </button>
          </div>

          {currentDay && currentDay.activities.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="activities">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="activities-list"
                  >
                    {currentDay.activities.map((activity, index) => (
                      <Draggable
                        key={activity.id}
                        draggableId={activity.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`activity-item fade-in ${
                              snapshot.isDragging ? 'dragging' : ''
                            }`}
                            style={{
                              ...provided.draggableProps.style,
                              animationDelay: `${index * 0.05}s`
                            }}
                          >
                            <div className="activity-time">
                              <span className="time-text">{activity.time}</span>
                              <div className="time-dot"></div>
                              <div className="time-line"></div>
                            </div>
                            <div className="activity-card">
                              <div className="activity-header">
                                <h4 className="activity-place">{activity.place}</h4>
                                <div className="activity-actions">
                                  <button
                                    className="action-btn edit-btn"
                                    onClick={() => setEditingActivity(activity)}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="action-btn delete-act-btn"
                                    onClick={() => handleDeleteActivity(activity.id)}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              <p className="activity-desc">{activity.description}</p>
                              {activity.notes && (
                                <div className="activity-notes">
                                  <span className="notes-label">备注:</span>
                                  <span className="notes-text">{activity.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="empty-activities fade-in">
              <div className="empty-act-icon">📋</div>
              <p>今天还没有行程安排</p>
              <button
                className="add-first-act-btn"
                onClick={() => setShowAddModal(true)}
              >
                添加第一个行程
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="timeline-section">
        <h4 className="timeline-title">行程总览</h4>
        <div className="mini-timeline">
          {allActivitiesTimeline.length > 0 ? (
            allActivitiesTimeline.map((activity, index) => (
              <div
                key={activity.id}
                className={`mini-timeline-item ${
                  activity.date === selectedDate ? 'active' : ''
                }`}
                onClick={() => setSelectedDate(activity.date)}
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <div className="mini-time">{activity.time}</div>
                <div className="mini-place">{activity.place}</div>
              </div>
            ))
          ) : (
            <p className="empty-timeline">暂无行程</p>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay scale-in" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">添加行程</h3>
            <div className="form-row">
              <div className="form-group">
                <label>时间</label>
                <input
                  type="time"
                  value={newActivity.time}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, time: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>地点 *</label>
                <input
                  type="text"
                  value={newActivity.place}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, place: e.target.value }))}
                  placeholder="例如：浅草寺"
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>活动描述</label>
              <input
                type="text"
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述一下活动内容"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea
                value={newActivity.notes}
                onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="门票、交通等提醒"
                className="form-textarea"
                rows={2}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>纬度</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newActivity.lat}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>经度</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newActivity.lng}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                取消
              </button>
              <button
                className="submit-btn"
                onClick={handleAddActivity}
                disabled={!newActivity.place}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {editingActivity && (
        <div className="modal-overlay scale-in" onClick={() => setEditingActivity(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">编辑行程</h3>
            <div className="form-row">
              <div className="form-group">
                <label>时间</label>
                <input
                  type="time"
                  value={editingActivity.time}
                  onChange={(e) => setEditingActivity({ ...editingActivity, time: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>地点</label>
                <input
                  type="text"
                  value={editingActivity.place}
                  onChange={(e) => setEditingActivity({ ...editingActivity, place: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>活动描述</label>
              <input
                type="text"
                value={editingActivity.description}
                onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea
                value={editingActivity.notes}
                onChange={(e) => setEditingActivity({ ...editingActivity, notes: e.target.value })}
                className="form-textarea"
                rows={2}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>纬度</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editingActivity.lat}
                  onChange={(e) => setEditingActivity({ ...editingActivity, lat: parseFloat(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>经度</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editingActivity.lng}
                  onChange={(e) => setEditingActivity({ ...editingActivity, lng: parseFloat(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setEditingActivity(null)}>
                取消
              </button>
              <button className="submit-btn" onClick={handleEditActivity}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DayPlanView;
