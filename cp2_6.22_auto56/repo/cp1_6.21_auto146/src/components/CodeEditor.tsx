import React, { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { useAppContext } from '../context/AppContext';
import type { Language } from '../types';

const languageColors: Record<Language, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  CSS: '#2965F1',
  HTML: '#E34F26',
};

const getLanguageExtension = (language: Language) => {
  switch (language) {
    case 'TypeScript':
    case 'JavaScript':
      return javascript({ typescript: language === 'TypeScript' });
    case 'CSS':
      return css();
    case 'HTML':
      return html();
    default:
      return javascript();
  }
};

export const CodeEditor: React.FC = () => {
  const { selectedSnippet, isEditing, setIsEditing, updateSnippet, deleteSnippet } =
    useAppContext();

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (!editorRef.current || !selectedSnippet) {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      return;
    }

    const content = isEditing ? editContent : selectedSnippet.content;

    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const extensions = [basicSetup, getLanguageExtension(selectedSnippet.language)];

    if (!isEditing) {
      extensions.push(EditorView.editable.of(false));
    }

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [selectedSnippet?.id, isEditing, selectedSnippet?.language]);

  useEffect(() => {
    if (selectedSnippet) {
      setEditContent(selectedSnippet.content);
    }
  }, [selectedSnippet?.id]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(selectedSnippet?.content || '');
  };

  const handleSave = () => {
    if (!selectedSnippet || !viewRef.current) return;
    const content = viewRef.current.state.doc.toString();
    updateSnippet(selectedSnippet.id, { content });
    setEditContent(content);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(selectedSnippet?.content || '');
  };

  const handleDelete = () => {
    if (!selectedSnippet) return;
    if (window.confirm(`确定要删除 ${selectedSnippet.filename} 吗？`)) {
      deleteSnippet(selectedSnippet.id);
    }
  };

  if (!selectedSnippet) {
    return (
      <div className="code-editor empty">
        <div className="empty-message">
          <p>请从左侧选择一个代码片段</p>
          <p className="empty-hint">或点击 + 按钮创建新片段</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`code-editor ${isEditing ? 'editing' : ''}`}>
      <div className="editor-header">
        <span
          className="language-tag"
          style={{
            backgroundColor: languageColors[selectedSnippet.language] + '20',
            color: languageColors[selectedSnippet.language],
          }}
        >
          {selectedSnippet.language}
        </span>
        <span className="editor-filename">{selectedSnippet.filename}</span>
        <div className="editor-actions">
          {!isEditing ? (
            <button className="btn-edit" onClick={handleEdit}>
              编辑
            </button>
          ) : (
            <>
              <button className="btn-cancel" onClick={handleCancel}>
                取消
              </button>
              <button className="btn-save" onClick={handleSave}>
                保存
              </button>
            </>
          )}
          <button className="btn-delete" onClick={handleDelete}>
            删除
          </button>
        </div>
      </div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
};
