import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { computeOperation, applyOperation, Operation } from './OTEngine';
import { tokenize, Token } from './tokenizer';
import { Socket } from 'socket.io-client';

interface EditorProps {
  socket: Socket;
}

const LINE_HEIGHT = 20;
const CHAR_WIDTH = 8.4;
const PADDING_LEFT = 12;

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

  const renderedLines = useMemo(() => {
    return lines.map((line, lineIdx) => {
      const lineOffset = document.indexOf('\n'.repeat(lineIdx)) + lineIdx;
      let actualOffset = 0;
      for (let l = 0; l < lineIdx; l++) {
        actualOffset += lines[l].length + 1;
      }
      const tokens = tokenize(line);

      return (
        <div
          key={'line-' + lineIdx}
          className={'code-line ' + (highlightedLine === lineIdx ? 'highlighted-flash' : '')}
        >
          {tokens.map((token, tokenIdx) => {
            const key = 'tok-' + lineIdx + '-' + tokenIdx + '-' + token.start + '-' + token.end;
            if (token.type === 'whitespace') {
              return <span key={key}>{token.value}</span>;
            }
            return (
              <span key={key} className={'token-' + token.type}>
                {token.value}
              </span>
            );
          })}
          {line.length === 0 && '\u200B'}
        </div>
      );
    });
  }, [lines, document, highlightedLine]);

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
  }, [socket, currentUser, cursors, setDocument, setRevision, updateCursor, addCursor, removeCursor, decrementPendingOps, revision]);

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

  const renderRemoteCursors = useMemo(() => {
    const remoteCursors = cursors.filter((c) => c.userId !== currentUser?.id);
    if (remoteCursors.length === 0) return null;

    return remoteCursors.map((cursor) => {
      const { line, col } = getLineAndColumn(cursor.position);
      const top = line * LINE_HEIGHT;
      const left = col * CHAR_WIDTH + PADDING_LEFT;

      return (
        <div
          key={'cursor-' + cursor.userId}
          className="remote-cursor"
          style={{
            top: top + 'px',
            left: left + 'px',
            height: LINE_HEIGHT + 'px',
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
              key={'ln-' + idx}
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
            {renderedLines}
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
