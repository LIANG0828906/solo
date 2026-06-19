import { useState, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bold, Italic, Heading, List, X } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editingNote?: Note | null;
}

const TOOLBAR_ITEMS = [
  { icon: Bold, label: '加粗', prefix: '**', suffix: '**', block: false },
  { icon: Italic, label: '斜体', prefix: '*', suffix: '*', block: false },
  { icon: Heading, label: '标题', prefix: '## ', suffix: '', block: true },
  { icon: List, label: '列表', prefix: '- ', suffix: '', block: true },
] as const;

export default function NoteEditor({ isOpen, onClose, editingNote }: NoteEditorProps) {
  const { addNote, updateNote } = useNoteStore();
  const notes = useNoteStore((s) => s.notes);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [notes]);

  const suggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const input = tagInput.trim().toLowerCase();
    return allTags.filter(
      (t) => t.toLowerCase().includes(input) && !tags.includes(t)
    );
  }, [tagInput, allTags, tags]);

  useEffect(() => {
    if (isOpen && editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setTags([...editingNote.tags]);
    } else if (isOpen) {
      setTitle('');
      setContent('');
      setTags([]);
    }
    setTagInput('');
    setShowSuggestions(false);
  }, [isOpen, editingNote]);

  const handleToolbarClick = (
    prefix: string,
    suffix: string,
    block: boolean
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    let insertion: string;
    let newCursorPos: number;

    if (block) {
      const lineStart = beforeText.lastIndexOf('\n') + 1;
      const prefixBeforeLine = content.substring(0, lineStart);
      const lineContent = content.substring(lineStart, end);
      insertion = prefixBeforeLine + prefix + lineContent + suffix + afterText;
      newCursorPos = lineStart + prefix.length + lineContent.length + suffix.length;
    } else {
      insertion = beforeText + prefix + selectedText + suffix + afterText;
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    }

    setContent(insertion);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && tags.length < 5 && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const selectSuggestion = (tag: string) => {
    if (tags.length < 5 && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
    setShowSuggestions(false);
    tagInputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (editingNote) {
      updateNote(editingNote.id, {
        title: title.trim(),
        content,
        tags,
      });
    } else {
      addNote({
        id: uuidv4(),
        title: title.trim(),
        content,
        tags,
        createdAt: Date.now(),
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2 className="editor-title">{editingNote ? '编辑笔记' : '新建笔记'}</h2>
          <button className="editor-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <input
          className="editor-title-input"
          type="text"
          placeholder="笔记标题..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="editor-toolbar">
          {TOOLBAR_ITEMS.map((item) => (
            <button
              key={item.label}
              className="toolbar-btn"
              title={item.label}
              onClick={() => handleToolbarClick(item.prefix, item.suffix, item.block)}
            >
              <item.icon size={16} />
              <span className="toolbar-tooltip">{item.label}</span>
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          className="editor-content"
          placeholder="支持 Markdown 语法编写内容..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="editor-tags-area">
          <div className="editor-tags-container">
            {tags.map((tag) => (
              <span key={tag} className="editor-tag">
                {tag}
                <button
                  className="editor-tag-remove"
                  onClick={() => removeTag(tag)}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <div className="editor-tag-input-wrapper">
                <input
                  ref={tagInputRef}
                  className="editor-tag-input"
                  type="text"
                  placeholder={tags.length === 0 ? '添加标签...' : ''}
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleTagKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="editor-tag-suggestions">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        className="editor-tag-suggestion"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="editor-tags-count">{tags.length}/5</span>
        </div>

        <div className="editor-actions">
          <button className="editor-cancel-btn" onClick={onClose}>
            取消
          </button>
          <button
            className="editor-submit-btn"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            {editingNote ? '保存修改' : '创建笔记'}
          </button>
        </div>
      </div>
    </div>
  );
}
