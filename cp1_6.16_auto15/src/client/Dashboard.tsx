import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import type { EventStats, Attendance, Event } from './types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  eventId: string;
}

function Dashboard({ eventId }: DashboardProps) {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?eventId=${eventId}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'onlineCount') {
          setOnlineCount(data.count);
        } else if (data.type === 'newAttendance') {
          setRecentAttendance(prev => {
            const updated = [data.attendance, ...prev].slice(0, 50);
            return updated;
          });
        }
      } catch (err) {
        console.error('Parse error:', err);
      }
    };

    wsRef.current = websocket;

    return () => {
      clearInterval(interval);
      websocket.close();
    };
  }, [eventId]);

  useEffect(() => {
    if (listRef.current && recentAttendance.length > 20) {
      listRef.current.scrollTop = 0;
    }
  }, [recentAttendance]);

  const fetchData = async () => {
    try {
      const [statsRes, attendanceRes, eventRes] = await Promise.all([
        fetch(`/api/events/${eventId}/stats`),
        fetch(`/api/events/${eventId}/attendance?limit=50`),
        fetch(`/api/events/${eventId}`)
      ]);

      const statsData = await statsRes.json();
      const attendanceData = await attendanceRes.json();
      const eventData = await eventRes.json();

      setStats(statsData);
      setRecentAttendance(attendanceData);
      setEvent(eventData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const lineChartData = stats ? {
    labels: stats.hourlyDistribution.map(d => `${d.hour}:00`),
    datasets: [{
      label: '签到人数',
      data: stats.hourlyDistribution.map(d => d.count),
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#00d4ff',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4
    }]
  } : null;

  const pieChartData = stats ? {
    labels: ['已签到', '未签到'],
    datasets: [{
      data: [stats.totalAttendance, Math.max(0, stats.expectedCount - stats.totalAttendance)],
      backgroundColor: ['#00d4ff', 'rgba(255, 255, 255, 0.1)'],
      borderColor: ['#00d4ff', 'rgba(255, 255, 255, 0.3)'],
      borderWidth: 2
    }]
  } : null;

  const genderPieData = stats ? {
    labels: ['男', '女'],
    datasets: [{
      data: [stats.maleCount, stats.femaleCount],
      backgroundColor: ['#4facfe', '#f093fb'],
      borderColor: ['#4facfe', '#f093fb'],
      borderWidth: 2
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          font: { size: 12 }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.7)' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        ticks: { color: 'rgba(255,255,255,0.7)' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#fff',
          font: { size: 12 }
        }
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{event?.name || '数据大屏'}</h1>
        <p style={styles.subtitle}>实时签到数据监控</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>签到人数</div>
          <div style={styles.statValue}>{stats?.totalAttendance || 0}</div>
          <div style={styles.statSub}>
            / {stats?.expectedCount || 0} 人
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>在线人数</div>
          <div style={{ ...styles.statValue, fontSize: '4rem' }}>{onlineCount}</div>
          <div style={styles.statSub}>实时连接</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>男女比例</div>
          <div style={styles.statValue}>
            {stats?.maleCount || 0} : {stats?.femaleCount || 0}
          </div>
          <div style={styles.statSub}>
            男性占比: {stats && (stats.maleCount + stats.femaleCount) > 0
              ? Math.round((stats.maleCount / (stats.maleCount + stats.femaleCount)) * 100)
              : 0}%
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>参与率</div>
          <div style={styles.statValue}>
            {stats?.attendanceRate ? stats.attendanceRate.toFixed(1) : 0}%
          </div>
          <div style={styles.statSub}>
            目标进度
          </div>
        </div>
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>签到时间分布</h3>
          <div style={styles.chartContainer}>
            {lineChartData && <Line data={lineChartData} options={chartOptions} />}
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>参与率统计</h3>
          <div style={styles.chartContainer}>
            {pieChartData && <Pie data={pieChartData} options={pieOptions} />}
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>性别分布</h3>
          <div style={styles.chartContainer}>
            {genderPieData && <Pie data={genderPieData} options={pieOptions} />}
          </div>
        </div>
      </div>

      <div style={styles.listCard}>
        <h3 style={styles.chartTitle}>最新签到记录</h3>
        <div ref={listRef} style={styles.listContainer}>
          {recentAttendance.length === 0 ? (
            <div style={styles.emptyState}>暂无签到记录</div>
          ) : (
            recentAttendance.map((record, index) => (
              <div
                key={record.id}
                style={{
                  ...styles.listItem,
                  animation: index === 0 ? 'fadeIn 0.3s ease-in' : 'none'
                }}
              >
                <span style={styles.serialBadge}>#{record.serialNumber}</span>
                <span style={styles.listName}>{record.name}</span>
                <span style={styles.listTime}>{formatTime(record.checkInTime)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    padding: '20px',
    color: 'white'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: '8px',
    textShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#00d4ff',
    textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
    lineHeight: 1
  },
  statSub: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '8px'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '20px',
    marginBottom: '24px'
  },
  chartCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '20px',
    minHeight: '300px'
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: '16px'
  },
  chartContainer: {
    height: '250px',
    position: 'relative'
  },
  listCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '20px'
  },
  listContainer: {
    maxHeight: '300px',
    overflowY: 'auto'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  serialBadge: {
    background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  listName: {
    flex: 1,
    fontSize: '14px',
    color: 'white'
  },
  listTime: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px'
  }
};

export default Dashboard;
