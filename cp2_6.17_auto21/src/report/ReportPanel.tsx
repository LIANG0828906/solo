import { useState } from 'react';
import { useAnalysisStore } from '../analysis/store';
import { generateMarkdownReport } from '../analysis/analyzer';
import type { Issue, IssueType, Severity } from '../utils/db';

const TYPE_LABELS: Record<IssueType, string> = {
  'duplication': '重复代码',
  'complexity': '高复杂度',
  'long-function': '过长函数',
};

const TYPE_COLORS: Record<IssueType, string> = {
  'duplication': '#FFE0E0',
  'complexity': '#FFF0D0',
  'long-function': '#E0F0FF',
};

const TYPE_HOVER_COLORS: Record<IssueType, string> = {
  'duplication': '#FFD0D0',
  'complexity': '#FFE8A0',
  'long-function': '#C0E0FF',
};

const TYPE_ICON: Record<IssueType, string> = {
  'duplication': '🔴',
  'complexity': '🟡',
  'long-function': '🔵',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  'high': '严重',
  'medium': '中等',
  'low': '轻微',
};

const SEVERITY_COLORS: Record<Severity, string> = {
  'high': '#E53935',
  'medium': '#FB8C00',
  'low': '#1E88E5',
};

type FilterType = 'all' | IssueType;

interface ReportPanelProps {
  activeTab: 'issues' | 'report' | 'history';
  onTabChange: (tab: 'issues' | 'report' | 'history') => void;
}

