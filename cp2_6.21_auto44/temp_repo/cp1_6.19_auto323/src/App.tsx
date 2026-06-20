import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from './store';
import EventCard from './components/EventCard';
import EventDetail from './components/EventDetail';
import { CreateEventData, Event } from './types';
import { format } from 'date-fns';
import './App.css';

const PAGE_SIZE = 10;

function Dashboard() {
  const events = useStore((s) => s.events);

  const stats = useMemo(() => {
    const totalEvents = events.length;
    const totalSignups = events.reduce((sum, e) => sum + e.currentParticipants, 0);
    const totalCapacity = events.reduce((sum, e) => sum + e.maxParticipants, 0);
    const avgRate = totalCapacity > 0 ? ((totalSignups / totalCapacity) * 100).toFixed(1) : '0.0';
    const mostPopular = events.length > 0
      ? [...events].sort((a, b) => b.likes - a.likes)[0]
      : null;
    const today = format(new Date(), 'yyyy-MM-dd');
    const expiringToday = events.filter((e) => e.date === today).length;
    return { totalEvents, totalSignups, avgRate, mostPopular, expiringToday };
  }, [events]);

  return (
    <div className="dashboard-panel">
      <h3>数据看板</h3>
      <div className="dashboard-item">
        <span className="dashboard-label">当前总活动数</span>
        <span className="dashboard-value">{stats.totalEvents}</span>
      </div>
      <div className="dashboard-item">
        <span className="dashboard-label">总报名人次</span>
        <span className="dashboard-value">{stats.totalSignups}</span>
      </div>
      <div className="dashboard-item">
        <span className="dashboard-label">平均报名率</span>
        <span className="dashboard-value">{stats.avgRate}%</span>
      </div>
      <div className="dashboard-item">
        <span className="dashboard-label">最受欢迎活动</span>
        <span className="dashboard-value dashboard-popular">
          {stats.mostPopular ? stats.mostPopular.title : '-'}
        </span>
      </div>
      <div className="dashboard-item">
        <span className="dashboard-label">今天到期活动</span>
        <span className="dashboard-value">{stats.expiringToday}</span>
      </div>
    </div>
  );
}

function CreateEventForm() {
  const createEvent = useStore((s) => s.createEvent);
  const setShowCreateForm = useStore((s) => s.setShowCreateForm);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location || !description) return;
    const data: CreateEventData = {
      title,
      date,
      time,
      location,
      description,
      maxParticipants,
    };
    createEvent(data);
  };

  return (
    <div className="create-form-wrapper">
      <div className="create-form-header">
        <h2>创建新活动</h2>
        <button className="btn-close" onClick={() => setShowCreateForm(false)}>✕</button>
      </div>
      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>活动标题</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>时间</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label>地点</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>上限人数</label>
          <div className="stepper">
            <button type="button" onClick={() => setMaxParticipants(Math.max(10, maxParticipants - 1))}>−</button>
            <span className="stepper-value">{maxParticipants}</span>
            <button type="button" onClick={() => setMaxParticipants(Math.min(50, maxParticipants + 1))}>+</button>
          </div>
        </div>
        <div className="form-group">
          <label>活动简介（最多200字）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
            maxLength={200}
            rows={4}
            required
          />
          <span className="char-count">{description.length}/200</span>
        </div>
        <button type="submit" className="btn-submit">提交活动</button>
      </form>
    </div>
  );
}

function ConfirmDialog() {
  const confirmDialog = useStore((s) => s.confirmDialog);
  const signUp = useStore((s) => s.signUp);
  const cancelSignUp = useStore((s) => s.cancelSignUp);

  if (!confirmDialog?.show) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <p>您确定要报名「{confirmDialog.title}」吗？</p>
        <div className="confirm-actions">
          <button className="btn-confirm" onClick={() => signUp(confirmDialog.eventId)}>确认</button>
          <button className="btn-cancel" onClick={cancelSignUp}>取消</button>
        </div>
      </div>
    </div>
  );
}

function Notification() {
  const notification = useStore((s) => s.notification);
  if (!notification) return null;
  return <div className="notification-bubble">{notification}</div>;
}

export default function App() {
  const {
    events,
    selectedEvent,
    onlineCount,
    currentPage,
    showCreateForm,
    dashboardOpen,
    newEventId,
    init,
    fetchEvents,
    selectEvent,
    setCurrentPage,
    setShowCreateForm,
    setDashboardOpen,
  } = useStore();

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    init();
    fetchEvents();
  }, []);

  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  const pagedEvents = events.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSelectEvent = (event: Event) => {
    selectEvent(event);
    setDrawerOpen(false);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <button className="drawer-toggle" onClick={() => setDrawerOpen(!drawerOpen)}>
          {drawerOpen ? '✕' : '☰'}
        </button>
        <h1 className="navbar-title">📖 读书圈</h1>
        <div className="navbar-right">
          <span className="online-badge">
            <span className={`online-dot ${useStore.getState().connected ? 'connected' : ''}`} />
            在线 {onlineCount}
          </span>
          <button
            className="dashboard-toggle"
            onClick={() => setDashboardOpen(!dashboardOpen)}
            title="数据看板"
          >
            {dashboardOpen ? '◀' : '▶'} 📊
          </button>
        </div>
      </nav>

      <div className="main-content">
        <aside className={`sidebar ${drawerOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-header">
            <button className="btn-create" onClick={() => setShowCreateForm(true)}>
              + 创建活动
            </button>
          </div>
          <div className="event-list">
            {pagedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isNew={event.id === newEventId}
                isSelected={selectedEvent?.id === event.id}
                onSelect={handleSelectEvent}
              />
            ))}
            {events.length === 0 && <p className="empty-hint">暂无活动</p>}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                上一页
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </aside>

        <div className="content-area">
          {showCreateForm && <CreateEventForm />}
          {selectedEvent && !showCreateForm && (
            <div className="detail-layout">
              <div className="detail-info" style={{ flex: dashboardOpen ? '0 0 60%' : 1 }}>
                <EventDetail />
              </div>
              {dashboardOpen && (
                <div className="detail-dashboard">
                  <Dashboard />
                </div>
              )}
            </div>
          )}
          {!selectedEvent && !showCreateForm && (
            <div className="welcome">
              <div className="welcome-icon">📚</div>
              <h2>欢迎来到读书圈</h2>
              <p>从左侧选择一个活动，或创建新活动开始分享阅读的快乐</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog />
      <Notification />
    </div>
  );
}
