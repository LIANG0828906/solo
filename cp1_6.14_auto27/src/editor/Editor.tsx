import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { saveDraft, getDraft } from '../utils/indexedDB';
import { chapterApi } from '../utils/api';
import { formatTime, stripHtml, countWords, todayStr, recordDailyWords, setProjectWordCount } from '../utils/textStats';

interface EditorProps {
  chapterId: string;
  projectId: string;
  chapterTitle: string;
  initialContent: string;
  onContentChange: (html: string, text: string) => void;
  onTitleChange: (title: string) => void;
}

const Editor: React.FC<EditorProps> = ({
  chapterId,
  projectId,
  chapterTitle,
  initialContent,
  onContentChange,
  onTitleChange,
}) => {
  const quillRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localTitle, setLocalTitle] = useState(chapterTitle);
  const previousWordCount = useRef<number>(0);

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context unavailable'));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageInsert = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !quillInstance.current) return;
    try {
      const dataUrl = await compressImage(file);
      const range = quillInstance.current.getSelection(true);
      quillInstance.current.insertEmbed(range.index, 'image', dataUrl);
      quillInstance.current.setSelection(range.index + 1);
    } catch (err) {
      console.error('Image insert failed:', err);
    }
    e.target.value = '';
  }, [compressImage]);

  const saveContent = useCallback(async () => {
    if (!quillInstance.current || !chapterId) return;
    const html = quillInstance.current.root.innerHTML;
    const text = stripHtml(html);
    const delta = quillInstance.current.getContents();
    try {
      setIsSaving(true);
      await saveDraft({
        chapterId,
        projectId,
        content: JSON.stringify(delta),
        title: localTitle,
        savedAt: Date.now(),
      });
      const wc = countWords(text);
      const wordsDelta = wc - previousWordCount.current;
      if (wordsDelta > 0) {
        recordDailyWords(projectId, wordsDelta, text.slice(0, 200));
      }
      previousWordCount.current = wc;
      setProjectWordCount(projectId, wc);
      try {
        await chapterApi.update(chapterId, { content: html, title: localTitle });
      } catch {
        /* ignore network errors, draft is saved locally */
      }
      setLastSaved(new Date());
      onContentChange(html, text);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [chapterId, projectId, localTitle, onContentChange]);

  useEffect(() => {
    if (!quillRef.current || quillInstance.current) return;

    const toolbarOptions = [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote'],
      ['image'],
      ['clean'],
    ];

    const quill = new Quill(quillRef.current, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            image: handleImageInsert,
          },
        },
      },
      placeholder: '开始写作...',
    });

    quillInstance.current = quill;

    const loadDraft = async () => {
      try {
        const draft = await getDraft(chapterId);
        if (draft && draft.content) {
          const delta = JSON.parse(draft.content);
          quill.setContents(delta);
          if (draft.title) {
            setLocalTitle(draft.title);
            onTitleChange(draft.title);
          }
          const html = quill.root.innerHTML;
          const text = stripHtml(html);
          previousWordCount.current = countWords(text);
          onContentChange(html, text);
        } else if (initialContent) {
          quill.root.innerHTML = initialContent;
          const text = stripHtml(initialContent);
          previousWordCount.current = countWords(text);
          onContentChange(initialContent, text);
        }
      } catch {
        if (initialContent) {
          quill.root.innerHTML = initialContent;
          const text = stripHtml(initialContent);
          previousWordCount.current = countWords(text);
          onContentChange(initialContent, text);
        }
      }
    };

    loadDraft();

    const interval = setInterval(saveContent, 5000);

    return () => {
      clearInterval(interval);
      quillInstance.current = null;
    };
  }, [chapterId, initialContent, handleImageInsert, saveContent, onContentChange, onTitleChange]);

  useEffect(() => {
    setLocalTitle(chapterTitle);
  }, [chapterTitle]);

  const handleTitleBlur = () => {
    if (localTitle !== chapterTitle) {
      onTitleChange(localTitle);
      chapterApi.update(chapterId, { title: localTitle }).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between px-6 py-3 bg-surface border-b border-primary-100">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="font-serif text-2xl font-bold text-primary-600 bg-transparent border-none outline-none w-full max-w-2xl"
          placeholder="章节标题..."
        />
        <div className="flex items-center gap-3 text-sm">
          <span className={`flex items-center gap-1 ${isSaving ? 'text-primary-400' : 'text-success'}`}>
            {isSaving ? (
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-success"></span>
            )}
            {lastSaved ? `已保存 ${formatTime(lastSaved)}` : '未保存'}
          </span>
          <button
            onClick={saveContent}
            className="px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-all text-xs font-medium"
          >
            立即保存
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-surface paper-bg">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div
            ref={quillRef}
            className="editor-container bg-white rounded-lg shadow-sm min-h-[600px] p-8"
          ></div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default Editor;
