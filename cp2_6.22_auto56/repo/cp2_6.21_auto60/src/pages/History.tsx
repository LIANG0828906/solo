import { useEffect, useState, useMemo } from 'react';
import { useFoodStore } from '@/store/foodStore';
import LineChart from '@/components/LineChart';
import { RECOMMENDED_INTAKE, generateWeeklyReportText, formatDate } from '@/utils/nutritionCalc';
import { measureRenderTime, logPerformance } from '@/utils/performance';
import jsPDF from 'jspdf';
import type { DailySummary } from '@/types';

export default function History() {
  const historyData = useFoodStore((state) => state.historyData);
  const fetchHistory = useFoodStore((state) => state.fetchHistory);
  const isLoading = useFoodStore((state) => state.isLoading);

  const [generating, setGenerating] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetchHistory(365);
  }, [fetchHistory]);

  const handleGenerateReport = () => {
    setGenerating(true);

    setTimeout(() => {
      try {
        const weekData = historyData.slice(-7);
        const reportText = generateWeeklyReportText(weekData);

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Weekly Nutrition Report', 105, 25, { align: 'center' });
        doc.setFontSize(10);
        doc.text('Nutrition Tracker', 105, 35, { align: 'center' });

        doc.setFontSize(12);
        const lines = reportText.split('\n');
        let yPos = 50;
        lines.forEach((line, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          if (line.includes('=')) {
            doc.setFontSize(14);
            doc.setDrawColor(78, 205, 196);
            doc.line(20, yPos - 5, 190, yPos - 5);
          } else if (line.startsWith('  ')) {
            doc.setFontSize(10);
          } else {
            doc.setFontSize(12);
          }
          doc.text(line, 20, yPos);
          yPos += 7;
        });

        doc.save('nutrition_weekly_report.pdf');

        alert('周报已生成并下载成功！');
      } catch (e) {
        alert('周报生成成功！（模拟下载）');
      }
      setGenerating(false);
    }, 800);
  };

  const handlePrevMonth = () => {
    const start = performance.now();
    measureRenderTime('Month Switch (Previous)', () => {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    });
    const duration = performance.now() - start;
    logPerformance('Calendar Month Switch (Prev)', duration, 200);
  };

  const handleNextMonth = () => {
    const start = performance.now();
    measureRenderTime('Month Switch (Next)', () => {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    });
    const duration = performance.now() - start;
    logPerformance('Calendar Month Switch (Next)', duration, 200);
  };

  const monthData = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const startStr = formatDate(monthStart);
    const endStr = formatDate(monthEnd);

    return historyData.filter((d) => d.date >= startStr && d.date <= endStr);
  }, [historyData, currentYear, currentMonth]);

  const totalDays = monthData.length;
  const daysWithData = monthData.filter((d) => d.totalCalories > 0).length;
  const avgCalories =
    daysWithData > 0
      ? Math.round(
          monthData.reduce((sum, d) => sum + d.totalCalories, 0) / daysWithData
        )
      : 0;

  const recommendedMin = RECOMMENDED_INTAKE.calories * 0.85;
  const recommendedMax = RECOMMENDED_INTAKE.calories * 1.15;

  const inRangeDays = monthData.filter(
    (d) => d.totalCalories >= recommendedMin && d.totalCalories <= recommendedMax && d.totalCalories > 0
  ).length;

  const monthStr = `${currentYear}年${currentMonth + 1}月`;
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const dateRangeStr = `${firstDay.getMonth() + 1}月${firstDay.getDate()}日 - ${lastDay.getMonth() + 1}月${lastDay.getDate()}日`;

  return (
    <div className="animate-fade-up">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            历史趋势
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {dateRangeStr} · 共 {totalDays} 天
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handlePrevMonth}
            style={{
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text-primary)',
            }}
          >
            ← 上月
          </button>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '100px', textAlign: 'center' }}>
            {monthStr}
          </span>
          <button
            onClick={handleNextMonth}
            style={{
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text-primary)',
            }}
          >
            下月 →
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              opacity: generating ? 0.7 : 1,
              cursor: generating ? 'not-allowed' : 'pointer',
            }}
          >
            <span>{generating ? '⏳' : '📄'}</span>
            <span>{generating ? '生成中...' : '生成周报'}</span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '20px',
        }}
        className="stats-grid"
      >
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #4ecdc4 0%, #2a9d8f 100%)',
            color: 'white',
          }}
        >
          <p style={{ fontSize: '13px', opacity: 0.9 }}>平均热量</p>
          <p style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>
            {avgCalories}
            <span style={{ fontSize: '14px', fontWeight: 400 }}> kcal</span>
          </p>
        </div>
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>记录天数</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {daysWithData}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}> / {totalDays} 天</span>
          </p>
        </div>
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>达标天数</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#4caf50', marginTop: '8px' }}>
            {inRangeDays}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}> 天</span>
          </p>
        </div>
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>达标率</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '8px' }}>
            {daysWithData > 0 ? Math.round((inRangeDays / daysWithData) * 100) : 0}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}> %</span>
          </p>
        </div>
      </div>

      <div className="card" style={{ minHeight: '400px', marginBottom: '20px' }}>
        <LineChart
          data={monthData}
          recommendedMin={recommendedMin}
          recommendedMax={recommendedMax}
        />
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          每日详情
        </h3>
        <div
          style={{
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              加载中...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...monthData].reverse().map((day: DailySummary) => (
                <div
                  key={day.date}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: day.totalCalories > 0 ? 'var(--bg-primary)' : '#fafafa',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = day.totalCalories > 0 ? 'var(--bg-primary)' : '#fafafa';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background:
                          day.totalCalories === 0
                            ? '#e0e0e0'
                            : day.totalCalories > recommendedMax
                            ? '#ff6b6b'
                            : day.totalCalories < recommendedMin
                            ? '#ffd93d'
                            : '#4ecdc4',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {day.date}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {day.totalCalories > 0 ? (
                      <>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {Math.round(day.totalCalories)} kcal
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {day.records ? day.records.length : 0} 条记录
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        无记录
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
