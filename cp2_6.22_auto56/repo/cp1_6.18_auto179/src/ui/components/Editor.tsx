import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '../store';
import type { UserInfo } from '../../types';

interface CursorPosition {
  top: number;
  left: number;
}

const Editor: React.FC = () => {
  const {
    content,
    comments,
    users,
    userId,
    cursorPosition,
    selectionStart,
    selectionEnd,
    editorEngine,
    collabEngine,
    addComment,
    setSelection,
    setCursorPosition,
  } = useEditorStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [showAddCommentBtn, setShowAddCommentBtn] = useState(false);

  const lineCount = content.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const getCaretCoordinates = useCallback((element: HTMLTextAreaElement, position: number) => {
    const mirror = document.createElement('div');
    const computed = window.getComputedStyle(element);

    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.overflow = 'hidden';
    mirror.style.fontFamily = computed.fontFamily;
    mirror.style.fontSize = computed.fontSize;
    mirror.style.lineHeight = computed.lineHeight;
    mirror.style.padding = computed.padding;
    mirror.style.width = element.offsetWidth + 'px';

    const text = element.value.substring(0, position);
    mirror.textContent = text + '|';

    document.body.appendChild(mirror);
    const coordinates = {
      top: mirror.offsetTop,
      left: mirror.offsetWidth - 5,
    };
    document.body.removeChild(mirror);

    return coordinates;
  }, []);

  const calculateRemoteCursorPositions = useCallback(() => {
    if (!textareaRef.current) return;

    const newPositions = new Map<string, CursorPosition>();
    users.forEach((user: UserInfo) => {
      if (user.id !== userId) {
        const pos = getCaretCoordinates(textareaRef.current!, user.cursorPosition);
        newPositions.set(user.id, pos);
      }
    });
    setRemoteCursors(newPositions);
  }, [users, userId, getCaretCoordinates]);

  useEffect(() => {
    calculateRemoteCursorPositions();
  }, [calculateRemoteCursorPositions, content]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editorEngine || !collabEngine) return;

    const newContent = e.target.value;
    const selectionStart = e.target.selectionStart;

    let op = null;
    if (newContent.length > content.length) {
      const insertedText = newContent.slice(content.length - (newContent.length - content.length));
      const pos = selectionStart - insertedText.length;
      op = editorEngine.insertText(pos, insertedText);
    } else if (newContent.length < content.length) {
      const deletedLength = content.length - newContent.length;
      const pos = selectionStart;
      op = editorEngine.deleteText(pos, deletedLength);
    }

    if (op) {
      collabEngine.sendEdit(op);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useEditorStore.getState().redo();
        } else {
          useEditorStore.getState().undo();
        }
      }
      if (e.key === 'y') {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
    }
  };

  const handleSelect = () => {
    if (!textareaRef.current || !editorEngine || !collabEngine) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    editorEngine.setSelection(start, end);
    collabEngine.sendSelection(start, end);
    setShowAddCommentBtn(start !== end);
  };

  const handleClick = () => {
    if (!textareaRef.current || !editorEngine || !collabEngine) return;

    const position = textareaRef.current.selectionStart;
    editorEngine.setCursor(position);
    collabEngine.sendCursor(position);
  };

  const handleAddComment = () => {
    if (selectionStart === selectionEnd) return;
    const text = prompt('请输入批注内容：');
    if (text && text.trim()) {
      addComment(selectionStart, selectionEnd, text.trim());
      setShowAddCommentBtn(false);
    }
  };

  const renderHighlightedText = () => {
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    const sortedComments = [...comments].sort((a, b) => a.start - b.start);

    sortedComments.forEach((comment, idx) => {
      if (comment.start > lastIndex) {
        segments.push(
          <span key={`text-${idx}`}>
            {content.slice(lastIndex, comment.start)}
          </span>
        );
      }
      segments.push(
        <span
          key={`comment-${comment.id}`}
          className={`comment-highlight ${comment.resolved ? 'resolved' : ''}`}
        >
          {content.slice(comment.start, comment.end)}
        </span>
      );
      lastIndex = comment.end;
    });

    if (lastIndex < content.length) {
      segments.push(
        <span key="text-end">{content.slice(lastIndex)}</span>
      );
    }

    return segments;
  };

  return (
    <div className="editor-content">
      <div className="line-numbers">
        {lineNumbers.map((num) => (
          <div key={num}>{num}</div>
        ))}
      </div>
      <div className="editor-wrapper" ref={editorRef}>
        {showAddCommentBtn && (
          <button
            className="add-comment-btn"
            onClick={handleAddComment}
            title="添加批注"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        )}

        <div className="editor-highlight-layer">
          {renderHighlightedText()}
        </div>

        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onClick={handleClick}
          onKeyUp={handleSelect}
          spellCheck={false}
        />

        {users
          .filter((u) => u.id !== userId)
          .map((user) => {
            const pos = remoteCursors.get(user.id);
            if (!pos) return null;
            return (
              <div
                key={user.id}
                className="remote-cursor"
                style={{
                  top: pos.top + 20,
                  left: pos.left + 40,
                  color: user.color,
                }}
              >
                <div className="remote-cursor-label" style={{ color: user.color }}>
                  {user.name}
                </div>
                <div className="remote-cursor-line" />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Editor;
