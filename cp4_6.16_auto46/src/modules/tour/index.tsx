import React, { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  X,
  Save,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '@/store';
import { TourDate } from '@/types';
import { isWithinDays, formatDate, getMonthDay, sortDatesByAscending, getTodayDateString } from '@/utils/date';
import './styles.css';

interface TourFormData {
  date: string;
  time: string;
  venue: string;
  city: string;
  ticketLink: string;
}

const TourModule: React.FC = () => {
  const { artist, tourDates, addTourDate, deleteTourDate } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TourFormData>({
    date: '',
    time: '19:00',
    venue: '',
    city: '',
    ticketLink: '',
  });
  const [selectedTour, setSelectedTour] = useState<TourDate | null>(null);

  const sortedDates = useMemo(() => {
    return sortDatesByAscending(tourDates);
  }, [tourDates]);

  const upcomingDates = useMemo(() => {
    const today = new Date(getTodayDateString()).getTime();
    return sortedDates.filter((d) => new Date(d.date).getTime() >= today);
  }, [sortedDates]);

  const handleSubmit = useCallback(() => {
    if (!artist) return;

    if (!formData.date.trim()) {
      alert('请选择演出日期');
      return;
    }
    if (!formData.venue.trim()) {
      alert('请输入场地名称');
      return;
    }
    if (!formData.city.trim()) {
      alert('请输入城市');
      return;
    }

    const tourDate: TourDate = {
      id: uuidv4(),
      artistId: artist.id,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      city: formData.city,
      ticketLink: formData.ticketLink,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addTourDate(tourDate);
    setShowForm(false);
    setFormData({
      date: '',
      time: '19:00',
      venue: '',
      city: '',
      ticketLink: '',
    });
  }, [artist, formData, addTourDate]);

  const handleCardClick = useCallback((tour: TourDate) => {
    setSelectedTour(tour);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedTour(null);
  }, []);

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('确定要删除这个演出日程吗？')) {
        deleteTourDate(id);
      }
    },
    [deleteTourDate]
  );

  return (
    <div className="tour-module">
      <div className="tour-header">
        <h2 className="section-title">接下来</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          添加演出
        </button>
      </div>

      {upcomingDates.length === 0 ? (
        <div className="empty-state card">
          <Calendar size={48} className="empty-icon" />
          <p>还没有安排演出</p>
          <p className="empty-hint">点击上方按钮添加你的第一场演出</p>
        </div>
      ) : (
        <div className="timeline-container">
          <div className="timeline-scroll">
            <div className="timeline-track">
              {upcomingDates.map((tour, index) => {
                const isUrgent = isWithinDays(tour.date, 7);
                const { month, day } = getMonthDay(tour.date);
                return (
                  <div
                    key={tour.id}
                    className={`tour-card card fade-in ${isUrgent ? 'urgent' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => handleCardClick(tour)}
                  >
                    {isUrgent && <span className="pulse-dot" title="7天内演出" />}
                    <div className="tour-date-badge">
                      <span className="tour-month">{month}</span>
                      <span className="tour-day">{day}</span>
                    </div>
                    <div className="tour-info">
                      <h3 className="tour-venue">{tour.venue}</h3>
                      <div className="tour-meta">
                        <span className="tour-city">
                          <MapPin size={14} />
                          {tour.city}
                        </span>
                        <span className="tour-time">
                          <Clock size={14} />
                          {tour.time}
                        </span>
                      </div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDelete(tour.id, e)}
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="timeline-hint">← 左右滑动查看更多 →</div>
        </div>
      )}

      {showForm && (
        <div className="tour-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="tour-modal scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加新演出</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    演出日期 *
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    min={getTodayDateString()}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Clock size={16} />
                    演出时间 *
                  </label>
                  <input
                    type="time"
                    className="input"
                    value={formData.time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <MapPin size={16} />
                    场地名称 *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.venue}
                    onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                    placeholder="如：MAO Livehouse"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <MapPin size={16} />
                    城市 *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="如：北京"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Ticket size={16} />
                  购票链接 (可选)
                </label>
                <input
                  type="url"
                  className="input"
                  value={formData.ticketLink}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ticketLink: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                <Save size={18} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTour && (
        <div className="tour-modal-overlay" onClick={closeModal}>
          <div className="detail-modal scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>演出详情</h3>
              <button className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="detail-content">
              <div className="detail-hero">
                <div className="detail-date-large">
                  <span className="detail-month">{getMonthDay(selectedTour.date).month}</span>
                  <span className="detail-day">{getMonthDay(selectedTour.date).day}</span>
                </div>
                <div className="detail-hero-info">
                  <h2 className="detail-venue">{selectedTour.venue}</h2>
                  <p className="detail-full-date">{formatDate(selectedTour.date)}</p>
                </div>
              </div>

              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <Clock size={20} className="detail-icon" />
                  <div>
                    <p className="detail-label">演出时间</p>
                    <p className="detail-value">{selectedTour.time}</p>
                  </div>
                </div>
                <div className="detail-info-item">
                  <MapPin size={20} className="detail-icon" />
                  <div>
                    <p className="detail-label">演出城市</p>
                    <p className="detail-value">{selectedTour.city}</p>
                  </div>
                </div>
              </div>

              {selectedTour.ticketLink && (
                <a
                  href={selectedTour.ticketLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary ticket-btn"
                >
                  <Ticket size={18} />
                  立即购票
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourModule;
