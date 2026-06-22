import { RunResult } from '@/types';

interface OutputPanelProps {
  result: RunResult | null;
}

export default function OutputPanel({ result }: OutputPanelProps) {
  return (
    <div
      style={{
        borderRadius: '12px',
        background: '#020617',
        boxShadow: '0 4px 24px rgba(0,0,0,.3)',
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: '12px',
          color: 'var(--text-secondary)',
        }}
      >
        输出面板
      </div>
      <div
        style={{
          flex: 1,
          background: '#000',
          borderRadius: '8px',
          padding: '14px',
          overflowY: 'auto',
          fontFamily: "'Courier New', monospace",
          fontSize: '13px',
          lineHeight: 1.6,
        }}
      >
        {!result ? (
          <div style={{ color: '#64748b' }}>代码运行结果将显示在此处...</div>
        ) : (
          <div className={result.status === 'error' ? 'shake fade-in' : 'fade-in'}>
            {result.output !== '' && (
              <div style={{ color: 'var(--success)', whiteSpace: 'pre-wrap' }}>
                {result.output}
              </div>
            )}
            {result.status === 'error' && result.error && (
              <div style={{ color: 'var(--error)', whiteSpace: 'pre-wrap', marginTop: result.output ? '8px' : 0 }}>
                {result.error}
              </div>
            )}
            <div
              style={{
                color: 'var(--text-secondary)',
                marginTop: '8px',
              }}
            >
              Execution time: {result.executionTime}ms
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
