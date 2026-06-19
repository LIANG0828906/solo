import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../store/useStore';
import type { ErrorBookEntry, ErrorType } from '../types';
import './ErrorBook.css';

interface ErrorBookProps {
  userId: string;
}

const errorTypeLabels: Record<ErrorType, string> = {
  knowledge_gap: '知识遗漏',
  unclear_expression: '表述不清',
  misunderstanding: '理解偏差',
};

const errorTypeColors: Record<ErrorType, string> = {
  knowledge_gap: '#EF4444',
  unclear_expression: '#F59E0B',
  misunderstanding: '#8B5CF6',
};

export function ErrorBook({ userId }: ErrorBookProps) {
  const { errorBook } = useStore();
  const [selectedEntry, setSelectedEntry] = useState<ErrorBookEntry | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const userErrorBook = useMemo(() => {
    return errorBook
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [errorBook, userId]);

  const filteredEntries = useMemo(() => {
    let entries = userErrorBook;
    if (filterSubject !== 'all') {
      entries = entries.filter((e) => e.subject === filterSubject);
    }
    if (filterType !== 'all') {
      entries = entries.filter((e) => e.errorType === filterType);
    }
    return entries;
  }, [userErrorBook, filterSubject, filterType]);

  const subjects = useMemo(() => {
    const set = new Set(userErrorBook.map((e) => e.subject));
    return Array.from(set);
  }, [userErrorBook]);

  const chartData = useMemo(() => {
    const data: { subject: string; knowledge_gap: number; unclear_expression: number; misunderstanding: number }[] = [];
    const subjectMap = new Map<string, Record<ErrorType, number>>();

    userErrorBook.forEach((entry) => {
      if (!subjectMap.has(entry.subject)) {
        subjectMap.set(entry.subject, {
          knowledge_gap: 0,
          unclear_expression: 0,
          misunderstanding: 0,
        });
      }
      const subjectData = subjectMap.get(entry.subject)!;
      subjectData[entry.errorType]++;
    });

    subjectMap.forEach((value, key) => {
      data.push({
        subject: key,
        knowledge_gap: value.knowledge_gap,
        unclear_expression: value.unclear_expression,
        misunderstanding: value.misunderstanding,
      });
    });

    return data;
  }, [userErrorBook]);

  const errorTypeSummary = useMemo(() => {
    const summary: Record<ErrorType, number> = {
      knowledge_gap: 0,
      unclear_expression: 0,
      misunderstanding: 0,
    };
    userErrorBook.forEach((entry) => {
      summary[entry.errorType]++;
    });
    return summary;
  }, [userErrorBook]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              <span className="tooltip-dot" style={{ backgroundColor: entry.color }}></span>
              {entry.name === 'knowledge_gap' && '知识遗漏'}
              {entry.name === 'unclear_expression' && '表述不清'}
              {entry.name === 'misunderstanding' && '理解偏差'}
              ：{entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="error-book">
      <div className="error-book-header">
        <h2 className="page-title">错题本</h2>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-label">总错题数</span>
            <span className="stat-value">{userErrorBook.length}</span>
          </div>
          {(['knowledge_gap', 'unclear_expression', 'misunderstanding'] as ErrorType[]).map((type) => (
            <div key={type} className="stat-card">
              <span className="stat-label" style={{ color: errorTypeColors[type] }}>
                {errorTypeLabels[type]}
              </span>
              <span className="stat-value" style={{ color: errorTypeColors[type] }}>
                {errorTypeSummary[type]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-section glass-card">
        <h3 className="section-title">错误类型分布</h3>
        <div className="chart-container">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 14 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 14 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => {
                    if (value === 'knowledge_gap') return '知识遗漏';
                    if (value === 'unclear_expression') return '表述不清';
                    if (value === 'misunderstanding') return '理解偏差';
                    return value;
                  }}
                />
                <Bar dataKey="knowledge_gap" fill="#EF4444" name="knowledge_gap" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unclear_expression" fill="#F59E0B" name="unclear_expression" radius={[4, 4, 0, 0]} />
                <Bar dataKey="misunderstanding" fill="#8B5CF6" name="misunderstanding" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">暂无错题数据</div>
          )}
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <span className="filter-label">科目筛选：</span>
          <select
            className="filter-select"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="all">全部科目</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">错误类型：</span>
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">全部类型</option>
            <option value="knowledge_gap">知识遗漏</option>
            <option value="unclear_expression">表述不清</option>
            <option value="misunderstanding">理解偏差</option>
          </select>
        </div>
      </div>

      <div className="error-cards-grid">
        {filteredEntries.length === 0 ? (
          <div className="empty-error">
            <div className="empty-icon">🎉</div>
            <p>太棒了！暂无错题</p>
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="error-card glass-card"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="error-card-header">
                <span
                  className="error-type-badge"
                  style={{ backgroundColor: errorTypeColors[entry.errorType] }}
                >
                  {errorTypeLabels[entry.errorType]}
                </span>
                <span className="error-score" style={{ color: entry.score < 40 ? '#EF4444' : '#F59E0B' }}>
                  {entry.score}分
                </span>
              </div>
              <div className="error-card-subject">
                <span className="subject-text">{entry.subject}</span>
                <span className="assignment-text">· {entry.assignmentTitle}</span>
              </div>
              <p className="error-card-question">{entry.question.content}</p>
              <div className="error-card-footer">
                <span className="error-date">
                  {new Date(entry.createdAt).toLocaleDateString('zh-CN')}
                </span>
                <span className="view-detail">查看详情 →</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">错题详情</h3>
              <button className="close-btn" onClick={() => setSelectedEntry(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <span
                  className="error-type-badge"
                  style={{ backgroundColor: errorTypeColors[selectedEntry.errorType] }}
                >
                  {errorTypeLabels[selectedEntry.errorType]}
                </span>
                <span className="detail-subject">{selectedEntry.subject}</span>
                <span className="detail-assignment">· {selectedEntry.assignmentTitle}</span>
              </div>

              <div className="detail-section">
                <h4 className="detail-label">题目</h4>
                <p className="detail-question">{selectedEntry.question.content}</p>
              </div>

              <div className="detail-section">
                <h4 className="detail-label">我的答案</h4>
                <p className="detail-answer student">
                  {selectedEntry.studentAnswer || '（未作答）'}
                </p>
              </div>

              <div className="detail-section">
                <h4 className="detail-label">标准答案</h4>
                <p className="detail-answer standard">{selectedEntry.question.standardAnswer}</p>
              </div>

              <div className="detail-section">
                <h4 className="detail-label">得分</h4>
                <span
                  className="detail-score"
                  style={{ color: selectedEntry.score < 40 ? '#EF4444' : '#F59E0B' }}
                >
                  {selectedEntry.score} 分
                </span>
              </div>

              <div className="detail-section">
                <h4 className="detail-label">批改评语</h4>
                <p className="detail-feedback">{selectedEntry.feedback}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
