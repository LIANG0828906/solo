import { useMemo } from 'react';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { EvaluationResult } from '../types';

interface ReportPreviewProps {
  evaluationResult: EvaluationResult;
  assignmentTitle: string;
}

export default function ReportPreview({ evaluationResult, assignmentTitle }: ReportPreviewProps) {
  const scorePercent = useMemo(() => {
    if (evaluationResult.totalTests === 0) return 0;
    return Math.round((evaluationResult.passedTests / evaluationResult.totalTests) * 100);
  }, [evaluationResult.passedTests, evaluationResult.totalTests]);

  const conicGradient = useMemo(() => {
    return `conic-gradient(#10b981 0% ${scorePercent}%, #e2e8f0 ${scorePercent}% 100%)`;
  }, [scorePercent]);

  const pieData = useMemo(() => {
    return [
      { name: 'Passed', value: evaluationResult.passedTests, color: '#10b981' },
      { name: 'Failed', value: evaluationResult.totalTests - evaluationResult.passedTests, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [evaluationResult.passedTests, evaluationResult.totalTests]);

  const handleDownload = () => {
    const html = generateReportHTML(evaluationResult, assignmentTitle, scorePercent);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${evaluationResult.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-preview">
      <div className="report-preview-header">
        <div>
          <h2 className="report-preview-title">{assignmentTitle}</h2>
          <p className="report-preview-time">
            提交时间: {dayjs(evaluationResult.timestamp).format('YYYY-MM-DD HH:mm:ss')}
          </p>
        </div>
        <button className="report-download-btn" onClick={handleDownload}>
          下载报告
        </button>
      </div>

      <div className="report-preview-scores">
        <div className="score-circle" style={{ background: conicGradient }}>
          <div className="score-circle-inner">
            <span className="score-value">{scorePercent}</span>
            <span className="score-label">%</span>
          </div>
        </div>

        <div className="score-chart">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="report-preview-table">
        <h3>测试结果</h3>
        <table>
          <thead>
            <tr>
              <th>测试名称</th>
              <th>结果</th>
              <th>预期输出</th>
              <th>实际输出</th>
            </tr>
          </thead>
          <tbody>
            {evaluationResult.testResults.map((result) => (
              <tr key={result.testCaseId} className={result.passed ? 'row-pass' : 'row-fail'}>
                <td>{result.testCaseName}</td>
                <td>{result.passed ? '✓ 通过' : '✗ 失败'}</td>
                <td><pre>{result.expectedOutput}</pre></td>
                <td><pre>{result.actualOutput}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {evaluationResult.lintIssues.length > 0 && (
        <div className="report-lint-issues">
          <h3>Lint 问题 ({evaluationResult.lintIssues.length})</h3>
          <ul>
            {evaluationResult.lintIssues.map((issue, idx) => (
              <li key={idx}>
                <span className={`lint-severity ${issue.severity}`}>
                  {issue.severity === 'warning' ? '⚠️' : '❌'}
                </span>
                <span>Line {issue.line}, Col {issue.column}: {issue.message}</span>
                <span className="lint-rule">({issue.rule})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function generateReportHTML(result: EvaluationResult, title: string, scorePercent: number): string {
  const rows = result.testResults
    .map(
      (r) => `<tr class="${r.passed ? 'pass' : 'fail'}">
      <td>${r.testCaseName}</td>
      <td>${r.passed ? '✓' : '✗'}</td>
      <td><pre>${r.expectedOutput}</pre></td>
      <td><pre>${r.actualOutput}</pre></td>
    </tr>`,
    )
    .join('');

  const lintRows = result.lintIssues
    .map(
      (l) => `<li>Line ${l.line}, Col ${l.column}: ${l.message} (${l.rule})</li>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>评测报告 - ${title}</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; }
    h1 { color: #0f172a; }
    .score { font-size: 48px; font-weight: 700; color: #10b981; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; }
    .pass { background: #f0fdf4; }
    .fail { background: #fef2f2; }
    pre { margin: 0; white-space: pre-wrap; font-size: 13px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
  <h1>评测报告 - ${title}</h1>
  <p>提交时间: ${dayjs(result.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
  <p class="score">得分: ${scorePercent}% (${result.passedTests}/${result.totalTests})</p>
  <h2>测试结果</h2>
  <table>
    <thead><tr><th>名称</th><th>结果</th><th>预期</th><th>实际</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${result.lintIssues.length > 0 ? `<h2>Lint 问题</h2><ul>${lintRows}</ul>` : ''}
</body>
</html>`;
}
