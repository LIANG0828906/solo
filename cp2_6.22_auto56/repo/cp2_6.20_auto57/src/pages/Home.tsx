import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScoreStore } from '@/stores/useScoreStore';
import { audioEngine } from '@/utils/audioEngine';
import { writeMidiFile } from '@/utils/midiWriter';
import { exportAsPDF } from '@/utils/pdfExporter';
import CanvasBoard from '@/components/CanvasBoard';
import StaffEditor from '@/components/StaffEditor';
import { Pencil, Eraser, MousePointer2, Play, Square, Download, Share2, FileMusic, FileText, Trash2 } from 'lucide-react';
import { saveAs } from 'file-saver';

export default function Home() {
  const navigate = useNavigate();
  const notes = useScoreStore(s => s.notes);
  const tempo = useScoreStore(s => s.tempo);
  const isPlaying = useScoreStore(s => s.isPlaying);
  const activeTool = useScoreStore(s => s.activeTool);
  const setActiveTool = useScoreStore(s => s.setActiveTool);
  const setPlaying = useScoreStore(s => s.setPlaying);
  const setCurrentPlayIndex = useScoreStore(s => s.setCurrentPlayIndex);
  const clearAllNotes = useScoreStore(s => s.clearAllNotes);
  const generateShareId = useScoreStore(s => s.generateShareId);

  const [shareToast, setShareToast] = useState<string | null>(null);
  const [exportMenu, setExportMenu] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setExportMenu(false);
    if (exportMenu) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [exportMenu]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.stopAll();
      setPlaying(false);
      setCurrentPlayIndex(-1);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }
    const sorted = [...useScoreStore.getState().notes].sort((a, b) => a.order - b.order);
    if (sorted.length === 0) return;
    setPlaying(true);
    let idx = 0;
    setCurrentPlayIndex(0);
    const playNext = () => {
      if (idx >= sorted.length) {
        setPlaying(false);
        setCurrentPlayIndex(-1);
        return;
      }
      const note = sorted[idx];
      setCurrentPlayIndex(idx);
      audioEngine.playNote(note.pitch, note.octave, note.duration, note.velocity, tempo);
      const beatMs = (60 / tempo) * 1000;
      const noteMs = note.duration * beatMs;
      idx++;
      playTimerRef.current = setTimeout(playNext, noteMs);
    };
    playNext();
  }, [isPlaying, tempo, setPlaying, setCurrentPlayIndex]);

  const handleExportMidi = useCallback(() => {
    const blob = writeMidiFile(notes, tempo);
    saveAs(blob, 'notescore.mid');
    setExportMenu(false);
  }, [notes, tempo]);

  const handleExportPDF = useCallback(() => {
    exportAsPDF(notes, tempo);
    setExportMenu(false);
  }, [notes, tempo]);

  const handleShare = useCallback(() => {
    if (notes.length === 0) return;
    const shareId = generateShareId();
    const url = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast('分享链接已复制到剪贴板');
      setTimeout(() => setShareToast(null), 3000);
    }).catch(() => {
      setShareToast(`分享链接: ${url}`);
      setTimeout(() => setShareToast(null), 5000);
    });
  }, [notes, generateShareId]);

  const handleClearAll = useCallback(() => {
    audioEngine.stopAll();
    setPlaying(false);
    setCurrentPlayIndex(-1);
    clearAllNotes();
  }, [setPlaying, setCurrentPlayIndex, clearAllNotes]);

  const tools = [
    { key: 'pencil' as const, icon: Pencil, label: '铅笔' },
    { key: 'eraser' as const, icon: Eraser, label: '橡皮' },
    { key: 'select' as const, icon: MousePointer2, label: '选择' },
  ];

  return (
    <div className="h-screen flex flex-col bg-bark-900">
      <header className="bg-bark-900 border-b border-bark-700 px-4 py-2 flex items-center gap-2 shrink-0">
        <h1 className="font-display text-xl font-bold text-parchment mr-4 tracking-wide">NoteScribe</h1>

        <div className="flex items-center gap-1 border-r border-bark-700 pr-3 mr-2">
          {tools.map(t => {
            const Icon = t.icon;
            const isActive = activeTool === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTool(t.key)} title={t.label}
                className={`tool-btn w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-parchment text-bark-900' : 'bg-bark-700 text-parchment/70 hover:text-parchment'
                }`}>
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <button onClick={handlePlay} title={isPlaying ? '停止' : '播放'}
          className={`tool-btn w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isPlaying ? 'bg-red-500 text-white' : 'bg-bark-700 text-parchment/70 hover:text-parchment'
          }`}>
          {isPlaying ? <Square size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        <div className="relative" ref={exportMenuRef}>
          <button onClick={(e) => { e.stopPropagation(); setExportMenu(!exportMenu); }} title="导出"
            className="tool-btn w-9 h-9 rounded-full flex items-center justify-center bg-bark-700 text-parchment/70 hover:text-parchment">
            <Download size={16} />
          </button>
          {exportMenu && (
            <div className="absolute top-11 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[140px]" onClick={e => e.stopPropagation()}>
              <button onClick={handleExportMidi}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <FileMusic size={14} /> 导出 MIDI
              </button>
              <button onClick={handleExportPDF}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <FileText size={14} /> 导出 PDF
              </button>
            </div>
          )}
        </div>

        <button onClick={handleShare} title="分享" disabled={notes.length === 0}
          className="tool-btn w-9 h-9 rounded-full flex items-center justify-center bg-bark-700 text-parchment/70 hover:text-parchment disabled:opacity-40">
          <Share2 size={16} />
        </button>

        <button onClick={handleClearAll} title="清空" disabled={notes.length === 0}
          className="tool-btn w-9 h-9 rounded-full flex items-center justify-center bg-bark-700 text-parchment/70 hover:text-parchment disabled:opacity-40">
          <Trash2 size={16} />
        </button>

        <div className="ml-auto flex items-center gap-3 text-parchment/60 text-xs font-body">
          <span>{tempo} BPM</span>
          <span>{notes.length} 音符</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="h-[55vh] lg:h-full lg:w-[60%] border-r border-bark-700">
          <CanvasBoard />
        </div>
        <div className="h-[45vh] lg:h-full lg:w-[40%]">
          <StaffEditor />
        </div>
      </main>

      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-bark-900 text-parchment px-5 py-3 rounded-xl shadow-2xl font-body text-sm z-50 animate-flash-green border border-bark-500">
          {shareToast}
        </div>
      )}
    </div>
  );
}