export default function ReportPanel({ activeTab, onTabChange }: ReportPanelProps) {
  const {
    result,
    filename,
    thresholds,
    selectedIssueId,
    selectIssue,
  } = useAnalysisStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const filteredIssues = result?.issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.type === filter;
  }) || [];

  const handleIssueClick = (issueId: string) => {
    if (selectedIssueId === issueId) {
      selectIssue(null);
    } else {
      selectIssue(issueId);
    }
  };

  const markdownContent = result
    ? generateMarkdownReport(result, filename, thresholds)
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdownContent).then(() => {
      alert('Markdown 报告已复制到剪贴板');
    });
  };

  const renderIssueCard = (issue: Issue) => {
    const isSelected = selectedIssueId === issue.id;
    const bgColor = isSelected ? TYPE_HOVER_COLORS[issue.type] : TYPE_COLORS[issue.type];

    return (
      <div
        key={issue.id}
        onClick={() => handleIssueClick(issue.id)}
        style={{
          padding: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: bgColor,
          borderRadius: '10px',
          marginBottom: '8px',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{TYPE_ICON[issue.type]}</span>
            <span style={{ fontWeight: 500, fontSize: '14px', color: '#333' }}>
              {TYPE_LABELS[issue.type]}
            </span>
          </div>
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '9999px',
              color: 'white',
              backgroundColor: SEVERITY_COLORS[issue.severity],
            }}
          >
            {SEVERITY_LABELS[issue.severity]}
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          📍 {filename}:{issue.lineStart}-{issue.lineEnd}
          {issue.functionName && (
            <span style={{ marginLeft: '8px' }}>📦 {issue.functionName}</span>
          )}
          {issue.complexity !== undefined && (
            <span style={{ marginLeft: '8px' }}>📊 复杂度: {issue.complexity}</span>
          )}
        </div>

        <p style={{ fontSize: '14px', color: '#333', marginBottom: '4px' }}>{issue.message}</p>
        <p style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>💡 {issue.suggestion}</p>
      </div>
    );
  };

  const renderStatsBadge = (type: IssueType, count: number) => (
    <button
      key={type}
      onClick={() => setFilter(filter === type ? 'all' : type)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'all 0.15s ease',
        backgroundColor: TYPE_COLORS[type],
        color: '#333',
        border: filter === type ? '2px solid #999' : '2px solid transparent',
      }}
    >
      <span>{TYPE_ICON[type]}</span>
      <span>{TYPE_LABELS[type]}</span>
      <span style={{
        backgroundColor: 'rgba(255,255,255,0.6)',
        padding: '1px 6px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 700,
      }}>
        {count}
      </span>
    </button>
  );

  const renderExportModal = () => {
    if (!showExportModal || !result) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#00000066',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setShowExportModal(false)}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}>
              📋 导出 Markdown 审查报告
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#0078D4',
                  color: 'white',
                  borderRadius: '8px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1086E0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0078D4'; }}
              >
                📋 复制到剪贴板
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#f3f4f6',
                  color: '#666',
                  borderRadius: '8px',
                }}
              >
                关闭
              </button>
            </div>
          </div>

          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
          }}>
            <div style={{
              backgroundColor: '#0d1117',
              color: '#c9d1d9',
              padding: '20px',
              borderRadius: '12px',
              fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
              fontSize: '13px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
            }}>
              {markdownContent}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportTable = () => {
    if (!result) return null;

    const severityCount: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
    result.issues.forEach(i => { severityCount[i.severity]++; });

    return (
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e' }}>{result.stats.total}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>问题总数</div>
          </div>
          <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{severityCount.high}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>严重问题</div>
          </div>
          <div style={{ backgroundColor: '#fff7ed', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c' }}>{severityCount.medium}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>中等问题</div>
          </div>
          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>{severityCount.low}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>轻微问题</div>
          </div>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>
          📋 问题详情
        </h3>
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>序号</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>类型</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>严重程度</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>位置</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>描述</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>修复建议</th>
              </tr>
            </thead>
            <tbody>
              {result.issues.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                    ✅ 代码质量良好，未发现问题！
                  </td>
                </tr>
              ) : (
                result.issues.map((issue, index) => (
                  <tr
                    key={issue.id}
                    onClick={() => selectIssue(issue.id)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: TYPE_COLORS[issue.type] + '40',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = TYPE_COLORS[issue.type]; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = TYPE_COLORS[issue.type] + '40'; }}
                  >
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>{index + 1}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', color: SEVERITY_COLORS[issue.severity] }}>
                      {TYPE_ICON[issue.type]} {TYPE_LABELS[issue.type]}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: 'white',
                        backgroundColor: SEVERITY_COLORS[issue.severity],
                      }}>
                        {SEVERITY_LABELS[issue.severity]}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {filename}:{issue.lineStart}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {issue.message}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {issue.suggestion}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['issues', 'report'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.15s ease',
              color: activeTab === tab ? '#2563eb' : '#6b7280',
              backgroundColor: 'transparent',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
            }}
          >
            {tab === 'issues' ? '问题列表' : '审查报告'}
            {tab === 'issues' && result && result.stats.total > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontSize: '12px',
                padding: '1px 6px',
                borderRadius: '9999px',
              }}>
                {result.stats.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'issues' && (
        <>
          <div style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                  backgroundColor: filter === 'all' ? '#374151' : 'white',
                  color: filter === 'all' ? 'white' : '#4b5563',
                  border: filter === 'all' ? '1px solid #374151' : '1px solid #e5e7eb',
                }}
              >
                全部 {result && `(${result.stats.total})`}
              </button>
              {result && (['duplication', 'complexity', 'long-function'] as const).map(type =>
                renderStatsBadge(type, type === 'long-function' ? result.stats.longFunction : result.stats[type as 'duplication' | 'complexity'])
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {!result ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '64px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>点击"分析代码"按钮</p>
                <p style={{ fontSize: '14px' }}>开始检测代码质量问题</p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '64px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>未发现此类问题</p>
                <p style={{ fontSize: '14px' }}>代码质量良好</p>
              </div>
            ) : (
              filteredIssues.map(renderIssueCard)
            )}
          </div>
        </>
      )}

      {activeTab === 'report' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '12px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb',
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {result ? `共 ${result.stats.total} 个问题` : '暂无报告'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowMarkdown(!showMarkdown)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  backgroundColor: showMarkdown ? '#374151' : '#e5e7eb',
                  color: showMarkdown ? 'white' : '#4b5563',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                }}
                disabled={!result}
              >
                {showMarkdown ? '📊 预览模式' : '📝 Markdown 源码'}
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  backgroundColor: '#0078D4',
                  color: 'white',
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease',
                }}
                disabled={!result}
                onMouseEnter={(e) => { if (result) e.currentTarget.style.backgroundColor = '#1086E0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0078D4'; }}
              >
                📤 导出 Markdown
              </button>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease',
                }}
                disabled={!result}
                onMouseEnter={(e) => { if (result) e.currentTarget.style.backgroundColor = '#059669'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#10b981'; }}
              >
                📋 复制
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {!result ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '64px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <p style={{ fontSize: '18px' }}>请先分析代码生成报告</p>
              </div>
            ) : showMarkdown ? (
              <pre style={{
                backgroundColor: '#0d1117',
                color: '#c9d1d9',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '12px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
                lineHeight: '1.6',
              }}>
                {markdownContent}
              </pre>
            ) : (
              renderReportTable()
            )}
          </div>
        </div>
      )}

      {renderExportModal()}
    </div>
  );
}
