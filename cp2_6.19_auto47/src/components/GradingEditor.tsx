import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Submission, Annotation } from '../types';
import { useStore } from '../store/useStore';

interface TextAnnotatorProps {
  content: string;
  annotations: Annotation[];
  onAddAnnotation: (startIndex: number, endIndex: number, text: string, content: string) => void;
  onDeleteAnnotation?: (id: string) => void;
  onJumpToAnnotation?: (id: string) => void;
  highlightId?: string | null;
}

const TextAnnotator: React.FC<TextAnnotatorProps> = ({
  content,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  highlightId,
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [selectionInfo, setSelectionInfo] = useState<{
    startIndex: number;
    endIndex: number;
    text: string;
    top: number;
    left: number;
  } | null>(null);
  const [annotationInput, setAnnotationInput] = useState('');
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedAnnotations = [...annotations].sort((a, b) => a.startIndex - b.startIndex);

  const getCharOffset = useCallback((node: Node, offset: number): number => {
    const range = document.createRange();
    range.selectNodeContents(textRef.current!);
    range.setEnd(node, offset);
    return range.toString().length;
  }, []);

  const handleTextMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      setSelectionInfo(null);
      return;
    }

    if (!textRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    const startIndex = getCharOffset(range.startContainer, range.startOffset);
    const endIndex = getCharOffset(range.endContainer, range.endOffset);
    const selectedText = range.toString();

    if (selectedText.trim().length === 0) {
      setSelectionInfo(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = textRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setSelectionInfo({
        startIndex,
        endIndex,
        text: selectedText,
        top: rect.top - containerRect.top - 40,
        left: rect.left - containerRect.left + rect.width / 2,
      });
    }
  }, [getCharOffset]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.annotation-toolbar') && !target.closest('.text-content')) {
        setSelectionInfo(null);
        window.getSelection()?.removeAllRanges();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectionInfo && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [selectionInfo]);

  const handleSaveAnnotation = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectionInfo || !annotationInput.trim()) return;

    onAddAnnotation(
      selectionInfo.startIndex,
      selectionInfo.endIndex,
      selectionInfo.text,
      annotationInput.trim()
    );

    setAnnotationInput('');
    setSelectionInfo(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveAnnotation();
    } else if (e.key === 'Escape') {
      setSelectionInfo(null);
      setAnnotationInput('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const renderAnnotatedText = () => {
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedAnnotations.forEach((annotation, idx) => {
      if (annotation.startIndex > lastIndex) {
        result.push(
          <span key={`text-${idx}`}>
            {content.slice(lastIndex, annotation.startIndex)}
          </span>
        );
      }

      const isHovered = hoveredAnnotation === annotation.id;
      const isHighlighted = highlightId === annotation.id;

      result.push(
        <span
          key={`ann-${annotation.id}`}
          className={`annotated-text ${isHovered ? 'hovered' : ''} ${isHighlighted ? 'highlighted' : ''}`}
          onMouseEnter={() => setHoveredAnnotation(annotation.id)}
          onMouseLeave={() => setHoveredAnnotation(null)}
        >
          {content.slice(annotation.startIndex, annotation.endIndex)}
          <sup className="annotation-number">{idx + 1}</sup>
          {isHovered && (
            <div className="annotation-tooltip">
              <div className="tooltip-content">
                <span className="tooltip-number">#{idx + 1}</span>
                {annotation.content}
              </div>
              {onDeleteAnnotation && (
                <button
                  className="tooltip-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(annotation.id);
                  }}
                >
                  删除
                </button>
              )}
            </div>
          )}
        </span>
      );

      lastIndex = annotation.endIndex;
    });

    if (lastIndex < content.length) {
      result.push(
        <span key="text-end">{content.slice(lastIndex)}</span>
      );
    }

    return result;
  };

  return (
    <div className="text-annotator">
      <div
        ref={textRef}
        className="text-content"
        onMouseUp={handleTextMouseUp}
      >
        {renderAnnotatedText()}
      </div>

      {selectionInfo && (
        <div
          className="annotation-toolbar"
          style={{ top: selectionInfo.top, left: selectionInfo.left }}
        >
          <form onSubmit={handleSaveAnnotation}>
            <input
              ref={inputRef}
              type="text"
              value={annotationInput}
              onChange={(e) => setAnnotationInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入批注内容，Enter保存"
              className="toolbar-input"
              autoFocus
            />
            <button
              type="submit"
              className="toolbar-btn"
              disabled={!annotationInput.trim()}
            >
              添加
            </button>
          </form>
        </div>
      )}

      <style>{`
        .text-annotator {
          position: relative;
          height: 100%;
        }

        .text-content {
          background: #fff;
          padding: 24px 28px;
          line-height: 1.8;
          font-size: 16px;
          color: #333;
          overflow-y: auto;
          height: 100%;
          user-select: text;
          cursor: text;
        }

        .annotated-text {
          position: relative;
          background: linear-gradient(transparent 85%, #fff3b0 85%);
          cursor: pointer;
          border-bottom: 2px solid #e6c200;
          transition: background 0.2s;
        }

        .annotated-text.hovered,
        .annotated-text.highlighted {
          background: linear-gradient(transparent 80%, #ffd93d 80%);
        }

        .annotation-number {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          background: #ff8c42;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          line-height: 16px;
          text-align: center;
          margin-left: 2px;
          vertical-align: super;
          position: relative;
          top: -2px;
        }

        .annotation-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 10px 12px;
          min-width: 200px;
          max-width: 300px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 100;
          margin-bottom: 6px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .annotation-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #fff;
        }

        .tooltip-content {
          font-size: 13px;
          color: #333;
          line-height: 1.5;
        }

        .tooltip-number {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          background: #ff8c42;
          padding: 2px 6px;
          border-radius: 10px;
          margin-right: 6px;
          margin-bottom: 6px;
        }

        .tooltip-delete {
          margin-top: 8px;
          background: #fff0f0;
          color: #ff6b6b;
          border: none;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .tooltip-delete:hover {
          background: #ffe0e0;
        }

        .annotation-toolbar {
          position: absolute;
          transform: translateX(-50%);
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
          z-index: 100;
          animation: toolbarIn 0.15s ease;
        }

        @keyframes toolbarIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .annotation-toolbar form {
          display: flex;
          gap: 6px;
        }

        .toolbar-input {
          width: 220px;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
        }

        .toolbar-input:focus {
          border-color: #4a90d9;
        }

        .toolbar-btn {
          background: #4a90d9;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .toolbar-btn:disabled {
          background: #a0c4e8;
          cursor: not-allowed;
        }

        .toolbar-btn:hover:not(:disabled) {
          background: #3a7bc8;
        }
      `}</style>
    </div>
  );
};

