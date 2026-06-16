import { useState, useRef, useEffect, useCallback } from 'react';
import { useNoteStore } from '@/store/noteStore';
import { useTypewriterSound } from '@/hooks/useTypewriterSound';
import { useDebounce } from '@/hooks/useDebounce';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AUTOSAVE_INTERVAL, EDITOR_WIDTH } from '@/utils/constants';
import { generateShareLink } from '@/utils/export';
import { History, Download, Share2 } from 'lucide-react';

interface EditorProps {
  onOpenHistory: () => void;
  onOpenExport: () => void;
}

const Editor = ({ onOpenHistory, onOpenExport }: EditorProps) => {
  const { currentNoteId, notes, updateNote } = useNoteStore();
  const { playSound } = useTypewriterSound();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  const [isShaking, setIsShaking] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving' | null>(null);
  const [localContent, setLocalContent] = useState('');

  const currentNote = notes.find((note) => note.id === currentNoteId);

  useEffect(() => {
    if (currentNote) {
      setLocalContent(currentNote.content);
    } else {
      setLocalContent('');
    }
  }, [currentNoteId, currentNote]);

  const debouncedContent = useDebounce(localContent, 300);

  useEffect(() => {
    if (!currentNote || debouncedContent === currentNote.content) return;

    setSavedStatus('saving');
    updateNote(currentNote.id, { content: debouncedContent });

    const timer = setTimeout(() => {
      setSavedStatus('saved');
    }, 200);

    const hideTimer = setTimeout(() => {
      setSavedStatus(null);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [debouncedContent, currentNote, updateNote]);

  const handleSave = useCallback(() => {
    if (!currentNote || localContent === currentNote.content) return;

    setSavedStatus('saving');
    updateNote(currentNote.id, { content: localContent });

    setTimeout(() => {
      setSavedStatus('saved');
    }, 200);

    setTimeout(() => {
      setSavedStatus(null);
    }, 2000);
  }, [currentNote, localContent, updateNote]);

  useAutoSave(handleSave, AUTOSAVE_INTERVAL, [handleSave]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const oldValue = localContent;

    if (newValue.length > oldValue.length) {
      const newChar = newValue[newValue.length - 1];
      playSound(newChar);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 100);
    }

    setLocalContent(newValue);
  };

  const handleShare = async () => {
    if (!currentNote) return;
    const link = generateShareLink(currentNote.title, currentNote.content);
    try {
      await navigator.clipboard.writeText(link);
      alert('分享链接已复制到剪贴板');
    } catch {
      prompt('复制以下链接进行分享：', link);
    }
  };

  if (!currentNote) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ backgroundColor: 'var(--color-wood-medium)' }}
      >
        <p style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-typewriter)' }}>
          请选择或创建一篇笔记
        </p>
      </div>
    );
  }

  const charCount = localContent.length;
  const lineCount = localContent ? localContent.split('\n').length : 0;

  return (
    <div
      className="h-full flex flex-col items-center py-6 px-4 overflow-hidden"
      style={{ backgroundColor: 'var(--color-wood-medium)' }}
    >
      <div
        className="w-full flex justify-between items-center mb-4 px-2"
        style={{ maxWidth: EDITOR_WIDTH }}
      >
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-2 px-4 py-2 rounded transition-colors"
          style={{
            backgroundColor: 'var(--color-bronze)',
            color: 'var(--color-paper)',
            fontFamily: 'var(--font-typewriter)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bronze-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bronze)';
          }}
        >
          <History size={18} />
          <span>历史</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-4 py-2 rounded transition-colors"
            style={{
              backgroundColor: 'var(--color-bronze)',
              color: 'var(--color-paper)',
              fontFamily: 'var(--font-typewriter)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bronze-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bronze)';
            }}
          >
            <Download size={18} />
            <span>导出</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded transition-colors"
            style={{
              backgroundColor: 'var(--color-bronze)',
              color: 'var(--color-paper)',
              fontFamily: 'var(--font-typewriter)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bronze-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bronze)';
            }}
          >
            <Share2 size={18} />
            <span>分享</span>
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 w-full flex flex-col rounded shadow-2xl overflow-hidden"
        style={{
          maxWidth: EDITOR_WIDTH,
          backgroundColor: '#F5F0E1',
          fontFamily: 'var(--font-typewriter)',
        }}
      >
        <div
          ref={displayRef}
          className={`absolute inset-0 p-8 whitespace-pre-wrap break-words overflow-auto pointer-events-none ${isShaking ? 'typewriter-shake' : ''}`}
          style={{
            color: 'var(--color-wood-dark)',
            fontSize: '16px',
            lineHeight: '1.8',
          }}
        >
          {localContent}
          <span className="cursor-blink inline-block w-0.5 h-5 bg-black ml-px align-text-bottom" />
        </div>

        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full p-8 resize-none outline-none bg-transparent"
          style={{
            color: 'transparent',
            caretColor: 'transparent',
            fontFamily: 'var(--font-typewriter)',
            fontSize: '16px',
            lineHeight: '1.8',
          }}
          placeholder="开始写作..."
        />

        <div
          className="absolute bottom-4 right-4 flex items-center gap-2 transition-opacity duration-300"
          style={{
            opacity: savedStatus ? 1 : 0,
          }}
        >
          <span
            className="text-sm"
            style={{
              color: savedStatus === 'saved' ? '#2E7D32' : 'var(--color-wood-dark)',
              fontFamily: 'var(--font-typewriter)',
            }}
          >
            {savedStatus === 'saved' ? '已保存' : '保存中...'}
          </span>
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: savedStatus === 'saved' ? '#4CAF50' : 'var(--color-bronze)',
            }}
          />
        </div>

        <div
          className="absolute bottom-4 left-4 flex items-center gap-4 text-sm"
          style={{
            color: 'var(--color-wood-dark)',
            opacity: 0.7,
            fontFamily: 'var(--font-typewriter)',
          }}
        >
          <span>{charCount} 字符</span>
          <span>{lineCount} 行</span>
        </div>
      </div>
    </div>
  );
};

export default Editor;
