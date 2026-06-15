import { memo, useEffect, useState, useMemo } from 'react';
import { ArrowLeft, MapPin, Star, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useJournalStore } from '../../store/useJournalStore';
import { TasteProfile } from '../../types';
import RadarChart from '../radar/RadarChart';
import CalendarHeatmap from '../calendar/CalendarHeatmap';
import './ProfilePage.css';

const ProfilePage = memo(function ProfilePage() {
  const navigate = useNavigate();
  const { entries, radarData, calendarData, fetchRadarData, fetchCalendarData, isLoading } = useJournalStore();
  const [selectedYear] = useState(2026);

  useEffect(() => {
    fetchRadarData();
    fetchCalendarData(selectedYear);
  }, [fetchRadarData, fetchCalendarData, selectedYear]);

  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const avgRating = totalEntries > 0
      ? entries.reduce((sum, e) => sum + e.rating, 0) / totalEntries
      : 0;
    const uniqueCities = new Set(entries.map(e => `${e.latitude.toFixed(2)},${e.longitude.toFixed(2)}`)).size;
    
    const cuisineCounts = entries.reduce((acc, e) => {
      e.cuisineTags.forEach(c => {
        acc[c] = (acc[c] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    const cuisineStats = Object.entries(cuisineCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalEntries) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return { totalEntries, avgRating, uniqueCities, cuisineStats };
  }, [entries]);

  const defaultRadarData: TasteProfile = {
    sour: 0,
    sweet: 0,
    spicy: 0,
    salty: 0,
    umami: 0,
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">个人中心</h1>
        <div style={{ width: 40 }} />
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=foodie"
            alt="美食探险家"
            className="profile-avatar"
          />
          <h2 className="profile-name">美食探险家</h2>

          <div className="profile-stats">
            <div className="stat-item">
              <Utensils className="stat-icon" size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.totalEntries}</span>
                <span className="stat-label">食记</span>
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-item">
              <Star className="stat-icon" size={20} fill="#f59e0b" />
              <div className="stat-info">
                <span className="stat-value">{stats.avgRating.toFixed(1)}</span>
                <span className="stat-label">平均分</span>
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-item">
              <MapPin className="stat-icon" size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.uniqueCities}</span>
                <span className="stat-label">城市</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h3 className="section-title">口味雷达</h3>
          {isLoading && !radarData ? (
            <div className="loading-placeholder">加载中...</div>
          ) : (
            <RadarChart data={radarData || defaultRadarData} size={260} />
          )}
        </div>

        <div className="section-card">
          <h3 className="section-title">年度足迹</h3>
          <CalendarHeatmap data={calendarData} year={selectedYear} />
        </div>

        {stats.cuisineStats.length > 0 && (
          <div className="section-card">
            <h3 className="section-title">偏好菜系</h3>
            <div className="cuisine-stats">
              {stats.cuisineStats.map((item) => (
                <div key={item.name} className="cuisine-stat-item">
                  <div className="cuisine-stat-header">
                    <span className="cuisine-name">{item.name}</span>
                    <span className="cuisine-count">{item.count}次</span>
                  </div>
                  <div className="cuisine-stat-bar">
                    <div
                      className="cuisine-stat-fill"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ProfilePage;
