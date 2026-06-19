import { useState, useMemo } from 'react';
import type { TestResult, LintIssue } from '../types';

interface TestResultPanelProps {
  results: TestResult[];
  lintIssues: LintIssue[];
}

function DiffView({ expected, actual }: { expected: string; actual: string }) {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const maxLen = Math.max(expectedLines.length, actualLines.length);

  const rows = [];
  for (let i = 0; i < maxLen; i++) {
    const expLine = expectedLines[i] ?? '';
    const actLine = actualLines[i] ?? '';
    const isDiff = expLine !== actLine;
    rows.push(
      <div key={i} className={`diff-row ${isDiff ? 'diff-highlight' : ''}`}>
        <span className="diff-line-number">{i + 1}</span>
        <span className="diff-expected">{expLine}</span>
        <span className="diff-actual">{actLine}</span>
      </div>,
    );
  }

  return (
    <div className="diff-view">
      <div className="diff-header">
        <span>Line</span>
        <span>Expected</span>
        <span>Actual</span>
      </div>
      {rows}
    </div>
  );
}

export default function TestResultPanel({ results, lintIssues }: TestResultPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const passedCount = useMemo(() => results.filter((r) => r.passed).length, [results]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progressPercent = results.length > 0 ? (passedCount / results.length) * 100 : 0;

  return (
    <div className="test-result-panel">
      <div className="test-result-summary">
        <span className="test-result-count">
          {passedCount}/{results.length} passed
        </span>
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
            <div key={result.testCaseId} className="test-result-item">
              <button
                className="test-result-header"
                onClick={() => toggleExpand(result.testCaseId)}
              >
                <span className={`test-result-icon ${result.passed ? 'pass' : 'fail'}`}>
                  {result.passed ? '✓' : '✗'}
                </span>
                <span className="test-result-name">{result.testCaseName}</span>
                <span className="test-result-expand">{isExpanded ? '▼' : '▶'}</span>
              </button>
              <div
                className="test-result-detail"
                style={{
                  maxHeight: isExpanded ? '300px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
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
                    <div className="test-result-section">
                      <h4>Diff</h4>
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
          <h3>Lint Issues ({lintIssues.length})</h3>
          <div className="lint-issues-list">
            {lintIssues.map((issue, idx) => (
              <div key={idx} className="lint-issue-item">
                <span className={`lint-issue-severity ${issue.severity}`}>
                  {issue.severity === 'warning' ? '⚠️' : '❌'}
                </span>
                <span className="lint-issue-location">
                  Line {issue.line}, Col {issue.column}
                </span>
                <span className="lint-issue-message">{issue.message}</span>
                <span className="lint-issue-rule">{issue.rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
