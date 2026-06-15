import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { CodeEditor } from '../components/CodeEditor';
import { LoadingSpinner } from '../components/Common';
import { Assignment } from '../../types';

export const StudentPage: React.FC = () => {
  const {
    assignments,
    fetchAssignments,
    currentAssignment,
    setCurrentAssignment,
    runTests,
    testResults,
    loading,
    error,
    setError,
    clearTestResults,
    currentUserId,
  } = useAppStore();

  const [code, setCode] = useState(
    `// 请实现 solution 函数\n// 示例：\n// function solution(nums, target) {\n//   for (let i = 0; i < nums.length; i++) {\n//     for (let j = i + 1; j < nums.length; j++) {\n//       if (nums[i] + nums[j] === target) return [i, j];\n//     }\n//   }\n//   return [];\n// }\n\nfunction solution() {\n  // 在此实现你的代码\n  \n}\n`
  );
  const [expandedCase, setExpandedCase] = useState<number | null>(null);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAssignments();
    fetchMySubmissions();
  }, [fetchAssignments, currentUserId]);

  const fetchMySubmissions = async () => {
    try {
      const res = await fetch(`/api/assignments/_/submissions?studentId=${currentUserId}`);
      if (res.ok) {
        const subs = await res.json();
        setSubmittedIds(new Set(subs.map((s: any) => s.assignmentId)));
      }
    } catch {}
  };

  const handleSelectAssignment = (a: Assignment) => {
    setCurrentAssignment(a);
    clearTestResults();
    setExpandedCase(null);
  };

  const handleRunTests = async () => {
    if (!currentAssignment) return;
    await runTests(currentAssignment.id, code);
  };

  if (!currentAssignment) {
    return (
      <div>
        <h2 className="page-title">选择作业</h2>
        {loading && assignments.length === 0 ? (
          <LoadingSpinner />
        ) : assignments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#9e9e9e', padding: '40px' }}>
            暂无作业
          </div>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelectAssignment(a)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#37474f', marginBottom: '6px' }}>
                    {a.title}
                    {submittedIds.has(a.id) && (
                      <span style={{
                        marginLeft: '10px', fontSize: '11px',
                        background: '#e8f5e9', color: '#2e7d32',
                        padding: '2px 8px', borderRadius: '10px',
                      }}>
                        ✓ 已提交
                      </span>
                    )}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#607d8b' }}>
                    {a.description?.slice(0, 100) || '暂无描述'}{a.description?.length > 100 ? '...' : ''}
                  </p>
                </div>
                <span style={{ fontSize: '12px', color: '#9e9e9e' }}>
                  📋 {a.testCases.length} 测试
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  const passedCount = testResults?.filter((t) => t.passed).length ?? 0;
  const totalCount = testResults?.length ?? 0;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn-secondary"
          onClick={() => setCurrentAssignment(null)}
          style={{ marginBottom: '12px' }}
        >
          ← 返回作业列表
        </button>
        <h2 className="page-title" style={{ marginBottom: '8px' }}>{currentAssignment.title}</h2>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#546e7a', marginBottom: '16px' }}>
          {currentAssignment.description || '暂无描述'}
        </div>
        <div className="card" style={{ background: '#f5f5f5', padding: '12px 16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#607d8b', marginBottom: '8px' }}>
            📋 测试用例
          </div>
          {currentAssignment.testCases.map((tc, i) => (
            <div key={i} style={{
              fontSize: '12px', fontFamily: 'Consolas, monospace',
              color: '#455a64', padding: '4px 0',
              borderBottom: i < currentAssignment.testCases.length - 1 ? '1px solid #e0e0e0' : 'none',
            }}>
              <span style={{ color: '#1976d2' }}>输入:</span> {tc.input}
              <span style={{ color: '#757575', margin: '0 8px' }}>=></span>
              <span style={{ color: '#388e3c' }}>期望:</span> {tc.expected}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#455a64' }}>
          💻 代码编辑器
        </h4>
        <CodeEditor code={code} onChange={setCode} minLines={15} />
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={handleRunTests} disabled={loading}>
            {loading ? '运行中...' : '▶ 运行测试'}
          </button>
          {testResults && (
            <div style={{
              fontSize: '15px', fontWeight: 600,
              color: passedCount === totalCount ? '#4caf50' : '#ff9800',
            }}>
              {passedCount}/{totalCount} 通过
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: '#ffebee', color: '#c62828', marginTop: '16px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {testResults && testResults.length > 0 && (
        <div className="card" style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#455a64' }}>
            📊 测试结果
          </h4>
          {testResults.map((result, i) => (
            <div
              key={i}
              style={{
                borderLeft: `4px solid ${result.passed ? '#4caf50' : '#f44336'}`,
                padding: '10px 14px',
                marginBottom: '8px',
                background: result.passed ? '#f1f8e9' : '#ffebee',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => setExpandedCase(expandedCase === i ? null : i)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: result.passed ? '#2e7d32' : '#c62828',
                }}>
                  {result.passed ? '✓' : '✗'} 测试用例 {i + 1}
                </span>
                <span style={{ fontSize: '11px', color: '#9e9e9e' }}>
                  {expandedCase === i ? '收起 ▲' : '展开 ▼'}
                </span>
              </div>
              {expandedCase === i && (
                <div style={{
                  marginTop: '10px', fontSize: '12px',
                  fontFamily: 'Consolas, monospace',
                }}>
                  <div style={{ padding: '4px 0' }}>
                    <span style={{ color: '#1976d2', fontWeight: 600 }}>输入: </span>
                    {result.input}
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <span style={{ color: '#388e3c', fontWeight: 600 }}>期望: </span>
                    {result.expected}
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <span style={{ color: result.passed ? '#388e3c' : '#d32f2f', fontWeight: 600 }}>实际: </span>
                    <span style={{ color: result.passed ? '#388e3c' : '#d32f2f' }}>{result.actual}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
