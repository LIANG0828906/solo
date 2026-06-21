import React, { useCallback } from 'react';
import { AlignLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export const ScriptPanel: React.FC<Props> = ({ collapsed, onToggle }) => {
  const scriptInput = useEditorStore((s) => s.scriptInput);
  const scriptLines = useEditorStore((s) => s.scriptLines);
  const setScriptInput = useEditorStore((s) => s.setScriptInput);
  const splitScriptToLines = useEditorStore((s) => s.splitScriptToLines);
  const removeScriptLine = useEditorStore((s) => s.removeScriptLine);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        splitScriptToLines();
      }
    },
    [splitScriptToLines],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, lineId: string, assigned: boolean) => {
      if (assigned) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('application/x-script-line-id', lineId);
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  return (
    <>
      <aside className={`script-panel ${collapsed ? 'collapsed' : ''}`}>
        <div className="script-panel-header">
          <div className="script-panel-title">
            <AlignLeft size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }} />
            剧本面板
          </div>
          <textarea
            className="script-input"
            placeholder={`请输入剧本文本，例如：\n清晨的阳光照进房间。\n主角睁开眼睛，露出了微笑。\n"今天是个好日子！"他说。\n\n按 Enter 键自动拆分为句子列表`}
            value={scriptInput}
            onChange={(e) => setScriptInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="btn-primary script-split-btn"
            onClick={splitScriptToLines}
            disabled={!scriptInput.trim()}
          >
            拆分为句子（Enter）
          </button>
        </div>

        <div className="script-lines">
          {scriptLines.length === 0 && (
            <div className="empty-hint">
              在上方输入剧本文本并按 Enter，
              <br />
              句子将出现在这里。
              <br />
              拖拽句子卡片到画布的分镜格子中即可生成对白文字图层。
            </div>
          )}
          {scriptLines.map((line, idx) => (
            <div
              key={line.id}
              className={`script-line-item ${line.assigned ? 'assigned' : ''}`}
              draggable={!line.assigned}
              onDragStart={(e) => handleDragStart(e, line.id, line.assigned)}
              title={line.assigned ? '已分配到格子' : '拖拽到画布分镜格子'}
            >
              <span
                style={{
                  display: 'inline-block',
                  minWidth: 20,
                  marginRight: 6,
                  color: '#4a90d9',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {idx + 1}.
              </span>
              {line.content}
              <button
                className="script-line-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  removeScriptLine(line.id);
                }}
                title="删除"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <button
        className="panel-sidebar-toggle"
        onClick={onToggle}
        style={{ left: collapsed ? 0 : 300 }}
        title={collapsed ? '展开剧本面板' : '收起剧本面板'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </>
  );
};
