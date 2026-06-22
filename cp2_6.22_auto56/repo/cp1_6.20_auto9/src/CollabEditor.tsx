import { useState, useRef, useEffect, useCallback } from 'react';
import * as Diff from 'diff';
import type { User, DocVersion } from './types';

interface CollabEditorProps {
  content: string;
  users: User[];
  myUserId: string | null;
  myColor: string;
  selectedVersion: DocVersion | null;
  onContentChange: (content: string) => void;
  onCursorChange: (cursor: { start: number; end: number } | null) => void;
  onRename: (name: string) => void;
  myName: string;
}

const CollabEditor: React.FC<CollabEditorProps> = ({
  content,
  users,
  myUserId,
  myColor,
  selectedVersion,
  onContentChange,
  onCursorChange,
  onRename,
  myName
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInput, setNameInput] = useState(myName);
  const cursorUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInternalUpdate = useRef(false);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isInternalUpdate.current) return;
    const newContent = editorRef.current.innerHTML;
    onContentChange(newContent);
  }, [onContentChange]);

  const getCaretOffset = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null;

    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(editorRef.current);
    preRange.setEnd(range.endContainer, range.endOffset);
    const end = preRange.toString().length;
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;

    return { start, end };
  }, []);

  const sendCursorUpdate = useCallback(() => {
    if (cursorUpdateTimer.current) {
      clearTimeout(cursorUpdateTimer.current);
    }
    cursorUpdateTimer.current = setTimeout(() => {
      const caret = getCaretOffset();
      onCursorChange(caret);
    }, 30);
  }, [getCaretOffset, onCursorChange]);

  useEffect(() => {
    if (!editorRef.current) return;
    
    if (editorRef.current.innerHTML !== content) {
      isInternalUpdate.current = true;
      const selection = window.getSelection();
      let savedRange: Range | null = null;
      
      if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }
      
      editorRef.current.innerHTML = content;
      
      if (savedRange && editorRef.current.contains(savedRange.startContainer)) {
        try {
          selection?.removeAllRanges();
          selection?.addRange(savedRange);
        } catch (e) {
          // ignore
        }
      }
      
      requestAnimationFrame(() => {
        isInternalUpdate.current = false;
      });
    }
  }, [content]);

  useEffect(() => {
    setNameInput(myName);
  }, [myName]);

  const renderDiffContent = () => {
    if (!selectedVersion) return null;

    const oldText = stripHtml(selectedVersion.content);
    const newText = stripHtml(content);
    const changes = Diff.diffChars(oldText, newText);

    const elements: React.ReactNode[] = [];
    changes.forEach((part, index) => {
      const text = part.value;
      if (part.added) {
        elements.push(
          <mark key={index} style={{ backgroundColor: 'rgba(40, 167, 69, 0.3)', padding: '1px 2px', borderRadius: '2px' }}>
            {text}
          </mark>
        );
      } else if (part.removed) {
        elements.push(
          <mark key={index} style={{ backgroundColor: 'rgba(220, 53, 69, 0.3)', padding: '1px 2px', borderRadius: '2px', textDecoration: 'line-through' }}>
            {text}
          </mark>
        );
      } else {
        elements.push(<span key={index}>{text}</span>);
      }
    });

    return elements;
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getUserCursorPosition = (user: User): { left: number; top: number } | null => {
    if (!user.cursor || !editorRef.current) return null;

    const textContent = stripHtml(editorRef.current.innerHTML);
    const targetOffset = Math.min(user.cursor.start, textContent.length);

    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT, null);
    let currentOffset = 0;
    let node: Node | null;
    let targetNode: Node | null = null;
    let targetNodeOffset = 0;

    while ((node = walker.nextNode())) {
      const nodeLength = (node.textContent || '').length;
      if (currentOffset + nodeLength >= targetOffset) {
        targetNode = node;
        targetNodeOffset = targetOffset - currentOffset;
        break;
      }
      currentOffset += nodeLength;
    }

    if (!targetNode) return null;

    try {
      const range = document.createRange();
      range.setStart(targetNode, targetNodeOffset);
      range.setEnd(targetNode, targetNodeOffset);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      return {
        left: rect.left - editorRect.left,
        top: rect.top - editorRect.top
      };
    } catch (e) {
      return null;
    }
  };

  const handleNameSubmit = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== myName) {
      onRename(trimmed.slice(0, 20));
    }
    setShowNameInput(false);
  };

  const isReadOnly = selectedVersion !== null;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {!isReadOnly ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px',
            backgroundColor: '#F8F9FA',
            borderRadius: '8px',
            border: '1px solid #E9ECEF'
          }}>
            <ToolbarButton onClick={() => execCommand('bold')} title="粗体 (Ctrl+B)">
              <b>B</b>
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('italic')} title="斜体 (Ctrl+I)">
              <i>I</i>
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('underline')} title="下划线 (Ctrl+U)">
              <u>U</u>
            </ToolbarButton>
            <Divider />
            <ToolbarButton onClick={() => execCommand('formatBlock', '<h1>')} title="标题1">
              H1
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('formatBlock', '<h2>')} title="标题2">
              H2
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('formatBlock', '<p>')} title="正文">
              P
            </ToolbarButton>
            <Divider />
            <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="无序列表">
              • 列表
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="有序列表">
              1. 列表
            </ToolbarButton>
            <Divider />
            <ToolbarButton onClick={() => execCommand('undo')} title="撤销">
              ↶
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('redo')} title="重做">
              ↷
            </ToolbarButton>
          </div>
        ) : (
          <div style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(13, 110, 253, 0.2)',
            fontSize: '13px',
            color: '#0D6EFD',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            👁️ 差异预览模式 - {new Date(selectedVersion.timestamp).toLocaleString('zh-CN')} by {selectedVersion.userName}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: myColor,
            border: '2px solid #FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            flexShrink: 0
          }} />
          {showNameInput ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                  if (e.key === 'Escape') setShowNameInput(false);
                }}
                autoFocus
                style={{
                  width: '120px',
                  padding: '4px 8px',
                  border: '1px solid #0D6EFD',
                  borderRadius: '4px',
                  fontSize: '13px',
                  outline: 'none'
                }}
                maxLength={20}
              />
              <button
                onClick={handleNameSubmit}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#0D6EFD',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                ✓
              </button>
              <button
                onClick={() => setShowNameInput(false)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #DEE2E6',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNameInput(true)}
              style={{
                padding: '4px 8px',
                border: '1px solid transparent',
                backgroundColor: 'transparent',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#DEE2E6';
                e.currentTarget.style.backgroundColor = '#F8F9FA';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {myName || '匿名用户'}
              <span style={{ fontSize: '11px', color: '#ADB5BD' }}>✏️</span>
            </button>
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: `2px solid ${isFocused ? '#0D6EFD' : '#E9ECEF'}`,
        boxShadow: isFocused ? '0 0 0 3px rgba(13, 110, 253, 0.1), 0 2px 8px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div
          ref={editorRef}
          contentEditable={!isReadOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          onSelect={sendCursorUpdate}
          onKeyUp={sendCursorUpdate}
          onMouseUp={sendCursorUpdate}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onCursorChange(null);
          }}
          style={{
            flex: 1,
            padding: '24px 28px',
            overflowY: 'auto',
            outline: 'none',
            fontSize: '15px',
            lineHeight: 1.8,
            color: '#212529',
            display: isReadOnly ? 'none' : 'block'
          }}
          dir="auto"
        />

        {isReadOnly && (
          <div style={{
            flex: 1,
            padding: '24px 28px',
            overflowY: 'auto',
            fontSize: '15px',
            lineHeight: 1.8,
            color: '#212529',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {renderDiffContent()}
          </div>
        )}

        {!isReadOnly && users.map(user => {
          if (!user.cursor) return null;
          const pos = getUserCursorPosition(user);
          if (!pos) return null;

          return (
            <div
              key={user.id}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              <div style={{
                width: '2px',
                height: '20px',
                backgroundColor: user.color,
                borderRadius: '1px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-18px',
                  left: '-2px',
                  backgroundColor: user.color,
                  color: '#FFFFFF',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isReadOnly && (
        <div style={{
          fontSize: '12px',
          color: '#ADB5BD',
          padding: '0 4px'
        }}>
          💡 提示：停止编辑 3 秒后将自动保存为新版本。使用工具栏可以设置富文本格式。
        </div>
      )}
    </div>
  );
};

const ToolbarButton: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      padding: '6px 10px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      color: '#495057',
      minWidth: '32px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      fontWeight: 500
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#E9ECEF';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
    onMouseDown={(e) => e.preventDefault()}
  >
    {children}
  </button>
);

const Divider: React.FC = () => (
  <div style={{
    width: '1px',
    height: '20px',
    backgroundColor: '#DEE2E6',
    margin: '0 4px'
  }} />
);

export default CollabEditor;
