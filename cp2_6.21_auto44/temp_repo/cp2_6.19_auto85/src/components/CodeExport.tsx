import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useClipboard } from '../hooks/useClipboard';
import { generateCode } from '../utils/codeGenerator';
import { highlight } from '../utils/syntaxHighlight';

interface CodeExportProps {
  componentId: string;
  props: Record<string, any>;
  onToast: (msg: string) => void;
}

export const CodeExport: React.FC<CodeExportProps> = ({ componentId, props, onToast }) => {
  const { copied, copy } = useClipboard();

  const code = useMemo(() => generateCode(componentId, props), [componentId, props]);

  const highlighted = useMemo(() => highlight(code), [code]);

  const handleCopy = async () => {
    const ok = await copy(code);
    if (ok) {
      onToast('代码已复制到剪贴板');
    }
  };

  return (
    <div
      style={{
        borderTop: '1px solid #313244',
        backgroundColor: '#181825',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #313244',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon icon="mdi:code-tags" width={16} height={16} color="#89b4fa" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#cdd6f4' }}>
            代码片段
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: copied ? '#a6e3a1' : '#313244',
            color: copied ? '#1e1e2e' : '#cdd6f4',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon
            icon={copied ? 'mdi:check' : 'mdi:content-copy'}
            width={14}
            height={14}
          />
          <span>{copied ? '已复制' : '复制代码'}</span>
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '16px 24px',
          fontSize: '13px',
          fontFamily: 'Consolas, "Courier New, monospace',
          lineHeight: 1.7,
          color: '#cdd6f4',
          maxHeight: '200px',
          overflowX: 'auto',
          overflowY: 'auto',
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
};
