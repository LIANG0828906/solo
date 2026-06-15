import React, { useState } from 'react';
import { Download, Plus, Trash2, Clock, Edit3, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { SubtitleEntry } from '../types';

interface SubtitleEditorProps {
  subtitles: SubtitleEntry[];
  isGenerating: boolean;
  videoUrl: string | null;
  duration: number;
  onUpdateSubtitle: (id: string, updates: Partial<SubtitleEntry>) => void;
  onAdjustOffset: (id: string, offsetMs: number) => void;
  onDeleteSubtitle: (id: string) => void;
  onAddSubtitle: (entry: Omit<SubtitleEntry, 'id'>) => void;
  onExportSRT: () => string;
  onExportVTT: () => string;
  onGenerateSubtitles: () => void;
  showSubtitles: boolean;
  onToggleSubtitles: () => void;
  showAnnotations: boolean;
  onToggleAnnotations: () => void;
  onResetRecording: () => void;
}

function formatTimeMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

function parseTimeToMs(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const [mins, secsMs] = parts;
    const [secs, ms] = secsMs.split('.');
    return (parseInt(mins) * 60 + parseInt(secs)) * 1000 + parseInt(ms || '0') * 10;
  }
  return 0;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  subtitles,
  isGenerating,
  videoUrl,
  duration,
  onUpdateSubtitle,
  onAdjustOffset,
  onDeleteSubtitle,
  onAddSubtitle,
  onExportSRT,
  onExportVTT,
  onGenerateSubtitles,
  showSubtitles,
  onToggleSubtitles,
  showAnnotations,
  onToggleAnnotations,
  onResetRecording,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime);

  const handleStartEdit = (subtitle: SubtitleEntry) => {
    setEditingId(subtitle.id);
    setEditText(subtitle.text);
    setEditStartTime(formatTimeMs(subtitle.startTime));
    setEditEndTime(formatTimeMs(subtitle.endTime));
  };

  const handleSaveEdit = (id: string) => {
    onUpdateSubtitle(id, {
      text: editText,
      startTime: parseTimeToMs(editStartTime),
      endTime: parseTimeToMs(editEndTime),
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleAddSubtitle = () => {
    const lastSubtitle = sortedSubtitles[sortedSubtitles.length - 1];
    const startTime = lastSubtitle ? lastSubtitle.endTime : 0;
    const endTime = Math.min(startTime + 3000, duration * 1000);
    
    onAddSubtitle({
      startTime,
      endTime,
      text: '',
      offset: 0,
    });
  };

  const handleDownloadSRT = () => {
    const srtContent = onExportSRT();
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadVTT = () => {
    const vttContent = onExportVTT();
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.vtt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'recording.webm';
    a.click();
  };

  return (
    <div
      className="h-full flex flex-col animate-fadeIn"
      style={{ animationDelay: '300ms' }}
    >
      <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-[16px] mb-1">字幕编辑</h2>
          <p className="text-gray-500 text-[11px]">编辑字幕内容和时间轴</p>
        </div>

        <div className="px-5 py-3 border-b border-white/10 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={onGenerateSubtitles}
              disabled={isGenerating || !videoUrl}
              className="btn-gradient flex-1 py-2.5 px-4 rounded-xl text-white text-[13px] font-medium transition-all duration-200 hover:btn-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  生成中...
                </span>
              ) : (
                '自动生成字幕'
              )}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onToggleSubtitles}
              className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium transition-all ${
                showSubtitles
                  ? 'bg-neon-blue/30 text-neon-blue border border-neon-blue/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              字幕 {showSubtitles ? '开' : '关'}
            </button>
            <button
              onClick={onToggleAnnotations}
              className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium transition-all ${
                showAnnotations
                  ? 'bg-electric-purple/30 text-electric-purple border border-electric-purple/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              注释 {showAnnotations ? '开' : '关'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isGenerating && sortedSubtitles.length === 0 && (
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-3 border-2 border-electric-purple/30 border-t-electric-purple rounded-full animate-spin" />
              <p className="text-gray-500 text-[13px]">正在分析音频生成字幕...</p>
              <p className="text-gray-600 text-[11px] mt-1">预计需要 3-5 秒</p>
            </div>
          )}

          {!isGenerating && sortedSubtitles.length === 0 && videoUrl && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-gray-500 text-[13px]">暂无字幕</p>
              <p className="text-gray-600 text-[11px] mt-1">点击上方按钮自动生成或手动添加</p>
            </div>
          )}

          {!videoUrl && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-gray-500 text-[13px]">录制完成后可生成字幕</p>
            </div>
          )}

          {sortedSubtitles.map((subtitle, index) => (
            <div
              key={subtitle.id}
              className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-white/20 transition-colors"
            >
              {editingId === subtitle.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-[13px] focus:outline-none focus:border-electric-purple/50"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-black/30 border border-white/20 rounded-lg text-white text-[11px] font-mono text-center focus:outline-none focus:border-electric-purple/50"
                    />
                    <span className="text-gray-500 self-center">→</span>
                    <input
                      type="text"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-black/30 border border-white/20 rounded-lg text-white text-[11px] font-mono text-center focus:outline-none focus:border-electric-purple/50"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(subtitle.id)}
                      className="p-1.5 text-green-400 hover:text-green-300 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-gradient-to-br from-neon-blue to-electric-purple flex items-center justify-center text-white text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <span className="text-gray-500 text-[11px] font-mono">
                        {formatTimeMs(subtitle.startTime)} → {formatTimeMs(subtitle.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onAdjustOffset(subtitle.id, -100)}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="提前100ms"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onAdjustOffset(subtitle.id, 100)}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="延后100ms"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(subtitle)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSubtitle(subtitle.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-white text-[13px] leading-relaxed pl-8">
                    {subtitle.text}
                  </p>
                  {subtitle.offset !== 0 && (
                    <p className="text-electric-purple text-[10px] pl-8 mt-1">
                      偏移: {subtitle.offset > 0 ? '+' : ''}{subtitle.offset}ms
                    </p>
                  )}
                </>
              )}
            </div>
          ))}

          {sortedSubtitles.length > 0 && (
            <button
              onClick={handleAddSubtitle}
              className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-500 text-[12px] hover:border-white/40 hover:text-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加新字幕
            </button>
          )}
        </div>

        {videoUrl && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <button
              onClick={handleDownloadVideo}
              className="w-full btn-gradient py-3 px-4 rounded-xl text-white text-[13px] font-medium transition-all duration-200 hover:btn-hover flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出 MP4 视频
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadSRT}
                disabled={sortedSubtitles.length === 0}
                className="flex-1 py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl text-white text-[12px] font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                SRT
              </button>
              <button
                onClick={handleDownloadVTT}
                disabled={sortedSubtitles.length === 0}
                className="flex-1 py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl text-white text-[12px] font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                VTT
              </button>
              <button
                onClick={onResetRecording}
                className="py-2.5 px-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[12px] font-medium hover:bg-red-500/20 transition-colors"
                title="重新录制"
              >
                重置
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
