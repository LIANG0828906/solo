import { useState, useRef, useEffect } from 'react';
import { X, Bold, Italic, List, ListOrdered, Send, Tag } from 'lucide-react';
import type { InspirationType } from '@/types';
import { useInspirationStore } from '@/store';
import CanvasDraw from './CanvasDraw';
import VoiceRecorder from './VoiceRecorder';

interface RecordModalProps {
  mode: InspirationType;
  onClose: () => void;
}

export default function RecordModal({ mode, onClose }: RecordModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [voiceResult, setVoiceResult] = useState<{ content: string; duration: number; audioUrl?: string } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { createInspiration, fetchTags, allTags } = useInspirationStore();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const execCommand = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSave = async () => {
    let content = '';
    let thumbnail: string | undefined;
    let duration: number | undefined;
    let audioUrl: string | undefined;
    let drawing: string | undefined;

    if (mode === 'text') {
      content = editorRef.current?.innerHTML || '';
      if (!content || content === '<br>' || content === '<p><br></p>') {
        alert('请输入内容');
        return;
      }
    } else if (mode === 'drawing') {
      if (!drawingData) {
        alert('请绘制内容');
        return;
      }
      content = drawingData;
      drawing = drawingData;
      thumbnail = drawingData;
    } else if (mode === 'voice') {
      if (!voiceResult) {
        alert('请先录音');
        return;
      }
      content = voiceResult.content;
      duration = voiceResult.duration;
      audioUrl = voiceResult.audioUrl;
    }

    await createInspiration({
      type: mode,
      content,
      tags,
      thumbnail,
      duration,
      audioUrl,
      drawingData: drawing,
    });
    fetchTags();
    onClose();
  };

  if (mode === 'drawing') {
    return (
      <CanvasDraw
        onSave={(data) => setDrawingData(data)}
        onClose={onClose}
        tags={tags}
        tagInput={tagInput}
        setTagInput={setTagInput}
        addTag={addTag}
        removeTag={removeTag}
        onConfirm={handleSave}
        allTags={allTags}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[480px] animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {mode === 'text' ? '记录文字灵感' : '录制语音灵感'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {mode === 'text' && (
            <div>
              <div className="flex items-center gap-1 mb-3 bg-gray-50 rounded-lg p-1">
                <ToolbarBtn onClick={() => execCommand('bold')} icon={<Bold size={16} />} />
                <ToolbarBtn onClick={() => execCommand('italic')} icon={<Italic size={16} />} />
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} icon={<List size={16} />} />
                <ToolbarBtn onClick={() => execCommand('insertOrderedList')} icon={<ListOrdered size={16} />} />
              </div>
              <div
                ref={editorRef}
                contentEditable
                className="richtext-editor"
                suppressContentEditableWarning
                data-placeholder="在这里记录你的灵感..."
              />
            </div>
          )}

          {mode === 'voice' && (
            <VoiceRecorder onResult={setVoiceResult} />
          )}

          <div className="mt-5">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-2">
              <Tag size={12} />
              标签
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-accent-blue text-xs rounded-full"
                >
                  #{t}
                  <button onClick={() => removeTag(t)} className="hover:text-blue-700">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder="添加标签，回车确认"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-accent-blue focus:ring-2 focus:ring-blue-100"
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {allTags.filter((t) => !tags.includes(t)).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-accent-blue hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Send size={14} />
            保存灵感
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all"
    >
      {icon}
    </button>
  );
}
