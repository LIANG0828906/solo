import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Link2, Plus, X, Eye, Copy, Check } from 'lucide-react';
import { usePodcastStore, type ProgramStatus } from '@/store';
import { decodeAudioFile } from '@/utils/audioUtils';
import ProgressBar from '@/components/ProgressBar';
import CountdownTimer from '@/components/CountdownTimer';
import AudioPlayer from '@/components/AudioPlayer';

const STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: '草稿',
  recording: '录制中',
  editing: '剪辑中',
  published: '已发布',
};

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { programs, guests, updateProgram, addAnnotation, updateAnnotation, deleteAnnotation, linkGuestToProgram, unlinkGuestFromProgram } = usePodcastStore();
  const program = programs.find((p) => p.id === id);

  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [editingProgress, setEditingProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  useEffect(() => {
    if (program?.status === 'editing') {
      const annCount = program.annotations.length;
      const est = Math.min(100, annCount * 10);
      setEditingProgress(est);
    }
  }, [program]);

  const handleAudioUpload = useCallback(async (file: File) => {
    if (!id) return;
    try {
      const url = URL.createObjectURL(file);
      const buffer = await decodeAudioFile(file);
      updateProgram(id, { audioUrl: url, audioDuration: buffer.duration });
    } catch {
      const url = URL.createObjectURL(file);
      updateProgram(id, { audioUrl: url, audioDuration: 0 });
    }
  }, [id, updateProgram]);

  const handleAddAnnotation = useCallback((time: number, text: string, color: string) => {
    if (!id) return;
    addAnnotation(id, { time, text, color });
  }, [id, addAnnotation]);

  const handleUpdateAnnotation = useCallback((annotationId: string, time: number) => {
    if (!id) return;
    updateAnnotation(id, annotationId, { time });
  }, [id, updateAnnotation]);

  const handleDeleteAnnotation = useCallback((annotationId: string) => {
    if (!id) return;
    deleteAnnotation(id, annotationId);
  }, [id, deleteAnnotation]);

  const handleExportAnnotations = () => {
    if (!program) return;
    const data = JSON.stringify(program.annotations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${program.title}_annotations.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPreviewLink = () => {
    const link = `${window.location.origin}/preview/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleCopyJson = () => {
    if (!program) return;
    const data = JSON.stringify(program.annotations, null, 2);
    navigator.clipboard.writeText(data).then(() => {
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    });
  };

  if (!program) {
    return (
      <div className="card-base text-center py-16 animate-fade-in">
        <h3 className="font-display font-semibold text-lg text-slate-600 mb-2">节目不存在</h3>
        <button onClick={() => navigate('/')} className="btn-press px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium mt-4">
          返回看板
        </button>
      </div>
    );
  }

  const availableGuests = guests.filter((g) => !program.guestIds.includes(g.id));
  const linkedGuests = guests.filter((g) => program.guestIds.includes(g.id));
  const exportJson = JSON.stringify(program.annotations, null, 2);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="btn-press p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-xl text-slate-800">{program.title}</h1>
          <p className="text-xs text-slate-400">{STATUS_LABELS[program.status]}</p>
        </div>
        <button
          onClick={handleCopyPreviewLink}
          className="btn-press flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm text-sm text-slate-600 hover:text-accent"
        >
          <Link2 size={14} />
          {copySuccess ? '已复制' : '预览链接'}
        </button>
      </div>

      {program.publishDate && (
        <div className="card-base">
          <h3 className="text-xs font-medium text-slate-400 mb-3">发布倒计时</h3>
          <CountdownTimer targetDate={program.publishDate} />
        </div>
      )}

      <div className="card-base">
        <h3 className="text-xs font-medium text-slate-400 mb-2">制作进度</h3>
        <ProgressBar status={program.status} editingProgress={editingProgress} />
      </div>

      <div className="card-base space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-slate-400">节目信息</h3>
          <div className="flex items-center gap-2">
            <select
              value={program.status}
              onChange={(e) => updateProgram(program.id, { status: e.target.value as ProgramStatus })}
              className="px-2 py-1 rounded-md border border-slate-200 text-xs focus:outline-none focus:border-accent bg-white"
            >
              <option value="draft">草稿</option>
              <option value="recording">录制中</option>
              <option value="editing">剪辑中</option>
              <option value="published">已发布</option>
            </select>
          </div>
        </div>
        {program.description && (
          <p className="text-sm text-slate-600">{program.description}</p>
        )}
        {program.recordDate && (
          <p className="text-xs text-slate-400">录制日期：{program.recordDate}</p>
        )}
        {program.publishDate && (
          <p className="text-xs text-slate-400">发布日期：{program.publishDate}</p>
        )}
        {program.notes && (
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">{program.notes}</div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-slate-400">音频与标注</h3>
          {program.annotations.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExportPreview(true)}
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white shadow-sm text-xs text-slate-500 hover:text-accent"
              >
                <Eye size={12} />
                导出预览
              </button>
              <button
                onClick={handleExportAnnotations}
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white shadow-sm text-xs text-slate-500 hover:text-accent"
              >
                <Download size={12} />
                导出标注
              </button>
            </div>
          )}
        </div>
        <AudioPlayer
          audioUrl={program.audioUrl}
          audioDuration={program.audioDuration}
          annotations={program.annotations}
          onUpload={handleAudioUpload}
          onAddAnnotation={handleAddAnnotation}
          onUpdateAnnotation={handleUpdateAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
        />
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-slate-400">关联嘉宾</h3>
          <button
            onClick={() => setShowGuestPicker(true)}
            className="btn-press flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-500 hover:text-accent"
          >
            <Plus size={12} />
            添加
          </button>
        </div>

        {linkedGuests.length === 0 ? (
          <p className="text-xs text-slate-300 py-2">暂未关联嘉宾</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {linkedGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-sm"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: guest.color }}
                >
                  {guest.name.charAt(0)}
                </div>
                <span
                  className="text-slate-600 cursor-pointer hover:text-accent"
                  onClick={() => navigate(`/guest/${guest.id}`)}
                >
                  {guest.name}
                </span>
                <button
                  onClick={() => unlinkGuestFromProgram(program.id, guest.id)}
                  className="text-slate-300 hover:text-red-400 btn-press"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showGuestPicker && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">选择嘉宾</span>
              <button onClick={() => setShowGuestPicker(false)} className="text-slate-400 hover:text-slate-600 btn-press">
                <X size={14} />
              </button>
            </div>
            {availableGuests.length === 0 ? (
              <p className="text-xs text-slate-300">所有嘉宾已关联或无可用嘉宾</p>
            ) : (
              <div className="space-y-1">
                {availableGuests.map((guest) => (
                  <button
                    key={guest.id}
                    onClick={() => {
                      linkGuestToProgram(program.id, guest.id);
                      if (availableGuests.length <= 1) setShowGuestPicker(false);
                    }}
                    className="btn-press w-full text-left px-3 py-2 rounded-md bg-white text-sm text-slate-600 hover:text-accent flex items-center gap-2"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: guest.color }}
                    >
                      {guest.name.charAt(0)}
                    </div>
                    {guest.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showExportPreview && (
        <div className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card-base max-w-lg w-full space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-slate-800">导出预览</h3>
              <button onClick={() => setShowExportPreview(false)} className="btn-press p-1.5 rounded-md hover:bg-slate-100 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-slate-400">
              共 {program.annotations.length} 条标注，确认数据完整性后再导出
            </div>
            <div className="flex-1 overflow-auto rounded-lg bg-slate-900 p-4 min-h-[200px]">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
                {exportJson}
              </pre>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleCopyJson}
                className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium"
              >
                {jsonCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {jsonCopied ? '已复制' : '复制到剪贴板'}
              </button>
              <button
                onClick={() => {
                  handleExportAnnotations();
                  setShowExportPreview(false);
                }}
                className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium"
              >
                <Download size={14} />
                下载文件
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
