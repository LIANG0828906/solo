import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Empty, Spin, Alert, Button, Space } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { BarChartOutlined, PieChartOutlined, RadarChartOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import type { AnalysisResult } from '../../types';

const COLORS = ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E86452', '#6DC8EC'];

const DataAnalyzer: React.FC = () => {
  const { template, responses, setResponses, setTemplate } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template?.id) {
      fetchAnalysis(template.id);
    }
  }, [template?.id, responses.length]);

  const fetchAnalysis = async (templateId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/results/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        setTemplate(data.template);
        setResponses(data.responses);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '加载分析数据失败');
      }
    } catch (err) {
      setError('无法连接到后端服务');
    } finally {
      setLoading(false);
    }
  };

  const totalResponses = useMemo(() => {
    return analysis.length > 0 ? analysis[0].stats.totalResponses : 0;
  }, [analysis]);

  const renderBarChart = (result: AnalysisResult) => {
    if (!result.stats.counts) return null;

    const data = Object.entries(result.stats.counts).map(([name, value]) => ({
      name,
      count: value,
      percentage: result.stats.percentages?.[name] || 0,
    }));

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value} (${result.stats.percentages?.[data.find(d => d.count === value)?.name || ''] || 0}%)`,
              name === 'count' ? '选择人数' : name,
            ]}
          />
          <Legend />
          <Bar dataKey="count" name="选择人数" fill="#5B8FF9" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = (result: AnalysisResult) => {
    if (!result.stats.counts) return null;

    const data = Object.entries(result.stats.counts).map(([name, value]) => ({
      name,
      value,
    }));

    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value} 人`, '选择人数']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderRadarChart = (result: AnalysisResult) => {
    const data = [
      { subject: '1分', A: result.stats.counts?.['1分'] || 0, fullMark: totalResponses },
      { subject: '2分', A: result.stats.counts?.['2分'] || 0, fullMark: totalResponses },
      { subject: '3分', A: result.stats.counts?.['3分'] || 0, fullMark: totalResponses },
      { subject: '4分', A: result.stats.counts?.['4分'] || 0, fullMark: totalResponses },
      { subject: '5分', A: result.stats.counts?.['5分'] || 0, fullMark: totalResponses },
    ];

    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: '#666' }}>平均分：</span>
          <span style={{ fontSize: 32, fontWeight: 'bold', color: '#1890FF' }}>
            {result.stats.mean?.toFixed(1) || '0.0'}
          </span>
          <span style={{ fontSize: 14, color: '#666' }}> / 5.0</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#f0f0f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={{ fontSize: 10 }} />
            <Radar
              name="评分分布"
              dataKey="A"
              stroke="#5B8FF9"
              fill="#5B8FF9"
              fillOpacity={0.6}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderChartCard = (result: AnalysisResult, index: number) => {
    let chartIcon;
    let chartTitle;
    let chartContent;

    switch (result.questionType) {
      case 'single':
        chartIcon = <BarChartOutlined style={{ color: '#5B8FF9' }} />;
        chartTitle = '单选题 - 柱状图';
        chartContent = renderBarChart(result);
        break;
      case 'multiple':
        chartIcon = <PieChartOutlined style={{ color: '#5AD8A6' }} />;
        chartTitle = '多选题 - 饼图';
        chartContent = renderPieChart(result);
        break;
      case 'rating':
        chartIcon = <RadarChartOutlined style={{ color: '#F6BD16' }} />;
        chartTitle = '评分题 - 雷达图';
        chartContent = renderRadarChart(result);
        break;
      default:
        return null;
    }

    return (
      <Col xs={24} lg={12} key={result.questionId} style={{ marginBottom: 16 }}>
        <Card
          className="chart-card"
          title={
            <Space>
              {chartIcon}
              <span style={{ color: '#1890FF', fontWeight: 600 }}>{chartTitle}</span>
            </Space>
          }
          size="small"
          extra={
            <span style={{ fontSize: 12, color: '#999' }}>
              第 {index + 1} 题
            </span>
          }
        >
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ marginBottom: 8, color: '#333' }}>{result.questionTitle}</h4>
            {result.stats.percentages && (
              <div style={{ fontSize: 12, color: '#666' }}>
                共 {result.stats.totalResponses} 人回答
              </div>
            )}
          </div>
          {chartContent}
        </Card>
      </Col>
    );
  };

  if (!template) {
    return (
      <Card
        title={
          <span style={{ color: '#1890FF', fontWeight: 600 }}>
            <BarChartOutlined /> 数据分析
          </span>
        }
        size="small"
      >
        <Empty description="请先创建并发布问卷" />
      </Card>
    );
  }

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        title={
          <span style={{ color: '#1890FF', fontWeight: 600 }}>
            <BarChartOutlined /> 数据分析
          </span>
        }
        size="small"
        extra={
          <Button type="primary" size="small" onClick={() => fetchAnalysis(template.id)}>
            刷新数据
          </Button>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="问卷标题"
              value={template.title}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: 14, color: '#666' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="题目数量"
              value={template.questions.length}
              suffix="题"
              valueStyle={{ color: '#1890FF' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="回收答卷"
              value={totalResponses}
              suffix="份"
              valueStyle={{ color: '#52C41A' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待收集"
              value={Math.max(0, 100 - totalResponses)}
              suffix="份"
              valueStyle={{ color: '#FA8C16' }}
            />
          </Col>
        </Row>
      </Card>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <Card size="small">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#999' }}>正在加载分析数据...</p>
          </div>
        </Card>
      ) : analysis.length === 0 ? (
        <Card size="small">
          <Empty description="暂无答卷数据" />
        </Card>
      ) : (
        <Row gutter={16}>
          {analysis
            .filter((r) => r.questionType !== 'text')
            .map((result, index) => renderChartCard(result, index))}
          
          {analysis
            .filter((r) => r.questionType === 'text')
            .map((result, index) => (
              <Col xs={24} key={result.questionId} style={{ marginBottom: 16 }}>
                <Card
                  className="chart-card"
                  title={
                    <Space>
                      <FileTextOutlined style={{ color: '#5D7092' }} />
                      <span style={{ color: '#1890FF', fontWeight: 600 }}>开放文本 - 回答汇总</span>
                    </Space>
                  }
                  size="small"
                  extra={
                    <span style={{ fontSize: 12, color: '#999' }}>
                      第 {analysis.filter((_, i) => i <= analysis.findIndex(a => a.questionId === result.questionId)).length} 题
                    </span>
                  }
                >
                  <h4 style={{ marginBottom: 12, color: '#333' }}>{result.questionTitle}</h4>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                    共 {result.stats.totalResponses} 人回答
                  </div>
                  <div style={{ 
                    maxHeight: 200, 
                    overflowY: 'auto',
                    background: '#fafafa',
                    borderRadius: 4,
                    padding: 12,
                  }}>
                    {responses.length > 0 ? (
                      responses.map((response, idx) => {
                        const answer = response.answers.find(a => a.questionId === result.questionId);
                        if (!answer || !answer.value) return null;
                        return (
                          <div key={response.id} style={{ 
                            padding: '8px 0', 
                            borderBottom: idx < responses.length - 1 ? '1px solid #f0f0f0' : 'none' 
                          }}>
                            <span style={{ color: '#999', fontSize: 12 }}>{idx + 1}. </span>
                            <span>{String(answer.value)}</span>
                          </div>
                        );
                      })
                    ) : (
                      <Empty description="暂无回答" image={null} />
                    )}
                  </div>
                </Card>
              </Col>
            ))}
        </Row>
      )}
    </div>
  );
};

export default DataAnalyzer;
