import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { MoodData, MOOD_CONFIGS, TAG_LABELS, TagType } from '../types';
import MoodCard from './MoodCard';

interface AnalysisViewProps {
  moods?: MoodData[];
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ moods = [] }) => {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredMoods = useMemo(() => {
    const cutoff = subDays(new Date(), timeRange);
    return moods.filter((m) => new Date(m.timestamp) >= cutoff);
  }, [moods, timeRange]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMoods.forEach((m) => {
      counts[m.type] = (counts[m.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, value]) => ({
      name: MOOD_CONFIGS[type as keyof typeof MOOD_CONFIGS].label,
      value,
      color: MOOD_CONFIGS[type as keyof typeof MOOD_CONFIGS].color,
    }));
  }, [filteredMoods]);

  const lineData = useMemo(() => {
    const days: Record<string, Record<string, number>> = {};
    const allTypes = new Set<string>();

    for (let i = timeRange - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MM-dd');
      days[date] = {};
    }

    filteredMoods.forEach((m) => {
      const date = format(new Date(m.timestamp), 'MM-dd');
      if (days[date]) {
        days[date][m.type] = Math.max(days[date][m.type] || 0, m.intensity);
        allTypes.add(m.type);
      }
    });

    return Object.entries(days).map(([date, typeIntensities]) => ({
      date,
      ...typeIntensities,
    }));
  }, [filteredMoods, timeRange]);

  const tagAnalysis = useMemo(() => {
    const tagStats: Record<string, { count: number; totalIntensity: number; moods: MoodData[] }> = {};

    filteredMoods.forEach((mood) => {
      mood.tags.forEach((tag) => {
        if (!tagStats[tag]) {
          tagStats[tag] = { count: 0, totalIntensity: 0, moods: [] };
        }
        tagStats[tag].count++;
        tagStats[tag].totalIntensity += mood.intensity;
        tagStats[tag].moods.push(mood);
      });
    });

    return Object.entries(tagStats)
      .filter(([_, stats]) => stats.count > 3)
      .map(([tag, stats]) => ({
        tag: tag as TagType,
        count: stats.count,
        avgIntensity: (stats.totalIntensity / stats.count).toFixed(1),
        moods: stats.moods,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredMoods]);

  const filteredByTag = useMemo(() => {
    if (!selectedTag) return [];
    return moods.filter((m) => m.tags.includes(selectedTag));
  }, [moods, selectedTag]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          animation: 'slideInUp 0.5s ease',
        }}
      >
        {([7, 30, 90] as const).map((days) => (
          <button
            key={days}
            onClick={() => setTimeRange(days)}
            style={{
              padding: '10px 24px',
              borderRadius: '20px',
              border: 'none',
              background: timeRange === days ? '#667eea' : 'white',
              color: timeRange === days ? 'white' : '#666',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: timeRange === days ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
            }}
          >
            {days}天
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
            animation: 'slideInUp 0.5s ease 0.1s both',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
            情绪分布
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
            animation: 'slideInUp 0.5s ease 0.2s both',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
            情绪强度趋势
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" fontSize={12} />
                <YAxis stroke="#999" fontSize={12} domain={[0, 10]} />
                <Tooltip />
                <Legend />
                {Object.entries(MOOD_CONFIGS).map(([type, config]) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    name={config.label}
                    stroke={config.color}
                    strokeWidth={3}
                    dot={{ r: 4, fill: config.color }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
          animation: 'slideInUp 0.5s ease 0.3s both',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
          事件关联分析
          <span style={{ fontSize: '13px', color: '#999', fontWeight: 400, marginLeft: '12px' }}>
            点击标签筛选相关记录
          </span>
        </h3>

        {tagAnalysis.length > 0 ? (
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr',
                padding: '16px 20px',
                background: '#fafafa',
                fontSize: '13px',
                fontWeight: 600,
                color: '#666',
              }}
            >
              <div>标签</div>
              <div>出现次数</div>
              <div>平均强度</div>
            </div>
            {tagAnalysis.map((item) => {
              const isSelected = selectedTag === item.tag;
              const isExpanded = expandedRow === item.tag;
              return (
                <React.Fragment key={item.tag}>
                  <div
                    onClick={() => {
                      setSelectedTag(isSelected ? null : item.tag);
                      setExpandedRow(isExpanded ? null : item.tag);
                    }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      padding: '20px',
                      cursor: 'pointer',
                      background: isSelected ? '#f0f4ff' : 'white',
                      borderTop: '1px solid #f0f0f0',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#fafafa';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                          color: '#bbb',
                        }}
                      >
                        ▼
                      </div>
                      <span
                        style={{
                          padding: '6px 16px',
                          borderRadius: '12px',
                          background: '#667eea20',
                          color: '#667eea',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        {TAG_LABELS[item.tag]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '15px', color: '#333', fontWeight: 600 }}>
                      {item.count} 次
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '15px', color: '#764ba2', fontWeight: 600 }}>
                      {item.avgIntensity}/10
                    </div>
                  </div>
                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 20px 20px 60px',
                        background: '#fafafa',
                        borderTop: '1px solid #f0f0f0',
                        animation: 'fadeIn 0.3s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px' }}>
                        {item.moods.slice(0, 5).map((mood) => (
                          <MoodCard key={mood.id} moodData={mood} />
                        ))}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无高频标签数据（需出现3次以上）
          </div>
        )}
      </div>

      {selectedTag && filteredByTag.length > 0 && (
        <div style={{ marginTop: '24px', animation: 'slideInUp 0.5s ease' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '16px' }}>
            「{TAG_LABELS[selectedTag]}」相关记录 ({filteredByTag.length}条)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredByTag.map((mood) => (
              <MoodCard key={mood.id} moodData={mood} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
