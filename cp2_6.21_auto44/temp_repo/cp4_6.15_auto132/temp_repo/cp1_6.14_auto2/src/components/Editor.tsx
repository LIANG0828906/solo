import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save, Wifi, WifiOff, Users } from 'lucide-react';

interface EditorProps {
  content: string;
  readOnly: boolean;
  connected: boolean;
  userCount: number;
  isRestoring: boolean;
  onChange: (content: string) => void;
  onSave: () => void;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'color',
  'background',
  'blockquote',
  'code-block',
  'link',
];

export const Editor: React.FC<EditorProps> = ({
  content,
  readOnly,
  connected,
  userCount,
  isRestoring,
  onChange,
  onSave,
}) => {
  const quillRef = useRef<ReactQuill | null>(null);
  const isLocalChangeRef = useRef(false);
  const [showSaveHint, setShowSaveHint] = useState(false);
  const lastContentRef = useRef(content);

  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    if (!editor) return;

    editor.enable(!readOnly);
  }, [readOnly]);

  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    if (!editor) return;

    if (!isLocalChangeRef.current && content !== lastContentRef.current) {
      const currentSelection = editor.getSelection();
      const delta = editor.clipboard.convert(content);
      editor.setContents(delta, 'silent');
      lastContentRef.current = content;

      if (currentSelection && !readOnly) {
        try {
          editor.setSelection(currentSelection);
        } catch {
        }
      }
    }
    isLocalChangeRef.current = false;
  }, [content, readOnly]);

  const handleChange = useCallback(
    (value: string, _delta: unknown, _source: unknown, editor: unknown) => {
      if (readOnly) return;

      const quillEditor = editor as { getSelection: () => unknown };
      if (!quillEditor || !quillEditor.getSelection) return;

      isLocalChangeRef.current = true;
      lastContentRef.current = value;
      onChange(value);
    },
    [onChange, readOnly],
  );

  const handleSave = useCallback(() => {
    onSave();
    setShowSaveHint(true);
    setTimeout(() => setShowSaveHint(false), 2000);
  }, [onSave]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            {connected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600">已连接</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-rose-500" />
                <span className="text-slate-600">未连接</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span>{userCount} 人在线</span>
          </div>
          {readOnly && (
            <div className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">
              版本预览模式（只读）
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSaveHint && (
            <span className="text-sm text-emerald-600 animate-fade-in">版本已保存</span>
          )}
          <button
            onClick={handleSave}
            disabled={readOnly}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
          >
            <Save className="w-4 h-4" />
            保存版本
          </button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-hidden transition-opacity duration-300 ${
          isRestoring ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div
          className={`h-full editor-wrapper transition-opacity duration-300 ${
            isRestoring ? 'opacity-0' : 'opacity-100 animate-fade-in'
          }`}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            readOnly={readOnly}
            className="h-full flex flex-col"
            preserveWhitespace
          />
        </div>
      </div>
    </div>
  );
};
