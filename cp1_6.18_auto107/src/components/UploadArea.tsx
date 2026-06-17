import { useState, useRef, DragEvent, ChangeEvent, ClipboardEvent } from 'react';
import { CloudUpload } from 'lucide-react';
import { useAnalysisStore } from '@/store/analysisStore';

export default function UploadArea() {
  const { setRawCode, startAnalysis } = useAnalysisStore();
  const [isDragging, setIsDragging] = useState(false);
  const [showTextarea, setShowTextarea] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.endsWith('.js')) {
      alert('请上传 .js 格式的文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawCode(content, file.name);
      startAnalysis();
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text');
    if (text) {
      setPasteContent(text);
      setShowTextarea(true);
    }
  };

  const handleClick = () => {
    setShowTextarea(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleConfirmPaste = () => {
    if (pasteContent.trim()) {
      setRawCode(pasteContent, 'pasted-code.js');
      startAnalysis();
    }
    setShowTextarea(false);
    setPasteContent('');
  };

  const handleCancelPaste = () => {
    setShowTextarea(false);
    setPasteContent('');
  };

  const borderColor = isDragging ? '#3B82F6' : '#475569';

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        style={{
          width: '100%',
          height: '200px',
          border: `2px dashed ${borderColor}`,
          borderRadius: '12px',
          transform: isDragging ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        className="flex flex-col items-center justify-center gap-3 bg-slate-900/30"
      >
        <CloudUpload size={48} color={isDragging ? '#3B82F6' : '#94A3B8'} />
        <p className="text-sm text-slate-400">
          拖拽.js文件到此处 或 点击粘贴/选择文件
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".js"
        multiple={false}
        className="hidden"
        onChange={handleFileSelect}
      />

      {showTextarea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-slate-900 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-white">粘贴或输入 JavaScript 代码</h3>
            <textarea
              ref={textareaRef}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className="h-64 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-4 font-mono text-sm text-slate-100 outline-none focus:border-blue-500"
              placeholder="// 在此粘贴或输入你的 JavaScript 代码..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleCancelPaste}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleConfirmPaste}
                className="rounded-lg px-4 py-2 text-sm text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#3B82F6' }}
              >
                开始分析
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="mb-2 text-sm text-slate-400">或选择本地 .js 文件：</p>
              <label
                className="inline-block cursor-pointer rounded-lg border border-dashed border-slate-600 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500 hover:text-blue-400"
              >
                选择文件
                <input
                  type="file"
                  accept=".js"
                  multiple={false}
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    setShowTextarea(false);
                    setPasteContent('');
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
