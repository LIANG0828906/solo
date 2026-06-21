import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface DailyStats {
  date: string;
  avgTime: number;
  avgAccuracy: number;
  count: number;
}

const StatsChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalGames: 0,
    avgTime: 0,
    avgAccuracy: 0,
    bestTime: Infinity,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/stats/week');
      const data = res.data as DailyStats[];
      setStats(data);

      let totalGames = 0;
      let totalTime = 0;
      let totalAcc = 0;
      let best = Infinity;

      data.forEach((d) => {
        totalGames += d.count;
        totalTime += d.avgTime * d.count;
        totalAcc += d.avgAccuracy * d.count;
        if (d.avgTime < best && d.avgTime > 0) best = d.avgTime;
      });

      setOverallStats({
        totalGames,
        avgTime: totalGames > 0 ? parseFloat((totalTime / totalGames).toFixed(1)) : 0,
        avgAccuracy: totalGames > 0 ? parseFloat((totalAcc / totalGames).toFixed(1)) : 0,
        bestTime: best === Infinity ? 0 : parseFloat(best.toFixed(1)),
      });
    } catch (err) {
      console.log('获取统计数据失败（服务器可能未启动），使用模拟数据');
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const mock: DailyStats[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      mock.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        avgTime: 30 + Math.random() * 50,
        avgAccuracy: 60 + Math.random() * 35,
        count: Math.floor(Math.random() * 5) + 1,
      });
    }
    setStats(mock);

    let totalGames = 0;
    let totalTime = 0;
    let totalAcc = 0;
    let best = Infinity;
    mock.forEach((d) => {
      totalGames += d.count;
      totalTime += d.avgTime * d.count;
      totalAcc += d.avgAccuracy * d.count;
      if (d.avgTime < best) best = d.avgTime;
    });
    setOverallStats({
      totalGames,
      avgTime: totalGames > 0 ? parseFloat((totalTime / totalGames).toFixed(1)) : 0,
      avgAccuracy: totalGames > 0 ? parseFloat((totalAcc / totalGames).toFixed(1)) : 0,
      bestTime: parseFloat(best.toFixed(1)),
    });
  };

  useEffect(() => {
    if (stats.length > 0) {
      drawChart();
    }
  }, [stats]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth < 768;
    const width = isMobile ? 320 : 600;
    const height = isMobile ? 280 : 360;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 40, right: 60, bottom: 50, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxTime = Math.max(...stats.map((s) => s.avgTime), 10) * 1.15;
    const maxAcc = 100;
    const minTime = 0;

    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const timeVal = maxTime - ((maxTime - minTime) / 5) * i;
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${timeVal.toFixed(0)}s`, padding.left - 10, y + 4);
    }

    for (let i = 0; i <= 5; i++) {
      const accVal = maxAcc - (maxAcc / 5) * i;
      const y = padding.top + (chartH / 5) * i;
      ctx.fillStyle = '#48BB78';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${accVal}%`, width - padding.right + 10, y + 4);
    }

    const stepX = chartW / (stats.length - 1 || 1);

    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    stats.forEach((s, i) => {
      const x = padding.left + stepX * i;
      ctx.fillText(s.date, x, height - padding.bottom + 25);
    });

    const getX = (i: number) => padding.left + stepX * i;
    const getTimeY = (v: number) =>
      padding.top + chartH - ((v - minTime) / (maxTime - minTime)) * chartH;
    const getAccY = (v: number) =>
      padding.top + chartH - (v / maxAcc) * chartH;

    const timeGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    timeGradient.addColorStop(0, 'rgba(79, 209, 197, 0.35)');
    timeGradient.addColorStop(1, 'rgba(79, 209, 197, 0)');
    ctx.fillStyle = timeGradient;
    ctx.beginPath();
    ctx.moveTo(getX(0), height - padding.bottom);
    stats.forEach((s, i) => {
      ctx.lineTo(getX(i), getTimeY(s.avgTime));
    });
    ctx.lineTo(getX(stats.length - 1), height - padding.bottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4FD1C5';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    stats.forEach((s, i) => {
      const x = getX(i);
      const y = getTimeY(s.avgTime);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    stats.forEach((s, i) => {
      const x = getX(i);
      const y = getTimeY(s.avgTime);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4FD1C5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.strokeStyle = '#48BB78';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    stats.forEach((s, i) => {
      const x = getX(i);
      const y = getAccY(s.avgAccuracy);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    stats.forEach((s, i) => {
      const x = getX(i);
      const y = getAccY(s.avgAccuracy);
      ctx.fillStyle = '#48BB78';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    const legendY = 16;
    ctx.fillStyle = '#4FD1C5';
    ctx.fillRect(padding.left, legendY - 8, 16, 16);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText('平均用时(s)', padding.left + 24, legendY + 4);

    ctx.strokeStyle = '#48BB78';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left + 160, legendY);
    ctx.lineTo(padding.left + 176, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#48BB78';
    ctx.beginPath();
    ctx.arc(padding.left + 168, legendY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText('准确率(%)', padding.left + 186, legendY + 4);
  };

  const statCard = (label: string, value: string, color: string, emoji: string) => ({
    flex: 1,
    background: '#1A202C',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center' as const,
  });

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{
      maxWidth: isMobile ? '340px' : '640px',
      width: '100%',
    }}>
      <h2 style={{
        fontSize: isMobile ? '20px' : '24px',
        marginBottom: '20px',
        color: '#E2E8F0',
        textAlign: 'center',
      }}>
        📊 近七天训练趋势
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <div style={statCard('总游戏', `${overallStats.totalGames}`, '#4FD1C5', '🎮')}>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>🎮 总训练次数</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#4FD1C5' }}>{overallStats.totalGames}</div>
        </div>
        <div style={statCard('平均用时', `${overallStats.avgTime}s`, '#63B3ED', '⏱️')}>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>⏱️ 平均用时</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#63B3ED' }}>{overallStats.avgTime}s</div>
        </div>
        <div style={statCard('平均准确率', `${overallStats.avgAccuracy}%`, '#48BB78', '✅')}>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>✅ 平均准确率</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#48BB78' }}>{overallStats.avgAccuracy}%</div>
        </div>
        <div style={statCard('最佳用时', `${overallStats.bestTime}s`, '#F6AD55', '🏆')}>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>🏆 最佳用时</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F6AD55' }}>{overallStats.bestTime}s</div>
        </div>
      </div>

      <div style={{
        background: '#1E293B',
        borderRadius: '16px',
        padding: isMobile ? '12px' : '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        textAlign: 'center',
      }}>
        {loading ? (
          <div style={{ padding: '80px', color: '#94A3B8' }}>加载中...</div>
        ) : (
          <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
        )}
      </div>

      {!loading && stats.length > 0 && (
        <div style={{
          marginTop: '20px',
          background: '#1E293B',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '13px',
        }}>
          <div style={{ color: '#94A3B8', marginBottom: '12px', fontWeight: 600 }}>
            📅 每日训练详情
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#1A202C',
                borderRadius: '8px',
              }}>
                <span style={{ color: '#E2E8F0', fontWeight: 600, width: '80px' }}>{s.date}</span>
                <span style={{ color: '#4FD1C5', width: '80px', textAlign: 'center' }}>⏱ {s.avgTime.toFixed(1)}s</span>
                <span style={{ color: '#48BB78', width: '70px', textAlign: 'center' }}>✅ {s.avgAccuracy.toFixed(0)}%</span>
                <span style={{ color: '#F6AD55', width: '60px', textAlign: 'right' }}>{s.count}局</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
      }}>
        <button
          onClick={fetchStats}
          style={{
            padding: '12px 32px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            color: '#E2E8F0',
            background: '#2D3748',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4A5568')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#2D3748')}
        >
          🔄 刷新数据
        </button>
      </div>
    </div>
  );
};

export default StatsChart;
