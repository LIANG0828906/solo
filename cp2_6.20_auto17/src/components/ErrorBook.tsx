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

const VIRTUAL_ROW_HEIGHT = 260;
const VISIBLE_ROWS = 10;
const ALL_ERROR_TYPES: ErrorType[] = ['knowledge_gap', 'unclear_expression', 'misunderstanding'];

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
  style,
}: {
  entry: ErrorBookEntry;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  const typeLabel = ERROR_TYPE_LABELS[entry.errorType];
  const typeColor = ERROR_TYPE_COLORS[entry.errorType];

  return (
    <div className="error-card" style={style} onClick={onClick}>
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

interface DiffSegment {
  text: string;
  isMatch: boolean;
  isStudentOnly?: boolean;
  isStandardOnly?: boolean;
}

function highlightDifferences(student: string, standard: string): { studentSegs: DiffSegment[]; standardSegs: DiffSegment[]; commonKeywords: string[] } {
  const stdLower = standard.toLowerCase();
  const stuLower = student.toLowerCase();

  const tokenize = (text: string) => {
    const tokens: string[] = [];
    const regex = /[\u4e00-\u9fa5]{2,}|[a-zA-Z0-9_]{2,}/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) tokens.push(m[0]);
    return tokens;
  };

  const stdTokens = tokenize(stdLower);
  const stuTokens = tokenize(stuLower);
  const commonKeywords = stdTokens.filter((t) => t.length >= 2 && stuTokens.includes(t));

  const buildSegs = (text: string, keywordList: string[], _highlightMissing: boolean, source: 'student' | 'standard'): DiffSegment[] => {
    if (text.length === 0) return [{ text: '（未作答）', isMatch: false, isStudentOnly: source === 'student' }];
    const segs: DiffSegment[] = [];
    let lower = text.toLowerCase();
    const indices: Array<{ start: number; end: number; word: string }> = [];
    keywordList.forEach((kw) => {
      let idx = 0;
      while ((idx = lower.indexOf(kw, idx)) !== -1) {
        indices.push({ start: idx, end: idx + kw.length, word: kw });
        idx += kw.length;
      }
    });
    indices.sort((a, b) => a.start - b.start);
    const merged: typeof indices = [];
    indices.forEach((r) => {
      const last = merged[merged.length - 1];
      if (last && r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
      } else {
        merged.push({ ...r });
      }
    });

    let cursor = 0;
    merged.forEach((r) => {
      if (r.start > cursor) {
        segs.push({
          text: text.slice(cursor, r.start),
          isMatch: false,
          [source === 'standard' ? 'isStandardOnly' : 'isStudentOnly']: true,
        } as DiffSegment);
      }
      segs.push({ text: text.slice(r.start, r.end), isMatch: true });
      cursor = r.end;
    });
    if (cursor < text.length) {
      segs.push({
        text: text.slice(cursor),
        isMatch: false,
        [source === 'standard' ? 'isStandardOnly' : 'isStudentOnly']: true,
      } as DiffSegment);
    }
    return segs;
  };

  const keywordsForStudent = commonKeywords;
  const keywordsForStandard = commonKeywords;
  const studentSegs = buildSegs(student, keywordsForStudent, false, 'student');
  const standardSegs = buildSegs(standard, keywordsForStandard, true, 'standard');
  return { studentSegs, standardSegs, commonKeywords: Array.from(new Set(commonKeywords)) };
}

function DiffView({
  studentAnswer,
  standardAnswer,
  keywords,
}: {
  studentAnswer: string;
  standardAnswer: string;
  keywords: string[];
}) {
  const { studentSegs, standardSegs, commonKeywords } = useMemo(
    () => highlightDifferences(studentAnswer || '', standardAnswer || ''),
    [studentAnswer, standardAnswer]
  );
  const allKeywords = useMemo(
    () => Array.from(new Set([...commonKeywords, ...keywords.slice(0, 8)])),
    [commonKeywords, keywords]
  );

  return (
    <div className="diff-view-wrapper">
      <div className="diff-columns">
        <div className="diff-col diff-col-student">
          <div className="diff-col-header">
            <span className="diff-dot student-dot" />
            <span>学生答案</span>
            <span className="diff-status-badge student-badge">
              {studentAnswer ? '已作答' : '未作答'}
            </span>
          </div>
          <div className="diff-content-box">
            {studentSegs.length === 0 ? (
              <span className="placeholder-text">（未作答）</span>
            ) : (
              studentSegs.map((seg, i) => (
                <span
                  key={`stu-${i}`}
                  className={
                    'diff-seg ' +
                    (seg.isMatch ? 'diff-match' : seg.isStudentOnly ? 'diff-student-only' : '')
                  }
                >
                  {seg.text}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="diff-col diff-col-standard">
          <div className="diff-col-header">
            <span className="diff-dot standard-dot" />
            <span>标准答案</span>
            <span className="diff-status-badge standard-badge">参考答案</span>
          </div>
          <div className="diff-content-box">
            {standardSegs.map((seg, i) => (
              <span
                key={`std-${i}`}
                className={
                  'diff-seg ' +
                  (seg.isMatch ? 'diff-match' : seg.isStandardOnly ? 'diff-standard-only' : '')
                }
              >
                {seg.text}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="keywords-bar">
        <div className="keywords-bar-title">关键词命中：</div>
        <div className="keywords-tags">
          {allKeywords.length === 0 && <span className="keywords-empty">暂无命中关键词</span>}
          {allKeywords.map((kw) => {
            const hit =
              studentAnswer.toLowerCase().includes(kw.toLowerCase());
            return (
              <span
                key={kw}
                className={`keyword-tag ${hit ? 'hit' : 'miss'}`}
              >
                {hit ? '✓' : '✗'} {kw}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const DiffViewMemo = memo(DiffView);

const DetailModal = memo(function DetailModal({
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
      <div className="modal-content detail-modal-lg" onClick={(e) => e.stopPropagation()}>
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

          <div className="detail-section">
            <div className="detail-label">答案对比视图</div>
            <DiffViewMemo
              studentAnswer={entry.studentAnswer}
              standardAnswer={entry.question.standardAnswer}
              keywords={entry.question.keywords}
            />
          </div>

          <div className="detail-section">
            <div className="detail-label">批改评语</div>
            <div className="detail-content feedback-content">{entry.feedback}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export function ErrorBook({ userId }: ErrorBookProps) {
  const errorBook = useStore((s) => s.errorBook.filter((e) => e.userId === userId));
  const subjects = useMemo(() => Array.from(new Set(errorBook.map((e) => e.subject))), [errorBook]);

  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState<ErrorType | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<ErrorBookEntry | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [chartsReady, setChartsReady] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredEntries = useMemo(() => {
    return errorBook
      .filter((e) => (subjectFilter === 'all' ? true : e.subject === subjectFilter))
      .filter((e) => (errorTypeFilter === 'all' ? true : e.errorType === errorTypeFilter))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [errorBook, subjectFilter, errorTypeFilter]);

  const errorTypeChartData = useMemo(() => {
    if (!chartsReady) {
      return ALL_ERROR_TYPES.map((t) => ({
        name: ERROR_TYPE_LABELS[t],
        数量: 0,
        fill: ERROR_TYPE_COLORS[t],
      }));
    }
    const errorMap: Record<ErrorType, number> = {
      knowledge_gap: 0,
      unclear_expression: 0,
      misunderstanding: 0,
    };
    errorBook.forEach((e) => {
      errorMap[e.errorType] = (errorMap[e.errorType] || 0) + 1;
    });
    return ALL_ERROR_TYPES.map((type) => ({
      name: ERROR_TYPE_LABELS[type],
      数量: errorMap[type] ?? 0,
      fill: ERROR_TYPE_COLORS[type],
    }));
  }, [errorBook, chartsReady]);

  const subjectErrorTypeData = useMemo(() => {
    if (!chartsReady || subjects.length === 0) {
      return [{ subject: '暂无数据', 知识遗漏: 0, 表述不清: 0, 理解偏差: 0 }];
    }
    const subjectMap: Record<string, Record<ErrorType, number>> = {};
    subjects.forEach((s) => {
      subjectMap[s] = { knowledge_gap: 0, unclear_expression: 0, misunderstanding: 0 };
    });
    errorBook.forEach((e) => {
      if (!subjectMap[e.subject]) {
        subjectMap[e.subject] = { knowledge_gap: 0, unclear_expression: 0, misunderstanding: 0 };
      }
      subjectMap[e.subject][e.errorType] = (subjectMap[e.subject][e.errorType] ?? 0) + 1;
    });
    return subjects.map((subject) => {
      const counts = subjectMap[subject];
      return {
        subject,
        知识遗漏: counts.knowledge_gap ?? 0,
        表述不清: counts.unclear_expression ?? 0,
        理解偏差: counts.misunderstanding ?? 0,
      };
    });
  }, [errorBook, subjects, chartsReady]);

  const stats = useMemo(() => {
    const typeCounts: Record<ErrorType, number> = {
      knowledge_gap: 0,
      unclear_expression: 0,
      misunderstanding: 0,
    };
    errorBook.forEach((e) => {
      typeCounts[e.errorType] = (typeCounts[e.errorType] ?? 0) + 1;
    });
    return {
      total: errorBook.length,
      knowledge_gap: typeCounts.knowledge_gap ?? 0,
      unclear_expression: typeCounts.unclear_expression ?? 0,
      misunderstanding: typeCounts.misunderstanding ?? 0,
    };
  }, [errorBook]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const id2 = window.setTimeout(() => setChartsReady(true), 30);
      return () => window.clearTimeout(id2);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const virtualizedEntries = useMemo(() => {
    const total = filteredEntries.length;
    if (total <= VISIBLE_ROWS + 4) {
      return { visible: filteredEntries, offsetY: 0, totalHeight: total * VIRTUAL_ROW_HEIGHT };
    }
    const startIdx = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - 2);
    const endIdx = Math.min(total, startIdx + VISIBLE_ROWS + 4);
    return {
      visible: filteredEntries.slice(startIdx, endIdx),
      offsetY: startIdx * VIRTUAL_ROW_HEIGHT,
      totalHeight: total * VIRTUAL_ROW_HEIGHT,
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

  const CustomTooltip = memo(function CustomTooltip({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload?: { fill?: string } }>;
  }) {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="chart-tooltip">
        {payload.map((entry, index) => {
          const displayValue = typeof entry.value === 'number' ? entry.value : 0;
          return (
            <div key={index} className="tooltip-item">
              <span
                className="tooltip-dot"
                style={{ background: entry.payload?.fill || '#3B82F6' }}
              />
              {entry.name}: <strong>{displayValue}</strong>
            </div>
          );
        })}
      </div>
    );
  });

  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubjectFilter(e.target.value);
  }, []);

  const handleErrorTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setErrorTypeFilter(e.target.value as ErrorType | 'all');
  }, []);

  const closeModal = useCallback(() => setSelectedEntry(null), []);

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
            <BarChart
              data={errorTypeChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 13 }} />
              <YAxis
                tick={{ fill: '#475569', fontSize: 13 }}
                allowDecimals={false}
                domain={[0, 'auto']}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="数量" radius={[8, 8, 0, 0]} barSize={60} maxBarSize={60}>
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
            <BarChart
              data={subjectErrorTypeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13 }} />
              <YAxis
                tick={{ fill: '#475569', fontSize: 13 }}
                allowDecimals={false}
                domain={[0, 'auto']}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar
                dataKey="知识遗漏"
                stackId="a"
                fill={ERROR_TYPE_COLORS.knowledge_gap}
                radius={[0, 0, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="表述不清"
                stackId="a"
                fill={ERROR_TYPE_COLORS.unclear_expression}
                radius={[0, 0, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="理解偏差"
                stackId="a"
                fill={ERROR_TYPE_COLORS.misunderstanding}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
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
              onChange={handleSubjectChange}
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
              onChange={handleErrorTypeChange}
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

      {selectedEntry && <DetailModal entry={selectedEntry} onClose={closeModal} />}
    </div>
  );
}
