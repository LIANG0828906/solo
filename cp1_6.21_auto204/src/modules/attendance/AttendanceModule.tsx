import { useState, useEffect, useRef, useContext } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ActivityContext } from '../../App';
import type { Activity, AttendanceRecord, Registration } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const AttendanceDashboard = () => {
  const navigate = useNavigate();
  const { currentActivityId, setCurrentActivityId } = useContext(ActivityContext);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>(currentActivityId || '');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    fetch('/api/activity')
      .then((r) => r.json())
      .then((data) => {
        setActivities(data);
        if (data.length > 0 && !selectedActivity) {
          setSelectedActivity(data[0].id);
          setCurrentActivityId(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedActivity) return;
    setCurrentActivityId(selectedActivity);

    const loadData = async () => {
      const [statsRes, regRes] = await Promise.all([
        fetch(`/api/attendance/activity/${selectedActivity}/stats`),
        fetch(`/api/activity/${selectedActivity}/registrations`),
      ]);
      const statsData = await statsRes.json();
      const regData = await regRes.json();

      const totalReg = regData.length;
      const finalStats = await fetch(
        `/api/attendance/activity/${selectedActivity}/stats?totalRegistrations=${totalReg}`
      ).then((r) => r.json());

      setStats(finalStats);
      setRecords(finalStats.records || []);
      setRegistrations(regData);
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [selectedActivity]);

  const handleExport = () => {
    if (!selectedActivity) return;
    window.open(`/api/attendance/activity/${selectedActivity}/export`, '_blank');
  };

  const chartData = {
    labels: stats?.timeDistribution?.map((t: any) => t.time) || [],
    datasets: [
      {
        label: '签到人数',
        data: stats?.timeDistribution?.map((t: any) => t.count) || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10B981',
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255,255,255,0.06)',
          borderDash: [4, 4],
        },
        ticks: { color: '#94A3B8' },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255,255,255,0.06)',
          borderDash: [4, 4],
        },
        ticks: { color: '#94A3B8', stepSize: 1 },
      },
    },
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  const currentActivity = activities.find((a) => a.id === selectedActivity);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>签到统计</h2>
          <div className="subtitle">实时查看签到数据和参与报表</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/attendance/scan" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary">📱 扫码签到</button>
          </Link>
          <Link to="/attendance/display" style={{ textDecoration: 'none' }}>
            <button className="btn btn-secondary">🖥️ 签到大屏</button>
          </Link>
        </div>
      </div>

      <div className="input-group" style={{ maxWidth: 400 }}>
        <label>选择活动</label>
        <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {currentActivity && stats && (
        <>
          <div className="stats-panel" style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="stat-card">
                <div className="stat-title">总报名人数</div>
                <div className="stat-value accent">{stats.totalRegistrations}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">已签到</div>
                <div className="stat-value success">{stats.totalCheckedIn}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">签到率</div>
                <div className="stat-value">
                  {(stats.checkInRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-title">待签到</div>
                <div className="stat-value">
                  {stats.totalRegistrations - stats.totalCheckedIn}
                </div>
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>签到时间分布</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              各时段签到人数统计
            </div>
            <div className="chart-container" style={{ height: 240 }}>
              {stats.timeDistribution?.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  暂无签到数据
                </div>
              )}
            </div>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16 }}>签到记录（{records.length}人）</h3>
              <button className="btn btn-secondary" onClick={handleExport} disabled={records.length === 0}>
                📥 导出 CSV
              </button>
            </div>
            {records.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <h3>暂无签到记录</h3>
              </div>
            ) : (
              <table className="participants-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>签到时间</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
                      <td>{r.name}</td>
                      <td>{new Date(r.checkInTime).toLocaleString('zh-CN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ScannerView = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentActivityId, setCheckInStatus, setLastCheckedIn } = useContext(ActivityContext);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>(currentActivityId || '');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    fetch('/api/activity')
      .then((r) => r.json())
      .then((data) => {
        setActivities(data);
        if (data.length > 0 && !selectedActivity) {
          setSelectedActivity(data[0].id);
        }
      });
  }, []);

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        simulateScan();
      }
    } catch (e) {
      setError('无法访问摄像头，请检查权限设置。您也可以手动输入二维码内容。');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const simulateScan = () => {
    const simulate = () => {
      if (!scanning) return;
      animationRef.current = requestAnimationFrame(simulate);
    };
    animationRef.current = requestAnimationFrame(simulate);
  };

  const handleCheckIn = async (qrCode: string) => {
    if (!qrCode.trim()) {
      setMessage({ type: 'error', text: '请输入二维码内容' });
      return;
    }
    try {
      const regRes = await fetch(`/api/activity/registration/${qrCode.trim()}`);
      let regData: any = null;
      if (regRes.ok) {
        regData = await regRes.json();
      }

      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: qrCode.trim(),
          name: regData?.name || '参与者',
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '签到失败');
      }

      const data = await res.json();
      setLastCheckedIn(data);
      setCheckInStatus('success');
      setMessage({ type: 'success', text: `${regData?.name || '参与者'} 签到成功！` });
      setManualInput('');

      setTimeout(() => {
        setMessage(null);
        setCheckInStatus('idle');
      }, 2500);
    } catch (err: any) {
      setCheckInStatus('error');
      setMessage({ type: 'error', text: err.message });
      setTimeout(() => {
        setMessage(null);
        setCheckInStatus('idle');
      }, 2500);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const demoQRCodes = [
    { label: '模拟签到 1', value: 'evt-demo-1-sample-reg-1' },
    { label: '模拟签到 2', value: 'evt-demo-1-sample-reg-2' },
    { label: '模拟签到 3', value: 'evt-demo-1-sample-reg-3' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>扫码签到</h2>
          <div className="subtitle">扫描参与者二维码完成签到</div>
        </div>
        <Link to="/attendance" style={{ textDecoration: 'none' }}>
          <button className="btn btn-secondary">← 返回统计</button>
        </Link>
      </div>

      <div className="input-group" style={{ maxWidth: 400 }}>
        <label>选择活动</label>
        <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="glass" style={{ padding: 24, maxWidth: 500, margin: '0 auto' }}>
        <div className="scanner-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="scanner-video"
            style={{
              background: '#1E293B',
              minHeight: 300,
              display: scanning ? 'block' : 'none',
            }}
          />
          {scanning && <div className="scanner-frame" />}
          {!scanning && (
            <div
              style={{
                aspectRatio: '4/3',
                background: '#1E293B',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                color: 'var(--text-secondary)',
              }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z"></path>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <p>摄像头未启动</p>
              <button className="btn btn-primary" onClick={startCamera}>
                启动摄像头
              </button>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {scanning && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={stopCamera}>
              停止扫描
            </button>
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            或手动输入二维码内容
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="输入二维码字符串"
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'var(--glass)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: 14,
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckIn(manualInput)}
            />
            <button className="btn btn-primary" onClick={() => handleCheckIn(manualInput)}>
              签到
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            快速模拟（演示用）
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {demoQRCodes.map((d) => (
              <button key={d.value} className="btn btn-secondary" onClick={() => handleCheckIn(d.value)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div
          className="toast-success"
          style={{
            background: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            boxShadow:
              message.type === 'success'
                ? '0 8px 32px rgba(16, 185, 129, 0.4)'
                : '0 8px 32px rgba(239, 68, 68, 0.4)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {message.type === 'success' ? (
              <polyline points="20 6 9 17 4 12"></polyline>
            ) : (
              <>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </>
            )}
          </svg>
          {message.text}
        </div>
      )}
    </div>
  );
};

const BigScreenDisplay = () => {
  const { currentActivityId } = useContext(ActivityContext);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>(currentActivityId || '');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<any>({ totalCheckedIn: 0, totalRegistrations: 0 });
  const [displayRecords, setDisplayRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetch('/api/activity')
      .then((r) => r.json())
      .then((data) => {
        setActivities(data);
        if (data.length > 0) {
          const defaultId = currentActivityId || data[0].id;
          setSelectedActivity(defaultId);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedActivity) return;

    const loadData = async () => {
      const [statsRes, regRes] = await Promise.all([
        fetch(`/api/attendance/activity/${selectedActivity}/stats`),
        fetch(`/api/activity/${selectedActivity}/registrations`),
      ]);
      const statsData = await statsRes.json();
      const regData = await regRes.json();

      const finalStats = await fetch(
        `/api/attendance/activity/${selectedActivity}/stats?totalRegistrations=${regData.length}`
      ).then((r) => r.json());

      const sorted = [...(finalStats.records || [])].sort(
        (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
      );

      setRecords(sorted);
      setStats({
        totalCheckedIn: finalStats.totalCheckedIn,
        totalRegistrations: finalStats.totalRegistrations,
      });
    };

    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [selectedActivity]);

  useEffect(() => {
    setDisplayRecords([]);
    records.forEach((r, i) => {
      setTimeout(() => {
        setDisplayRecords((prev) => {
          if (prev.find((p) => p.id === r.id)) return prev;
          return [...prev, r];
        });
      }, i * 300);
    });
  }, [records.length]);

  const currentActivity = activities.find((a) => a.id === selectedActivity);

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="big-screen">
      <div className="big-screen-header">
        <h1>{currentActivity?.name || '活动签到大屏'}</h1>
        <div className="stats">
          <div className="stat-item">
            <div className="stat-value">{stats.totalRegistrations}</div>
            <div className="stat-label">报名人数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalCheckedIn}</div>
            <div className="stat-label">已签到</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {stats.totalRegistrations > 0
                ? ((stats.totalCheckedIn / stats.totalRegistrations) * 100).toFixed(0)
                : 0}%
            </div>
            <div className="stat-label">签到率</div>
          </div>
        </div>
      </div>

      <div className="waterfall">
        {displayRecords.map((r) => (
          <div key={r.id} className="attendee-card">
            <div className="avatar">{getInitial(r.name)}</div>
            <div className="info">
              <div className="name">{r.name}</div>
              <div className="time">{formatDate(r.checkInTime)}</div>
            </div>
          </div>
        ))}
      </div>

      {displayRecords.length === 0 && (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.5, margin: '0 auto 20px', display: 'block' }}
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h2 style={{ marginBottom: 8 }}>等待签到...</h2>
          <p>参与者扫码后将显示在此处</p>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', gap: 8 }}>
        <Link to="/attendance" style={{ textDecoration: 'none' }}>
          <button
            className="btn btn-secondary"
            style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)' }}
          >
            ← 返回
          </button>
        </Link>
      </div>

      {activities.length > 1 && (
        <div style={{ position: 'fixed', top: 20, right: 20 }}>
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              padding: '10px 36px 10px 14px',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

const AttendanceModule = () => {
  return (
    <Routes>
      <Route path="/" element={<AttendanceDashboard />} />
      <Route path="/scan" element={<ScannerView />} />
      <Route path="/display" element={<BigScreenDisplay />} />
    </Routes>
  );
};

export default AttendanceModule;
