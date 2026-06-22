import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNoteStore } from '../store/useNoteStore';

export const NoteEditor: React.FC = () => {
  const { notes, selectedNoteId, saveNote } = useNoteStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [localTitle, setLocalTitle] = useState('');
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const currentNote = notes.find(note => note.id === selectedNoteId) || null;

  useEffect(() => {
    if (currentNote) {
      setLocalTitle(currentNote.title);
      setLocalTags(currentNote.tags);
      if (editorRef.current) {
        if (editorRef.current.innerHTML !== currentNote.content) {
          editorRef.current.innerHTML = currentNote.content;
        }
      }
      setHasChanges(false);
    } else {
      setLocalTitle('');
      setLocalTags([]);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      setHasChanges(false);
    }
  }, [selectedNoteId, currentNote]);

  const handleSave = useCallback(() => {
    if (!selectedNoteId) return;
    const content = editorRef.current?.innerHTML || '';
    saveNote(selectedNoteId, {
      title: localTitle || '无标题笔记',
      content,
      tags: localTags
    });
    setHasChanges(false);
  }, [selectedNoteId, localTitle, localTags, saveNote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setHasChanges(true);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      execCommand('bold');
    } else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      execCommand('italic');
    } else if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      execCommand('insertUnorderedList');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = newTag.trim();
      if (tag && !localTags.includes(tag)) {
        setLocalTags([...localTags, tag]);
        setHasChanges(true);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setLocalTags(localTags.filter(tag => tag !== tagToRemove));
    setHasChanges(true);
  };

  if (!currentNote) {
    return (
      <div className="note-editor empty-editor">
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <div className="empty-text">选择一篇笔记开始编辑，或点击左侧"新建笔记"按钮</div>
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor">
      <div className="editor-header">
        <div className="editor-header-left">
          <input
            ref={titleRef}
            type="text"
            className="title-input"
            value={localTitle}
            onChange={(e) => {
              setLocalTitle(e.target.value);
              setHasChanges(true);
            }}
            placeholder="输入笔记标题..."
          />
        </div>
        <div className="editor-header-right">
          {hasChanges && <span className="unsaved-indicator">● 未保存</span>}
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            保存 (Ctrl+S)
          </button>
        </div>
      </div>

      <div className="tags-container">
        <div className="tags-label">标签:</div>
        <div className="tags-list">
          {localTags.map(tag => (
            <span key={tag} className="tag-item">
              {tag}
              <button
                className="tag-remove"
                onClick={() => handleRemoveTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={tagInputRef}
            type="text"
            className="tag-input"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="输入标签后按回车添加"
          />
        </div>
      </div>

      <div className="editor-wrapper">
        {showToolbar && (
          <div className="editor-toolbar">
            <button
              className="toolbar-btn"
              onClick={() => execCommand('bold')}
              title="粗体 (Ctrl+B)"
            >
              <b>B</b>
            </button>
            <button
              className="toolbar-btn"
              onClick={() => execCommand('italic')}
              title="斜体 (Ctrl+I)"
            >
              <i>I</i>
            </button>
            <button
              className="toolbar-btn"
              onClick={() => execCommand('insertUnorderedList')}
              title="无序列表 (Ctrl+Shift+L)"
            >
              • 列表
            </button>
          </div>
        )}
        <div
          ref={editorRef}
          className="editor-content"
          contentEditable
          suppressContentEditableWarning
          onKeyDown={handleEditorKeyDown}
          onInput={() => setHasChanges(true)}
          onFocus={() => setShowToolbar(true)}
          onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
          placeholder="开始输入内容..."
        />
      </div>

      <div className="editor-footer">
        <span className="editor-hint">
          提示: Ctrl+B 粗体 | Ctrl+I 斜体 | Ctrl+Shift+L 列表
        </span>
      </div>
    </div>
  );
};
