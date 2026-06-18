import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import {
  calculateStats,
  generateMockAnswerRecords,
  getAccuracyColor,
} from './AnswerAggregator';
import { storage } from '../../utils/storage';
import type { Question, QuestionStats, Page } from '../../types';

interface StatsPageProps {
  onNavigate: (page: Page) => void;
}

interface ChartDataPoint {
  name: string;
  accuracy: number;
  questionId: string;
  totalAnswers: number;
  correctAnswers: number;
}

interface OptionChartDataPoint {
  name: string;
  count: number;
  isCorrect: boolean;
}

export const StatsPage: React.FC<StatsPageProps> = ({ onNavigate }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<QuestionStats[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );
  const [panelKey, setPanelKey] = useState(0);

  useEffect(() => {
    const loadedQuestions = storage.getQuestions();
    setQuestions(loadedQuestions);

    let records = storage.getAnswerRecords();
    if (records.length === 0 && loadedQuestions.length > 0) {
      records = generateMockAnswerRecords(loadedQuestions);
      storage.setAnswerRecords(records);
    }

    const calculatedStats = calculateStats(loadedQuestions, records);
    setStats(calculatedStats);

    if (loadedQuestions.length > 0) {
      setSelectedQuestionId(loadedQuestions[0].id);
    }
  }, []);

  const handleBarClick = useCallback((data: ChartDataPoint) => {
    setSelectedQuestionId(data.questionId);
    setPanelKey((prev) => prev + 1);
  }, []);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    return stats.map((stat, index) => {
      const question = questions.find((q) => q.id === stat.questionId);
      return {
        name: `Q${index + 1}`,
        accuracy: Math.round(stat.accuracyRate * 100),
        questionId: stat.questionId,
        totalAnswers: stat.totalAnswers,
        correctAnswers: stat.correctAnswers,
      };
    });
  }, [stats, questions]);

  const selectedQuestion = useMemo(
    () => questions.find((q) => q.id === selectedQuestionId) || null,
    [questions, selectedQuestionId]
  );

  const selectedStats = useMemo(
    () => stats.find((s) => s.questionId === selectedQuestionId) || null,
    [stats, selectedQuestionId]
  );

  const optionChartData = useMemo<OptionChartDataPoint[]>(() => {
    if (!selectedQuestion || !selectedStats) return [];
    return selectedQuestion.options.map((option, index) => ({
      name: `${String.fromCharCode(65 + index)}. ${option.text}`,
      count: selectedStats.optionCounts[index] || 0,
      isCorrect: index === selectedQuestion.correctOptionIndex,
    }));
  }, [selectedQuestion, selectedStats]);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: ChartDataPoint }[];
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-800">{data.name}</p>
          <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
            <Users size={14} />
            <span>总作答: {data.totalAnswers} 人</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 text-sm">
            <CheckCircle size={14} />
            <span>正确: {data.correctAnswers} 人</span>
          </div>
          <p className="text-[#1a237e] font-semibold mt-1">
            正确率: {data.accuracy}%
          </p>
        </div>
      );
    }
    return null;
  };

  const OptionCustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: OptionChartDataPoint }[];
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-800 text-sm">{data.name}</p>
          <p className="text-gray-600 text-sm mt-1">
            被选择: {data.count} 次
          </p>
          {data.isCorrect && (
            <p className="text-green-600 text-sm font-medium">✓ 正确答案</p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderBarLabel = (props: {
    x: number;
    y: number;
    width: number;
    value: number;
  }) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#374151"
        fontSize={13}
        fontWeight={600}
        textAnchor="middle"
      >
        {value}%
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1a237e] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('builder')}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              返回创建
            </button>
            <h1 className="text-xl font-bold">作答统计分析</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {questions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">暂无数据</p>
            <p className="text-sm mt-2">请先创建至少3道题目</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-3/5">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">
                  各题正确率统计
                </h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 30, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 13 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                      <Bar
                        dataKey="accuracy"
                        radius={[8, 8, 0, 0]}
                        onClick={(data) => handleBarClick(data as ChartDataPoint)}
                        label={renderBarLabel}
                        cursor="pointer"
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getAccuracyColor(entry.accuracy / 100)}
                            stroke={selectedQuestionId === entry.questionId ? '#1a237e' : 'none'}
                            strokeWidth={selectedQuestionId === entry.questionId ? 3 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#4caf50]" />
                    <span className="text-sm text-gray-600">正确率 {'>'} 80%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#ff9800]" />
                    <span className="text-sm text-gray-600">正确率 50-80%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#e53935]" />
                    <span className="text-sm text-gray-600">正确率 {'<'} 50%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {stats.map((stat, index) => (
                  <div
                    key={stat.questionId}
                    className={`bg-white rounded-xl p-4 shadow-sm transition-all duration-200 cursor-pointer ${
                      selectedQuestionId === stat.questionId
                        ? 'ring-2 ring-[#1a237e] shadow-md'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => {
                      setSelectedQuestionId(stat.questionId);
                      setPanelKey((prev) => prev + 1);
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm text-gray-500">
                          第 {index + 1} 题
                        </span>
                        <p className="font-medium text-gray-800 text-[14px] font-roboto mt-1">
                          {questions.find((q) => q.id === stat.questionId)?.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {stat.correctAnswers}/{stat.totalAnswers} 正确
                        </p>
                      </div>
                    </div>
                    <ProgressBar accuracyRate={stat.accuracyRate} height={20} />
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-2/5">
              <div
                key={panelKey}
                className="bg-white rounded-xl shadow-md p-6 sticky top-8 animate-[fadeIn_0.3s_ease-out]"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  选项分布详情
                </h2>

                {selectedQuestion && selectedStats ? (
                  <>
                    <div className="mb-6">
                      <p className="text-[14px] font-roboto text-gray-800 font-medium">
                        {selectedQuestion.title}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {selectedStats.totalAnswers} 人作答
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle size={14} />
                          {selectedStats.correctAnswers} 人正确
                        </span>
                      </div>
                    </div>

                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={optionChartData}
                          layout="vertical"
                          margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                            horizontal={true}
                            vertical={false}
                          />
                          <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#374151', fontSize: 12 }}
                            width={80}
                            tickFormatter={(value, index) => {
                              const isCorrect =
                                optionChartData[index]?.isCorrect;
                              return isCorrect ? `${value} ★` : value;
                            }}
                          />
                          <Tooltip content={<OptionCustomTooltip />} />
                          <Bar
                            dataKey="count"
                            radius={[0, 6, 6, 0]}
                            barSize={24}
                          >
                            {optionChartData.map((entry, index) => (
                              <Cell
                                key={`opt-${index}`}
                                fill={entry.isCorrect ? '#4caf50' : '#94a3b8'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mb-2">图例</p>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-[#4caf50]" />
                          <span className="text-sm text-gray-600">
                            正确答案 ★
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-[#94a3b8]" />
                          <span className="text-sm text-gray-600">其他选项</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">点击左侧条形图查看详情</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
