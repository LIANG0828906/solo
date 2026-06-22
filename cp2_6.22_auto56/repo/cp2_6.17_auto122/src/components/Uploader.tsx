import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Check, Play, Pause, RotateCcw } from 'lucide-react';
import { useAudioStore } from '@/stores/audioStore';
import { audioEngine } from '@/utils/audioEngine';
import { v4 as uuidv4 } from 'uuid';

const AVAILABLE_TAGS = ['雨声', '森林', '城市', '咖啡馆', '海洋', '夜晚'];

interface UploaderProps {
  isOpen: boolean;
  onClose: () => void;
}

const Uploader: React.FC<UploaderProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(10).fill(0.3));

  const recordingBlob = useAudioStore((state) => state.recordingBlob);
  const isRecording = useAudioStore((state) => state.isRecording);
  const startRecording = useAudioStore((state) => state.startRecording);
  const stopRecording = useAudioStore((state) => state.stopRecording);
  const clearRecording = useAudioStore((state) => state.clearRecording);
  const audioList = useAudioStore((state) => state.audioList);
  const setAudioList = useAudioStore((state) => state.setAudioList);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (recordingBlob) {
      const url = URL.createObjectURL(recordingBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [recordingBlob]);

  useEffect(() => {
    if (isRecording && analyserRef.current) {
      const updateWaveform = () => {
        if (analyserRef.current) {
          const data = audioEngine.getRealTimeWaveform(analyserRef.current);
          setWaveform(data);
        }
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  const resetForm = () => {
    setTitle('');
    setSelectedTags([]);
    setError('');
    setRecordingTime(0);
    setPreviewUrl(null);
    setIsPreviewPlaying(false);
    setWaveform(Array(10).fill(0.3));
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
    
    if (isRecording) {
      audioEngine.cancelRecording();
    }
    clearRecording();
  };

  const handleStartRecording = async () => {
    try {
      setError('');
      const { stream, analyser } = await audioEngine.startRecording();
      mediaStreamRef.current = stream;
      analyserRef.current = analyser;
      startRecording();
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('无法访问麦克风，请检查权限设置');
      console.error('Recording error:', err);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      const result = await audioEngine.stopRecording();
      stopRecording(result.blob, result.duration, result.waveformData);
      setWaveform(result.waveformData);
    } catch (err) {
      setError('停止录制失败');
      console.error('Stop recording error:', err);
    }
  };

  const handleCancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
    audioEngine.cancelRecording();
    clearRecording();
    setWaveform(Array(10).fill(0.3));
    setRecordingTime(0);
  };

  const handleReRecord = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPreviewPlaying(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    clearRecording();
    setPreviewUrl(null);
    setWaveform(Array(10).fill(0.3));
    setRecordingTime(0);
  };

  const togglePreview = () => {
    if (!previewUrl) return;

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(previewUrl);
      previewAudioRef.current.addEventListener('ended', () => setIsPreviewPlaying(false));
    }

    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play().catch(() => {});
      setIsPreviewPlaying(true);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const serializeBlob = async (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('请输入音频标题');
      return;
    }
    if (title.length > 30) {
      setError('标题不能超过30个字');
      return;
    }
    if (selectedTags.length === 0) {
      setError('请至少选择一个标签');
      return;
    }
    if (!recordingBlob) {
      setError('请先录制音频');
      return;
    }

    try {
      const blobData = await serializeBlob(recordingBlob);
      const audioUrl = URL.createObjectURL(recordingBlob);

      const newAudio = {
        id: uuidv4(),
        title: title.trim(),
        tags: selectedTags,
        audioUrl,
        blobData,
        duration: recordingTime,
        playCount: 0,
        likeCount: 0,
        isLiked: false,
        createdAt: Date.now(),
        waveformData: waveform,
        comments: [],
      };

      setAudioList([newAudio, ...audioList]);
      onClose();
      resetForm();
    } catch (err) {
      setError('上传失败，请重试');
      console.error('Upload error:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md p-6 z-10"
        style={{
          backgroundColor: '#1E1E2E',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">录制音频</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: '#888' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3A3A5C';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#888';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B' }}
          >
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">音频标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入标题（最多30字）"
            maxLength={30}
            className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 outline-none transition-all"
            style={{
              backgroundColor: '#2A2A3D',
              fontSize: '14px',
              border: '1px solid #3A3A5C',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6C63FF';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#3A3A5C';
            }}
          />
          <p className="text-right text-xs mt-1" style={{ color: '#888' }}>
            {title.length}/30
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            标签（最多3个）
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className="px-3 py-1.5 rounded-full text-sm transition-all"
                style={{
                  backgroundColor: selectedTags.includes(tag) ? '#6C63FF' : '#3A3A5C',
                  color: 'white',
                  fontSize: '12px',
                  transition: 'all 0.2s ease',
                  opacity:
                    selectedTags.length >= 3 && !selectedTags.includes(tag) ? 0.5 : 1,
                  cursor:
                    selectedTags.length >= 3 && !selectedTags.includes(tag)
                      ? 'not-allowed'
                      : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!(selectedTags.length >= 3 && !selectedTags.includes(tag))) {
                    if (!selectedTags.includes(tag)) {
                      e.currentTarget.style.backgroundColor = '#4A4A6C';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedTags.includes(tag)) {
                    e.currentTarget.style.backgroundColor = '#3A3A5C';
                  }
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">音频录制</label>
          <div
            className="p-6 rounded-lg text-center"
            style={{ backgroundColor: '#2A2A3D' }}
          >
            {!isRecording && !recordingBlob && (
              <>
                <div className="flex items-center justify-center gap-2 h-16 mb-4">
                  {waveform.map((height, i) => (
                    <div
                      key={i}
                      className="w-2 rounded-full"
                      style={{
                        height: `${Math.max(8, height * 64)}px`,
                        backgroundColor: '#3A3A5C',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleStartRecording}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all"
                  style={{
                    backgroundColor: '#FF6B6B',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 107, 107, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Mic className="w-6 h-6 text-white" />
                </button>
                <p className="text-sm mt-3" style={{ color: '#888' }}>
                  点击开始录制
                </p>
              </>
            )}

            {isRecording && (
              <>
                <div className="flex items-center justify-center gap-2 h-16 mb-4">
                  {waveform.map((height, i) => (
                    <div
                      key={i}
                      className="w-2 rounded-full transition-all"
                      style={{
                        height: `${Math.max(8, height * 64)}px`,
                        backgroundColor: '#FF6B6B',
                        transition: 'height 0.1s ease',
                      }}
                    />
                  ))}
                </div>
                <div
                  className="text-2xl font-mono mb-4"
                  style={{ color: '#FF6B6B' }}
                >
                  {formatTime(recordingTime)}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleStopRecording}
                    className="px-6 py-2.5 rounded-full text-white font-medium transition-all"
                    style={{
                      backgroundColor: '#6C63FF',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#5A52D5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#6C63FF';
                    }}
                  >
                    <Check className="w-5 h-5 inline mr-2" />
                    完成
                  </button>
                  <button
                    onClick={handleCancelRecording}
                    className="px-6 py-2.5 rounded-full font-medium transition-all"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #3A3A5C',
                      color: '#888',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#FF6B6B';
                      e.currentTarget.style.color = '#FF6B6B';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#3A3A5C';
                      e.currentTarget.style.color = '#888';
                    }}
                  >
                    <X className="w-5 h-5 inline mr-2" />
                    取消
                  </button>
                </div>
              </>
            )}

            {!isRecording && recordingBlob && (
              <>
                <div className="flex items-center justify-center gap-2 h-16 mb-4">
                  {waveform.map((height, i) => (
                    <div
                      key={i}
                      className="w-2 rounded-full transition-all"
                      style={{
                        height: `${Math.max(8, height * 64)}px`,
                        backgroundColor: isPreviewPlaying
                          ? `rgb(${108 + Math.random() * 147}, ${99 - Math.random() * 99}, ${
                              255 - Math.random() * 148
                            })`
                          : '#6C63FF',
                        animation: isPreviewPlaying ? `preview-pulse-${i} 0.5s ease-in-out infinite alternate` : 'none',
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
                <div
                  className="text-xl font-mono mb-4"
                  style={{ color: 'white' }}
                >
                  {formatTime(Math.floor(recordingTime))}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={togglePreview}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: '#6C63FF',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#5A52D5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#6C63FF';
                    }}
                  >
                    {isPreviewPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={handleReRecord}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: '#3A3A5C',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4A4A6C';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3A3A5C';
                    }}
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #3A3A5C',
              color: '#888',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#888';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3A3A5C';
              e.currentTarget.style.color = '#888';
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!recordingBlob || !title.trim() || selectedTags.length === 0}
            className="flex-1 py-3 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#6C63FF',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#5A52D5';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#6C63FF';
              }
            }}
          >
            上传
          </button>
        </div>

        <style>{`
          @keyframes preview-pulse-0 { to { height: ${Math.random() * 40 + 24}px; } }
          @keyframes preview-pulse-1 { to { height: ${Math.random() * 40 + 24}px; } }
          @keyframes preview-pulse-2 { to { height: ${Math.random() * 40 + 24}px; } }
          @keyframes preview-pulse-3 { to { height: ${Math.random() * 40 + 24}px; } }
          @keyframes preview-pulse-4 { to { height: ${Math.random() * 40 + 24}px; } }
          @keyframes preview-pulse-5 { to { height: ${Math.random() * 40 + 24}px; } }
          @keyframes preview-pulse-6 { to { height: ${Math.random() * 40 + 24}px; } }
          @keyframes preview-pulse-7 { to { height: ${Math.random() * 40 + 24}px; } }
          @keyframes preview-pulse-8 { to { height: ${Math.random() * 40 + 24}px; } }
          @keyframes preview-pulse-9 { to { height: ${Math.random() * 40 + 24}px; } }
        `}</style>
      </div>
    </div>
  );
};

export default Uploader;
