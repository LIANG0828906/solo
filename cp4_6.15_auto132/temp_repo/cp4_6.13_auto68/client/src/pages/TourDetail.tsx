import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTourStore } from '@/store/tourStore';
import MapView from '@/components/MapView';
import type { City, AttendanceStatus } from '@/types';
import { findNearestCity, CHINA_CITIES } from '@/constants/cities';
import './TourDetail.css';

type TabType = 'timeline' | 'setlist' | 'schedule';

const TourDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    tours,
    members,
    setlists,
    currentMemberId,
    fetchTours,
    fetchMembers,
    fetchSetlists,
    updateCity,
    addCity,
    updateAttendance,
    bindSetlist,
  } = useTourStore();

  const tour = tours.find((t) => t.id === id);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityForm, setCityForm] = useState({
    venue: '',
    date: '',
    time: '',
    posterUrl: '',
  });
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchTours();
    fetchMembers();
    fetchSetlists();
  }, [fetchTours, fetchMembers, fetchSetlists]);

  const sortedCities = useMemo(
    () => (tour ? [...tour.cities].sort((a, b) => a.order - b.order) : []),
    [tour]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleCityClick = useCallback(
    (city: City) => {
      setEditingCity(city);
      setCityForm({
        venue: city.venue || '',
        date: city.date || '',
        time: city.time || '',
        posterUrl: city.posterUrl || '',
      });
    },
    []
  );

  const handleMapClick = useCallback(
    async (cityData: Omit<City, 'id' | 'order'>) => {
      if (!tour) return;
      if (tour.cities.length >= 10) {
        showToast('最多只能添加10个城市');
        return;
      }
      const newCity: City = {
        ...cityData,
        id: `city-${Date.now()}`,
        order: tour.cities.length,
        attendance: {},
      };
      await addCity(tour.id, newCity);
      showToast(`已添加城市：${cityData.name}`);
    },
    [tour, addCity, showToast]
  );

  const handleSaveCity = useCallback(async () => {
    if (!tour || !editingCity) return;
    await updateCity(tour.id, editingCity.id, cityForm);
    setEditingCity(null);
    showToast('已保存场次信息');
  }, [tour, editingCity, cityForm, updateCity, showToast]);

  const handleAttendanceChange = useCallback(
    async (cityId: string, memberId: string, status: AttendanceStatus) => {
      if (!tour) return;
      await updateAttendance(tour.id, cityId, memberId, status);
    },
    [tour, updateAttendance]
  );

  const handleBindSetlist = useCallback(
    async (cityId: string, setlistId: string, type: 'main' | 'encore') => {
      if (!tour) return;
      await bindSetlist(tour.id, cityId, setlistId, type);
      showToast(`已绑定${type === 'main' ? '主' : '安可'}歌单`);
    },
    [tour, bindSetlist, showToast]
  );

  if (!tour) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎫</div>
        <div className="empty-title">巡演未找到</div>
        <div className="empty-desc">该巡演可能已被删除</div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 20 }}
          onClick={() => navigate('/')}
        >
          返回仪表盘
        </button>
      </div>
    );
  }

  const renderTimeline = () => (
    <div className="timeline-container">
      {sortedCities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <div className="empty-title">暂无场次</div>
          <div className="empty-desc">点击左侧地图空白处添加城市</div>
        </div>
      ) : (
        sortedCities.map((city, idx) => (
          <div key={city.id} className="timeline-item">
            <div className="timeline-connector">
              <div className="timeline-node">
                <span>{city.order + 1}</span>
              </div>
              {idx < sortedCities.length - 1 && <div className="timeline-line" />}
            </div>
            <div
              className={`timeline-card ${expandedCard === city.id ? 'expanded' : ''}`}
              onMouseEnter={() => setExpandedCard(city.id)}
              onMouseLeave={() => setExpandedCard(null)}
              onClick={() => handleCityClick(city)}
            >
              <div className="timeline-card-inner">
                <div className="timeline-main">
                  <div className="timeline-city">{city.name}</div>
                  <div className="timeline-venue">
                    <span>📍</span>
                    {city.venue || '待确认场地'}
                  </div>
                  <div className="timeline-date">
                    <span>📅</span>
                    {city.date || '待定'}
                    {city.time && <span className="timeline-time"> · {city.time}</span>}
                  </div>
                </div>
                <div className="timeline-extra">
                  {city.posterUrl ? (
                    <div className="poster-thumb">
                      <img src={city.posterUrl} alt="海报" />
                    </div>
                  ) : (
                    <div className="poster-placeholder">🎤 暂无海报</div>
                  )}
                  <div className="timeline-edit-hint">点击编辑 →</div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderSetlistTab = () => (
    <div className="setlist-bind-container">
      {sortedCities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <div className="empty-title">暂无可绑定的场次</div>
        </div>
      ) : (
        sortedCities.map((city) => (
          <div key={city.id} className="setlist-bind-card card">
            <div className="setlist-bind-header">
              <span className="setlist-bind-city">🎸 {city.name}站</span>
              <span className="setlist-bind-order">第{city.order + 1}场</span>
            </div>
            <div className="setlist-bind-group">
              <label className="label">主歌单</label>
              <select
                className="select"
                value={city.setlistId || ''}
                onChange={(e) =>
                  handleBindSetlist(city.id, e.target.value, 'main')
                }
              >
                <option value="">-- 选择主歌单 --</option>
                {setlists
                  .filter((s) => s.type === 'main')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.songs.length}首)
                    </option>
                  ))}
              </select>
            </div>
            <div className="setlist-bind-group">
              <label className="label">安可歌单</label>
              <select
                className="select"
                value={city.encoreSetlistId || ''}
                onChange={(e) =>
                  handleBindSetlist(city.id, e.target.value, 'encore')
                }
              >
                <option value="">-- 选择安可歌单 --</option>
                {setlists
                  .filter((s) => s.type === 'encore')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.songs.length}首)
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderScheduleTab = () => (
    <div className="schedule-container">
      {sortedCities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">暂无可排期的场次</div>
        </div>
      ) : (
        sortedCities.map((city) => (
          <div key={city.id} className="schedule-city-card card">
            <div className="schedule-city-header">
              <div>
                <span className="schedule-city-name">🎪 {city.name}</span>
                <span className="schedule-city-date">
                  {city.date || '日期待定'}
                </span>
              </div>
              <span className="badge badge-purple">第{city.order + 1}场</span>
            </div>
            <div className="schedule-table">
              <div className="schedule-table-header">
                <span>成员</span>
                <span>角色</span>
                <span>参与状态</span>
              </div>
              {members.map((member) => {
                const status =
                  city.attendance?.[member.id] || 'pending';
                return (
                  <div key={member.id} className="schedule-table-row">
                    <div className="schedule-member">
                      <div className="member-avatar">
                        {member.name.slice(-1)}
                      </div>
                      <span>{member.name}</span>
                    </div>
                    <span className="schedule-role">{member.role}</span>
                    <div className="schedule-buttons">
                      <button
                        className={`btn btn-sm btn-attend ${
                          status === 'attend' ? 'btn-active' : ''
                        }`}
                        onClick={() =>
                          handleAttendanceChange(city.id, member.id, 'attend')
                        }
                      >
                        参加
                      </button>
                      <button
                        className={`btn btn-sm btn-decline ${
                          status === 'decline' ? 'btn-active' : ''
                        }`}
                        onClick={() =>
                          handleAttendanceChange(city.id, member.id, 'decline')
                        }
                      >
                        不参加
                      </button>
                      <button
                        className={`btn btn-sm btn-pending ${
                          status === 'pending' ? 'btn-active' : ''
                        }`}
                        onClick={() =>
                          handleAttendanceChange(city.id, member.id, 'pending')
                        }
                      >
                        待定
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="tour-detail-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="detail-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 12 }}
            onClick={() => navigate('/')}
          >
            ← 返回仪表盘
          </button>
          <h1 className="page-title" style={{ marginBottom: 8 }}>
            {tour.name}
          </h1>
          <div className="tour-meta">
            <span
              className="route-color-dot"
              style={{ background: tour.routeColor }}
            />
            <span>{sortedCities.length} 个城市</span>
            <span className="meta-divider">·</span>
            <span>创建于 {tour.createdAt}</span>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <div className="map-section">
          <div className="section-header">
            <span className="section-title" style={{ marginBottom: 0 }}>
              🗺️ 巡演路线地图
            </span>
            <span className="map-hint">点击空白处可添加附近城市</span>
          </div>
          <div className="map-wrapper">
            <MapView
              tourId={tour.id}
              cities={tour.cities}
              routeColor={tour.routeColor}
              onCityClick={handleCityClick}
              onMapClick={handleMapClick}
            />
          </div>
        </div>

        <div className="panel-section">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              📋 场次时间线
            </button>
            <button
              className={`tab ${activeTab === 'setlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('setlist')}
            >
              🎵 歌单绑定
            </button>
            <button
              className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              👥 成员排期
            </button>
          </div>

          <div className="panel-content">
            {activeTab === 'timeline' && renderTimeline()}
            {activeTab === 'setlist' && renderSetlistTab()}
            {activeTab === 'schedule' && renderScheduleTab()}
          </div>
        </div>
      </div>

      {editingCity && (
        <div className="modal-overlay" onClick={() => setEditingCity(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">编辑场次 · {editingCity.name}</h3>
              <button className="modal-close" onClick={() => setEditingCity(null)}>
                ✕
              </button>
            </div>

            <div className="form-group">
              <label className="label">场地名称</label>
              <input
                className="input"
                placeholder="例如：工人体育馆"
                value={cityForm.venue}
                onChange={(e) =>
                  setCityForm({ ...cityForm, venue: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">演出日期</label>
                <input
                  type="date"
                  className="input"
                  value={cityForm.date}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, date: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">演出时间</label>
                <input
                  type="time"
                  className="input"
                  value={cityForm.time}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">海报图片 URL</label>
              <input
                className="input"
                placeholder="https://..."
                value={cityForm.posterUrl}
                onChange={(e) =>
                  setCityForm({ ...cityForm, posterUrl: e.target.value })
                }
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setEditingCity(null)}
              >
                取消
              </button>
              <button className="btn btn-gold" onClick={handleSaveCity}>
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourDetail;
