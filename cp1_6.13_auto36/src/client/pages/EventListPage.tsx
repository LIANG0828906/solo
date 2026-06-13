import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EventList from '../components/EventList';
import { eventAPI } from '../services/api';
import type { Event } from '../types';

const PAGE_SIZE = 20;

export default function EventListPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [preloadedEvents, setPreloadedEvents] = useState<Event[] | null>(null);

  const fetchEvents = useCallback(async (p: number, status: string, kw: string) => {
    setLoading(true);
    try {
      const result = await eventAPI.list(p, PAGE_SIZE, status === 'all' ? undefined : status, kw || undefined);
      setEvents(result.events);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setFadeKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const preloadNextPage = useCallback(async (p: number, status: string, kw: string) => {
    try {
      const result = await eventAPI.list(p + 1, PAGE_SIZE, status === 'all' ? undefined : status, kw || undefined);
      setPreloadedEvents(result.events);
    } catch {
      setPreloadedEvents(null);
    }
  }, []);

  useEffect(() => {
    fetchEvents(page, statusFilter, keyword);
  }, [page, statusFilter, keyword, fetchEvents]);

  useEffect(() => {
    if (hasMore) {
      preloadNextPage(page, statusFilter, keyword);
    } else {
      setPreloadedEvents(null);
    }
  }, [page, statusFilter, keyword, hasMore, preloadNextPage]);

  const handlePageChange = (newPage: number) => {
    if (preloadedEvents && newPage === page + 1) {
      setEvents(preloadedEvents);
      setFadeKey(prev => prev + 1);
      setPreloadedEvents(null);
    }
    setPage(newPage);
  };

  const handleEventClick = (event: Event) => {
    navigate(`/events/${event.id}`);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">活动列表</h1>
          <p className="page-subtitle">共 {total} 个活动</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/events/create')}>
          ➕ 创建活动
        </button>
      </div>

      <div className="filters">
        <div className="filter-group">
          {[
            { value: 'all', label: '全部' },
            { value: 'ongoing', label: '进行中' },
            { value: 'upcoming', label: '即将开始' },
            { value: 'ended', label: '已结束' },
          ].map(filter => (
            <button
              key={filter.value}
              className={'filter-tab' + (statusFilter === filter.value ? ' active' : '')}
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(1);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <input
          className="search-input"
          type="text"
          placeholder="🔍 搜索活动标题或地点..."
          value={keyword}
          onChange={e => {
            setKeyword(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading && events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <div className="empty-text">加载中...</div>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-text">暂无活动，点击右上角按钮创建第一个活动</div>
        </div>
      ) : (
        <>
          <EventList key={fadeKey} events={events} onEventClick={handleEventClick} />
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let displayPage = i + 1;
              if (totalPages > 5) {
                if (page > 3) {
                  displayPage = page - 2 + i;
                  if (displayPage > totalPages) displayPage = totalPages - (4 - i);
                }
              }
              return (
                <button
                  key={displayPage}
                  className={'page-btn' + (page === displayPage ? ' active' : '')}
                  onClick={() => handlePageChange(displayPage)}
                >
                  {displayPage}
                </button>
              );
            })}
            <button
              className="page-btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              ›
            </button>
          </div>
        </>
      )}
    </div>
  );
}
