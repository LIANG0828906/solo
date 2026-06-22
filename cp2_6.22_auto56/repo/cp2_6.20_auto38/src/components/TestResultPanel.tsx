import { useState, useMemo, useCallback } from 'react';
import type { TestResult, LintIssue } from '../types';
import { diffLines } from '../utils/diff';

interface TestResultPanelProps {
  results: TestResult[];
  lintIssues: LintIssue[];
}

function DiffView({ expected, actual }: { expected: string; actual: string }) {
  const diff = useMemo(() => diffLines(expected, actual), [expected, actual]);

  return (
    <div className="diff-view">
      <div className="diff-header">
        <span className="diff-col-linenum">行</span>
        <span className="diff-col-expected">期望输出</span>
        <span className="diff-col-linenum">行</span>
        <span className="diff-col-actual">实际输出</span>
      </div>
      <div className="diff-body">
        {diff.map((item, index) => {
          if (item.type === 'equal') {
            return (
              <div key={index} className="diff-row diff-row-equal">
                <span className="diff-linenum diff-linenum-expected">{item.lineNumber}</span>
                <span className="diff-content diff-content-expected">{item.content}</span>
                <span className="diff-linenum diff-linenum-actual">{item.lineNumber}</span>
                <span className="diff-content diff-content-actual">{item.content}</span>
              </div>
            );
          }
          if (item.type === 'removed') {
            return (
              <div key={index} className="diff-row diff-row-removed">
                <span className="diff-linenum diff-linenum-expected">{item.lineNumber}</span>
                <span className="diff-content diff-content-removed">
                  <span className="diff-sign">-</span>
                  {item.content}
                </span>
                <span className="diff-linenum diff-linenum-actual"></span>
                <span className="diff-content diff-content-empty"></span>
              </div>
            );
          }
          return (
            <div key={index} className="diff-row diff-row-added">
              <span className="diff-linenum diff-linenum-expected"></span>
              <span className="diff-content diff-content-empty"></span>
              <span className="diff-linenum diff-linenum-actual">{item.lineNumber}</span>
              <span className="diff-content diff-content-added">
                <span className="diff-sign">+</span>
                {item.content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TestResultPanel({ results, lintIssues }: TestResultPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const passedCount = useMemo(() => results.filter((r) => r.passed).length, [results]);
  const failedCount = useMemo(() => results.length - passedCount, [results.length, passedCount]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const progressPercent = results.length > 0 ? (passedCount / results.length) * 100 : 0;

  return (
    <div className="test-result-panel">
      <div className="stats-summary">
        <div className="stats-card stats-total">
          <span className="stats-card-value">{results.length}</span>
          <span className="stats-card-label">总用例</span>
        </div>
        <div className="stats-card stats-passed">
          <span className="stats-card-value">{passedCount}</span>
          <span className="stats-card-label">通过</span>
        </div>
        <div className="stats-card stats-failed">
          <span className="stats-card-value">{failedCount}</span>
          <span className="stats-card-label">失败</span>
        </div>
      </div>

      <div className="test-result-summary">
        <div className="test-result-progress">
          <div
            className="test-result-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="test-result-list">
        {results.map((result) => {
          const isExpanded = expandedIds.has(result.testCaseId);
          return (
            <div key={result.testCaseId} className={`test-result-item ${result.passed ? 'item-passed' : 'item-failed'}`}>
              <button
                className="test-result-header"
                onClick={() => toggleExpand(result.testCaseId)}
              >
                <span className={`test-result-icon ${result.passed ? 'pass' : 'fail'}`}>
                  {result.passed ? '✓' : '✗'}
                </span>
                <span className="test-result-name">{result.testCaseName}</span>
                <span className={`test-result-status-badge ${result.passed ? 'badge-pass' : 'badge-fail'}`}>
                  {result.passed ? '通过' : '失败'}
                </span>
                <span className="test-result-expand">{isExpanded ? '▼' : '▶'}</span>
              </button>
              <div
                className={`test-result-detail ${isExpanded ? 'open' : ''}`}
              >
                <div className="test-result-detail-inner">
                  <div className="test-result-section">
                    <h4>Input</h4>
                    <pre className="test-result-code">{result.expectedOutput}</pre>
                  </div>
                  <div className="test-result-section">
                    <h4>Expected Output</h4>
                    <pre className="test-result-output expected">{result.expectedOutput}</pre>
                  </div>
                  <div className="test-result-section">
                    <h4>Actual Output</h4>
                    <pre className={`test-result-output ${result.passed ? 'expected' : 'actual'}`}>
                      {result.actualOutput}
                    </pre>
                  </div>
                  {!result.passed && (
                    <div className="test-result-section diff-section">
                      <h4>Diff (差异对比)</h4>
                      <DiffView expected={result.expectedOutput} actual={result.actualOutput} />
                    </div>
                  )}
                  {result.error && (
                    <div className="test-result-section">
                      <h4>Error</h4>
                      <pre className="test-result-error">{result.error}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lintIssues.length > 0 && (
        <div className="lint-issues-section">
          <h3>Lint 问题 ({lintIssues.length})</h3>
          <div className="lint-issues-list">
            {lintIssues.map((issue, idx) => (
              <div key={idx} className={`lint-issue-item severity-${issue.severity}`}>
                <span className="lint-issue-severity">
                  {issue.severity === 'warning' ? '⚠️' : '❌'}
                </span>
                <span className="lint-issue-location">
                  Line {issue.line}, Col {issue.column}
                </span>
                <span className="lint-issue-message">{issue.message}</span>
                <span className="lint-issue-rule">[{issue.rule}]</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
