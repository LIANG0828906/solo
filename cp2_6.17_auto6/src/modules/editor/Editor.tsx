import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { computeOperation, applyOperation, Operation } from './OTEngine';
import { Socket } from 'socket.io-client';

interface EditorProps {
  socket: Socket;
}

interface Token {
  type: string;
  value: string;
}

const KEYWORDS = new Set([
  'function', 'if', 'else', 'return', 'const', 'let', 'var', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'class', 'extends', 'new',
  'this', 'super', 'import', 'export', 'default', 'from', 'as', 'type',
  'interface', 'implements', 'public', 'private', 'protected', 'readonly',
  'static', 'void', 'async', 'await', 'try', 'catch', 'finally', 'throw',
  'in', 'of', 'typeof', 'instanceof', 'true', 'false', 'null', 'undefined',
  'NaN', 'Infinity', 'debugger', 'with', 'yield', 'delete'
]);

const BUILT_INS = new Set([
  'console', 'Math', 'Date', 'Array', 'Object', 'String', 'Number',
  'Boolean', 'RegExp', 'Map', 'Set', 'Promise', 'JSON', 'parseInt',
  'parseFloat', 'isNaN', 'isFinite', 'decodeURI', 'encodeURI', 'eval'
]);

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const remaining = line.slice(i);

    if (char === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', value: remaining });
      break;
    }

    if (char === '/' && line[i + 1] === '*') {
      const endIdx = remaining.indexOf('*/');
      if (endIdx !== -1) {
        tokens.push({ type: 'comment', value: remaining.slice(0, endIdx + 2) });
        i += endIdx + 2;
        continue;
      } else {
        tokens.push({ type: 'comment', value: remaining });
        break;
      }
    }

    if (char === '`') {
      let j = i + 1;
      while (j < line.length && line[j] !== '`') {
        if (line[j] === '\\' && j + 1 < line.length) j++;
        j++;
      }
      const val = line.slice(i, j + 1);
      tokens.push({ type: 'template-literal', value: val });
      i = j + 1;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\' && j + 1 < line.length) j++;
        j++;
      }
      const val = line.slice(i, j + 1);
      tokens.push({ type: 'string', value: val });
      i = j + 1;
      continue;
    }

    if (/\d/.test(char)) {
      let j = i;
      while (j < line.length && /[\d.xXoObBeE+\-a-fA-F]/.test(line[j])) {
        if ((line[j] === 'e' || line[j] === 'E') && j + 1 < line.length && /[+\-]/.test(line[j + 1])) j++;
        j++;
      }
      const val = line.slice(i, j);
      if (/^[\d.][\d.xXoObBeE+\-a-fA-F]*$/.test(val)) {
        tokens.push({ type: 'number', value: val });
        i = j;
        continue;
      }
    }

    if (/[a-zA-Z_$]/.test(char)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const val = line.slice(i, j);

      if (KEYWORDS.has(val)) {
        tokens.push({ type: 'keyword', value: val });
      } else if (BUILT_INS.has(val)) {
        tokens.push({ type: 'variable', value: val });
      } else if (line[j] === '(') {
        tokens.push({ type: 'function', value: val });
      } else if (line[j] === '.' && j + 1 < line.length) {
        tokens.push({ type: 'variable', value: val });
      } else {
        tokens.push({ type: 'variable', value: val });
      }
      i = j;
      continue;
    }

    if (/[+\-*/%=<>!&|^~?:]/.test(char)) {
      let j = i;
      while (j < line.length && /[+\-*/%=<>!&|^~?:]/.test(line[j])) j++;
      tokens.push({ type: 'operator', value: line.slice(i, j) });
      i = j;
      continue;
    }

    if (/[{}()[\];,.]/.test(char)) {
      tokens.push({ type: 'punctuation', value: char });
      i++;
      continue;
    }

    if (/\s/.test(char)) {
      let j = i;
      while (j < line.length && /\s/.test(line[j])) j++;
      tokens.push({ type: 'plain', value: line.slice(i, j) });
      i = j;
      continue;
    }

    tokens.push({ type: 'plain', value: char });
    i++;
  }

  return tokens;
}

const LINE_HEIGHT = 20;
const CHARS_PER_LINE = 80;

