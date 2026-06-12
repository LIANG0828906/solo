import { useEffect, useRef, useState, useCallback } from 'react';
import socketClient from './socketClient';
import type { OTAction, CursorPosition } from '../../shared/types';

interface EditorProps {
  docId: string;
  userId: string;
  userName: string;
  initialContent: string;
  onContentChange?: (content: string) => void;
}

const CURSOR_UPDATE_THROTTLE = 100;

export default function Editor({ docId, userId, userName, initialContent, onContentChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<string>(initialContent);
  const remoteCursors = useRef<Map<string, CursorPosition>>(new Map());
  const isComposing = useRef(false);
  const lastCursorUpdate = useRef(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = initialContent;
      contentRef.current = initialContent;
    }
  }, [initialContent]);

  const getCaretPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const position = preCaretRange.toString().length;

    return {
      position,
      selectionStart: position,
      selectionEnd: position,
    };
  }, []);

  const setCaretPosition = useCallback((position: number) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let currentPos = 0;
    const nodeStack: Node[] = [editorRef.current];
    let found = false;

    while (nodeStack.length > 0 && !found) {
      const node = nodeStack.pop()!;
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const textLength = textNode.length;
        if (currentPos + textLength >= position) {
          range.setStart(textNode, position - currentPos);
          range.setEnd(textNode, position - currentPos);
          found = true;
        } else {
          currentPos += textLength;
        }
      } else {
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }

    if (!found) {
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const computeOTActions = (oldText: string, newText: string, uid: string): OTAction[] => {
    const actions: OTAction[] = [];
    let i = 0;

    while (i < oldText.length && i < newText.length && oldText[i] === newText[i]) {
      i++;
    }

    let oldEnd = oldText.length;
    let newEnd = newText.length;
    while (oldEnd > i && newEnd > i && oldText[oldEnd - 1] === newText[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }

    if (i < oldEnd) {
      actions.push({
        type: 'delete',
        position: i,
        length: oldEnd - i,
        userId: uid,
        timestamp: Date.now(),
      });
    }

    if (i < newEnd) {
      actions.push({
        type: 'insert',
        position: i,
        text: newText.slice(i, newEnd),
        userId: uid,
        timestamp: Date.now(),
      });
    }

    return actions;
  };

  const handleInput = useCallback(() => {
    if (isComposing.current) return;

    const newContent = editorRef.current?.innerText || '';
    const oldContent = contentRef.current;

    if (newContent === oldContent) return;

    const actions = computeOTActions(oldContent, newContent, userId);

    actions.forEach(action => {
      socketClient.sendAction(action);
    });

    contentRef.current = newContent;
    onContentChange?.(newContent);
  }, [userId, onContentChange]);

  const applyRemoteAction = useCallback((action: OTAction) => {
    if (!editorRef.current) return;

    const caret = getCaretPosition();
    const currentContent = contentRef.current;
    let newContent = currentContent;

    if (action.type === 'insert' && action.text) {
      newContent = currentContent.slice(0, action.position) + action.text + currentContent.slice(action.position);
    } else if (action.type === 'delete' && action.length) {
      newContent = currentContent.slice(0, action.position) + currentContent.slice(action.position + action.length);
    }

    contentRef.current = newContent;

    const selection = window.getSelection();
    const isFocused = editorRef.current === document.activeElement;
    let caretPos = caret?.position ?? currentContent.length;

    if (action.type === 'insert' && action.position <= caretPos) {
      caretPos += action.text?.length || 0;
    } else if (action.type === 'delete') {
      const delLen = action.length || 0;
      if (action.position + delLen <= caretPos) {
        caretPos -= delLen;
      } else if (action.position < caretPos) {
        caretPos = action.position;
      }
    }

    editorRef.current.innerText = newContent;

    if (isFocused && selection) {
      setCaretPosition(caretPos);
    }

    onContentChange?.(newContent);
    forceUpdate(n => n + 1);
  }, [getCaretPosition, setCaretPosition, onContentChange]);

  const handleSelectionChange = useCallback(() => {
    const now = Date.now();
    if (now - lastCursorUpdate.current < CURSOR_UPDATE_THROTTLE) return;
    lastCursorUpdate.current = now;

    const caret = getCaretPosition();
    if (!caret) return;

    const cursor: CursorPosition = {
      userId,
      userName,
      color: '',
      position: caret.position,
      selectionStart: caret.selectionStart,
      selectionEnd: caret.selectionEnd,
    };

    socketClient.sendCursor(cursor);
  }, [userId, userName, getCaretPosition]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleInputEvent = () => handleInput();
    const handleSelectEvent = () => handleSelectionChange();
    const handleCompositionStart = () => { isComposing.current = true; };
    const handleCompositionEnd = () => {
      isComposing.current = false;
      handleInput();
    };

    editor.addEventListener('input', handleInputEvent);
    document.addEventListener('selectionchange', handleSelectEvent);
    editor.addEventListener('compositionstart', handleCompositionStart);
    editor.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      editor.removeEventListener('input', handleInputEvent);
      document.removeEventListener('selectionchange', handleSelectEvent);
      editor.removeEventListener('compositionstart', handleCompositionStart);
      editor.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [handleInput, handleSelectionChange]);

  useEffect(() => {
    const unsub1 = socketClient.on('doc:action', (action: OTAction) => {
      if (action.userId !== userId) {
        applyRemoteAction(action);
      }
    });

    const unsub2 = socketClient.on('doc:cursor', (cursor: CursorPosition) => {
      if (cursor.userId !== userId) {
        remoteCursors.current.set(cursor.userId, cursor);
        forceUpdate(n => n + 1);
      }
    });

    const unsub3 = socketClient.on('doc:restored', ({ content }: { content: string; versionId: string }) => {
      if (editorRef.current) {
        editorRef.current.classList.add('fade-transition');
        editorRef.current.innerText = content;
        contentRef.current = content;
        onContentChange?.(content);
        setTimeout(() => {
          editorRef.current?.classList.remove('fade-transition');
        }, 300);
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [userId, applyRemoteAction, onContentChange]);

  return (
    <div className="editor-wrapper">
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
      />
      <style>{`
        .editor-wrapper {
          position: relative;
          flex: 1;
          overflow: hidden;
        }
        .editor-content {
          width: 100%;
          height: 100%;
          padding: 24px 32px;
          font-size: 16px;
          line-height: 1.8;
          color: #1f2937;
          outline: none;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          overflow-y: auto;
          min-height: 400px;
          white-space: pre-wrap;
          word-wrap: break-word;
          box-sizing: border-box;
        }
        .editor-content:empty::before {
          content: '开始输入内容...';
          color: #9ca3af;
        }
        .fade-transition {
          opacity: 0.5;
          transition: opacity 0.3s ease-in-out;
        }
        @media (max-width: 768px) {
          .editor-content {
            padding: 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
