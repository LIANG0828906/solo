import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import type { Poem, Annotation } from './types';
import AnnotationItem from './AnnotationPanel';

interface PoemEditorProps {
  poem: Poem | null;
  annotations: Annotation[];
  currentUserId: string;
  currentUserName: string;
  isEditing: boolean;
  onSave: (poem: Omit<Poem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onToggleEdit: () => void;
  onClear: () => void;
  onAddAnnotation: (poemId: string, lineIndex: number, content: string) => void;
  onLikeAnnotation: (annotationId: string) => void;
  onAddReply: (annotationId: string, content: string) => void;
}

const MAX_LINES = 20;
const MAX_CHARS_PER_LINE = 50;
const MAX_ANNOTATIONS_PER_LINE = 5;

const PoemEditor: React.FC<PoemEditorProps> = memo(({
  poem,
  annotations,
  currentUserId,
  currentUserName,
  isEditing,
  onSave,
  onToggleEdit,
  onClear,
  onAddAnnotation,
  onLikeAnnotation,
  onAddReply,
}) => {
  void currentUserName;
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [lines, setLines] = useState<string[]>(['']);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [newAnnotationContent, setNewAnnotationContent] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const authorRef = useRef(author);
  const linesRef = useRef(lines);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { authorRef.current = author; }, [author]);
  useEffect(() => { linesRef.current = lines; }, [lines]);

  useEffect(() => {
    if (poem) {
      setTitle(poem.title);
      setAuthor(poem.author);
      const poemLines = poem.content.split('\n');
      if (isEditing && poemLines.length < MAX_LINES) {
        poemLines.push('');
      }
      setLines(poemLines.slice(0, MAX_LINES));
    } else {
      setTitle('');
      setAuthor('');
      setLines(['']);
    }
    setSelectedLineIndex(null);
    setNewAnnotationContent('');
  }, [poem, isEditing]);

  const debouncedUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    debouncedUpdate();
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthor(e.target.value);
    debouncedUpdate();
  };

  const handleLineChange = (index: number, value: string) => {
    if (value.length > MAX_CHARS_PER_LINE) {
      value = value.slice(0, MAX_CHARS_PER_LINE);
    }
    const newLines = [...linesRef.current];
    newLines[index] = value;
    setLines(newLines);
    debouncedUpdate();
  };

