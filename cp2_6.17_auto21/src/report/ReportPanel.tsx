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

  const filteredIssues = result?.issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.type === filter;
  }) || [];

  const groupedIssues: Record<IssueType, Issue[]> = {
    'duplication': [],
    'complexity': [],
    'long-function': [],
  };

  result?.issues.forEach(issue => {
    groupedIssues[issue.type].push(issue);
  });

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
        className="p-3 cursor-pointer transition-all duration-200 hover:shadow-md"
        style={{
          backgroundColor: bgColor,
          borderRadius: '10px',
          marginBottom: '8px',
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <span>{TYPE_ICON[issue.type]}</span>
            <span className="font-medium text-sm text-gray-800">
              {TYPE_LABELS[issue.type]}
            </span>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }}
          >
            {SEVERITY_LABELS[issue.severity]}
          </span>
        </div>
        
        <div className="text-xs text-gray-600 mb-2">
          📍 {filename}:{issue.lineStart}-{issue.lineEnd}
          {issue.functionName && (
            <span className="ml-2">📦 {issue.functionName}</span>
          )}
          {issue.complexity !== undefined && (
            <span className="ml-2">📊 复杂度: {issue.complexity}</span>
          )}
        </div>
        
        <p className="text-sm text-gray-700 mb-1">{issue.message}</p>
        <p className="text-xs text-gray-500 italic">💡 {issue.suggestion}</p>
      </div>
    );
  };

  const renderStatsBadge = (type: IssueType, count: number) => (
    <button
      key={type}
      onClick={() => setFilter(filter === type ? 'all' : type)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        filter === type ? 'ring-2 ring-offset-1 ring-gray-400' : ''
      }`}
      style={{ 
        backgroundColor: TYPE_COLORS[type],
        color: '#333',
      }}
    >
      <span>{TYPE_ICON[type]}</span>
      <span>{TYPE_LABELS[type]}</span>
      <span className="bg-white/60 px-1.5 rounded text-xs font-bold">
        {count}
      </span>
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex border-b border-gray-200">
        {(['issues', 'report'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'issues' ? '问题列表' : '审查报告'}
            {tab === 'issues' && result && result.stats.total > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                {result.stats.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'issues' && (
        <>
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-gray-700 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                全部 {result && `(${result.stats.total})`}
              </button>
              {result && (['duplication', 'complexity', 'long-function'] as const).map(type => 
                renderStatsBadge(type, result.stats[type])
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {!result ? (
              <div className="text-center text-gray-400 py-16">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg mb-2">点击"分析代码"按钮</p>
                <p className="text-sm">开始检测代码质量问题</p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-lg mb-2">未发现此类问题</p>
                <p className="text-sm">代码质量良好</p>
              </div>
            ) : (
              filteredIssues.map(renderIssueCard)
            )}
          </div>
        </>
      )}

      {activeTab === 'report' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-sm text-gray-600">
              {result ? `共 ${result.stats.total} 个问题` : '暂无报告'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMarkdown(!showMarkdown)}
                className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                disabled={!result}
              >
                {showMarkdown ? '预览模式' : 'Markdown 源码'}
              </button>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!result}
              >
                📋 复制 Markdown
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {!result ? (
              <div className="text-center text-gray-400 py-16">
                <div className="text-5xl mb-4">📄</div>
                <p className="text-lg">请先分析代码生成报告</p>
              </div>
            ) : showMarkdown ? (
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                {markdownContent}
              </pre>
            ) : (
              <div className="overflow-x-auto" style={{ minWidth: '800px' }}>
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3 text-gray-800">📊 问题摘要</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">{result.stats.total}</div>
                      <div className="text-sm text-gray-500">问题总数</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {result.issues.filter(i => i.severity === 'high').length}
                      </div>
                      <div className="text-sm text-gray-500">严重问题</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {result.issues.filter(i => i.severity === 'medium').length}
                      </div>
                      <div className="text-sm text-gray-500">中等问题</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.issues.filter(i => i.severity === 'low').length}
                      </div>
                      <div className="text-sm text-gray-500">轻微问题</div>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-3 text-gray-800">📋 问题详情</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left border-b border-gray-200">序号</th>
                        <th className="px-3 py-2 text-left border-b border-gray-200">类型</th>
                        <th className="px-3 py-2 text-left border-b border-gray-200">严重程度</th>
                        <th className="px-3 py-2 text-left border-b border-gray-200">位置</th>
                        <th className="px-3 py-2 text-left border-b border-gray-200">描述</th>
                        <th className="px-3 py-2 text-left border-b border-gray-200">修复建议</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.issues.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                            ✅ 代码质量良好，未发现问题！
                          </td>
                        </tr>
                      ) : (
                        result.issues.map((issue, index) => (
                          <tr 
                            key={issue.id} 
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            style={{ backgroundColor: TYPE_COLORS[issue.type] + '40' }}
                            onClick={() => selectIssue(issue.id)}
                          >
                            <td className="px-3 py-2 border-b border-gray-100">{index + 1}</td>
                            <td className="px-3 py-2 border-b border-gray-100">
                              <span style={{ color: SEVERITY_COLORS[issue.severity] }}>
                                {TYPE_ICON[issue.type]} {TYPE_LABELS[issue.type]}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100">
                              <span
                                className="px-2 py-0.5 rounded text-xs text-white"
                                style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }}
                              >
                                {SEVERITY_LABELS[issue.severity]}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100 font-mono text-xs">
                              {filename}:{issue.lineStart}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-100">{issue.message}</td>
                            <td className="px-3 py-2 border-b border-gray-100 text-gray-600 text-xs">
                              {issue.suggestion}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
