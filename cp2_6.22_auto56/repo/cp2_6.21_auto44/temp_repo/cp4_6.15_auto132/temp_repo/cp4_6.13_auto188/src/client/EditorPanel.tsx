import { useState, useEffect, useCallback } from 'react';
import { parseMarkdown, generateMarkdown } from './markdownParser';
import type { ParseResult, NodeMap } from './types';

interface EditorPanelProps {
  onChange: (result: ParseResult) => void;
  onShare: () => void;
  onExport: () => void;
  nodes: NodeMap;
  rootId: string;
}

const DEFAULT_MARKDOWN = `# 思维导图中心
## 分支一
- 子节点1
- 子节点2
  - 孙节点A
  - 孙节点B
## 分支二
- 子节点3
- 子节点4
## 分支三
- 子节点5
`;

export function EditorPanel({ onChange, onShare, onExport, nodes, rootId }: EditorPanelProps) {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [isInternalChange, setIsInternalChange] = useState(false);

  useEffect(() => {
    const result = parseMarkdown(DEFAULT_MARKDOWN);
    onChange(result);
  }, []);

  useEffect(() => {
    if (isInternalChange) {
      setIsInternalChange(false);
      return;
    }
    if (nodes.size > 0 && rootId) {
      const generated = generateMarkdown(nodes, rootId);
      if (generated !== markdown) {
        setMarkdown(generated);
      }
    }
  }, [nodes, rootId]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newMarkdown = e.target.value;
      setMarkdown(newMarkdown);
      setIsInternalChange(true);
      const result = parseMarkdown(newMarkdown);
      onChange(result);
    },
    [onChange]
  );

  return (
    <div className="editor-panel">
      <h2>Markdown 编辑器</h2>
      <textarea
        className="editor-textarea"
        value={markdown}
        onChange={handleTextChange}
        placeholder="输入 Markdown 文本..."
        spellCheck={false}
      />
      <div className="editor-actions">
        <button className="btn btn-primary" onClick={onShare}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          分享
        </button>
        <button className="btn btn-secondary" onClick={onExport}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导出
        </button>
      </div>
    </div>
  );
}
