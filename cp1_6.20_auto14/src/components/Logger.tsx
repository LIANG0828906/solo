import { useMemo } from 'react';
import { StudyLog } from '../types';
import { format, parseISO } from 'date-fns';

interface LoggerProps {
  logs: StudyLog[];
}

const loggerContainerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '24px',
};

const dateGroupStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)',
  marginBottom: '16px',
  overflow: 'hidden',
};

const dateHeaderStyle: React.CSSProperties = {
  padding: '16px 20px',
  backgroundColor: '#F0F4F8',
  borderBottom: '1px solid #E0E8F0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const logItemStyle: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid #F0F4F8',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'background-color 0.2s ease',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#999',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)',
  flex: 1,
  textAlign: 'center',
};

const statsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginBottom: '24px',
};

function Logger({ logs }: LoggerProps) {
  const logsByDate = useMemo(() => {
    const map: Record<string, StudyLog[]> = {};
    logs.forEach((log) => {
      if (!map[log.date]) {
        map[log.date] = [];
      }
      map[log.date].push(log);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .reduce((acc, [date, dayLogs]) => {
        acc[date] = dayLogs.sort((a, b) => b.startTime.localeCompare(a.startTime));
        return acc;
      }, {} as Record<string, StudyLog[]>);
  }, [logs]);

  const totalStats = useMemo(() => {
    const totalMinutes = logs.reduce((sum, log) => sum + log.duration, 0);
    const totalSessions = logs.length;
    const daysStudied = Object.keys(logsByDate).length;

    return {
      totalMinutes,
      totalSessions,
      daysStudied,
      avgMinutesPerDay: daysStudied > 0 ? Math.round(totalMinutes / daysStudied) : 0,
    };
  }, [logs, logsByDate]);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}小时${mins > 0 ? mins + '分钟' : ''}`;
    }
    return `${mins}分钟`;
  };

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return '今天';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return '昨天';
    } else {
      return format(date, 'yyyy年MM月dd日 EEEE');
    }
  };

  const getDayTotalMinutes = (dayLogs: StudyLog[]) => {
    return dayLogs.reduce((sum, log) => sum + log.duration, 0);
  };

  return (
    <div style={loggerContainerStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '8px' }}>
          📝 学习日志
        </h2>
        <p style={{ fontSize: '14px', color: '#666' }}>
          记录你的每一次专注，见证成长的足迹
        </p>
      </div>

      <div style={statsContainerStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4A90D9', marginBottom: '4px' }}>
            {totalStats.totalSessions}
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>总专注次数</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3CB371', marginBottom: '4px' }}>
            {formatTime(totalStats.totalMinutes)}
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>总学习时长</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFA500', marginBottom: '4px' }}>
            {totalStats.daysStudied}
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>学习天数</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9370DB', marginBottom: '4px' }}>
            {formatTime(totalStats.avgMinutesPerDay)}
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>日均时长</div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>
            还没有学习记录
          </h3>
          <p style={{ fontSize: '14px', color: '#999' }}>
            去番茄钟开始你的第一次专注学习吧！
          </p>
        </div>
      ) : (
        Object.entries(logsByDate).map(([date, dayLogs]) => (
          <div key={date} style={dateGroupStyle}>
            <div style={dateHeaderStyle}>
              <div>
                <span style={{ fontWeight: 600, color: '#333', fontSize: '15px' }}>
                  {formatDate(date)}
                </span>
                <span style={{ fontSize: '13px', color: '#999', marginLeft: '10px' }}>
                  {date}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#4A90D9', fontWeight: 500 }}>
                {dayLogs.length} 次 · {formatTime(getDayTotalMinutes(dayLogs))}
              </div>
            </div>

            {dayLogs.map((log) => (
              <div
                key={log.id}
                style={logItemStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#F0F4F8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    🍅
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>
                      {log.subject || '自由学习'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                      {log.startTime} - {log.endTime}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#4A90D9',
                  }}
                >
                  {log.duration} 分钟
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default Logger;
