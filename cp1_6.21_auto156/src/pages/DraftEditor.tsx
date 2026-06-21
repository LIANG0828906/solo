import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Material, MaterialType } from '../types';

function formatInsertContent(material: Material): string {
  switch (material.type) {
    case 'text':
      return material.content;
    case 'link':
      return `[${material.title}](${material.content})`;
    case 'image':
      return `![${material.title}](${material.imageUrl || material.content})`;
    default:
      return material.content;
  }
}

export default function DraftEditor() {
  const { currentDraft, saveDraft, setInsertCallback } = useAppContext();
  const editorRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editorRef.current && currentDraft.content !== undefined) {
      if (editorRef.current.innerHTML !== currentDraft.content) {
        editorRef.current.innerHTML = currentDraft.content;
      }
    }
  }, [currentDraft.content]);

  const handleInput = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML;
        saveDraft(content);
      }
    }, 1000);
  }, [saveDraft]);

  const insertMaterial = useCallback((material: Material) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    const text = formatInsertContent(material);

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editor.innerHTML += text;
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      editor.innerHTML += text;
      return;
    }

    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    handleInput();
  }, [handleInput]);

  useEffect(() => {
    setInsertCallback(insertMaterial);
    return () => setInsertCallback(null);
  }, [insertMaterial, setInsertCallback]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const handleExport = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const text = editor.innerText || editor.textContent || '';
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const filename = `草稿_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const toolbarBtnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#475569',
    transition: 'background 0.15s, border-color 0.15s',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid #E2E8F0',
          background: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button style={toolbarBtnStyle} onClick={() => execCommand('bold')} title="粗体"><b>B</b></button>
          <button style={toolbarBtnStyle} onClick={() => execCommand('italic')} title="斜体"><i>I</i></button>
          <button style={toolbarBtnStyle} onClick={() => execCommand('underline')} title="下划线"><u>U</u></button>
          <button style={toolbarBtnStyle} onClick={() => execCommand('insertUnorderedList')} title="无序列表">• 列表</button>
          <button style={toolbarBtnStyle} onClick={() => execCommand('insertOrderedList')} title="有序列表">1. 列表</button>
        </div>
        <button
          onClick={handleExport}
          style={{
            background: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2563EB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#3B82F6'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          导出 .txt
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{
          flex: 1,
          padding: '20px 24px',
          outline: 'none',
          overflowY: 'auto',
          fontSize: '15px',
          lineHeight: 1.8,
          color: '#1E293B',
          background: '#FFFFFF',
        }}
        suppressContentEditableWarning
      />
    </div>
  );
}
