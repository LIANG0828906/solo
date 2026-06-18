import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { CourseUnit } from '../../types';

interface CourseContentProps {
  unit: CourseUnit;
  isCompleted: boolean;
  onMarkComplete: () => void;
}

export const CourseContent: React.FC<CourseContentProps> = ({
  unit,
  isCompleted,
  onMarkComplete,
}) => {
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const renderMarkdown = async () => {
      setLoading(true);
      const start = performance.now();
      
      marked.setOptions({
        breaks: true,
        gfm: true,
      });
      
      const rawHtml = await marked.parse(unit.content);
      const sanitizedHtml = DOMPurify.sanitize(rawHtml);
      setRenderedContent(sanitizedHtml);
      
      const duration = performance.now() - start;
      if (duration > 200) {
        console.warn(`Markdown rendering took ${duration}ms, exceeds 200ms limit`);
      }
      
      setLoading(false);
    };

    renderMarkdown();
  }, [unit.content]);

  if (loading) {
    return (
      <div className="course-content">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  return (
    <div className="course-content">
      <h2 className="course-unit-title">{unit.title}</h2>
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
      <div className="content-footer">
        <button
          className={`btn-mark-complete ${isCompleted ? 'completed' : ''}`}
          onClick={onMarkComplete}
          disabled={isCompleted}
        >
          {isCompleted ? '✓ 已完成' : '标记已完成'}
        </button>
      </div>
    </div>
  );
};
