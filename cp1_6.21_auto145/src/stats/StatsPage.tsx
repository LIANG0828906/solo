import { useMemo, useState, useEffect } from 'react';
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
  ScriptableContext,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { Diary, MOOD_CONFIG, STOP_WORDS } from '../types';

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

interface StatsPageProps {
  diaries: Diary[];
}

interface WordData {
  text: string;
  count: number;
  size: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
}

function StatsPage({ diaries }: StatsPageProps) {
  const [wordCloudData, setWordCloudData] = useState<WordData[]>([]);

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      weekDates.push(`${year}-${month}-${day}`);
    }
    return weekDates;
  };

  const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weekDates = getWeekDates();

  const chartData = useMemo<ChartData<'line', (number | null)[], string>>(() => {
    const moodScores = weekDates.map((date) => {
      const dayDiaries = diaries.filter((d) => d.date === date);
      if (dayDiaries.length === 0) return null;
      
      const totalScore = dayDiaries.reduce((sum, d) => {
        return sum + (MOOD_CONFIG[d.mood]?.score || 0);
      }, 0);
      return totalScore / dayDiaries.length;
    });

    const getGradientColor = (score: number | null) => {
      if (score === null) return 'transparent';
      const ratio = (score - 1) / 4;
      const r = Math.round(34 + (239 - 34) * (1 - ratio));
      const g = Math.round(197 + (68 - 197) * (1 - ratio));
      const b = Math.round(94 + (68 - 94) * (1 - ratio));
      return `rgb(${r}, ${g}, ${b})`;
    };

    return {
      labels: weekLabels,
      datasets: [
        {
          label: '情绪分值',
          data: moodScores,
          borderColor: 'rgba(59, 130, 246, 0.7)',
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const ctx = context.chart.ctx;
            const area = context.chart.chartArea;
            if (!area) return 'rgba(59, 130, 246, 0.1)';
            const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
            return gradient;
          },
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: (context: ScriptableContext<'line'>) => (context.raw !== null ? 6 : 0),
          pointHoverRadius: 8,
          pointBackgroundColor: moodScores.map((s) => getGradientColor(s)),
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          spanGaps: true,
        },
      ],
    };
  }, [diaries, weekDates]);

  const chartOptions = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const raw = context.raw as number | null;
            if (raw === null) return '无记录';
            const moodType = Object.keys(MOOD_CONFIG).find(
              (k) => MOOD_CONFIG[k].score === Math.round(raw)
            );
            const mood = MOOD_CONFIG[moodType || 'calm'];
            return `情绪: ${mood.emoji} ${mood.label} (${raw.toFixed(1)}分)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 13,
          },
        },
      },
      y: {
        min: 0,
        max: 5,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
        },
        ticks: {
          stepSize: 1,
          color: '#64748B',
          font: {
            size: 12,
          },
          callback: (value: string | number) => {
            const labels: Record<number, string> = { 1: '😢', 2: '😰', 3: '✨', 4: '😌', 5: '😊' };
            return labels[value as number] || '';
          },
        },
      },
    },
  }), []);

  useEffect(() => {
    const colors = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6'];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentDiaries = diaries.filter((d) => d.date >= sevenDaysAgoStr);
    
    const wordCount = new Map<string, number>();
    
    recentDiaries.forEach((diary) => {
      const text = diary.content.toLowerCase();
      const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
      
      words.forEach((word) => {
        if (word.length < 2) return;
        if (STOP_WORDS.has(word)) return;
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      });
    });

    const sortedWords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    if (sortedWords.length === 0) {
      setWordCloudData([]);
      return;
    }

    const maxCount = sortedWords[0][1];
    const minCount = sortedWords[sortedWords.length - 1][1];

    const usedPositions: { x: number; y: number; width: number; height: number }[] = [];
    
    const generatedWords: WordData[] = sortedWords.map(([text, count], index) => {
      const sizeRatio = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);
      const size = 12 + sizeRatio * 24;
      
      let x: number, y: number;
      let attempts = 0;
      const estimatedWidth = size * text.length * 0.6;
      const estimatedHeight = size * 1.2;
      
      do {
        x = Math.random() * 80 + 5;
        y = Math.random() * 70 + 10;
        attempts++;
      } while (
        attempts < 50 &&
        usedPositions.some(
          (pos) =>
            Math.abs(pos.x - x) < (pos.width + estimatedWidth) / 2 / 6 + 2 &&
            Math.abs(pos.y - y) < (pos.height + estimatedHeight) / 2 / 2.5 + 2
        )
      );

      usedPositions.push({ x, y, width: estimatedWidth, height: estimatedHeight });

      return {
        text,
        count,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        x,
        y,
        rotation: (Math.random() - 0.5) * 20,
      };
    });

    setWordCloudData(generatedWords);
  }, [diaries]);

  const hasChartData = chartData.datasets[0].data.some((d: number | null) => d !== null);

  return (
    <section className="stats-section">
      <h2 className="section-title">📊 情绪趋势</h2>
      
      <div className="chart-container">
        {hasChartData ? (
          <div style={{ height: '280px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="empty-state">
            还没有足够的数据生成图表，记录几天心情后再来查看吧
          </div>
        )}
      </div>

      <h2 className="section-title">☁️ 心情词云</h2>
      <div className="wordcloud-container">
        {wordCloudData.length > 0 ? (
          <div className="wordcloud">
            {wordCloudData.map((word, index) => (
              <span
                key={`${word.text}-${index}`}
                className="word-item"
                style={{
                  left: `${word.x}%`,
                  top: `${word.y}%`,
                  fontSize: `${word.size}px`,
                  color: word.color,
                  transform: `translate(-50%, -50%) rotate(${word.rotation}deg)`,
                }}
                title={`出现 ${word.count} 次`}
              >
                {word.text}
              </span>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            记录日记后，这里会展示你最近的心情关键词
          </div>
        )}
      </div>
    </section>
  );
}

export default StatsPage;
