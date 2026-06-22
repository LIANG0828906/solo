import { useCallback, useMemo } from 'react';
import { useStore } from '../store';

const KEYWORDS = ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'class', 'import', 'export', 'default', 'from', 'as', 'typeof', 'instanceof', 'new', 'this', 'true', 'false', 'null', 'undefined', 'void', 'interface', 'type', 'enum', 'public', 'private', 'protected', 'readonly', 'implements', 'extends'];

export default function CodeEditor() {
  const { codeInput, setCodeInput } = useStore();

  const highlightedCode = useMemo(() => {
    if (!codeInput) return '';
    
    let result = codeInput;
    
    result = result.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span style="color: #6A9955;">$1</span>');
    
    result = result.replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span style="color: #CE9178;">$1</span>');
    
    const keywordRegex = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'g');
    result = result.replace(keywordRegex, '<span style="color: #569CD6;">$1</span>');
    
    return result;
  }, [codeInput]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCodeInput(e.target.value);
  }, [setCodeInput]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: '16px',
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'hidden',
            pointerEvents: 'none',
            color: '#D4D4D4',
            backgroundColor: 'transparent',
          }}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
        <textarea
          value={codeInput}
          onChange={handleChange}
          maxLength={500}
          placeholder="// 在此输入 JavaScript 或 TypeScript 代码（最多500字符）"
          spellCheck={false}
          style={{
            position: 'relative',
            flex: 1,
            width: '100%',
            padding: '16px',
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'transparent',
            caretColor: '#FFFFFF',
            backgroundColor: '#1E1E1E',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#00BFFF';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
        />
      </div>
      <div style={{
        padding: '8px 16px',
        fontSize: '12px',
        color: '#888888',
        textAlign: 'right',
      }}>
        {codeInput.length}/500 字符
      </div>
    </div>
  );
}
