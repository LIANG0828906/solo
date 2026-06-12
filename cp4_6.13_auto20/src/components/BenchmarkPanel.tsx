import React, { useCallback } from 'react';
import { TestCase, BenchmarkResult } from '../utils/benchmark';

interface Props {
  testCases: TestCase[];
  results: BenchmarkResult[];
  isRunning: boolean;
  runningId: string | null;
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<TestCase>) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
  onRun: () => void;
  onSave: () => void;
  onLoad: () => void;
  onToggleMobileResults: () => void;
  mobileResultsExpanded: boolean;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(224, 224, 255, 0.08)',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  position: 'relative',
  transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
  boxShadow: '0 0 8px rgba(0, 201, 167, 0.15)',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(224, 224, 255, 0.1)',
  borderRadius: 6,
  color: '#e0e0ff',
  padding: '6px 10px',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s ease',
};

const btnStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  padding: '6px 10px',
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

function TestCaseCard({
  tc,
  result,
  isRunning,
  onUpdate,
  onDelete,
  onCopy,
}: {
  tc: TestCase;
  result?: BenchmarkResult;
  isRunning: boolean;
  onUpdate: (id: string, updates: Partial<TestCase>) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
}) {
  const handleCodeKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = tc.code.substring(0, start) + '  ' + tc.code.substring(end);
      onUpdate(tc.id, { code: newCode });
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  }, [tc.code, tc.id, onUpdate]);

  const opacity = tc.enabled ? 1 : 0.45;

  return (
    <div
      style={{
        ...cardStyle,
        opacity,
        animation: tc.enabled ? 'pulseGlow 3s ease-in-out infinite' : undefined,
      }}
      onMouseEnter={e => {
        if (!tc.enabled) return;
        e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 201, 167, 0.3), 0 0 22px rgba(0, 201, 167, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(0, 201, 167, 0.25)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 201, 167, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(224, 224, 255, 0.08)';
      }}
    >
      {isRunning && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26, 26, 46, 0.7)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}>
          <div style={{
            width: 32,
            height: 32,
            border: '3px solid rgba(0, 201, 167, 0.2)',
            borderTopColor: '#00c9a7',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => onUpdate(tc.id, { enabled: !tc.enabled })}
          style={{
            ...btnStyle,
            background: tc.enabled ? 'rgba(0, 201, 167, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            color: tc.enabled ? '#00c9a7' : 'rgba(224, 224, 255, 0.4)',
            padding: '4px 8px',
            fontWeight: 700,
            fontSize: 13,
          }}
          title={tc.enabled ? 'Disable' : 'Enable'}
        >
          {tc.enabled ? '●' : '○'}
        </button>

        <input
          type="text"
          value={tc.name}
          onChange={e => onUpdate(tc.id, { name: e.target.value })}
          style={{
            ...inputStyle,
            flex: 1,
            fontWeight: 600,
            fontSize: 14,
          }}
          placeholder="Test case name"
        />

        <button
          onClick={() => onCopy(tc.id)}
          style={{
            ...btnStyle,
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#e0e0ff',
          }}
          title="Copy"
        >
          📋
        </button>
        <button
          onClick={() => onDelete(tc.id)}
          style={{
            ...btnStyle,
            background: 'rgba(255, 71, 87, 0.15)',
            color: '#ff4757',
          }}
          title="Delete"
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: 'rgba(224, 224, 255, 0.6)', whiteSpace: 'nowrap' }}>
          Loops:
        </label>
        <input
          type="number"
          min={1}
          max={10000}
          value={tc.iterations}
          onChange={e => {
            const v = Math.max(1, Math.min(10000, parseInt(e.target.value) || 1));
            onUpdate(tc.id, { iterations: v });
          }}
          style={{
            ...inputStyle,
            width: 90,
            textAlign: 'center',
          }}
        />
        <span style={{ fontSize: 11, color: 'rgba(224, 224, 255, 0.4)' }}>1 – 10,000</span>
      </div>

      <textarea
        value={tc.code}
        onChange={e => onUpdate(tc.id, { code: e.target.value })}
        onKeyDown={handleCodeKeyDown}
        placeholder="// Write your function body here&#10;return result;"
        style={{
          ...inputStyle,
          fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
          fontSize: 12,
          lineHeight: 1.5,
          minHeight: 72,
          resize: 'vertical',
          padding: '8px 10px',
        }}
        spellCheck={false}
      />

      {result && result.avgTime >= 0 && !isRunning && (
        <div style={{
          display: 'flex',
          gap: 16,
          marginTop: 10,
          fontSize: 12,
          color: 'rgba(224, 224, 255, 0.6)',
        }}>
          <span>⏱ avg: <strong style={{ color: '#00c9a7' }}>{result.avgTime.toFixed(4)}</strong> ms</span>
          <span>total: <strong style={{ color: '#e0e0ff' }}>{result.totalTime.toFixed(3)}</strong> ms</span>
        </div>
      )}
      {result && result.avgTime < 0 && !isRunning && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#ff4757' }}>
          ⚠ Error executing this test case
        </div>
      )}
    </div>
  );
}

