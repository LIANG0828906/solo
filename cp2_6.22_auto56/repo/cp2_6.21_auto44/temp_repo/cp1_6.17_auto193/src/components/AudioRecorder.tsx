import { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Save, X, Play, Pause, Volume2 } from 'lucide-react';
import { useMarkerStore } from '@/stores/markerStore';
import { analyzeAudioBuffer, StyleFeatures } from '@/utils/audioAnalysis';

interface AudioRecorderProps {
  mode: 'create' | 'play';
  onClose: () => void;
  markerId?: string;
}

export default function AudioRecorder({ mode, onClose, markerId }: AudioRecorderProps) {
  const {
    markers,
    pendingLatLng,
    userId,
    addMarker,
    updateMarker,
    setPendingLatLng,
    setCreatingMode,
    playingMarkerId,
    setPlayingMarker,
    addRecentStyle,
  } = useMarkerStore();

  const [note, setNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [styleFeatures, setStyleFeatures] = useState<StyleFeatures | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeMarker = markerId ? markers.find((m) => m.id === markerId) : null;

  useEffect(() => {
    if (activeMarker && mode === 'play') {
      setAudioUrl(activeMarker.audioUrl);
      setNote(activeMarker.note);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, [activeMarker, mode]);

  useEffect(() => {
    if (mode === 'play' && playingMarkerId !== markerId && isPlaying) {
      handlePause();
    }
  }, [playingMarkerId, markerId, isPlaying, mode]);

  const processAudioFile = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      const features = await analyzeAudioBuffer(audioBuffer);
      setStyleFeatures(features);
      audioCtx.close();

      const tmpAudio = new Audio(url);
      tmpAudio.addEventListener('loadedmetadata', () => {
        setDuration(tmpAudio.duration);
      });
    } catch (err) {
      console.error('Audio processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        await processAudioFile(blob);
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      alert('无法访问麦克风：' + (err as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过5MB');
      return;
    }
    if (!/\.(mp3|wav|webm|ogg)$/i.test(file.name)) {
      alert('仅支持 mp3/wav 格式');
      return;
    }
    await processAudioFile(file);
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
      );
      const data = await res.json();
      return (
        data.display_name?.split(',').slice(0, 3).join(',') ||
        `位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      );
    } catch {
      return `未知地点 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
  };

  const handleSave = async () => {
    if (!audioUrl || !styleFeatures || !pendingLatLng || !userId) {
      alert('请先录制或上传音频并登录');
      return;
    }
    try {
      const blob = await fetch(audioUrl).then((r) => r.blob());
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const name = await reverseGeocode(pendingLatLng.lat, pendingLatLng.lng);
        await addMarker({
          lat: pendingLatLng.lat,
          lng: pendingLatLng.lng,
          name,
          note,
          audioUrl: base64,
          styleFeatures,
          isPublic: true,
          isFavorited: false,
          creatorId: userId,
        });
        onClose();
        setPendingLatLng(null);
        setCreatingMode(false);
        setAudioUrl(null);
        setNote('');
        setStyleFeatures(null);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      alert('保存失败：' + (err as Error).message);
    }
  };

  const ensureAudioElement = () => {
    if (!audioElementRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = volume / 100;
      audio.loop = false;
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / (audio.duration || 1)) * 100);
      });
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audio.addEventListener('ended', () => {
        const next = playCount + 1;
        if (next < 3) {
          setPlayCount(next);
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          setIsPlaying(false);
          setPlayCount(0);
          setPlayingMarker(null);
        }
      });
      audioElementRef.current = audio;
    }
    return audioElementRef.current;
  };

  const handlePlay = () => {
    if (!audioUrl) return;
    const audio = ensureAudioElement();
    if (!audio) return;
    audio.volume = volume / 100;
    audio.play().then(() => {
      setIsPlaying(true);
      if (activeMarker) {
        setPlayingMarker(activeMarker.id);
        addRecentStyle(activeMarker.styleFeatures);
      }
    }).catch(console.error);
  };

  const handlePause = () => {
    audioElementRef.current?.pause();
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (audioElementRef.current && duration) {
      audioElementRef.current.currentTime = (val / 100) * duration;
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (audioElementRef.current) {
      audioElementRef.current.volume = val / 100;
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (mode === 'create') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[1001] p-4 md:p-6 pointer-events-none">
        <div
          className="mx-auto max-w-2xl pointer-events-auto panel-slide-in-bottom"
          style={{
            background: 'rgba(15, 52, 96, 0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1px solid rgba(233, 69, 96, 0.3)',
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">创建语音标记</h3>
            <button
              onClick={() => {
                onClose();
                setPendingLatLng(null);
                setCreatingMode(false);
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors btn-hover"
            >
              <X size={18} className="text-white/80" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl btn-hover font-medium transition-all ${
                isRecording
                  ? 'animate-recording'
                  : ''
              }`}
              style={{
                background: isRecording
                  ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                  : 'linear-gradient(135deg, #E94560, #FF6B81)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(233,69,96,0.4)',
              }}
            >
              <div
                className={`w-4 h-4 rounded-full ${isRecording ? 'bg-white' : 'bg-white/90'}`}
              />
              {isRecording ? '停止录音' : '开始录音'}
              {!isRecording && <Mic size={16} />}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 rounded-xl btn-hover font-medium"
              style={{
                background: 'rgba(42, 42, 74, 0.9)',
                color: 'white',
                border: '1px solid rgba(233, 69, 96, 0.4)',
              }}
            >
              <Upload size={16} />
              上传音频
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.webm,.ogg,audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="添加文字备注..."
            className="w-full h-10 px-4 rounded-lg text-white placeholder-white/50 outline-none mb-4"
            style={{
              background: 'rgba(42, 42, 74, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">
              {isProcessing && <span className="text-[#FF6B81]">处理中...</span>}
              {audioUrl && !isProcessing && (
                <span className="text-green-400">✓ 音频已就绪 ({formatTime(duration) || '--:--'})</span>
              )}
              {!audioUrl && !isProcessing && <span>请录制或上传音频 (mp3/wav, ≤5MB)</span>}
              {styleFeatures && (
                <span className="ml-2 text-white/50">
                  风格 L{styleFeatures.low}/M{styleFeatures.mid}/H{styleFeatures.high}
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={!audioUrl || !styleFeatures || isProcessing || !userId}
              className="px-6 py-2 rounded-xl btn-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #E94560, #FF6B81)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(233,69,96,0.4)',
              }}
            >
              <span className="flex items-center gap-2">
                <Save size={16} />
                保存标记
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4"
      style={{
        background: 'rgba(26, 26, 46, 0.95)',
        border: '2px solid #E94560',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(233, 69, 96, 0.3)',
      }}
    >
      <div className="mb-2">
        <div className="text-sm font-semibold text-white mb-1 truncate pr-6">
          {activeMarker?.name || '未知地点'}
        </div>
        <div
          className="text-xs text-white/70 cursor-pointer"
          onClick={() => {
            const el = document.querySelector('.popup-note');
            el?.classList.toggle('line-clamp-1');
          }}
        >
          <p className="popup-note line-clamp-1">
            {activeMarker?.note || '暂无备注'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          {isPlaying && <div className="rotating-halo" />}
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="relative w-10 h-10 rounded-full flex items-center justify-center btn-hover z-10"
            style={{
              background: 'linear-gradient(135deg, #E94560, #FF6B81)',
              color: 'white',
              paddingLeft: isPlaying ? 0 : '3px',
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
          </button>
        </div>

        <div className="flex-1">
          <div className="relative h-1 rounded-full overflow-hidden" style={{ background: '#2A2A4A' }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #E94560, #FF6B81)',
              }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleSeek}
            className="absolute w-[calc(100%-52px)] -mt-[6px] opacity-0 cursor-pointer"
            style={{ marginLeft: '52px' }}
          />
          <div className="flex justify-between text-[10px] text-white/50 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Volume2 size={14} className="text-white/60 shrink-0" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={handleVolume}
          className="flex-1"
        />
        <span className="text-[10px] text-white/50 w-8 text-right">{volume}</span>
      </div>

      {activeMarker?.styleFeatures && (
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-around text-[10px] text-white/50">
          <span>低频 L{activeMarker.styleFeatures.low}</span>
          <span>中频 M{activeMarker.styleFeatures.mid}</span>
          <span>高频 H{activeMarker.styleFeatures.high}</span>
        </div>
      )}
    </div>
  );
}