interface GradingEditorProps {
  submission: Submission;
  studentHistory: Submission[];
}

export const GradingEditor: React.FC<GradingEditorProps> = ({
  submission,
  studentHistory,
}) => {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [localScore, setLocalScore] = useState<number | null>(submission.score);
  const [localComment, setLocalComment] = useState(submission.overallComment);
  const [highlightAnnotationId, setHighlightAnnotationId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addAnnotation = useStore((state) => state.addAnnotation);
  const deleteAnnotation = useStore((state) => state.deleteAnnotation);
  const updateOverallComment = useStore((state) => state.updateOverallComment);
  const updateScore = useStore((state) => state.updateScore);
  const submitGrading = useStore((state) => state.submitGrading);

  const displaySubmission = useMemo(() => {
    if (selectedHistoryId) {
      return studentHistory.find((s) => s.id === selectedHistoryId) || submission;
    }
    return submission;
  }, [selectedHistoryId, studentHistory, submission]);

  const isCurrent = !selectedHistoryId || selectedHistoryId === submission.id;

  useEffect(() => {
    setLocalScore(submission.score);
    setLocalComment(submission.overallComment);
    setSelectedHistoryId(null);
  }, [submission.id]);

  const handleHistoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value || null;
    const oldIndex = studentHistory.findIndex((s) => s.id === (selectedHistoryId || submission.id));
    const newIndex = newId
      ? studentHistory.findIndex((s) => s.id === newId)
      : studentHistory.findIndex((s) => s.id === submission.id);

    setSlideDirection(newIndex > oldIndex ? 'left' : 'right');
    setIsAnimating(true);
    setSelectedHistoryId(newId);

    setTimeout(() => {
      setIsAnimating(false);
      setSlideDirection(null);
    }, 300);
  };

  const handleAddAnnotation = (
    startIndex: number,
    endIndex: number,
    text: string,
    content: string
  ) => {
    if (!isCurrent) return;
    addAnnotation(submission.id, { startIndex, endIndex, text, content });
  };

  const handleDeleteAnnotation = (annotationId: string) => {
    if (!isCurrent) return;
    deleteAnnotation(submission.id, annotationId);
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalScore(value);
    updateScore(submission.id, value);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalComment(e.target.value);
    updateOverallComment(submission.id, e.target.value);
  };

  const handleSubmit = () => {
    if (localScore === null) {
      alert('请先打分');
      return;
    }
    submitGrading(submission.id);
    alert('批改已提交！');
  };

  const sortedAnnotations = [...displaySubmission.annotations].sort(
    (a, b) => a.startIndex - b.startIndex
  );

  const handleAnnotationHover = (id: string | null) => {
    setHighlightAnnotationId(id);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grading-editor" ref={containerRef}>
      <div className="editor-header">
        <div className="editor-title-section">
          <h2 className="editor-title">{displaySubmission.title}</h2>
          <div className="editor-meta">
            <span className="student-name-label">学生：{displaySubmission.studentName}</span>
            <span className="submit-time-label">
              提交时间：{formatDate(displaySubmission.submittedAt)}
            </span>
            {displaySubmission.gradedAt && (
              <span className="graded-time-label">
                批改时间：{formatDate(displaySubmission.gradedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="history-selector">
          <label htmlFor="history-select">历史作业：</label>
          <select
            id="history-select"
            value={selectedHistoryId || ''}
            onChange={handleHistoryChange}
            className="history-select"
          >
            <option value="">当前作业</option>
            {studentHistory
              .filter((s) => s.id !== submission.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({formatDate(s.submittedAt)})
                  {s.score !== null ? ` - ${s.score}分` : ''}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="editor-body">
        <div
          className={`text-pane ${isAnimating ? `slide-${slideDirection}` : ''}`}
          key={displaySubmission.id + '-text'}
        >
          <TextAnnotator
            content={displaySubmission.content}
            annotations={displaySubmission.annotations}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={isCurrent ? handleDeleteAnnotation : undefined}
            highlightId={highlightAnnotationId}
          />
        </div>

        <div
          className={`annotation-pane ${isAnimating ? `slide-${slideDirection}` : ''}`}
          key={displaySubmission.id + '-pane'}
        >
          <div className="annotations-section">
            <h3 className="section-title">
              批注列表
              <span className="annotation-count-badge">
                {sortedAnnotations.length}
              </span>
            </h3>
            <div className="annotations-list">
              {sortedAnnotations.length === 0 ? (
                <div className="empty-annotations">
                  <p>暂无批注</p>
                  <p className="hint">选中左侧文本添加批注</p>
                </div>
              ) : (
                sortedAnnotations.map((annotation, index) => (
                  <div
                    key={annotation.id}
                    className={`annotation-item ${
                      highlightAnnotationId === annotation.id ? 'highlight' : ''
                    }`}
                    onMouseEnter={() => handleAnnotationHover(annotation.id)}
                    onMouseLeave={() => handleAnnotationHover(null)}
                  >
                    <div className="annotation-header">
                      <span className="annotation-index">{index + 1}</span>
                      {isCurrent && (
                        <button
                          className="annotation-delete"
                          onClick={() => handleDeleteAnnotation(annotation.id)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="annotation-text">"{annotation.text}"</div>
                    <div className="annotation-content">{annotation.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="comment-section">
            <h3 className="section-title">总体评语</h3>
            <textarea
              className="comment-textarea"
              value={isCurrent ? localComment : displaySubmission.overallComment}
              onChange={handleCommentChange}
              placeholder="请输入总体评语..."
              rows={4}
              readOnly={!isCurrent}
            />
          </div>

          <div className="score-section">
            <div className="score-header">
              <h3 className="section-title">评分</h3>
              <span className="score-value">
                {isCurrent ? (localScore ?? '--') : displaySubmission.score ?? '--'}
                <span className="score-unit">分</span>
              </span>
            </div>
            <div className="score-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={isCurrent ? localScore ?? 0 : displaySubmission.score ?? 0}
                onChange={handleScoreChange}
                className="score-slider"
                disabled={!isCurrent}
              />
              <div className="slider-labels">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {isCurrent && (
            <div className="submit-section">
              <button className="submit-btn" onClick={handleSubmit}>
                {submission.gradedAt ? '更新批改' : '提交批改'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .grading-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100vh;
          overflow: hidden;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
          flex-shrink: 0;
        }

        .editor-title-section {
          min-width: 0;
        }

        .editor-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }

        .editor-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #888;
        }

        .history-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .history-selector label {
          font-size: 13px;
          color: #666;
        }

        .history-select {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          background: #fff;
          cursor: pointer;
          min-width: 200px;
        }

        .history-select:focus {
          outline: none;
          border-color: #4a90d9;
        }

        .editor-body {
          flex: 1;
          display: flex;
          min-height: 0;
        }

        .text-pane {
          flex: 1;
          min-width: 0;
          position: relative;
          overflow: hidden;
        }

        .annotation-pane {
          width: 320px;
          background: #f5f5f5;
          border-left: 1px solid #e5e5e5;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
        }

        .slide-left {
          animation: slideLeft 0.3s ease;
        }

        .slide-right {
          animation: slideRight 0.3s ease;
        }

        @keyframes slideLeft {
          from {
            opacity: 0.5;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideRight {
          from {
            opacity: 0.5;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .annotations-section {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .annotation-count-badge {
          background: #4a90d9;
          color: white;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 500;
        }

        .annotations-list {
          flex: 1;
          overflow-y: auto;
          margin-top: 12px;
          padding-right: 4px;
        }

        .empty-annotations {
          text-align: center;
          padding: 30px 10px;
          color: #999;
        }

        .empty-annotations p {
          margin: 4px 0;
          font-size: 13px;
        }

        .empty-annotations .hint {
          font-size: 12px;
          color: #bbb;
        }

        .annotation-item {
          background: #fff;
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 8px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .annotation-item.highlight {
          border-color: #4a90d9;
          box-shadow: 0 2px 8px rgba(74, 144, 217, 0.15);
        }

        .annotation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .annotation-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: #ff8c42;
          color: white;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
        }

        .annotation-delete {
          background: none;
          border: none;
          font-size: 16px;
          color: #ccc;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }

        .annotation-delete:hover {
          color: #ff6b6b;
        }

        .annotation-text {
          font-size: 12px;
          color: #666;
          font-style: italic;
          margin-bottom: 6px;
          padding: 4px 8px;
          background: #f8f9fa;
          border-radius: 4px;
          line-height: 1.5;
        }

        .annotation-content {
          font-size: 13px;
          color: #333;
          line-height: 1.5;
        }

        .comment-section {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .comment-textarea {
          width: 100%;
          margin-top: 10px;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          resize: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .comment-textarea:focus {
          outline: none;
          border-color: #4a90d9;
        }

        .comment-textarea[readonly] {
          background: #f8f9fa;
          color: #666;
        }

        .score-section {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .score-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .score-value {
          font-size: 24px;
          font-weight: 700;
          color: #ff8c42;
        }

        .score-unit {
          font-size: 14px;
          font-weight: 400;
          color: #888;
          margin-left: 2px;
        }

        .score-slider-container {
          position: relative;
        }

        .score-slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, #ff8c42, #ffb078);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .score-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #fff;
          border: 3px solid #ff8c42;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s;
        }

        .score-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .score-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #fff;
          border: 3px solid #ff8c42;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .score-slider:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 11px;
          color: #aaa;
        }

        .submit-section {
          padding: 16px;
        }

        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #4a90d9, #3a7bc8);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
        }

        .submit-btn:hover {
          background: linear-gradient(135deg, #3a7bc8, #2e6bb0);
        }

        @media (max-width: 768px) {
          .grading-editor {
            height: auto;
          }

          .editor-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 16px;
          }

          .history-select {
            width: 100%;
            min-width: auto;
          }

          .editor-body {
            flex-direction: column;
            height: auto;
          }

          .text-pane {
            height: 300px;
          }

          .annotation-pane {
            width: 100%;
            border-left: none;
            border-top: 1px solid #e5e5e5;
          }
        }
      `}</style>
    </div>
  );
};