export default function BenchmarkPanel({
  testCases,
  results,
  isRunning,
  runningId,
  onAdd,
  onUpdate,
  onDelete,
  onCopy,
  onRun,
  onSave,
  onLoad,
  onToggleMobileResults,
  mobileResultsExpanded,
}: Props) {
  const resultMap = new Map<string, BenchmarkResult>();
  for (const r of results) resultMap.set(r.id, r);

  return (
    <div
      className="benchmark-panel"
      style={{
        width: '45%',
        padding: '20px',
        overflowY: 'auto',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(224, 224, 255, 0.06)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>
          <span style={{ color: '#00c9a7' }}>⚡</span> JS Benchmark
        </h1>
        <button
          className="mobile-result-toggle"
          onClick={onToggleMobileResults}
          style={{
            ...btnStyle,
            display: 'none',
            background: mobileResultsExpanded ? 'rgba(255, 71, 87, 0.2)' : 'rgba(0, 201, 167, 0.2)',
            color: mobileResultsExpanded ? '#ff4757' : '#00c9a7',
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {mobileResultsExpanded ? '✕ Close' : '📊 Results'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {testCases.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: 'rgba(224, 224, 255, 0.3)',
            fontSize: 14,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧪</div>
            <div>No test cases yet.</div>
            <div>Click "Add Case" to get started.</div>
          </div>
        )}
        {testCases.map(tc => (
          <TestCaseCard
            key={tc.id}
            tc={tc}
            result={resultMap.get(tc.id)}
            isRunning={runningId === tc.id}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onCopy={onCopy}
          />
        ))}
      </div>

      <div style={{
        flexShrink: 0,
        paddingTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onAdd}
            disabled={isRunning}
            style={{
              ...btnStyle,
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#e0e0ff',
              padding: '10px',
              fontSize: 13,
              fontWeight: 600,
              justifyContent: 'center',
              opacity: isRunning ? 0.5 : 1,
            }}
          >
            + Add Case
          </button>
          <button
            onClick={onRun}
            disabled={isRunning || testCases.filter(t => t.enabled).length === 0}
            style={{
              ...btnStyle,
              flex: 2,
              background: isRunning
                ? 'rgba(0, 201, 167, 0.3)'
                : '#00c9a7',
              color: isRunning ? 'rgba(224, 224, 255, 0.6)' : '#1a1a2e',
              padding: '10px',
              fontSize: 14,
              fontWeight: 700,
              justifyContent: 'center',
            }}
          >
            {isRunning ? '⏳ Running...' : '▶ Run Benchmark'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onSave}
            disabled={testCases.length === 0}
            style={{
              ...btnStyle,
              flex: 1,
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'rgba(224, 224, 255, 0.7)',
              padding: '8px',
              fontSize: 12,
              justifyContent: 'center',
              opacity: testCases.length === 0 ? 0.5 : 1,
            }}
          >
            💾 Save
          </button>
          <button
            onClick={onLoad}
            style={{
              ...btnStyle,
              flex: 1,
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'rgba(224, 224, 255, 0.7)',
              padding: '8px',
              fontSize: 12,
              justifyContent: 'center',
            }}
          >
            📂 Load
          </button>
        </div>
      </div>
    </div>
  );
}
