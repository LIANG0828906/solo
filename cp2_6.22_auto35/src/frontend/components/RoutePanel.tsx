import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceArea
} from 'recharts';
import { Copy, ChevronDown, ChevronUp, User, Package } from 'lucide-react';
import useRouteStore from '../store/useRouteStore';

const RoutePanel: React.FC = () => {
  const route = useRouteStore((state) => state.route);
  const teammates = useRouteStore((state) => state.teammates);
  const gearItems = useRouteStore((state) => state.gearItems);
  const weatherData = useRouteStore((state) => state.weatherData);
  const calorieData = useRouteStore((state) => state.calorieData);
  const elevationData = useRouteStore((state) => state.elevationData);
  const userProfile = useRouteStore((state) => state.userProfile);
  const isPanelExpanded = useRouteStore((state) => state.isPanelExpanded);
  const inviteCode = useRouteStore((state) => state.inviteCode);
  const togglePanel = useRouteStore((state) => state.togglePanel);
  const toggleGearItem = useRouteStore((state) => state.toggleGearItem);
  const setUserProfile = useRouteStore((state) => state.setUserProfile);
  const fetchWeather = useRouteStore((state) => state.fetchWeather);
  const fetchGearList = useRouteStore((state) => state.fetchGearList);
  const fetchCalories = useRouteStore((state) => state.fetchCalories);
  const fetchElevation = useRouteStore((state) => state.fetchElevation);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchGearList();
  }, [fetchGearList]);

  useEffect(() => {
    if (route) {
      fetchWeather(route.id);
      fetchElevation(route.id);
      fetchCalories(route.id, userProfile.weight, userProfile.packWeight);
    }
  }, [route, fetchWeather, fetchElevation, fetchCalories, userProfile.weight, userProfile.packWeight]);

  const handleCopyInviteCode = async () => {
    if (inviteCode) {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getWeatherIcon = (condition: string): string => {
    const icons: Record<string, string> = {
      '晴': '☀️',
      '多云': '⛅',
      '阴': '☁️',
      '小雨': '🌧️',
      '阵雨': '🌦️'
    };
    return icons[condition] || '🌤️';
  };

  const difficultSegments = calorieData.reduce<{ start: number; end: number }[]>(
    (segments, point, index) => {
      if (point.isDifficult) {
        const lastSegment = segments[segments.length - 1];
        if (lastSegment && lastSegment.end === index - 1) {
          lastSegment.end = index;
        } else {
          segments.push({ start: index, end: index });
        }
      }
      return segments;
    },
    []
  );

  if (!isPanelExpanded) {
    return (
      <button className="panel-toggle-btn" onClick={togglePanel}>
        <ChevronUp size={24} />
      </button>
    );
  }

  return (
    <div className="route-panel">
      <button className="panel-collapse-btn" onClick={togglePanel}>
        <ChevronDown size={20} />
      </button>

      <div className="panel-section">
        <h3 className="section-title">路线概览</h3>
        <div className="elevation-preview">
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={elevationData}>
              <defs>
                <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="elevation"
                stroke="#2E7D32"
                fill="url(#elevationGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-grid">
          <div className="stat-item">
            <div className="stat-value">{route?.distance?.toFixed(1) || '0'} km</div>
            <div className="stat-label">总距离</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{route ? formatTime(route.estimatedTime) : '0m'}</div>
            <div className="stat-label">预计时间</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{route?.elevationGain || 0} m</div>
            <div className="stat-label">累计爬升</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{route?.elevationLoss || 0} m</div>
            <div className="stat-label">累计下降</div>
          </div>
        </div>
      </div>

      {inviteCode && (
        <div className="panel-section">
          <h3 className="section-title">活动邀请</h3>
          <div className="invite-code-card">
            <div className="invite-code-label">邀请码</div>
            <div className="invite-code-value">{inviteCode}</div>
            <button className="copy-btn" onClick={handleCopyInviteCode}>
              <Copy size={16} />
              <span>{copied ? '已复制' : '复制'}</span>
            </button>
          </div>
        </div>
      )}

      <div className="panel-section">
        <h3 className="section-title">队友列表</h3>
        <div className="teammate-list">
          {teammates.length === 0 ? (
            <div className="empty-state">暂无队友</div>
          ) : (
            teammates.map((teammate) => (
              <div key={teammate.id} className="teammate-item">
                <div className="teammate-avatar">
                  {teammate.avatar ? (
                    <img src={teammate.avatar} alt={teammate.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      <User size={18} color="#999" />
                    </div>
                  )}
                  <span className={`status-dot ${teammate.isOnline ? 'online' : 'offline'}`} />
                </div>
                <div className="teammate-info">
                  <div className="teammate-name">{teammate.name}</div>
                  <div className="teammate-status">
                    {teammate.isOnline ? '在线' : '离线'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">装备清单</h3>
        <div className="gear-list">
          {gearItems.map((item) => (
            <label key={item.id} className="gear-item">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleGearItem(item.id)}
              />
              <span className="gear-name">{item.name}</span>
              <span className="gear-category">{item.category}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">天气预报告</h3>
        <div className="weather-cards">
          {weatherData.map((day) => (
            <div key={day.date} className="weather-card">
              <div className="weather-date">{formatDate(day.date)}</div>
              <div className="weather-icon">{getWeatherIcon(day.condition)}</div>
              <div className="weather-condition">{day.condition}</div>
              <div className="weather-temp">
                {day.tempHigh}° / {day.tempLow}°
              </div>
              <div className="weather-rain">
                💧 {day.rainProbability}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">体能消耗</h3>
        <div className="calorie-chart">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={calorieData}>
              <XAxis
                dataKey="distance"
                tick={{ fontSize: 10, fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [`${value} kcal`, '卡路里']}
                labelFormatter={(label) => `${label} km`}
              />
              {difficultSegments.map((segment, index) => (
                <ReferenceArea
                  key={index}
                  x1={calorieData[segment.start].distance}
                  x2={calorieData[segment.end].distance}
                  fill="#f44336"
                  fillOpacity={0.15}
                />
              ))}
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#FF9800"
                strokeWidth={2}
                dot={{ fill: '#FF9800', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="calorie-total">
          总计消耗：
          <span className="calorie-value">
            {calorieData.reduce((sum, d) => sum + d.calories, 0)} kcal
          </span>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">个人设置</h3>
        <div className="settings-form">
          <div className="setting-item">
            <div className="setting-icon">
              <User size={18} />
            </div>
            <div className="setting-content">
              <label className="setting-label">体重 (kg)</label>
              <input
                type="number"
                value={userProfile.weight}
                onChange={(e) => setUserProfile({ weight: Number(e.target.value) })}
                className="setting-input"
                min="30"
                max="200"
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-icon">
              <Package size={18} />
            </div>
            <div className="setting-content">
              <label className="setting-label">背包重量 (kg)</label>
              <input
                type="number"
                value={userProfile.packWeight}
                onChange={(e) => setUserProfile({ packWeight: Number(e.target.value) })}
                className="setting-input"
                min="0"
                max="50"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .route-panel {
          background: #FAF8F5;
          height: 100%;
          overflow-y: auto;
          padding: 20px;
          position: relative;
          box-sizing: border-box;
        }

        .panel-collapse-btn {
          display: none;
          position: absolute;
          top: 8px;
          right: 8px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          color: #666;
          z-index: 10;
        }

        .panel-toggle-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #2E7D32;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
          z-index: 100;
        }

        .panel-section {
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #2E7D32;
          margin-bottom: 12px;
          font-family: 'Montserrat', sans-serif;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stat-item {
          background: white;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #FF9800;
          font-family: 'Montserrat', sans-serif;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        .elevation-preview {
          background: white;
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 12px;
          height: 80px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .invite-code-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .invite-code-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }

        .invite-code-value {
          font-size: 28px;
          font-weight: 700;
          color: #2E7D32;
          font-family: 'Montserrat', sans-serif;
          letter-spacing: 4px;
          margin-bottom: 12px;
        }

        .copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #2E7D32;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }

        .copy-btn:hover {
          background: #1B5E20;
        }

        .teammate-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .teammate-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 10px 12px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .teammate-avatar {
          position: relative;
          width: 40px;
          height: 40px;
        }

        .teammate-avatar img,
        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .status-dot.online {
          background: #4CAF50;
        }

        .status-dot.offline {
          background: #9E9E9E;
        }

        .teammate-info {
          flex: 1;
        }

        .teammate-name {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        .teammate-status {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }

        .empty-state {
          text-align: center;
          color: #999;
          padding: 20px;
          font-size: 13px;
        }

        .gear-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 200px;
          overflow-y: auto;
        }

        .gear-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .gear-item:hover {
          background: #f5f5f5;
        }

        .gear-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #2E7D32;
          cursor: pointer;
        }

        .gear-name {
          flex: 1;
          font-size: 13px;
          color: #333;
        }

        .gear-category {
          font-size: 11px;
          color: #999;
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .weather-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .weather-card {
          background: white;
          border-radius: 8px;
          padding: 12px 8px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .weather-date {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .weather-icon {
          font-size: 28px;
          margin-bottom: 4px;
        }

        .weather-condition {
          font-size: 12px;
          color: #333;
          margin-bottom: 4px;
        }

        .weather-temp {
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .weather-rain {
          font-size: 11px;
          color: #64B5F6;
        }

        .calorie-chart {
          background: white;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .calorie-total {
          text-align: center;
          font-size: 14px;
          color: #666;
        }

        .calorie-value {
          color: #FF9800;
          font-weight: 700;
          font-size: 18px;
          font-family: 'Montserrat', sans-serif;
          margin-left: 4px;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .setting-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .setting-icon {
          color: #2E7D32;
          background: #E8F5E9;
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .setting-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .setting-label {
          font-size: 12px;
          color: #666;
        }

        .setting-input {
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .setting-input:focus {
          border-color: #2E7D32;
        }

        @media (max-width: 768px) {
          .route-panel {
            padding: 16px;
          }

          .panel-collapse-btn {
            display: flex;
          }

          .weather-cards {
            grid-template-columns: repeat(3, 1fr);
          }

          .stat-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RoutePanel;
