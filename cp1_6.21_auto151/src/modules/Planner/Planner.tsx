import { useState, useRef, useEffect, DragEvent } from 'react';
import { Plus, GripVertical, Trash2, Calendar, MapPin, Clock, Download, CalendarPlus } from 'lucide-react';
import { useTravel } from '@/context/TravelContext';
import { Trip } from '@/types';
import './Planner.css';

export default function Planner() {
  const { state, dispatch, addTrip, updateTrip, deleteTrip, exportMarkdown, getTripsByDate, getUniqueDates, fetchTrips } = useTravel();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTrip, setNewTrip] = useState({
    title: '',
    location: '',
    duration: 60,
    rating: 3,
    description: '',
    tag: '探索',
  });
  const [draggedItem, setDraggedItem] = useState<Trip | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const uniqueDates = getUniqueDates();
  const selectedDateTrips = getTripsByDate(state.selectedDate);

  useEffect(() => {
    if (uniqueDates.length > 0 && !state.selectedDate) {
      dispatch({ type: 'SET_SELECTED_DATE', payload: uniqueDates[0] });
    }
  }, [uniqueDates, state.selectedDate, dispatch]);

  const handleDateClick = (date: string) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
    if (window.innerWidth < 1024) {
      dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: false });
    }
  };

  const handleAddDate = () => {
    if (newDate) {
      dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
      setShowDatePicker(false);
      setNewDate('');
      setShowAddForm(true);
    }
  };

  const handleAddTrip = async () => {
    if (!newTrip.title.trim()) return;
    
    const trip = {
      ...newTrip,
      date: state.selectedDate,
      note: '',
      order: selectedDateTrips.length,
    };
    
    await addTrip(trip);
    await fetchTrips();
    setNewTrip({
      title: '',
      location: '',
      duration: 60,
      rating: 3,
      description: '',
      tag: '探索',
    });
    setShowAddForm(false);
  };

  const handleRatingClick = (tripId: string, newRating: number) => {
    updateTrip(tripId, { rating: newRating });
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm('确定要删除这个行程吗？')) {
      deleteTrip(tripId);
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, trip: Trip, index: number) => {
    setDraggedItem(trip);
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', trip.id);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedItem || dragItemRef.current === null) return;
    if (dragItemRef.current === dropIndex) {
      setDraggedItem(null);
      return;
    }

    const trips = [...selectedDateTrips];
    const [removed] = trips.splice(dragItemRef.current, 1);
    trips.splice(dropIndex, 0, removed);
    
    const updatedTrips = trips.map((trip, idx) => ({ ...trip, order: idx }));
    
    dispatch({
      type: 'REORDER_TRIPS',
      payload: { date: state.selectedDate, trips: updatedTrips },
    });

    for (const trip of updatedTrips) {
      await updateTrip(trip.id, { order: trip.order });
    }

    setDraggedItem(null);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const renderStars = (rating: number, tripId?: string, interactive = false) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={interactive && tripId ? () => handleRatingClick(tripId, star) : undefined}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) {
        return `${hours}小时`;
      }
      return `${hours}小时${mins}分钟`;
    }
    return `${minutes}分钟`;
  };

  return (
    <>
      <div className={`planner-sidebar ${state.sidebarVisible ? 'visible' : 'hidden'}`}>
        <div className="sidebar-header">
          <button className="export-btn" onClick={exportMarkdown}>
            <Download size={18} />
            <span>导出笔记</span>
          </button>
        </div>

        <div className="date-section">
          <div className="section-header">
            <h3 className="section-title">
              <Calendar size={18} />
              旅行日期
            </h3>
            <button
              className="add-btn small"
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                if (!showDatePicker) {
                  setTimeout(() => dateInputRef.current?.focus(), 0);
                }
              }}
            >
              <CalendarPlus size={18} />
            </button>
          </div>

          {showDatePicker && (
            <div className="date-picker">
              <input
                ref={dateInputRef}
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
              <div className="date-picker-actions">
                <button
                  className="cancel-btn small"
                  onClick={() => setShowDatePicker(false)}
                >
                  取消
                </button>
                <button
                  className="confirm-btn small"
                  onClick={handleAddDate}
                  disabled={!newDate}
                >
                  选择
                </button>
              </div>
            </div>
          )}

          <div className="date-list">
            {uniqueDates.length === 0 ? (
              <p className="empty-text">暂无行程</p>
            ) : (
              uniqueDates.map((date) => (
                <div
                  key={date}
                  className={`date-item ${state.selectedDate === date ? 'active' : ''}`}
                  onClick={() => handleDateClick(date)}
                >
                  <Calendar size={16} />
                  <span>{date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="trips-section">
          <div className="section-header">
            <h3 className="section-title">
              <MapPin size={18} />
              当日行程
            </h3>
            <button
              className="add-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={18} />
            </button>
          </div>

          {showAddForm && (
            <div className="add-form">
              <input
                type="text"
                placeholder="行程标题"
                value={newTrip.title}
                onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                maxLength={30}
              />
              <input
                type="text"
                placeholder="地点名称"
                value={newTrip.location}
                onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
                maxLength={30}
              />
              <div className="form-row">
                <div className="form-item">
                  <label>
                    <Clock size={14} />
                    时长
                  </label>
                  <select
                    value={newTrip.duration}
                    onChange={(e) => setNewTrip({ ...newTrip, duration: Number(e.target.value) })}
                  >
                    <option value={15}>15分钟</option>
                    <option value={30}>30分钟</option>
                    <option value={60}>1小时</option>
                    <option value={90}>1.5小时</option>
                    <option value={120}>2小时</option>
                    <option value={180}>3小时</option>
                    <option value={240}>4小时</option>
                  </select>
                </div>
                <div className="form-item">
                  <label>评分</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star interactive ${star <= newTrip.rating ? 'filled' : ''}`}
                        onClick={() => setNewTrip({ ...newTrip, rating: star })}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <input
                type="text"
                placeholder="标签"
                value={newTrip.tag}
                onChange={(e) => setNewTrip({ ...newTrip, tag: e.target.value })}
              />
              <textarea
                placeholder="详细描述"
                value={newTrip.description}
                onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                rows={3}
              />
              <div className="form-actions">
                <button className="cancel-btn" onClick={() => setShowAddForm(false)}>
                  取消
                </button>
                <button className="confirm-btn" onClick={handleAddTrip}>
                  添加
                </button>
              </div>
            </div>
          )}

          <div className="trip-cards">
            {selectedDateTrips.length === 0 ? (
              <p className="empty-text">点击 + 添加行程</p>
            ) : (
              selectedDateTrips.map((trip, index) => (
                <div
                  key={trip.id}
                  className={`trip-card ${draggedItem?.id === trip.id ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, trip, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="drag-handle">
                    <GripVertical size={16} />
                  </div>
                  <div className="trip-info">
                    <h4 className="trip-title">{trip.title}</h4>
                    <p className="trip-location">
                      <MapPin size={12} />
                      {trip.location}
                    </p>
                    <div className="trip-meta">
                      <span className="trip-duration">
                        <Clock size={12} />
                        {formatDuration(trip.duration)}
                      </span>
                      {renderStars(trip.rating, trip.id, true)}
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrip(trip.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {state.sidebarVisible && typeof window !== 'undefined' && window.innerWidth < 1024 && (
        <div
          className="sidebar-overlay"
          onClick={() => dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: false })}
        />
      )}
    </>
  );
}
