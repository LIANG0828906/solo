import { useMemo, useRef, useCallback, useState } from 'react';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { EvaluationResult } from '../types';

interface ReportPreviewProps {
  evaluationResult: EvaluationResult;
  assignmentTitle: string;
}

export default function ReportPreview({ evaluationResult, assignmentTitle }: ReportPreviewProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current) return;

    setIsGenerating(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`report-${evaluationResult.id}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [evaluationResult.id]);

  return (
    <div className="report-preview">
      <div className="report-preview-header">
        <div>
          <h2 className="report-preview-title">{assignmentTitle}</h2>
          <p className="report-preview-time">
            提交时间: {dayjs(evaluationResult.timestamp).format('YYYY-MM-DD HH:mm:ss')}
          </p>
        </div>
        <button
          className="report-download-btn"
          onClick={handleDownloadPDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="btn-spinner" /> 生成中...
            </>
          ) : (
            '下载 PDF 报告'
          )}
        </button>
      </div>

      <div ref={reportRef} className="report-content">
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

        <div className="report-footer">
          <p>
            得分: {evaluationResult.passedTests}/{evaluationResult.totalTests} = {scorePercent}%
          </p>
          <p className="report-footer-subtitle">
            代码作业评测平台 · {dayjs(evaluationResult.timestamp).format('YYYY-MM-DD')}
          </p>
        </div>
      </div>
    </div>
  );
}
