import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function EcoDashboard() {
  const { currentUser, users } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const data = currentUser.pointsHistory;
    const maxVal = Math.max(...data) * 1.1;
    const minVal = 0;

    ctx.clearRect(0, 0, width, height);

    const xStep = width / (data.length - 1);

    ctx.beginPath();
    ctx.moveTo(0, height);
    data.forEach((val, i) => {
      const x = i * xStep;
      const y = height - ((val - minVal) / (maxVal - minVal)) * height;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(46, 204, 113, 0.3)');
    gradient.addColorStop(1, 'rgba(46, 204, 113, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * xStep;
      const y = height - ((val - minVal) / (maxVal - minVal)) * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = '#2ECC71';
    ctx.lineWidth = 2;
    ctx.stroke();

    const lastIndex = data.length - 1;
    const lastX = lastIndex * xStep;
    const lastY = height - ((data[lastIndex] - minVal) / (maxVal - minVal)) * height;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#2ECC71';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [currentUser.pointsHistory]);

  const sortedUsers = [...users].sort((a, b) => b.carbonPoints - a.carbonPoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 70,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            width: '90%',
            maxWidth: 320,
            margin: '0 auto 24px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: 20,
            color: '#E0E0E0',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, textAlign: 'center' }}>
            我的环保贡献
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2ECC71' }}>
                {currentUser.carbonPoints}
              </div>
              <div style={{ fontSize: 12, color: '#95A5A6' }}>总积分</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#4A90D9' }}>
                {currentUser.monthlyExchangeCount}
              </div>
              <div style={{ fontSize: 12, color: '#95A5A6' }}>本月交换</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#F39C12' }}>
                {currentUser.totalReduction.toFixed(1)}
              </div>
              <div style={{ fontSize: 12, color: '#95A5A6' }}>减排kg</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#95A5A6', marginBottom: 8 }}>
              积分增长趋势
            </div>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: 120,
                display: 'block',
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: 16,
            maxWidth: 600,
            margin: '0 auto',
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#E0E0E0' }}>
            🏆 碳积分排行榜
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sortedUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: index % 2 === 0 ? '#F0F4F8' : 'rgba(255, 255, 255, 0.02)',
                  color: index % 2 === 0 ? '#333' : '#E0E0E0',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 14,
                    background: index < 3 ? medalColors[index] : 'rgba(0,0,0,0.2)',
                    color: index < 3 ? '#fff' : 'inherit',
                    marginRight: 12,
                  }}
                >
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#ddd',
                    marginRight: 10,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ flex: 1, fontSize: 14 }}>{user.name}</div>
                <div style={{ fontWeight: 'bold', color: '#2ECC71' }}>
                  {user.carbonPoints}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
