import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTourStore } from '@/store/tourStore';
import MapView from '@/components/MapView';
import type { City, Tour } from '@/types';
import './Dashboard.css';

interface CityWithTour extends City {
  tourId: string;
  tourName: string;
  routeColor: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tours, members, currentMemberId, fetchTours, fetchMembers } = useTourStore();

  useEffect(() => {
    fetchTours();
    fetchMembers();
  }, [fetchTours, fetchMembers]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inSevenDays = new Date(today);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const allCities = useMemo(() => {
    const cities: CityWithTour[] = [];
    tours.forEach((tour) => {
      tour.cities.forEach((city) => {
        cities.push({
          ...city,
          tourId: tour.id,
          tourName: tour.name,
          routeColor: tour.routeColor,
        });
      });
    });
    return cities.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [tours]);

  const upcoming = useMemo(
    () =>
      allCities.filter((c) => {
        if (!c.date) return false;
        const d = new Date(c.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() >= today.getTime() && d.getTime() <= inSevenDays.getTime();
      }),
    [allCities, today, inSevenDays]
  );

  const pending = useMemo(
    () =>
      allCities.filter((c) => {
        const status = c.attendance?.[currentMemberId];
        return status === 'pending';
      }),
    [allCities, currentMemberId]
  );

  const history = useMemo(
    () =>
      allCities.filter((c) => {
        if (!c.date) return false;
        const d = new Date(c.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() < today.getTime();
      }),
    [allCities, today]
  );

  const currentMember = members.find((m) => m.id === currentMemberId);

  const renderCard = (city: CityWithTour, type: 'upcoming' | 'pending' | 'history') => {
    const gradient =
      type === 'upcoming'
        ? 'var(--blue-gradient)'
        : type === 'pending'
        ? 'var(--orange-gradient)'
        : 'var(--gray-gradient)';

    return (
      <div
        key={`${city.tourId}-${city.id}`}
        className="dashboard-card"
        style={{ background: gradient }}
        onClick={() => navigate(`/tour/${city.tourId}`)}
      >
        <div className="card-header-row">
          <span className="card-city">{city.name}</span>
          <span className="card-order">第{city.order + 1}站</span>
        </div>
        <div className="card-venue">
          <span className="venue-icon">📍</span>
          {city.venue || '待确认场地'}
        </div>
        <div className="card-date">
          <span className="date-icon">📅</span>
          {city.date || '待定'}
          {city.time && <span className="card-time"> · {city.time}</span>}
        </div>
        <div className="card-tour-name">{city.tourName}</div>
        <div className="card-map-preview">
          <MapView
            tourId={city.tourId}
            cities={tours.find((t) => t.id === city.tourId)?.cities || []}
            routeColor={city.routeColor}
            onCityClick={() => {}}
            interactive={false}
            height="100%"
          />
        </div>
        <div className="card-arrow">查看详情 →</div>
      </div>
    );
  };

  const renderColumn = (
    title: string,
    icon: string,
    cities: CityWithTour[],
    type: 'upcoming' | 'pending' | 'history',
    badgeClass: string
  ) => (
    <div className="dashboard-column">
      <div className="column-header">
        <div className="column-title-wrap">
          <span className="column-icon">{icon}</span>
          <span className="column-title">{title}</span>
        </div>
        <span className={`badge ${badgeClass}`}>{cities.length}</span>
      </div>
      <div className="column-cards">
        {cities.length === 0 ? (
          <div className="empty-mini">
            <span className="empty-mini-icon">🎵</span>
            <span className="empty-mini-text">暂无相关场次</span>
          </div>
        ) : (
          cities.map((c) => renderCard(c, type))
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">仪表盘</h1>
          <p className="dashboard-subtitle">
            欢迎回来，
            <span className="highlight-name">
              {currentMember?.name || '成员'}
            </span>
            （{currentMember?.role}）
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-num">{tours.length}</span>
            <span className="stat-label">巡演</span>
          </div>
          <div className="stat-item">
            <span className="stat-num">{members.length}</span>
            <span className="stat-label">成员</span>
          </div>
          <div className="stat-item">
            <span className="stat-num">{allCities.length}</span>
            <span className="stat-label">总场次</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {renderColumn('即将到来', '🎸', upcoming, 'upcoming', 'badge-purple')}
        {renderColumn('待确认', '⏳', pending, 'pending', 'badge-orange')}
        {renderColumn('历史场次', '📜', history, 'history', 'badge-green')}
      </div>
    </div>
  );
};

export default Dashboard;
