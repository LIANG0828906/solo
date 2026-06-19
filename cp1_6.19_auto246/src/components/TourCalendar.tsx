import React, { useState, useCallback, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { useTourStore, TourEvent } from '../store/tourStore';
import 'react-calendar/dist/Calendar.css';

interface CreateModalData {
  date: string;
  bandName: string;
  city: string;
  venue: string;
  expectedTickets: number;
  ticketPrice: number;
}

const TourCalendar: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    getToursForDate,
    createTour,
    selectedTourId,
    setSelectedTourId,
    updateTour,
  } = useTourStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDate, setCreateDate] = useState<string>('');
  const [formData, setFormData] = useState<Partial<CreateModalData>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<CreateModalData> & { id: string }>({ id: '' });
  const [draggedTourId, setDraggedTourId] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDropOnTile = (e: DragEvent) => {
      e.preventDefault();
      if (!draggedTourId) return;
      const target = e.target as HTMLElement;
      const tile = target.closest('[data-date]');
      if (tile) {
        const dateAttr = tile.getAttribute('data-date');
        if (dateAttr) {
          const dropDate = new Date(dateAttr);
          if (!isNaN(dropDate.getTime())) {
            const dateStr = format(dropDate, 'yyyy-MM-dd');
            updateTour(draggedTourId, { date: dateStr });
            setDraggedTourId(null);
          }
        }
      }
    };

    const handleDragOverTile = (e: DragEvent) => {
      e.preventDefault();
    };

    const calEl = calendarRef.current;
    if (calEl) {
      calEl.addEventListener('drop', handleDropOnTile);
      calEl.addEventListener('dragover', handleDragOverTile);
    }
    return () => {
      if (calEl) {
        calEl.removeEventListener('drop', handleDropOnTile);
        calEl.removeEventListener('dragover', handleDragOverTile);
      }
    };
  }, [draggedTourId, updateTour]);

  useEffect(() => {
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tile = target.closest('[data-date]');
      if (tile) {
        const dateAttr = tile.getAttribute('data-date');
        if (dateAttr) {
          const clickDate = new Date(dateAttr);
          if (!isNaN(clickDate.getTime())) {
            const dateStr = format(clickDate, 'yyyy-MM-dd');
            setCreateDate(dateStr);
            setFormData({
              date: dateStr,
              bandName: '',
              city: '',
              venue: '',
              expectedTickets: 100,
              ticketPrice: 200,
            });
            setShowCreateModal(true);
          }
        }
      }
    };

    const calEl = calendarRef.current;
    if (calEl) {
      calEl.addEventListener('dblclick', handleDblClick);
    }
    return () => {
      if (calEl) {
        calEl.removeEventListener('dblclick', handleDblClick);
      }
    };
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  const handleCreateSubmit = useCallback(async () => {
    if (!formData.bandName || !formData.city || !formData.venue) return;
    const result = await createTour({
      date: formData.date || createDate,
      bandName: formData.bandName!,
      city: formData.city!,
      venue: formData.venue!,
      expectedTickets: formData.expectedTickets || 100,
      ticketPrice: formData.ticketPrice || 200,
    });
    if (result) {
      setShowCreateModal(false);
      setFormData({});
    }
  }, [formData, createDate, createTour]);

  const handleCardClick = useCallback((tourId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTourId(tourId);
  }, [setSelectedTourId]);

  const handleEditClick = useCallback((tour: TourEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditData({
      id: tour.id,
      date: tour.date,
      bandName: tour.bandName,
      city: tour.city,
      venue: tour.venue,
      expectedTickets: tour.expectedTickets,
      ticketPrice: tour.ticketPrice,
    });
    setShowEditModal(true);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editData.id) return;
    const result = await updateTour(editData.id, {
      date: editData.date,
      bandName: editData.bandName,
      city: editData.city,
      venue: editData.venue,
      expectedTickets: editData.expectedTickets,
      ticketPrice: editData.ticketPrice,
    });
    if (result) {
      setShowEditModal(false);
    }
  }, [editData, updateTour]);

  const handleDragStart = useCallback((tourId: string, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedTourId(tourId);
  }, []);

  const tileContent = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    const tours = getToursForDate(date);
    if (tours.length === 0) return null;

    return (
      <div className="tour-cards-container">
        {tours.map(tour => (
          <div
            key={tour.id}
            className={`tour-card ${selectedTourId === tour.id ? 'selected' : ''}`}
            style={{ background: tour.color || '#FF6B6B' }}
            onClick={(e) => handleCardClick(tour.id, e)}
            draggable
            onDragStart={(e) => handleDragStart(tour.id, e)}
          >
            <div className="card-actions">
              <button onClick={(e) => handleEditClick(tour, e)}>✎</button>
            </div>
            <div className="band-abbr">
              {tour.bandName.substring(0, 3).toUpperCase()}
            </div>
            <div className="card-income">
              ¥{(tour.expectedTickets * tour.ticketPrice).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    );
  }, [getToursForDate, selectedTourId, handleCardClick, handleEditClick, handleDragStart]);

  const onActiveStartDateChange = useCallback(({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      setSelectedDate(activeStartDate);
    }
  }, [setSelectedDate]);

  const tileDisabled = useCallback(() => false, []);

  return (
    <div className="calendar-section" ref={calendarRef}>
      <Calendar
        onClickDay={handleDateClick}
        tileContent={tileContent}
        value={selectedDate}
        onActiveStartDateChange={onActiveStartDateChange}
        locale="zh-CN"
        prev2Label={null}
        next2Label={null}
        tileDisabled={tileDisabled}
      />
      <p style={{ fontSize: 12, color: '#BDC3C7', marginTop: 8, textAlign: 'center' }}>
        双击日期创建巡演 · 拖拽卡片调整日期
      </p>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal create-modal" onClick={e => e.stopPropagation()}>
            <h3>创建巡演事件 - {createDate}</h3>
            <div className="form-group">
              <label>乐队名称</label>
              <input
                type="text"
                value={formData.bandName || ''}
                onChange={e => setFormData({ ...formData, bandName: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>城市</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>场地</label>
                <input
                  type="text"
                  value={formData.venue || ''}
                  onChange={e => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>预计售票数</label>
                <input
                  type="number"
                  value={formData.expectedTickets || ''}
                  onChange={e => setFormData({ ...formData, expectedTickets: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>票价</label>
                <input
                  type="number"
                  value={formData.ticketPrice || ''}
                  onChange={e => setFormData({ ...formData, ticketPrice: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleCreateSubmit}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal edit-modal" onClick={e => e.stopPropagation()}>
            <h3>编辑巡演事件</h3>
            <div className="form-group">
              <label>乐队名称</label>
              <input
                type="text"
                value={editData.bandName || ''}
                onChange={e => setEditData({ ...editData, bandName: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>城市</label>
                <input
                  type="text"
                  value={editData.city || ''}
                  onChange={e => setEditData({ ...editData, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>场地</label>
                <input
                  type="text"
                  value={editData.venue || ''}
                  onChange={e => setEditData({ ...editData, venue: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>预计售票数</label>
                <input
                  type="number"
                  value={editData.expectedTickets || ''}
                  onChange={e => setEditData({ ...editData, expectedTickets: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>票价</label>
                <input
                  type="number"
                  value={editData.ticketPrice || ''}
                  onChange={e => setEditData({ ...editData, ticketPrice: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleEditSubmit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourCalendar;
