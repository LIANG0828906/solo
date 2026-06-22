import { memo } from 'react';

interface EditorPaneProps {
  code: string;
  onChange: (code: string) => void;
}

const EditorPane = memo(function EditorPane({ code, onChange }: EditorPaneProps) {
  return (
    <div className="editor-pane">
      <div className="editor-header">
        <h2 className="editor-title">代码编辑区</h2>
        <span className="editor-hint">输入或粘贴代码片段</span>
      </div>
      <textarea
        className="code-editor"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="在此输入代码..."
      />
    </div>
  );
});

export default EditorPane;
