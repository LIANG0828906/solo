import React, { useRef, useEffect } from 'react';

const ROOMS = [
  { id: 'living', label: '客厅 Living' },
  { id: 'bedroom', label: '卧室 Bedroom' },
  { id: 'kitchen', label: '厨房 Kitchen' },
  { id: 'bathroom', label: '卫生间 Bathroom' },
];

function getTempGradient(temp: number): string {
  if (temp < 18) return 'linear-gradient(135deg, #1a237e, #0d47a1)';
  if (temp <= 28) return 'linear-gradient(135deg, #1b5e20, #2e7d32)';
  return 'linear-gradient(135deg, #b71c1c, #c62828)';
}

function drawChart(
  canvas: HTMLCanvasElement,
  historyData: { temperature: number[]; humidity: number[]; light: number[] }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const pad = { top: 30, right: 20, bottom: 30, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, w, h);

  const temp = historyData.temperature.slice(-100);
  const hum = historyData.humidity.slice(-100);
  const light = historyData.light.slice(-100);
  const len = Math.max(temp.length, hum.length, light.length);
  if (len === 0) return;

  const lines = [
    { data: temp, color: '#ff6b6b', label: 'Temp °C', max: 50, min: 0 },
    { data: hum, color: '#4ecdc4', label: 'Humidity %', max: 100, min: 0 },
    { data: light, color: '#ffe66d', label: 'Light', max: 1000, min: 0 },
  ];

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
  }

  for (const line of lines) {
    if (line.data.length === 0) continue;
    ctx.beginPath();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (let i = 0; i < line.data.length; i++) {
      const x = pad.left + (i / (len - 1 || 1)) * chartW;
      const ratio = (line.data[i] - line.min) / (line.max - line.min || 1);
      const y = pad.top + chartH - ratio * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  let legendX = pad.left + 8;
  const legendY = 16;
  for (const line of lines) {
    ctx.fillStyle = line.color;
    ctx.fillRect(legendX, legendY - 6, 12, 12);
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '11px sans-serif';
    ctx.fillText(line.label, legendX + 16, legendY + 4);
    legendX += ctx.measureText(line.label).width + 36;
  }
}

interface SensorDashboardProps {
  sensorData: any;
  historyData: any;
  onSelectRoom: (roomId: string) => void;
  selectedRoom: string | null;
}

const SensorDashboard: React.FC<SensorDashboardProps> = ({
  sensorData,
  historyData,
  onSelectRoom,
  selectedRoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRoomData = selectedRoom ? sensorData?.[selectedRoom] : null;
  const selectedHistory = selectedRoom ? historyData?.[selectedRoom] : null;

  useEffect(() => {
    if (canvasRef.current && selectedHistory) {
      drawChart(canvasRef.current, selectedHistory);
    }
  }, [selectedHistory]);

  return (
    <div className="dashboard-layout">
      <div className="left-column" style={styles.leftColumn}>
        {ROOMS.map((room) => {
          const data = sensorData?.[room.id];
          const temp = data?.temperature ?? 0;
          return (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              style={{
                ...styles.roomCard,
                background: getTempGradient(temp),
                outline: selectedRoom === room.id ? '2px solid #e8b83a' : 'none',
              }}
            >
              <div style={styles.roomName}>{room.label}</div>
              <div style={styles.sensorRow}>
                <span>🌡️ {temp}°C</span>
                <span>💧 {data?.humidity ?? 0}%</span>
                <span>☀️ {data?.light ?? 0}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="right-column" style={styles.rightColumn}>
        {selectedRoom && selectedRoomData ? (
          <>
            <div style={styles.detailCard}>
              <h3 style={styles.detailTitle}>
                {ROOMS.find((r) => r.id === selectedRoom)?.label}
              </h3>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span>🌡️</span>
                  <span>Temperature</span>
                  <strong>{selectedRoomData.temperature}°C</strong>
                </div>
                <div style={styles.detailItem}>
                  <span>💧</span>
                  <span>Humidity</span>
                  <strong>{selectedRoomData.humidity}%</strong>
                </div>
                <div style={styles.detailItem}>
                  <span>☀️</span>
                  <span>Light</span>
                  <strong>{selectedRoomData.light}</strong>
                </div>
              </div>
            </div>

            <div style={styles.chartCard}>
              <h4 style={styles.chartTitle}>History Trend</h4>
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: 220, borderRadius: 8 }}
              />
            </div>
          </>
        ) : (
          <div style={styles.placeholder}>
            <span style={{ fontSize: 48, opacity: 0.3 }}>📊</span>
            <p style={{ color: '#a0a0b0', marginTop: 12 }}>
              Select a room to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  leftColumn: {
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 120px)',
  },
  roomCard: {
    borderRadius: 12,
    padding: '1rem 1.25rem',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, outline-color 0.3s ease',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  roomName: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e0e0e0',
    marginBottom: 8,
  },
  sensorRow: {
    display: 'flex',
    gap: 16,
    fontSize: 14,
    color: '#e0e0e0',
  },
  rightColumn: {
    overflowY: 'auto',
  },
  detailCard: {
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 12,
    padding: '1.25rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  detailTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#e8b83a',
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 15,
    color: '#e0e0e0',
  },
  chartCard: {
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 12,
    padding: '1.25rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  chartTitle: {
    fontSize: 15,
    marginBottom: 8,
    color: '#e0e0e0',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.06)',
  },
};

export default SensorDashboard;
