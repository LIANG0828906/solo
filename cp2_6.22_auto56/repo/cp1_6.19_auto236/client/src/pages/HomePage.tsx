import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import axios from 'axios';
import { Upload, Play, Pause, Trash2, Download, Share2, Music, GripVertical, Wand2, Plus, Volume2, Scissors } from 'lucide-react';
import WaveformCanvas from '../components/WaveformCanvas';
import CardGenerator from '../components/CardGenerator';
import { useAppStore, AudioClip } from '../store/useStore';

const formatTime = (t: number): string => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const ms = Math.floor((t % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const HomePage: React.FC = () => {
  const waveformRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mixedWaveform, setMixedWaveform] = useState<number[]>([]);
  const [mixedDuration, setMixedDuration] = useState(0);

  const {
    uploadedFile,
    clips,
    waveformData,
    startTime,
    endTime,
    isPlaying,
    playbackPosition,
    cardTitle,
    cardAuthor,
    cardShareUrl,
    setUploadedFile,
    setSelection,
    addClip,
    removeClip,
    reorderClips,
    setIsPlaying,
    setPlaybackPosition,
    setCardTitle,
    setCardAuthor,
    setCardShareUrl,
  } = useAppStore();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('文件大小不能超过 10MB');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['mp3', 'wav'].includes(ext || '')) {
      showToast('仅支持 MP3 或 WAV 格式');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedFile(res.data);
      showToast('上传成功！');
    } catch (e: any) {
      showToast(e?.response?.data?.error || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSaveClip = () => {
    if (!uploadedFile) return;
    if (clips.length >= 3) {
      showToast('最多只能保存 3 个片段');
      return;
    }
    if (endTime - startTime < 0.1) {
      showToast('请选择有效的片段范围');
      return;
    }
    const clip: AudioClip = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileId: uploadedFile.fileId,
      audioUrl: uploadedFile.audioUrl,
      startTime,
      endTime,
      color: '',
      name: `片段 ${clips.length + 1}`,
    };
    addClip(clip);
    showToast('片段已保存');
  };

  const handlePlayMix = useCallback(async () => {
    if (clips.length === 0) {
      showToast('请先添加至少一个片段');
      return;
    }
    try {
      const res = await axios.post('/api/mix', { clips });
      const data = res.data;
      setMixedWaveform(data.waveformData || []);
      setMixedDuration(data.totalDuration || 0);

      if (clips[0]?.audioUrl && audioRef.current) {
        audioRef.current.src = clips[0].audioUrl;
        audioRef.current.currentTime = clips[0].startTime;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      showToast('混音处理失败');
    }
  }, [clips, setIsPlaying]);

  const handleStopMix = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPlaybackPosition(0);
  };

  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;
    let raf = 0;
    const tick = () => {
      if (audioRef.current) {
        setPlaybackPosition(audioRef.current.currentTime);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, setPlaybackPosition]);

  const handleExportWaveform = () => {
    if (waveformRef.current && (waveformRef.current as any).exportPNG) {
      const dataUrl = (waveformRef.current as any).exportPNG(1024, 300);
      if (dataUrl) {
        const a = document.createElement('a');
        a.download = 'waveform.png';
        a.href = dataUrl;
        a.click();
        showToast('波形图已导出');
      }
    }
  };

  const handleShareCard = async () => {
    if (cardRef.current && (cardRef.current as any).copyToClipboard) {
      const ok = await (cardRef.current as any).copyToClipboard();
      showToast(ok ? '卡片已复制到剪贴板' : '卡片已下载');
    }
  };

  const displayWaveform = isPlaying && mixedWaveform.length > 0 ? mixedWaveform : waveformData;
  const displayDuration = isPlaying && mixedDuration > 0 ? mixedDuration : uploadedFile?.duration || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#1E1E24', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 50,
          background: 'rgba(30, 30, 36, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 100,
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6A5ACD 0%, #FF6347 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Music size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>WaveMix</span>
          <span style={{ fontSize: 11, color: '#A0A0AA', marginLeft: 4 }}>音频混音与社交卡片生成器</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#A0A0AA' }}>
          <Volume2 size={14} />
          <span>实时波形渲染</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 50,
          flex: 1,
          display: 'flex',
          gap: 24,
          padding: 24,
          maxWidth: 1600,
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: '1 1 55%',
            minWidth: 360,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: isDragOver ? '2px dashed #FFD700' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: 32,
              backdropFilter: 'blur(10px)',
              cursor: uploading ? 'progress' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(106,90,205,0.3) 0%, rgba(255,99,71,0.3) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={24} color="#fff" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                  {uploading ? '正在上传...' : uploadedFile ? uploadedFile.originalName : '拖拽或点击上传音频'}
                </div>
                <div style={{ fontSize: 12, color: '#A0A0AA' }}>
                  支持 MP3 / WAV 格式，最大 10MB
                </div>
              </div>
              {uploadedFile && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#A0A0AA', marginTop: 4 }}>
                  <span>时长: {formatTime(uploadedFile.duration)}</span>
                  <span>•</span>
                  <span>采样率: {uploadedFile.sampleRate}Hz</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: 20,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wand2 size={16} color="#FFD700" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>波形预览与裁剪</span>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#A0A0AA' }}>
                <span>起点: {formatTime(startTime)}</span>
                <span>→</span>
                <span>终点: {formatTime(endTime)}</span>
                <span style={{ color: '#FFD700' }}>({formatTime(endTime - startTime)})</span>
              </div>
            </div>

            <div ref={waveformRef as any}>
              <WaveformCanvas
                waveformData={displayWaveform}
                duration={displayDuration}
                startTime={startTime}
                endTime={endTime}
                onSelectionChange={setSelection}
                playbackPosition={playbackPosition}
                isPlaying={isPlaying}
                height={220}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                onClick={handleSaveClip}
                disabled={!uploadedFile}
                style={{
                  background: uploadedFile ? 'linear-gradient(135deg, #6A5ACD, #FF6347)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  opacity: uploadedFile ? 1 : 0.5,
                  cursor: uploadedFile ? 'pointer' : 'not-allowed',
                }}
              >
                <Scissors size={14} />
                保存为片段 ({clips.length}/3)
              </button>
              <button
                onClick={isPlaying ? handleStopMix : handlePlayMix}
                style={{
                  background: isPlaying ? 'rgba(255,99,71,0.9)' : 'linear-gradient(135deg, #50C878, #4A90D9)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? '停止混音' : '播放混音'}
              </button>
              <button
                onClick={handleExportWaveform}
                disabled={!uploadedFile && mixedWaveform.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: uploadedFile || mixedWaveform.length > 0 ? 1 : 0.5,
                  cursor: uploadedFile || mixedWaveform.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                <Download size={14} />
                导出波形PNG
              </button>
            </div>
          </motion.div>
        </div>

        <div
          style={{
            flex: '1 1 35%',
            minWidth: 360,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: 20,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Plus size={16} color="#50C878" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>音轨面板</span>
              <span style={{ fontSize: 12, color: '#A0A0AA', marginLeft: 4 }}>（可上下拖拽排序）</span>
            </div>

            {clips.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: '#A0A0AA',
                  fontSize: 13,
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: 10,
                }}
              >
                暂无音轨片段，请先在左侧波形上选择并保存
              </div>
            ) : (
              <Reorder.Group axis="y" values={clips} onReorder={reorderClips} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AnimatePresence>
                  {clips.map((clip, idx) => (
                    <Reorder.Item
                      key={clip.id}
                      value={clip}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        height: 80,
                        borderRadius: 8,
                        background: `linear-gradient(135deg, ${clip.color}33, ${clip.color}11)`,
                        border: `1px solid ${clip.color}66`,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        cursor: 'grab',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ cursor: 'grab', color: '#A0A0AA', display: 'flex' }}>
                        <GripVertical size={18} />
                      </div>
                      <div
                        style={{
                          width: 4,
                          height: '100%',
                          borderRadius: 2,
                          background: clip.color,
                          boxShadow: `0 0 10px ${clip.color}88`,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          {clip.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#A0A0AA', fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatTime(clip.startTime)} → {formatTime(clip.endTime)}
                          <span style={{ marginLeft: 6, color: clip.color }}>
                            ({formatTime(clip.endTime - clip.startTime)})
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 2, marginTop: 6, height: 18, alignItems: 'center' }}>
                          {Array.from({ length: 24 }).map((_, i) => {
                            const h = 4 + Math.abs(Math.sin((i + idx * 7) * 0.5)) * 14;
                            return (
                              <div
                                key={i}
                                style={{
                                  width: 2,
                                  height: h,
                                  borderRadius: 1,
                                  background: clip.color,
                                  opacity: 0.8,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => removeClip(clip.id)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: 6,
                          borderRadius: 6,
                          color: '#FF6F61',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: 20,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={16} color="#FFD700" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>社交卡片</span>
              </div>
              <button
                onClick={handleShareCard}
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FF8C42)',
                  color: '#1E1E24',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <Share2 size={14} />
                分享卡片
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#A0A0AA', display: 'block', marginBottom: 4 }}>
                    标题（最多20字符）
                  </label>
                  <input
                    type="text"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    placeholder="输入混音标题"
                    maxLength={20}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#A0A0AA', display: 'block', marginBottom: 4 }}>
                    作者名
                  </label>
                  <input
                    type="text"
                    value={cardAuthor}
                    onChange={(e) => setCardAuthor(e.target.value)}
                    placeholder="输入作者"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#A0A0AA', display: 'block', marginBottom: 4 }}>
                  分享链接（生成二维码）
                </label>
                <input
                  type="text"
                  value={cardShareUrl}
                  onChange={(e) => setCardShareUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '20px 0',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <div ref={cardRef as any}>
                <CardGenerator
                  title={cardTitle}
                  author={cardAuthor}
                  shareUrl={cardShareUrl}
                  waveformData={displayWaveform.length > 0 ? displayWaveform : waveformData}
                  width={540}
                  height={360}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: 30,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(30, 30, 36, 0.95)',
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 13,
              zIndex: 200,
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
