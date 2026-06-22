import React, { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { CodePayload, LogEntry } from '../PreviewEngine/types';
import { v4 as uuidv4 } from 'uuid';
import LogViewer from './LogViewer';

type TabType = 'html' | 'css' | 'js';

interface DebugPanelProps {
  code: CodePayload;
  onCodeChange: (code: CodePayload) => void;
  onLogAdd: (log: LogEntry) => void;
  logs: LogEntry[];
  onLogsClear: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  code,
  onCodeChange,
  onLogAdd,
  logs,
  onLogsClear
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('html');
  const [localCode, setLocalCode] = useState<CodePayload>(code);
  const textareaRefs = useMemo(() => ({
    html: React.createRef<HTMLTextAreaElement>(),
    css: React.createRef<HTMLTextAreaElement>(),
    js: React.createRef<HTMLTextAreaElement>()
  }), []);

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const debouncedSync = useCallback(
    debounce((newCode: CodePayload) => {
      onCodeChange(newCode);
      
      const event = new CustomEvent('code-synced', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    }, 300),
    [onCodeChange]
  );

  useEffect(() => {
    return () => {
      debouncedSync.cancel();
    };
  }, [debouncedSync]);

  const handleCodeChange = (type: TabType, value: string) => {
    const newCode = { ...localCode, [type]: value };
    setLocalCode(newCode);

    const lines = value.split('\n').length;
    if (lines > 0) {
      const infoLog: LogEntry = {
        id: uuidv4(),
        timestamp: Date.now(),
        level: 'info',
        message: `${type.toUpperCase()} 代码已更新，共 ${lines} 行`
      };
      onLogAdd(infoLog);
    }

    try {
      if (type === 'html') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(value, 'text/html');
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
          const errorLog: LogEntry = {
            id: uuidv4(),
            timestamp: Date.now(),
            level: 'error',
            message: `HTML 解析错误: ${parserError.textContent?.trim()}`
          };
          onLogAdd(errorLog);
        }
      }

      if (type === 'js') {
        new Function(value);
      }
    } catch (err) {
      const errorLog: LogEntry = {
        id: uuidv4(),
        timestamp: Date.now(),
        level: 'error',
        message: `${type.toUpperCase()} 语法错误: ${(err as Error).message}`
      };
      onLogAdd(errorLog);
    }

    debouncedSync(newCode);
  };

  const getLineNumbers = (content: string): string => {
    const lines = content.split('\n').length;
    return Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const tabLabels: Record<TabType, string> = {
    html: 'HTML',
    css: 'CSS',
    js: 'JS'
  };

  return (
    <div className="debug-panel">
      <div className="tabs-container">
        <div className="tabs">
          {(Object.keys(tabLabels) as TabType[]).map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              <span className="tab-bar" />
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="code-editor-container">
        {(Object.keys(tabLabels) as TabType[]).map(tab => (
          <div
            key={tab}
            className={`code-editor ${activeTab === tab ? 'visible' : 'hidden'}`}
          >
            <div className="line-numbers">
              <pre>{getLineNumbers(localCode[tab])}</pre>
            </div>
            <textarea
              ref={textareaRefs[tab]}
              value={localCode[tab]}
              onChange={(e) => handleCodeChange(tab, e.target.value)}
              spellCheck={false}
              className="code-textarea"
            />
          </div>
        ))}
      </div>

      <LogViewer logs={logs} onClear={onLogsClear} />
    </div>
  );
};

export default DebugPanel;
