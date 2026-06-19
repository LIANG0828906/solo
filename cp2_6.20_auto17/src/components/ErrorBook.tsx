import { useMemo, useState, memo, useCallback, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useStore } from '../store/useStore';
import type { ErrorBookEntry, ErrorType } from '../types';
import './ErrorBook.css';

interface ErrorBookProps {
  userId: string;
}

const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  knowledge_gap: '知识遗漏',
  unclear_expression: '表述不清',
  misunderstanding: '理解偏差',
};

const ERROR_TYPE_COLORS: Record<ErrorType, string> = {
  knowledge_gap: '#EF4444',
  unclear_expression: '#F59E0B',
  misunderstanding: '#8B5CF6',
};

const StatCard = memo(function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}1A`, color }}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
});

const ErrorCard = memo(function ErrorCard({
  entry,
  onClick,
}: {
  entry: ErrorBookEntry;
  onClick: () => void;
}) {
  const typeLabel = ERROR_TYPE_LABELS[entry.errorType];
  const typeColor = ERROR_TYPE_COLORS[entry.errorType];

  return (
    <div className="error-card" onClick={onClick}>
      <div className="error-card-header">
        <span
          className="error-type-chip"
          style={{
            background: `${typeColor}1A`,
            color: typeColor,
            borderColor: `${typeColor}40`,
          }}
        >
          {typeLabel}
        </span>
        <span className="error-score" style={{ color: entry.score >= 45 ? '#F59E0B' : '#EF4444' }}>
          {entry.score}分
        </span>
      </div>
      <div className="error-card-subject">{entry.subject} · {entry.assignmentTitle}</div>
      <h4 className="error-card-title">第 {entry.question.id} 题</h4>
      <p className="error-card-question">{entry.question.content}</p>
      <div className="error-card-footer">
        <span className="error-card-time">
          {new Date(entry.createdAt).toLocaleDateString('zh-CN')}
        </span>
        <span className="error-card-cta">查看详情 →</span>
      </div>
    </div>
  );
});

function DetailModal({
  entry,
  onClose,
}: {
  entry: ErrorBookEntry;
  onClose: () => void;
}) {
  const typeLabel = ERROR_TYPE_LABELS[entry.errorType];
  const typeColor = ERROR_TYPE_COLORS[entry.errorType];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">错题详情</h3>
            <div className="modal-subtitle">{entry.subject} · {entry.assignmentTitle}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-label">原题（第{entry.question.id}题）</div>
            <div className="detail-content original-question">
              {entry.question.content}
              <div className="limit-note">（限 {entry.question.maxWords} 字）</div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-row">
              <span
                className="error-type-chip"
                style={{
                  background: `${typeColor}1A`,
                  color: typeColor,
                  borderColor: `${typeColor}40`,
                }}
              >
                错误类型：{typeLabel}
              </span>
              <span
                className="error-score-big"
                style={{ color: entry.score >= 45 ? '#F59E0B' : '#EF4444' }}
              >
                得分：{entry.score} 分
              </span>
            </div>
          </div>

          <div className="detail-section answer-block-wrapper">
            <div className="detail-label">学生答案</div>
            <div className="detail-content student-answer">
              {entry.studentAnswer || '（未作答）'}
            </div>
          </div>

          <div className="detail-section answer-block-wrapper">
            <div className="detail-label">标准答案</div>
            <div className="detail-content standard-answer">
              {entry.question.standardAnswer}
            </div>
            <div className="keywords-hint">
              <strong>关键词：</strong>
              {entry.question.keywords.join('、')}
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-label">批改评语</div>
            <div className="detail-content feedback-content">{entry.feedback}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const VIRTUAL_ROW_HEIGHT = 260;
const VISIBLE_ROWS = 10;

export function ErrorBook({ userId }: ErrorBookProps) {
  const errorBook = useStore((state) =>
    state.errorBook.filter((e) => e.userId === userId)
  );
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState<ErrorType | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<ErrorBookEntry | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const subjects = useMemo(() => {
    const set = new Set(errorBook.map((e) => e.subject));
    return Array.from(set);
  }, [errorBook]);

  const filteredEntries = useMemo(() => {
    return errorBook
      .filter((e) => (subjectFilter === 'all' ? true : e.subject === subjectFilter))
      .filter((e) => (errorTypeFilter === 'all' ? true : e.errorType === errorTypeFilter))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [errorBook, subjectFilter, errorTypeFilter]);

  const errorTypeChartData = useMemo(() => {
    const errorMap: Record<ErrorType, number> = {
      knowledge_gap: 0,
      unclear_expression: 0,
      misunderstanding: 0,
    };
    errorBook.forEach((e) => {
      errorMap[e.errorType] = (errorMap[e.errorType] || 0) + 1;
    });
    const entries = Object.entries(errorMap) as [ErrorType, number][];
    return entries.map(([type, count]) => ({
      name: ERROR_TYPE_LABELS[type],
      数量: count,
      fill: ERROR_TYPE_COLORS[type],
    }));
  }, [errorBook]);

  const subjectErrorTypeData = useMemo(() => {
    const subjectMap: Record<string, Record<ErrorType, number>> = {};
    errorBook.forEach((e) => {
      if (!subjectMap[e.subject]) {
        subjectMap[e.subject] = {
          knowledge_gap: 0,
          unclear_expression: 0,
          misunderstanding: 0,
        };
      }
      subjectMap[e.subject][e.errorType]++;
    });
    return Object.entries(subjectMap).map(([subject, counts]) => ({
      subject,
      知识遗漏: counts.knowledge_gap,
      表述不清: counts.unclear_expression,
      理解偏差: counts.misunderstanding,
    }));
  }, [errorBook]);

  const stats = useMemo(() => {
    const typeCounts: Record<ErrorType, number> = {
      knowledge_gap: 0,
      unclear_expression: 0,
      misunderstanding: 0,
    };
    errorBook.forEach((e) => {
      typeCounts[e.errorType] = (typeCounts[e.errorType] || 0) + 1;
    });
    return {
      total: errorBook.length,
      knowledge_gap: typeCounts.knowledge_gap,
      unclear_expression: typeCounts.unclear_expression,
      misunderstanding: typeCounts.misunderstanding,
    };
  }, [errorBook]);

  const virtualizedEntries = useMemo(() => {
    if (filteredEntries.length <= VISIBLE_ROWS + 4) {
      return { visible: filteredEntries, offsetY: 0, totalHeight: filteredEntries.length * VIRTUAL_ROW_HEIGHT };
    }
    const startIdx = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - 2);
    const endIdx = Math.min(filteredEntries.length, startIdx + VISIBLE_ROWS + 4);
    return {
      visible: filteredEntries.slice(startIdx, endIdx),
      offsetY: startIdx * VIRTUAL_ROW_HEIGHT,
      totalHeight: filteredEntries.length * VIRTUAL_ROW_HEIGHT,
      startIdx,
    };
  }, [filteredEntries, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleCardClick = useCallback((entry: ErrorBookEntry) => {
    setSelectedEntry(entry);
  }, []);

  useEffect(() => {
    setScrollTop(0);
  }, [subjectFilter, errorTypeFilter]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload?: { fill?: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span className="tooltip-dot" style={{ background: entry.payload?.fill || '#3B82F6' }} />
              {entry.name}: <strong>{entry.value}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="error-book-page">
      <h2 className="page-title">📒 错题本</h2>

      <div className="stats-grid">
        <StatCard label="总错题数" value={stats.total} icon="📊" color="#3B82F6" />
        <StatCard label="知识遗漏" value={stats.knowledge_gap} icon="📚" color="#EF4444" />
        <StatCard label="表述不清" value={stats.unclear_expression} icon="✏️" color="#F59E0B" />
        <StatCard label="理解偏差" value={stats.misunderstanding} icon="🧠" color="#8B5CF6" />
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h4 className="chart-title">错误类型分布</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={errorTypeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 13 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 13 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="数量" radius={[8, 8, 0, 0]} barSize={60}>
                {errorTypeChartData.map((entry, index) => (
                  <rect
                    key={`bar-${index}`}
                    fill={entry.fill}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4 className="chart-title">各科目错误类型统计</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={subjectErrorTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 13 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="知识遗漏" fill={ERROR_TYPE_COLORS.knowledge_gap} radius={[6, 6, 0, 0]} />
              <Bar dataKey="表述不清" fill={ERROR_TYPE_COLORS.unclear_expression} radius={[6, 6, 0, 0]} />
              <Bar dataKey="理解偏差" fill={ERROR_TYPE_COLORS.misunderstanding} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="filters-section">
        <h4 className="filters-title">筛选条件</h4>
        <div className="filters-group">
          <div className="filter-item">
            <label className="filter-label">科目：</label>
            <select
              className="filter-select"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">全部科目</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label className="filter-label">错误类型：</label>
            <select
              className="filter-select"
              value={errorTypeFilter}
              onChange={(e) => setErrorTypeFilter(e.target.value as ErrorType | 'all')}
            >
              <option value="all">全部类型</option>
              <option value="knowledge_gap">知识遗漏</option>
              <option value="unclear_expression">表述不清</option>
              <option value="misunderstanding">理解偏差</option>
            </select>
          </div>
        </div>
        <div className="result-count">共 {filteredEntries.length} 道错题</div>
      </div>

      <div className="error-list-wrapper" ref={listRef} onScroll={handleScroll}>
        <div
          className="error-list-spacer"
          style={{ height: `${virtualizedEntries.totalHeight}px`, position: 'relative' }}
        >
          <div style={{ transform: `translateY(${virtualizedEntries.offsetY}px)` }}>
            <div className="error-cards-grid">
              {virtualizedEntries.visible.map((entry) => (
                <ErrorCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => handleCardClick(entry)}
                />
              ))}
            </div>
          </div>
        </div>

        {filteredEntries.length === 0 && (
          <div className="empty-errorbook">
            <div className="empty-icon-lg">🎉</div>
            <p className="empty-text-lg">暂无错题记录，继续保持！</p>
          </div>
        )}
      </div>

      {selectedEntry && (
        <DetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
