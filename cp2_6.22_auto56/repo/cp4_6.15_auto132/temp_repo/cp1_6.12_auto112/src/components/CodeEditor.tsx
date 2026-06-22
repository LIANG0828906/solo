import React, { useState, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Code } from 'lucide-react';

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: string;
  onSubmit?: (data: { code: string; language: string }) => void;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  height?: string;
}

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' }
];

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = '',
  initialLanguage = 'javascript',
  onSubmit,
  readOnly = false,
  showLineNumbers = true,
  height = '400px'
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const lineCount = code.split('\n').length;
  const isLongCode = lineCount > 20;

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      backgroundColor: '#2D2D2D'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: '#1E1E1E',
        borderBottom: '1px solid #3D3D3D'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Code size={16} style={{ color: '#888' }} />
          {!readOnly ? (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                backgroundColor: '#3D3D3D',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          ) : (
            <span style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase' }}>
              {language}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isLongCode && readOnly && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                color: '#888',
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '4px',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3D3D3D';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#888';
              }}
            >
              {isCollapsed ? '展开' : '折叠'}
            </button>
          )}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#888',
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '4px',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3D3D3D';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#888';
            }}
          >
            {copied ? <Check size={14} style={{ color: '#4CAF50' }} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      <div style={{
        position: 'relative',
        height: isCollapsed ? '200px' : height,
        overflow: isCollapsed ? 'hidden' : 'auto'
      }}>
        {!readOnly ? (
          <div style={{ display: 'flex', height: '100%' }}>
            <div
              style={{
                padding: '16px 12px',
                backgroundColor: '#252526',
                color: '#858585',
                fontFamily: '"Fira Code", "Consolas", monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                textAlign: 'right',
                userSelect: 'none',
                minWidth: '50px'
              }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} style={{ height: '22.4px' }}>{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: 'transparent',
                color: '#D4D4D4',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: '"Fira Code", "Consolas", monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre',
                overflow: 'auto',
                width: '100%',
                height: '100%'
              }}
            />
          </div>
        ) : (
          <SyntaxHighlighter
            language={language}
            style={tomorrow}
            showLineNumbers={showLineNumbers}
            wrapLines={true}
            customStyle={{
              margin: 0,
              padding: '16px',
              background: 'transparent',
              fontSize: '14px',
              lineHeight: '1.6',
              minHeight: '100%',
              fontFamily: '"Fira Code", "Consolas", monospace'
            }}
            lineNumberStyle={{
              minWidth: '40px',
              paddingRight: '12px',
              color: '#858585',
              textAlign: 'right',
              userSelect: 'none'
            }}
          >
            {code || '// 暂无代码'}
          </SyntaxHighlighter>
        )}

        {isCollapsed && (
          <div
            onClick={() => setIsCollapsed(false)}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(transparent, #2D2D2D)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '10px',
              cursor: 'pointer',
              color: '#888',
              fontSize: '13px'
            }}
          >
            点击展开查看更多
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