const Editor: React.FC<EditorProps> = ({ socket }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef<string>('');

  const document = useStore((s) => s.document);
  const revision = useStore((s) => s.revision);
  const setDocument = useStore((s) => s.setDocument);
  const setRevision = useStore((s) => s.setRevision);
  const currentUser = useStore((s) => s.currentUser);
  const cursors = useStore((s) => s.cursors);
  const updateCursor = useStore((s) => s.updateCursor);
  const addCursor = useStore((s) => s.addCursor);
  const removeCursor = useStore((s) => s.removeCursor);
  const selectedLine = useStore((s) => s.selectedLine);
  const setSelectedLine = useStore((s) => s.setSelectedLine);
  const highlightedLine = useStore((s) => s.highlightedLine);
  const setHighlightedLine = useStore((s) => s.setHighlightedLine);
  const incrementPendingOps = useStore((s) => s.incrementPendingOps);
  const decrementPendingOps = useStore((s) => s.decrementPendingOps);

  useEffect(() => {
    lastContentRef.current = document;
  }, []);

  const lines = useMemo(() => document.split('\n'), [document]);

  const tokenizedLines = useMemo(() => {
    return lines.map((line) => tokenizeLine(line));
  }, [lines]);

  const renderToken = (token: Token, key: string) => {
    if (token.type === 'plain') {
      return <span key={key}>{token.value}</span>;
    }
    return (
      <span key={key} className={'token-' + token.type}>
        {token.value}
      </span>
    );
  };

  const getLineAndColumn = useCallback((position: number) => {
    const text = document;
    let line = 0;
    let col = 0;
    for (let i = 0; i < position && i < text.length; i++) {
      if (text[i] === '\n') {
        line++;
        col = 0;
      } else {
        col++;
      }
    }
    return { line, col };
  }, [document]);

  const getPositionFromLine = useCallback((lineIndex: number) => {
    const text = document;
    let pos = 0;
    let currentLine = 0;
    while (currentLine < lineIndex && pos < text.length) {
      if (text[pos] === '\n') {
        currentLine++;
      }
      pos++;
    }
    return pos;
  }, [document]);

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const newValue = e.currentTarget.value;
    const oldValue = lastContentRef.current;

    if (newValue === oldValue) return;

    if (!currentUser) return;

    const op = computeOperation(oldValue, newValue, currentUser.id);
    if (!op) return;

    incrementPendingOps();
    socket.emit('operation', { operation: op, revision });

    const localDoc = applyOperation(oldValue, op);
    lastContentRef.current = localDoc;
    setDocument(localDoc);

    const pos = e.currentTarget.selectionStart;
    const { line } = getLineAndColumn(pos);
    socket.emit('cursor-move', { position: pos, lineNumber: line });
    updateCursor({
      userId: currentUser.id,
      userName: currentUser.name,
      color: currentUser.color,
      position: pos,
      lineNumber: line,
    });
  }, [socket, revision, currentUser, setDocument, updateCursor, getLineAndColumn, incrementPendingOps]);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteOp = (data: { operation: Operation; userId: string }) => {
      if (data.userId === currentUser?.id) return;

      const op = data.operation;
      const currentDoc = lastContentRef.current;
      const newDoc = applyOperation(currentDoc, op);
      lastContentRef.current = newDoc;
      setDocument(newDoc);
      setRevision(op.revision || revision + 1);

      if (textareaRef.current) {
        const selStart = textareaRef.current.selectionStart;
        const selEnd = textareaRef.current.selectionEnd;

        let newStart = selStart;
        let newEnd = selEnd;

        if (op.type === 'insert') {
          const insertLen = op.text?.length || 0;
          if (op.position <= selStart) newStart += insertLen;
          if (op.position <= selEnd) newEnd += insertLen;
        } else if (op.type === 'delete') {
          const delLen = op.length || 0;
          if (op.position + delLen <= selStart) {
            newStart -= delLen;
            newEnd -= delLen;
          } else if (op.position < selStart) {
            newStart = op.position;
            newEnd = Math.max(op.position, selEnd - delLen);
          } else if (op.position < selEnd) {
            newEnd = Math.max(op.position, selEnd - delLen);
          }
        }

        textareaRef.current.selectionStart = newStart;
        textareaRef.current.selectionEnd = newEnd;
      }
    };

    const handleOpAck = (data: { revision: number; operation: Operation }) => {
      setRevision(data.revision);
      decrementPendingOps();
    };

    const handleRemoteCursor = (data: { userId: string; position: number; lineNumber: number }) => {
      if (data.userId === currentUser?.id) return;

      const cursor = cursors.find((c) => c.userId === data.userId);
      if (cursor) {
        updateCursor({
          ...cursor,
          position: data.position,
          lineNumber: data.lineNumber,
        });
      }
    };

    const handleUserJoined = (user: { id: string; name: string; color: string }) => {
      addCursor({
        userId: user.id,
        userName: user.name,
        color: user.color,
        position: 0,
        lineNumber: 0,
      });
    };

    const handleUserLeft = (data: { id: string }) => {
      removeCursor(data.id);
    };

    socket.on('remote-operation', handleRemoteOp);
    socket.on('operation-ack', handleOpAck);
    socket.on('remote-cursor', handleRemoteCursor);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('remote-operation', handleRemoteOp);
      socket.off('operation-ack', handleOpAck);
      socket.off('remote-cursor', handleRemoteCursor);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, currentUser, cursors, setDocument, setRevision, updateCursor, addCursor, removeCursor, decrementPendingOps]);

  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const pos = target.selectionStart;
    const { line } = getLineAndColumn(pos);
    if (currentUser) {
      socket.emit('cursor-move', { position: pos, lineNumber: line });
      updateCursor({
        userId: currentUser.id,
        userName: currentUser.name,
        color: currentUser.color,
        position: pos,
        lineNumber: line,
      });
    }
  }, [socket, currentUser, updateCursor, getLineAndColumn]);

  const handleLineClick = useCallback((lineIndex: number) => {
    setSelectedLine(selectedLine === lineIndex ? null : lineIndex);
    const pos = getPositionFromLine(lineIndex);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos);
    }
  }, [selectedLine, setSelectedLine, getPositionFromLine]);

  const handleAddCommentClick = useCallback((e: React.MouseEvent, lineIndex: number) => {
    e.stopPropagation();
    setSelectedLine(lineIndex);
  }, [setSelectedLine]);

  const getRemoteCursorsForLine = useCallback((lineIndex: number) => {
    return cursors.filter((c) => c.userId !== currentUser?.id && c.lineNumber === lineIndex);
  }, [cursors, currentUser]);

  const renderRemoteCursors = useMemo(() => {
    if (!textareaRef.current) return null;

    const remoteCursors = cursors.filter((c) => c.userId !== currentUser?.id);
    const textarea = textareaRef.current;
    const lineHeight = LINE_HEIGHT;

    return remoteCursors.map((cursor) => {
      const { line, col } = getLineAndColumn(cursor.position);
      const top = line * lineHeight;
      const left = col * 8.4 + 12;

      return (
        <div
          key={cursor.userId}
          className="remote-cursor"
          style={{
            top: top + 'px',
            left: left + 'px',
            height: lineHeight + 'px',
            backgroundColor: cursor.color,
          }}
        >
          <div
            className="remote-cursor-flag"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </div>
        </div>
      );
    });
  }, [cursors, currentUser, getLineAndColumn]);

  useEffect(() => {
    if (highlightedLine !== null) {
      const timer = setTimeout(() => {
        setHighlightedLine(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedLine, setHighlightedLine]);

  return (
    <div className="editor-container" ref={containerRef}>
      <div className="editor-wrapper">
        <div className="line-numbers">
          {lines.map((_, idx) => (
            <div
              key={idx}
            className={'line-number ' + (selectedLine === idx ? 'selected' : '') + ' ' + (highlightedLine === idx ? 'highlighted' : '')}
              onClick={() => handleLineClick(idx)}
            >
              <button
                className="add-comment-btn"
                onClick={(e) => handleAddCommentClick(e, idx)}
                title="Add comment"
              >
                +
              </button>
              {idx + 1}
            </div>
          ))}
        </div>

        <div className="code-area">
          <div className="code-content">
            {tokenizedLines.map((tokens, lineIdx) => (
              <div
                key={lineIdx}
                className={'code-line ' + (highlightedLine === lineIdx ? 'highlighted-flash' : '')}
              >
                {tokens.map((token, tokenIdx) => renderToken(token, lineIdx + '-' + tokenIdx))}
              </div>
            ))}
          </div>

          <div className="remote-cursors">
            {renderRemoteCursors}
          </div>

          <textarea
            ref={textareaRef}
            className="code-textarea"
            value={document}
            onChange={handleInput}
            onSelect={handleSelect}
            onClick={handleSelect}
            onKeyUp={handleSelect}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;
