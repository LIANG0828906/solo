import { useStore } from '../store';
import { ReminderCard } from './ReminderCard';
import './ReminderPanel.css';

export function ReminderPanel() {
  const reminders = useStore(state => state.reminders);
  const weather = useStore(state => state.weather);
  const refreshWeather = useStore(state => state.refreshWeather);
  const plants = useStore(state => state.plants);

  const overdueCount = reminders.filter(r => r.daysLeft < 0).length;
  const todayCount = reminders.filter(r => r.daysLeft >= 0 && r.daysLeft <= 1).length;
  const upcomingCount = reminders.filter(r => r.daysLeft > 1 && r.daysLeft <= 3).length;

  return (
    <div className="reminder-panel">
      <div className="panel-header">
        <div>
          <h1 className="panel-title">🔔 养护提醒</h1>
          <p className="panel-subtitle">共 {reminders.length} 条待办提醒</p>
        </div>
        <div className="weather-info">
          <div className="weather-temp">
            <span className="weather-icon">🌡️</span>
            <span>{weather.temperature}°C</span>
          </div>
          <div className="weather-forecast">
            {weather.forecast.map(f => (
              <div key={f.day} className="forecast-item">
                <span>D+{f.day}</span>
                <span className={f.rainProbability > 60 ? 'rain-high' : ''}>
                  {f.rainProbability > 60 ? '🌧️' : '☀️'} {f.rainProbability}%
                </span>
              </div>
            ))}
          </div>
          <button className="refresh-btn" onClick={refreshWeather}>
            🔄 刷新
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card stat-overdue">
          <span className="stat-count">{overdueCount}</span>
          <span className="stat-label">已超期</span>
        </div>
        <div className="stat-card stat-today">
          <span className="stat-count">{todayCount}</span>
          <span className="stat-label">今日到期</span>
        </div>
        <div className="stat-card stat-upcoming">
          <span className="stat-count">{upcomingCount}</span>
          <span className="stat-label">未来3天</span>
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="empty-reminders">
          <span className="empty-emoji">🎉</span>
          <p>太棒了！暂无待办养护任务</p>
        </div>
      ) : (
        <div className="reminders-list">
          {reminders.map(reminder => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </div>
  );
}
