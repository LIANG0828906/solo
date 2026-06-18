import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';
import { Download, ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { useStore } from '@/store';
import { EMOTION_MAP } from '@/types';
import { getWordCloudSize } from '@/utils/wordCloud';
import type { RetroPeriod, RetroReport as RetroReportType } from '@/types';

const PERIOD_OPTIONS: { value: RetroPeriod; label: string }[] = [
  { value: 'week', label: '最近一周' },
  { value: 'twoWeeks', label: '最近两周' },
  { value: 'month', label: '最近一个月' },
];

export function RetroReport() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { generateReport, exportReport, currentBoard, tasks, loading } = useStore();
  const [period, setPeriod] = useState<RetroPeriod>('week');
  const [report, setReport] = useState<RetroReportType | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      setGenerating(true);
      try {
        const data = await generateReport(id, period);
        setReport(data);
      } catch (err) {
        console.error('Failed to generate report:', err);
      } finally {
        setGenerating(false);
      }
    };
    loadReport();
  }, [id, period, generateReport]);

  const pieData = useMemo(() => {
    if (!report) return [];
    return Object.entries(report.emotionStats)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => ({
        name: EMOTION_MAP[key]?.label || key,
        value: count,
        emoji: EMOTION_MAP[key]?.emoji || '❓',
        color: EMOTION_MAP[key]?.color || '#999',
      }));
  }, [report]);

  const radialData = useMemo(() => {
    if (!report) return [];
    return [
      {
        name: '完成率',
        value: report.completionRate,
        fill: report.completionRate >= 80 ? '#66BB6A' : report.completionRate >= 50 ? '#FFB74D' : '#E74C3C',
      },
    ];
  }, [report]);

  const maxWordCount = useMemo(() => {
    if (!report || report.wordCloud.length === 0) return 0;
    return report.wordCloud[0].count;
  }, [report]);

  const handleExport = async () => {
    if (!report || !currentBoard) return;
    await exportReport(report, currentBoard.name);
  };

  const totalEmotions = useMemo(() => {
    if (!report) return 0;
    return Object.values(report.emotionStats).reduce((sum, count) => sum + count, 0);
  }, [report]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn btn-outline"
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            onClick={() => navigate(`/board/${id}`)}
          >
            <ArrowLeft size={18} />
            返回看板
          </button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
              项目回顾报告
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              {currentBoard?.name}
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleExport}
          disabled={generating || !report}
        >
          <Download size={18} />
          导出HTML
        </button>
      </div>

      <div className="glass" style={{
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontWeight: 500, marginRight: '12px' }}>选择时间段：</span>
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            className="btn"
            style={{
              padding: '8px 20px',
              minHeight: 'auto',
              background: period === option.value ? 'var(--color-accent)' : 'transparent',
              color: period === option.value ? 'white' : 'var(--color-text)',
              border: period === option.value ? 'none' : '2px solid var(--color-border)',
            }}
            onClick={() => setPeriod(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {generating ? (
        <div className="glass" style={{
          borderRadius: '16px',
          padding: '60px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}>
            📊
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            正在生成报告...
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            请稍候，正在分析数据
          </p>
        </div>
      ) : report ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="glass animate-fade-in" style={{ borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>
              <TrendingUp size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              任务完成率
            </h3>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={20}
                  data={radialData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="36"
                    fontWeight="700"
                    fill="var(--color-primary)"
                  >
                    {report.completionRate}%
                  </text>
                  <text
                    x="50%"
                    y="65%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="var(--color-text-secondary)"
                  >
                    {report.completedTasks} / {report.totalTasks} 任务
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass animate-fade-in" style={{ borderRadius: '16px', padding: '24px', animationDelay: '0.1s' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>
              😊 情感分布
            </h3>
            <div style={{ height: '220px' }}>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="80%"
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} (${totalEmotions > 0 ? Math.round((value / totalEmotions) * 100) : 0}%)`, name]}
                    />
                    <Legend
                      formatter={(value, entry: any) => (
                        <span style={{ fontSize: '13px' }}>
                          {entry.payload.emoji} {value} ({entry.payload.value})
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                  暂无情感数据
                </div>
              )}
            </div>
          </div>

          <div className="glass animate-fade-in" style={{ borderRadius: '16px', padding: '24px', animationDelay: '0.2s' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>
              ☁️ 高频词云
            </h3>
            <div style={{
              height: '220px',
              overflow: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              alignContent: 'center',
              gap: '8px',
              padding: '16px',
              background: '#F8F9FA',
              borderRadius: '12px',
            }}>
              {report.wordCloud.length > 0 ? (
                report.wordCloud.map((item, index) => {
                  const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'];
                  return (
                    <span
                      key={item.word}
                      className="animate-fade-in"
                      style={{
                        fontSize: `${getWordCloudSize(item.count, maxWordCount, 14, 32)}px`,
                        color: colors[index % colors.length],
                        fontWeight: 600,
                        animationDelay: `${index * 0.05}s`,
                        opacity: 0,
                      }}
                      title={`出现 ${item.count} 次`}
                    >
                      {item.word}
                    </span>
                  );
                })
              ) : (
                <span style={{ color: 'var(--color-text-secondary)' }}>暂无评论数据</span>
              )}
            </div>
          </div>

          <div className="glass animate-fade-in" style={{
            gridColumn: '1 / -1',
            borderRadius: '16px',
            padding: '24px',
            animationDelay: '0.3s',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>
              📋 报告详情
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}>
              <div style={{
                background: '#F8F9FA',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {report.totalTasks}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  总任务数
                </div>
              </div>
              <div style={{
                background: '#F8F9FA',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#66BB6A' }}>
                  {report.completedTasks}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  已完成任务
                </div>
              </div>
              <div style={{
                background: '#F8F9FA',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#FFB74D' }}>
                  {report.totalTasks - report.completedTasks}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  未完成任务
                </div>
              </div>
              <div style={{
                background: '#F8F9FA',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#9B59B6' }}>
                  {totalEmotions}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  情感标签数
                </div>
              </div>
            </div>
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(155, 89, 182, 0.1) 100%)',
              borderRadius: '12px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
            }}>
              <strong>统计周期：</strong>
              {new Date(report.startDate).toLocaleDateString('zh-CN')} - {new Date(report.endDate).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
