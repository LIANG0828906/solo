import { Play } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  isRunning: boolean;
}

export default function CodeEditor({ code, onChange, onRun, isRunning }: CodeEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div
      style={{
        borderRadius: '12px',
        backgroundColor: 'var(--bg-secondary)',
        boxShadow: '0 4px 24px rgba(0,0,0,.3)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>代码编辑器</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          仅支持JavaScript纯函数和console.log输出
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: '100%',
          flex: 1,
          fontFamily: "'Courier New', monospace",
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #334155',
          background: '#0f172a',
          color: '#e2e8f0',
          resize: 'none',
          outline: 'none',
          transition: 'border-color .3s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#334155';
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="btn-press"
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'all .3s',
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isRunning ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(6,182,212,.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isRunning ? (
            <>
              <div className="spinner" />
              <span>运行中...</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>运行</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
