import { useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { Roadmap, SkillScore } from '@/types/index';
import {
  getAggregatedSkillScores,
  getTotalActualMinutes,
  getTotalEstimatedMinutes,
  getAverageMasteryScore,
  getOverallProgress,
  formatMinutes,
} from '@/utils/dataHelpers';
import './ProgressTracker.css';

interface ProgressTrackerProps {
  roadmap: Roadmap | null;
  onUpdateSkillScore: (stageId: string, scoreId: string, score: number) => void;
}

function ProgressTracker({ roadmap, onUpdateSkillScore }: ProgressTrackerProps) {
  const handleScoreChange = useCallback(
    (stageId: string, scoreId: string, score: number) => {
      onUpdateSkillScore(stageId, scoreId, score);
    },
    [onUpdateSkillScore]
  );

  if (!roadmap) {
    return (
      <div className="progress-tracker">
        <div className="tracker-empty">
          <div className="empty-icon">📊</div>
          <h2 className="empty-title">暂无学习数据</h2>
          <p className="empty-desc">请先创建一条学习路线</p>
        </div>
      </div>
    );
  }

  const totalActual = getTotalActualMinutes(roadmap);
  const totalEstimated = getTotalEstimatedMinutes(roadmap);
  const overallProgress = getOverallProgress(roadmap);
  const avgScore = getAverageMasteryScore(roadmap);
  const skillScores = getAggregatedSkillScores(roadmap);

  const lineChartData = roadmap.dailyRecords.map((record) => ({
    date: record.date.slice(5),
    目标时长: record.targetMinutes,
    实际时长: record.actualMinutes,
  }));

  const radarData = skillScores.map((ss) => ({
    skill: ss.skillName,
    score: ss.score,
    fullMark: 10,
  }));

  return (
    <div className="progress-tracker">
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-value">{formatMinutes(totalActual)}</div>
          <div className="stat-label">总学习时长</div>
          <div className="stat-sub">
            预估 {formatMinutes(totalEstimated)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overallProgress}%</div>
          <div className="stat-label">总体完成度</div>
          <div className="stat-sub">
            {roadmap.stages.filter((s) => s.subTasks.length > 0 && s.subTasks.every((st) => st.completed)).length} / {roadmap.stages.length} 阶段
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgScore}</div>
          <div className="stat-label">平均掌握评分</div>
          <div className="stat-sub">满分 10 分</div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3 className="chart-title">每日累计学习时长</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#999' }} />
                <YAxis tick={{ fontSize: 12, fill: '#999' }} unit="分" />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontSize: 13,
                  }}
                  labelStyle={{ fontWeight: 600, color: '#333', marginBottom: 4 }}
                  itemStyle={{ padding: '2px 0' }}
                  formatter={(value: number) => [`${value} 分钟`, '']}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10 }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="目标时长"
                  name="目标时长"
                  stroke="#4A90D9"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#4A90D9', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="实际时长"
                  name="实际时长"
                  stroke="#FF8C42"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#FF8C42', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">技能掌握雷达图</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <defs>
                  <linearGradient id="radarGradient" x1="50%" y1="50%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#4A90D9" stopOpacity={0.05} />
                    <stop offset="50%" stopColor="#4A90D9" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4A90D9" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4A90D9" />
                    <stop offset="100%" stopColor="#7B68AE" />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: '#666' }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10, fill: '#999' }} />
                <Radar
                  name="掌握程度"
                  dataKey="score"
                  stroke="url(#radarStroke)"
                  fill="url(#radarGradient)"
                  fillOpacity={1}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4A90D9', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontSize: 13,
                  }}
                  formatter={(value: number) => [`${value} / 10 分`, '掌握程度']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="skill-detail-section">
        <h3 className="section-title">各阶段技能评分</h3>
        <div className="skill-detail-grid">
          {roadmap.stages.map((stage) => (
            <div key={stage.id} className="skill-detail-card">
              <div className="skill-detail-header" style={{ borderLeftColor: stage.color }}>
                <span className="skill-detail-stage-name">{stage.name}</span>
              </div>
              <div className="skill-detail-scores">
                {stage.skillScores.map((ss) => (
                  <div key={ss.id} className="skill-detail-score-item">
                    <span className="skill-detail-score-name">{ss.skillName}</span>
                    <input
                      className="skill-detail-slider"
                      type="range"
                      min={0}
                      max={10}
                      step={0.5}
                      value={ss.score}
                      onChange={(e) => handleScoreChange(stage.id, ss.id, Number(e.target.value))}
                    />
                    <span className="skill-detail-score-value">{ss.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProgressTracker;