  const handleLineKeyDown = (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (linesRef.current.length < MAX_LINES) {
        const newLines = [...linesRef.current];
        newLines.splice(index + 1, 0, '');
        setLines(newLines);
      }
    } else if (e.key === 'Backspace' && linesRef.current[index] === '' && linesRef.current.length > 1) {
      e.preventDefault();
      const newLines = [...linesRef.current];
      newLines.splice(index, 1);
      setLines(newLines);
    }
  };

  const handleSave = () => {
    const content = lines
      .map(line => line.trimEnd())
      .filter(line => line.length > 0)
      .join('\n');

    if (!title.trim() || !content.trim()) {
      alert('请填写标题和诗词内容');
      return;
    }

    onSave({
      id: poem?.id,
      title: title.trim(),
      author: author.trim() || '佚名',
      content: content.trim(),
    });
  };

  const handleLineClick = (index: number) => {
    if (isEditing) return;
    const lineAnnotations = annotations.filter(a => a.lineIndex === index);
    if (lineAnnotations.length >= MAX_ANNOTATIONS_PER_LINE && selectedLineIndex !== index) {
      setSelectedLineIndex(index);
      return;
    }
    setSelectedLineIndex(selectedLineIndex === index ? null : index);
    setNewAnnotationContent('');
  };

  const handleSubmitAnnotation = () => {
    if (!poem || selectedLineIndex === null || !newAnnotationContent.trim()) return;
    const lineAnnotations = annotations.filter(a => a.lineIndex === selectedLineIndex);
    if (lineAnnotations.length >= MAX_ANNOTATIONS_PER_LINE) return;
    
    onAddAnnotation(poem.id, selectedLineIndex, newAnnotationContent.trim());
    setNewAnnotationContent('');
    setSelectedLineIndex(null);
  };

  const handleCancelAnnotation = () => {
    setSelectedLineIndex(null);
    setNewAnnotationContent('');
  };

  const getAnnotationsForLine = (lineIndex: number) => {
    return annotations.filter(a => a.lineIndex === lineIndex);
  };

  if (!poem && !isEditing) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📜</div>
        <div className="empty-state-text">请选择左侧诗词或点击"新建"开始创作</div>
      </div>
    );
  }

  const displayLines = isEditing ? lines : (poem ? poem.content.split('\n') : ['']);

  return (
    <div className="editor-section">
      {isEditing ? (
        <>
          <input
            type="text"
            className="editor-title-input"
            placeholder="请输入诗词标题..."
            value={title}
            onChange={handleTitleChange}
            maxLength={50}
          />
          <input
            type="text"
            className="editor-author-input"
            placeholder="作者（可选）"
            value={author}
            onChange={handleAuthorChange}
            maxLength={30}
          />
        </>
      ) : poem && (
        <>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#3A2A1A', padding: '12px 16px', borderBottom: '2px solid #E8DCC8' }}>
            {poem.title}
          </div>
          <div style={{ fontSize: '16px', color: '#6B5744', padding: '10px 16px', marginTop: '8px' }}>
            {poem.author}
          </div>
        </>
      )}

      <div className="editor-content-area">
        <div className="poem-lines-container">
          {displayLines.map((line, index) => {
            const lineAnnotations = getAnnotationsForLine(index);
            const isSelected = selectedLineIndex === index;
            const canAddAnnotation = lineAnnotations.length < MAX_ANNOTATIONS_PER_LINE;

            return (
              <div key={index} className="line-with-annotations">
                <div className="line-content-wrapper">
                  {isEditing ? (
                    <div className="poem-line" style={{ cursor: 'text' }}>
                      <span className="line-number">{index + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <textarea
                          className="poem-line-input"
                          value={line}
                          onChange={(e) => handleLineChange(index, e.target.value)}
                          onKeyDown={(e) => handleLineKeyDown(index, e)}
                          placeholder={index === 0 ? '开始创作你的诗词...（每行自动为一句）' : ''}
                          rows={1}
                          style={{ height: 'auto' }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                        <div className="char-count">
                          {line.length}/{MAX_CHARS_PER_LINE}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`poem-line ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleLineClick(index)}
                    >
                      <span className="line-number">{index + 1}</span>
                      <span style={{ flex: 1, fontFamily: '"Noto Serif SC", serif', fontSize: '18px', lineHeight: 2 }}>
                        {line}
                      </span>
                      {lineAnnotations.length > 0 && (
                        <span className="annotation-count-badge">{lineAnnotations.length}</span>
                      )}
                    </div>
                  )}

                  {!isEditing && isSelected && canAddAnnotation && (
                    <div style={{ marginTop: '12px', padding: '0 48px' }}>
                      <textarea
                        className="annotation-input"
                        placeholder="写下你的批注（不超过200字）..."
                        value={newAnnotationContent}
                        onChange={(e) => setNewAnnotationContent(e.target.value.slice(0, 200))}
                        maxLength={200}
                        autoFocus
                      />
                      <div className="char-count">
                        {newAnnotationContent.length}/200
                      </div>
                      <div className="annotation-input-actions">
                        <button className="btn-secondary" onClick={handleCancelAnnotation}>
                          取消
                        </button>
                        <button
                          className="btn-primary"
                          onClick={handleSubmitAnnotation}
                          disabled={!newAnnotationContent.trim()}
                          style={{ opacity: newAnnotationContent.trim() ? 1 : 0.5 }}
                        >
                          提交批注
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && lineAnnotations.length > 0 && (
                  <div className="annotations-wrapper">
                    {lineAnnotations.map((annotation) => (
                      <AnnotationItem
                        key={annotation.id}
                        annotation={annotation}
                        currentUserId={currentUserId}
                        onLike={onLikeAnnotation}
                        onAddReply={onAddReply}
                      />
                    ))}
                    {canAddAnnotation && !isSelected && (
                      <button
                        className="add-annotation-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLineClick(index);
                        }}
                      >
                        + 添加批注
                      </button>
                    )}
                    {!canAddAnnotation && (
                      <div style={{ fontSize: '11px', color: '#8B7355', paddingLeft: '8px' }}>
                        本句批注已达上限（{MAX_ANNOTATIONS_PER_LINE}个）
                      </div>
                    )}
                  </div>
                )}

                {!isEditing && lineAnnotations.length === 0 && canAddAnnotation && !isSelected && (
                  <div className="annotations-wrapper">
                    <button
                      className="add-annotation-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLineClick(index);
                      }}
                    >
                      + 添加批注
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {isEditing && lines.length >= MAX_LINES && (
            <div style={{ color: '#8B6914', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
              已达到最大行数（{MAX_LINES}行）
            </div>
          )}
        </div>
      </div>

      <div className="editor-actions">
        <button className="btn-secondary" onClick={onClear}>
          新建
        </button>
        {poem && !isEditing && (
          <button className="btn-secondary" onClick={onToggleEdit}>
            编辑
          </button>
        )}
        {isEditing && (
          <button className="btn-secondary" onClick={onToggleEdit}>
            取消编辑
          </button>
        )}
        {isEditing && (
          <button className="btn-primary" onClick={handleSave}>
            保存
          </button>
        )}
      </div>
    </div>
  );
});

PoemEditor.displayName = 'PoemEditor';

export default PoemEditor;
