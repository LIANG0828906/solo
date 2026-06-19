import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save, ArrowLeft, X } from 'lucide-react';
import dayjs from 'dayjs';
import { useNoteStore } from '@/store/noteStore';
import TagCapsule from '@/components/TagCapsule';
import BacklinkList from '@/components/BacklinkList';
import type { Tag, Note } from '@/types';

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['code-block'],
  ],
};

const formats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link', 'image', 'code-block'];

interface SelectionPulse {
  visible: boolean;
  x: number;
  y: number;
}

const generateSummary = (text: string): string => {
  const plainText = text.replace(/<[^>]*>/g, '').replace(/\[\[([^\]]+)\]\]/g, '$1');
  return plainText.slice(0, 100);
};

const parseReferences = (text: string, notes: { id: string; title: string }[]): string[] => {
  const regex = /\[\[([^\]]+)\]\]/g;
  const references: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const referencedNote = notes.find((n) => n.title === match![1]);
    if (referencedNote) {
      references.push(referencedNote.id);
    }
  }
  return [...new Set(references)];
};

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchNote, currentNote, addNote, updateNote, fetchBacklinks, backlinks, notes } = useNoteStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [selectionPulse, setSelectionPulse] = useState<SelectionPulse>({ visible: false, x: 0, y: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  const isNew = id === 'new';

  useEffect(() => {
    if (!isNew && id) {
      fetchNote(id);
      fetchBacklinks(id);
    }
  }, [isNew, id, fetchNote, fetchBacklinks]);

  useEffect(() => {
    if (currentNote && !isNew) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setTags(currentNote.tags);
    }
  }, [currentNote, isNew]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPulse({
          visible: true,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        setTimeout(() => setSelectionPulse((prev) => ({ ...prev, visible: false })), 800);
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const saveNote = useCallback(async () => {
    if (!title.trim()) return;

    const summary = generateSummary(content);
    const referenceIds = parseReferences(content, notes);

    if (isNew) {
      const newNote: Partial<Note> = {
        title: title.trim(),
        content,
        summary,
        tags,
        referenceIds,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
      };
      await addNote(newNote);
      navigate('/');
    } else if (id) {
      const updatedNote: Partial<Note> = {
        title: title.trim(),
        content,
        summary,
        tags,
        referenceIds,
        updatedAt: dayjs().toISOString(),
      };
      await updateNote(id, updatedNote);
    }
  }, [title, content, tags, isNew, id, addNote, updateNote, navigate, notes]);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (!isNew && title.trim()) {
        saveNote();
      }
    }, 500);
  };

  const handleSaveClick = async () => {
    await saveNote();
    if (isNew) {
      navigate('/');
    }
  };

  const handleAddTag = (tag: Tag) => {
    if (!tags.find((t) => t.id === tag.id)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

  const allTags = [...new Map(notes.flatMap((n) => n.tags).map((t) => [t.id, t])).values()];
  const filteredTags = allTags.filter(
    (t) => t.name.toLowerCase().includes(tagInput.toLowerCase()) && !tags.find((ut) => ut.id === t.id)
  );

  const handleBacklinkClick = (noteId: string) => {
    navigate(`/editor/${noteId}`);
  };

  return (
    <div className="min-h-screen" style={{ background: '#faf8f5' }}>
      {selectionPulse.visible && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: selectionPulse.x,
            top: selectionPulse.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-garden-teal/50 animate-ping" />
        </div>
      )}

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-garden-teal transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">返回</span>
          </button>
          <button
            onClick={handleSaveClick}
            className="flex items-center gap-2 bg-garden-teal text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
          >
            <Save size={18} />
            <span>保存</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-[15%] py-12">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题..."
          className="text-3xl font-sans font-bold bg-transparent border-none outline-none w-full mb-6 placeholder-gray-400"
        />

        <div className="flex flex-wrap items-center gap-2 mb-6" ref={tagDropdownRef}>
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-1">
              <TagCapsule tag={tag} />
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagDropdown(true);
              }}
              onFocus={() => setShowTagDropdown(true)}
              placeholder="添加标签..."
              className="px-3 py-1 text-sm border border-dashed border-gray-300 rounded-full bg-transparent outline-none focus:border-garden-teal w-32"
            />
            {showTagDropdown && filteredTags.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px] max-h-48 overflow-y-auto">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <TagCapsule tag={tag} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          placeholder="开始写作... 使用 [[笔记标题]] 创建双向链接"
          style={{
            fontFamily: 'Georgia, serif',
            lineHeight: 1.6,
            minHeight: '60vh',
          }}
        />

        <BacklinkList backlinks={backlinks} onClick={handleBacklinkClick} />
      </div>
    </div>
  );
}
