import { useRef } from 'react';
import { useEditorStore, type Language } from '@/store/editorStore';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
];

function throttle<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    lastArgs = args;
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      lastCall = now;
      fn(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        if (lastArgs) fn(...lastArgs);
        timeout = null;
      }, remaining);
    }
  }) as T;
}

const Toolbar = () => {
  const { code, language, setLanguage, saveDraft, createVersion, currentDraftId } =
    useEditorStore();
  const selectRef = useRef<HTMLSelectElement>(null);

  const throttledSave = useRef(
    throttle(() => {
      saveDraft();
    }, 600),
  ).current;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#007ACC20',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0, 122, 204, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #007ACC, #00A3FF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: '#FFFFFF',
          }}
        >
          C
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
            CodeCollab
          </div>
          <div style={{ fontSize: 11, color: '#6A6A6A' }}>代码协作评审</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          onClick={() => selectRef.current?.focus()}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            height: 32,
            borderRadius: 4,
            background: '#252526',
            border: '1px solid #3A3A3C',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#007ACC';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#3A3A3C';
          }}
        >
          <select
            ref={selectRef}
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#D4D4D4',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value} style={{ background: '#252526' }}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginLeft: 8 }}>
        <ToolbarButton
          icon="💾"
          label="保存草稿"
          onClick={throttledSave}
        />
        <ToolbarButton
          icon="➕"
          label={currentDraftId ? '新建版本' : '请先保存草稿'}
          onClick={() => createVersion()}
          disabled={!currentDraftId}
          warning={!currentDraftId}
        />
      </div>

      <div
        style={{
          marginLeft: 12,
          padding: '4px 10px',
          borderRadius: 4,
          background: 'rgba(0, 122, 204, 0.1)',
          fontSize: 11,
          color: '#007ACC',
          fontFamily: '"Fira Code", monospace',
        }}
      >
        {code.split('\n').length} 行 · {code.length} 字符
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  warning?: boolean;
}

const ToolbarButton = ({ icon, label, onClick, disabled, warning }: ToolbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: 'none',
        background: disabled ? '#2A2A2B' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = '#007ACC40';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }
      }}
    >
      {icon}
      {warning && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#F48771',
          }}
        />
      )}
    </button>
  );
};

export default Toolbar;
