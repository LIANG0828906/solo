import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import type { Snippet, SnippetCreate } from '@/types';

const TAG_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
];

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'typescript', label: 'TypeScript' },
] as const;

interface SnippetFormProps {
  onSubmit: (data: SnippetCreate) => void;
  editingSnippet?: Snippet | null;
  onCancel?: () => void;
}

export default function SnippetForm({
  onSubmit,
  editingSnippet,
  onCancel,
}: SnippetFormProps) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] =
    useState<SnippetCreate['language']>('javascript');
  const [code, setCode] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagColors, setTagColors] = useState<Map<string, string>>(new Map());
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{ title?: string; code?: string }>({});
  const [leftWidth, setLeftWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSnippet) {
      setTitle(editingSnippet.title);
      setLanguage(editingSnippet.language);
      setCode(editingSnippet.code);
      setTags(editingSnippet.tags);
      const colors = new Map<string, string>();
      editingSnippet.tags.forEach((tag, index) => {
        colors.set(tag, TAG_COLORS[index % TAG_COLORS.length]);
      });
      setTagColors(colors);
    } else {
      setTitle('');
      setLanguage('javascript');
      setCode('');
      setTags([]);
      setTagColors(new Map());
    }
    setErrors({});
    setTagInput('');
  }, [editingSnippet]);

  const getRandomColor = useCallback(() => {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
  }, []);

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && tags.length < 5 && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagColors((prev) => {
        const newMap = new Map(prev);
        newMap.set(trimmed, getRandomColor());
        return newMap;
      });
      setTagInput('');
    }
  }, [tagInput, tags, getRandomColor]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
    setTagColors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(tagToRemove);
      return newMap;
    });
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const mouseX = e.clientX - rect.left;
      const percentage = (mouseX / containerWidth) * 100;
      const clamped = Math.max(20, Math.min(50, percentage));
      setLeftWidth(clamped);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const validate = useCallback(() => {
    const newErrors: { title?: string; code?: string } = {};
    if (!title.trim()) {
      newErrors.title = '标题不能为空';
    }
    if (!code.trim()) {
      newErrors.code = '代码不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, code]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validate()) {
        onSubmit({
          title: title.trim(),
          language,
          code: code.trim(),
          tags,
        });
      }
    },
    [validate, onSubmit, title, language, code, tags]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
    setTitle('');
    setLanguage('javascript');
    setCode('');
    setTags([]);
    setTagColors(new Map());
    setErrors({});
    setTagInput('');
  }, [onCancel]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden'
      )}
      style={{
        transition: 'all var(--transition-base)',
      }}
    >
      <div
        className="flex flex-col p-4 overflow-y-auto"
        style={{
          width: `${leftWidth}%`,
          transition: isDragging ? 'none' : 'width var(--transition-base)',
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full gap-4">
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-[var(--text-primary)]"
              style={{ transition: 'color var(--transition-base)' }}
            >
              标题 <span className="text-[var(--accent-red)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入代码片段标题..."
              className={cn(
                errors.title &&
                  'border-[var(--accent-red)] focus:border-[var(--accent-red)] focus:shadow-[0_0_0_3px_rgba(255,85,85,0.15)]'
              )}
            />
            {errors.title && (
              <span
                className="text-xs text-[var(--accent-red)]"
                style={{ transition: 'color var(--transition-base)' }}
              >
                {errors.title}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-[var(--text-primary)]"
              style={{ transition: 'color var(--transition-base)' }}
            >
              语言
            </label>
            <select
              value={language}
              onChange={(e) =>
                setLanguage(
                  e.target.value as SnippetCreate['language']
                )
              }
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-[var(--text-primary)]"
              style={{ transition: 'color var(--transition-base)' }}
            >
              标签
              <span className="ml-2 text-xs text-[var(--border-color)]">
                ({tags.length}/5)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="输入标签后按回车添加..."
                disabled={tags.length >= 5}
                className={cn(tags.length >= 5 && 'opacity-50 cursor-not-allowed')}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={tags.length >= 5 || !tagInput.trim()}
                className="w-10 flex items-center justify-center px-0"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 text-xs text-white cursor-pointer"
                  style={{
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: tagColors.get(tag) || TAG_COLORS[0],
                    transition: 'all var(--transition-base)',
                  }}
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                  <span
                    className="inline-flex items-center justify-center"
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      transition: 'all var(--transition-base)',
                    }}
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <label
              className="text-sm font-medium text-[var(--text-primary)]"
              style={{ transition: 'color var(--transition-base)' }}
            >
              代码 <span className="text-[var(--accent-red)]">*</span>
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="输入代码..."
              className={cn(
                'flex-1 min-h-[200px]',
                errors.code &&
                  'border-[var(--accent-red)] focus:border-[var(--accent-red)] focus:shadow-[0_0_0_3px_rgba(255,85,85,0.15)]'
              )}
            />
            {errors.code && (
              <span
                className="text-xs text-[var(--accent-red)]"
                style={{ transition: 'color var(--transition-base)' }}
              >
                {errors.code}
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1">
              {editingSnippet ? '保存修改' : '提交'}
            </button>
            {editingSnippet && onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-[var(--border-color)] text-[var(--text-primary)]"
              >
                取消
              </button>
            )}
          </div>
        </form>
      </div>

      <div
        className={cn(
          'w-1 cursor-col-resize bg-[var(--border-color)] hover:bg-[var(--accent-purple)]',
          isDragging && 'bg-[var(--accent-purple)]'
        )}
        onMouseDown={handleMouseDown}
        style={{
          transition: isDragging ? 'none' : 'background-color var(--transition-base)',
        }}
      />

      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: `${100 - leftWidth}%`,
          transition: isDragging ? 'none' : 'width var(--transition-base)',
        }}
      >
        <div
          className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] bg-[var(--bg-primary)]"
          style={{ transition: 'all var(--transition-base)' }}
        >
          预览 - {LANGUAGES.find((l) => l.value === language)?.label}
        </div>
        <div className="flex-1 overflow-auto">
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            showLineNumbers={true}
            wrapLines={true}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              minHeight: '100%',
              background: 'transparent',
              transition: 'all var(--transition-base)',
            }}
            lineNumberStyle={{
              minWidth: '3em',
              paddingRight: '1em',
              textAlign: 'right',
              color: 'var(--border-color)',
              userSelect: 'none',
              transition: 'color var(--transition-base)',
            }}
          >
            {code || '// 开始输入代码，预览将显示在这里...'}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
