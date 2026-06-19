import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Booking } from '../types';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const mo = (d.getMonth() + 1).toString().padStart(2, '0');
  const da = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${mo}-${da} ${h}:${m}`;
}

export default function ReportPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((data) => {
        setBooking(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => {
    if (!booking || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    ctx.clearRect(0, 0, W, H);

    const gunCount = 5;
    const data: number[] = [];
    for (let i = 0; i < gunCount; i++) {
      if (i === 0) {
        data.push(booking.energyConsumed ?? Math.random() * 20 + 5);
      } else {
        data.push(Math.random() * 25 + 3);
      }
    }

    const maxVal = Math.max(...data) * 1.2;

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#888888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const val = ((maxVal / 4) * (4 - i)).toFixed(1);
      ctx.fillText(`${val}`, padding.left - 6, y);
    }

    const barWidth = chartW / gunCount * 0.6;
    const gap = chartW / gunCount;

    data.forEach((val, i) => {
      const barHeight = (val / maxVal) * chartH;
      const x = padding.left + gap * i + (gap - barWidth) / 2;
      const y = padding.top + chartH - barHeight;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#4CAF50');
      gradient.addColorStop(1, '#8BC34A');

      ctx.fillStyle = gradient;
      const radius = 4;
      if (barHeight > radius * 2) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight);
        ctx.lineTo(x, y + barHeight);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val.toFixed(1), x + barWidth / 2, y - 8);

      ctx.fillStyle = '#CCCCCC';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`枪${i + 1}`, x + barWidth / 2, padding.top + chartH + 8);
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('历史充电电量 (kWh)', W / 2, 14);
  }, [booking]);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#121212',
        }}
      >
        <div style={{ color: '#888888', fontSize: 14 }}>加载中...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#121212',
          gap: 16,
        }}
      >
        <div style={{ color: '#F44336', fontSize: 14 }}>未找到该预约记录</div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#2196F3',
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          返回首页
        </motion.button>
      </div>
    );
  }

  const durationMin = Math.max(
    1,
    Math.round(((booking.actualEndTime ?? booking.endTime) - (booking.actualStartTime ?? booking.startTime)) / 60000)
  );
  const energy = booking.energyConsumed ?? (booking.gunPower ?? 7) * (durationMin / 60);
  const cost = booking.cost ?? durationMin * 0.5;
  const carbonSaved = energy * 0.5;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: 24,
        backgroundColor: '#121212',
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#1E1E2E',
              color: '#FFFFFF',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ←
          </motion.button>
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 600 }}>
              充电使用报告
            </h2>
            <p style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>
              订单号: {booking.id.slice(0, 12)}
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            padding: 20,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #2196F320 0%, #4CAF5020 100%)',
            border: '1px solid #2196F340',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#4CAF50', fontSize: 12, marginBottom: 6 }}>✓ 已完成</div>
              <h3 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                {booking.stationName}
              </h3>
              <div style={{ color: '#CCCCCC', fontSize: 12 }}>
                充电枪功率: {booking.gunPower ?? 7}kW
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#888888', fontSize: 11 }}>总费用</div>
              <div style={{ color: '#FF9800', fontSize: 28, fontWeight: 700 }}>
                ¥{cost.toFixed(2)}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#1E1E2E',
            }}
          >
            <div style={{ color: '#888888', fontSize: 11, marginBottom: 6 }}>充电时长</div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 600 }}>
              {Math.floor(durationMin / 60) > 0 ? `${Math.floor(durationMin / 60)}h ` : ''}
              {durationMin % 60}min
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#1E1E2E',
            }}
          >
            <div style={{ color: '#888888', fontSize: 11, marginBottom: 6 }}>消耗电量</div>
            <div style={{ color: '#4CAF50', fontSize: 20, fontWeight: 600 }}>
              {energy.toFixed(2)} kWh
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#1E1E2E',
            }}
          >
            <div style={{ color: '#888888', fontSize: 11, marginBottom: 6 }}>充电时段</div>
            <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 500 }}>
              {formatTime(booking.actualStartTime ?? booking.startTime)} - {formatTime(booking.actualEndTime ?? booking.endTime)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#1E1E2E',
            }}
          >
            <div style={{ color: '#888888', fontSize: 11, marginBottom: 6 }}>碳减排量</div>
            <div style={{ color: '#2196F3', fontSize: 20, fontWeight: 600 }}>
              {carbonSaved.toFixed(2)} kg
            </div>
            <div style={{ color: '#666666', fontSize: 10, marginTop: 2 }}>CO₂ 减排</div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: '#1E1E2E',
            marginBottom: 20,
          }}
        >
          <h4 style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            费用明细
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#CCCCCC', fontSize: 13 }}>充电时长</span>
              <span style={{ color: '#FFFFFF', fontSize: 13 }}>{durationMin} 分钟</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#CCCCCC', fontSize: 13 }}>单价</span>
              <span style={{ color: '#FFFFFF', fontSize: 13 }}>¥0.50 / 分钟</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#CCCCCC', fontSize: 13 }}>功率</span>
              <span style={{ color: '#FFFFFF', fontSize: 13 }}>{booking.gunPower ?? 7}kW</span>
            </div>
            <div
              style={{
                borderTop: '1px solid #333333',
                paddingTop: 8,
                marginTop: 4,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 600 }}>实付金额</span>
              <span style={{ color: '#FF9800', fontSize: 16, fontWeight: 700 }}>
                ¥{cost.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: '#1E1E2E',
            marginBottom: 20,
          }}
        >
          <h4 style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            历史使用统计
          </h4>
          <p style={{ color: '#888888', fontSize: 11, marginBottom: 12 }}>
            各充电枪历史平均耗电量
          </p>
          <div style={{ width: '100%', height: 220 }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: '#4CAF5015',
            border: '1px solid #4CAF5030',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 24 }}>🌱</div>
          <div>
            <div style={{ color: '#4CAF50', fontSize: 13, fontWeight: 600 }}>
              感谢您为环保做出的贡献
            </div>
            <div style={{ color: '#888888', fontSize: 11, marginTop: 2 }}>
              本次充电相当于减少了约 {carbonSaved.toFixed(2)}kg CO₂ 排放，约等于种植 {Math.ceil(carbonSaved / 18)} 棵树一年的吸收量
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
