import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { useScheduleStore } from './store';
import { COLOR_LABEL, COLOR_MAP, DAY_LABELS, Course, ColorTag } from './types';

const PIE_COLORS: Record<ColorTag, string> = COLOR_MAP;

function getStats(courses: Course[]) {
  const totalSlots = courses.reduce((sum, c) => sum + c.duration, 0);
  const totalHours = (totalSlots * 30) / 60;

  const typeCount: Record<ColorTag, number> = { major: 0, elective: 0, pe: 0, lab: 0 };
  courses.forEach((c) => {
    typeCount[c.colorTag] += c.duration;
  });

  const dayLoad: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 26 }, () => 0),
  );
  courses.forEach((c) => {
    for (let s = c.startSlot; s < c.startSlot + c.duration; s++) {
      if (s < 26) dayLoad[c.dayOfWeek][s]++;
    }
  });

  const peakPerDay = dayLoad.map((loads) => {
    let max = 0;
    let peak = -1;
    for (let i = 0; i < loads.length; i++) {
      if (loads[i] > max) {
        max = loads[i];
        peak = i;
      }
    }
    return peak;
  });

  return { totalHours, typeCount, peakPerDay };
}

function PieChart({ typeCount }: { typeCount: Record<ColorTag, number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = Object.values(typeCount).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 30;

    ctx.clearRect(0, 0, w, h);

    let startAngle = -Math.PI / 2;
    const tags: ColorTag[] = ['major', 'elective', 'pe', 'lab'];
    for (const tag of tags) {
      const value = typeCount[tag];
      if (value === 0) continue;
      const sliceAngle = (value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = PIE_COLORS[tag];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius + 18;
      const lx = cx + Math.cos(midAngle) * labelRadius;
      const ly = cy + Math.sin(midAngle) * labelRadius;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(midAngle) * (radius - 3), cy + Math.sin(midAngle) * (radius - 3));
      ctx.lineTo(cx + Math.cos(midAngle) * (radius + 10), cy + Math.sin(midAngle) * (radius + 10));
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#333';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const pct = (value / total) * 100;
      if (pct >= 3) {
        ctx.fillText(`${pct.toFixed(0)}%`, lx, ly);
      }

      startAngle = endAngle;
    }
  }, [typeCount]);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={200}
      style={{ display: 'block', margin: '0 auto' }}
    />
  );
}

export default function Sidebar() {
  const courses = useScheduleStore((s) => s.courses);
  const setNotification = useScheduleStore((s) => s.setNotification);
  const { totalHours, typeCount, peakPerDay } = getStats(courses);

  const handleExportPrint = async () => {
    const grid = document.querySelector('[data-schedule-grid]');
    if (!grid) {
      setNotification({ message: '找不到课表区域', type: 'error' });
      return;
    }
    setNotification({ message: '正在生成打印版...', type: 'success' });
    try {
      const canvas = await html2canvas(grid as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = '课表-打印版.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setNotification({ message: '打印版导出成功', type: 'success' });
      setTimeout(() => setNotification(null), 2000);
    } catch {
      setNotification({ message: '导出失败', type: 'error' });
    }
  };

  const handleExportWallpaper = async () => {
    const grid = document.querySelector('[data-schedule-grid]');
    if (!grid) {
      setNotification({ message: '找不到课表区域', type: 'error' });
      return;
    }
    setNotification({ message: '正在生成壁纸版...', type: 'success' });
    try {
      const canvas = await html2canvas(grid as HTMLElement, {
        backgroundColor: '#F9F6F0',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = '课表-壁纸版.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setNotification({ message: '壁纸版导出成功', type: 'success' });
      setTimeout(() => setNotification(null), 2000);
    } catch {
      setNotification({ message: '导出失败', type: 'error' });
    }
  };

  const total = Object.values(typeCount).reduce((a, b) => a + b, 0);

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderLeft: '2px solid #E8E3D9',
        padding: '20px 20px 24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        background: '#FDFBF7',
      }}
    >
      <div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
          本周统计
        </div>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#5B86E5' }}>
              {totalHours.toFixed(1)}
            </span>
            <span style={{ fontSize: 14, color: '#666' }}>课时</span>
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            共 {courses.length} 门课程
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
          类型占比
        </div>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          {total > 0 ? (
            <PieChart typeCount={typeCount} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#ccc' }}>
              暂无课程
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {(['major', 'elective', 'pe', 'lab'] as ColorTag[]).map((tag) => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: COLOR_MAP[tag],
                  }}
                />
                {COLOR_LABEL[tag]}
                <span style={{ color: '#999' }}>
                  {(typeCount[tag] / 2).toFixed(1)}h
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
          每日负荷高峰
        </div>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          {DAY_LABELS.map((day, i) => {
            const peak = peakPerDay[i];
            const hasPeak = peak >= 0;
            const hour = 8 + Math.floor(peak / 2);
            const min = (peak % 2) * 30;
            return (
              <div
                key={day}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: hasPeak ? 'rgba(255,138,92,0.12)' : 'transparent',
                }}
              >
                <span style={{ fontSize: 12, color: '#666' }}>{day}</span>
                {hasPeak ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#FF6B35',
                      fontWeight: 600,
                    }}
                  >
                    {hour.toString().padStart(2, '0')}:{min.toString().padStart(2, '0')} 高峰
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#bbb' }}>无课</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          onClick={handleExportPrint}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '2px solid #5B86E5',
            background: '#5B86E5',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          导出打印版
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          onClick={handleExportWallpaper}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '2px solid #E8E3D9',
            background: '#fff',
            color: '#555',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          导出壁纸版
        </motion.button>
      </div>
    </div>
  );
}
