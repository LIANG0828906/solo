import { useState, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Legend,
} from 'recharts';
import { BarChart3, Radar as RadarIcon, Table, Download } from 'lucide-react';
import type { Vote } from '@/types';
import { cn } from '@/lib/utils';

interface ResultChartProps {
  vote: Vote;
}

type ViewType = 'chart' | 'radar' | 'table';

const PRIMARY_COLOR = '#4a90d9';
const ACCENT_COLOR = '#ff7b54';
const CARD_COLOR = '#2a2f4a';
const TEXT_COLOR = '#e0e4f0';
const GRID_COLOR = '#3a3f5a';

export default function ResultChart({ vote }: ResultChartProps) {
  const [viewType, setViewType] = useState<ViewType>('chart');
  const chartRef = useRef<HTMLDivElement>(null);

  // 根据投票类型准备图表数据
  const getChartData = () => {
    return vote.options.map((opt) => ({
      name: opt.text,
      value:
        vote.type === 'rank'
          ? opt.avgRank ?? 0
          : vote.type === 'score'
          ? opt.avgScore ?? 0
          : opt.votes,
    }));
  };

  // 获取数值标签
  const getValueLabel = () => {
    switch (vote.type) {
      case 'rank':
        return '平均排名';
      case 'score':
        return '平均得分';
      default:
        return '得票数';
    }
  };

  // 雷达图数据（仅评分类型使用）
  const getRadarData = () => {
    return vote.options.map((opt) => ({
      subject: opt.text,
      score: opt.avgScore ?? 0,
      fullMark: vote.maxScore ?? 10,
    }));
  };

  // 导出图片功能（占位实现）
  const handleExportImage = () => {
    alert('导出图片功能将在后续版本支持');
  };

  // 判断是否可以显示雷达图（仅评分类型）
  const canShowRadar = vote.type === 'score';

  const data = getChartData();
  const radarData = getRadarData();

  return (
    <div
      ref={chartRef}
      className="w-full rounded-xl p-6"
      style={{ backgroundColor: CARD_COLOR }}
    >
      {/* 视图切换按钮 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewType('chart')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
              viewType === 'chart'
                ? 'text-white'
                : 'text-gray-400 hover:text-white',
            )}
            style={{
              backgroundColor: viewType === 'chart' ? PRIMARY_COLOR : 'transparent',
            }}
          >
            <BarChart3 size={16} />
            <span>图表</span>
          </button>
          {canShowRadar && (
            <button
              onClick={() => setViewType('radar')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                viewType === 'radar'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white',
              )}
              style={{
                backgroundColor: viewType === 'radar' ? PRIMARY_COLOR : 'transparent',
              }}
            >
              <RadarIcon size={16} />
              <span>雷达图</span>
            </button>
          )}
          <button
            onClick={() => setViewType('table')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
              viewType === 'table'
                ? 'text-white'
                : 'text-gray-400 hover:text-white',
            )}
            style={{
              backgroundColor: viewType === 'table' ? PRIMARY_COLOR : 'transparent',
            }}
          >
            <Table size={16} />
            <span>表格</span>
          </button>
        </div>
        <button
          onClick={handleExportImage}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:opacity-80"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          <Download size={16} />
          <span>导出图片</span>
        </button>
      </div>

      {/* 图表视图 */}
      {viewType === 'chart' && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {vote.type === 'rank' ? (
              // 排名：横向条形图
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis
                  type="number"
                  stroke={TEXT_COLOR}
                  tick={{ fill: TEXT_COLOR, fontSize: 12 }}
                  label={{
                    value: getValueLabel(),
                    fill: TEXT_COLOR,
                    fontSize: 12,
                    position: 'insideBottom',
                    offset: -5,
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={TEXT_COLOR}
                  tick={{ fill: TEXT_COLOR, fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CARD_COLOR,
                    border: `1px solid ${GRID_COLOR}`,
                    borderRadius: '8px',
                    color: TEXT_COLOR,
                  }}
                  labelStyle={{ color: TEXT_COLOR }}
                  formatter={(value: number) => [value.toFixed(2), getValueLabel()]}
                />
                <Bar
                  dataKey="value"
                  fill={PRIMARY_COLOR}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            ) : (
              // 单选/多选/评分：柱状图
              <BarChart
                data={data}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis
                  dataKey="name"
                  stroke={TEXT_COLOR}
                  tick={{ fill: TEXT_COLOR, fontSize: 12 }}
                />
                <YAxis
                  stroke={TEXT_COLOR}
                  tick={{ fill: TEXT_COLOR, fontSize: 12 }}
                  label={{
                    value: getValueLabel(),
                    angle: -90,
                    position: 'insideLeft',
                    fill: TEXT_COLOR,
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CARD_COLOR,
                    border: `1px solid ${GRID_COLOR}`,
                    borderRadius: '8px',
                    color: TEXT_COLOR,
                  }}
                  labelStyle={{ color: TEXT_COLOR }}
                  formatter={(value: number) =>
                    vote.type === 'score'
                      ? [value.toFixed(2), getValueLabel()]
                      : [value, getValueLabel()]
                  }
                />
                <Legend wrapperStyle={{ color: TEXT_COLOR }} />
                <Bar
                  dataKey="value"
                  name={getValueLabel()}
                  fill={PRIMARY_COLOR}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* 雷达图视图（仅评分类型） */}
      {viewType === 'radar' && canShowRadar && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke={GRID_COLOR} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: TEXT_COLOR, fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, vote.maxScore ?? 10]}
                tick={{ fill: TEXT_COLOR, fontSize: 10 }}
                stroke={GRID_COLOR}
              />
              <RechartsRadar
                name="平均得分"
                dataKey="score"
                stroke={PRIMARY_COLOR}
                fill={PRIMARY_COLOR}
                fillOpacity={0.5}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: CARD_COLOR,
                  border: `1px solid ${GRID_COLOR}`,
                  borderRadius: '8px',
                  color: TEXT_COLOR,
                }}
                labelStyle={{ color: TEXT_COLOR }}
                formatter={(value: number) => [value.toFixed(2), '平均得分']}
              />
              <Legend wrapperStyle={{ color: TEXT_COLOR }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 表格视图 */}
      {viewType === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="border-b text-left text-sm"
                style={{ borderColor: GRID_COLOR }}
              >
                <th className="py-3 px-4 font-medium" style={{ color: TEXT_COLOR }}>
                  选项名称
                </th>
                <th className="py-3 px-4 text-right font-medium" style={{ color: TEXT_COLOR }}>
                  {vote.type === 'rank' && '平均排名'}
                  {vote.type === 'score' && '平均得分'}
                  {(vote.type === 'single' || vote.type === 'multiple') && '得票数'}
                </th>
                {(vote.type === 'single' || vote.type === 'multiple') && (
                  <th className="py-3 px-4 text-right font-medium" style={{ color: TEXT_COLOR }}>
                    占比
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {vote.options.map((opt) => {
                const totalVotes = vote.options.reduce((sum, o) => sum + o.votes, 0);
                const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                return (
                  <tr
                    key={opt.id}
                    className="border-b transition-colors duration-200 hover:bg-opacity-30"
                    style={{ borderColor: GRID_COLOR }}
                  >
                    <td className="py-3 px-4" style={{ color: TEXT_COLOR }}>
                      {opt.text}
                    </td>
                    <td className="py-3 px-4 text-right" style={{ color: TEXT_COLOR }}>
                      {vote.type === 'rank' && (opt.avgRank ?? 0).toFixed(2)}
                      {vote.type === 'score' && (opt.avgScore ?? 0).toFixed(2)}
                      {(vote.type === 'single' || vote.type === 'multiple') && opt.votes}
                    </td>
                    {(vote.type === 'single' || vote.type === 'multiple') && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div
                            className="h-2 w-20 rounded-full overflow-hidden"
                            style={{ backgroundColor: GRID_COLOR }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: PRIMARY_COLOR,
                              }}
                            />
                          </div>
                          <span className="text-sm w-12 text-right" style={{ color: TEXT_COLOR }}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
