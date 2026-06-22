import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Smile, CloudRain, Sparkles, Snowflake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Emotion, EMOTION_COLORS, EMOTION_LABELS, uploadAudio } from '../api';
import { useAudioStore } from '../store';

const EMOTIONS: { key: Emotion; icon: typeof Smile; label: string }[] = [
  { key: 'happy', icon: Smile, label: '欢快' },
  { key: 'sad', icon: CloudRain, label: '忧伤' },
  { key: 'psychedelic', icon: Sparkles, label: '迷幻' },
  { key: 'cool', icon: Snowflake, label: '冷峻' },
];

export default function Recorder() {
  const navigate = useNavigate();
  const addAudio = useAudioStore((s) => s.addAudio);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioDataRef = useRef<number[]>([]);
  const durationIntervalRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      stopRecording();
      cancelAnimationFrame(animationRef.current);
      clearInterval(durationIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (analyserRef.current && isRecording) {
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const sliceWidth = (w * 1.0) / bufferLength;
        let x = 0;

        const gradient = ctx.createLinearGradient(0, 0, w, 0);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#6C5CE7');

        ctx.lineWidth = 2;
        ctx.strokeStyle = gradient;
        ctx.beginPath();

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, h / 2 - y / 2);
          } else {
            ctx.lineTo(x, h / 2 - y / 2);
          }
          x += sliceWidth;
        }

        ctx.lineTo(w, h / 2);
        ctx.stroke();

        const sampleData: number[] = [];
        for (let i = 0; i < 32; i++) {
          const idx = Math.floor((i / 32) * bufferLength);
          sampleData.push(dataArray[idx] / 255);
        }
        audioDataRef.current = sampleData;
      } else if (recordedBlob) {
        const gradient = ctx.createLinearGradient(0, 0, w, 0);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#6C5CE7');
        ctx.lineWidth = 2;
        ctx.strokeStyle = gradient;
        ctx.beginPath();

        const data = audioDataRef.current.length > 0 
          ? audioDataRef.current 
          : Array(32).fill(0.5).map(() => Math.random() * 0.5 + 0.3);

        for (let i = 0; i < data.length; i++) {
          const x1 = (i / data.length) * w;
          const x2 = ((i + 1) / data.length) * w;
          const amplitude = data[i] * h * 0.4;
          const midY = h / 2;
          
          ctx.moveTo(x1, midY - amplitude);
          ctx.quadraticCurveTo((x1 + x2) / 2, midY + amplitude * (Math.random() - 0.5), x2, midY + amplitude);
        }
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording, recordedBlob]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setShowEmotionPicker(true);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      durationIntervalRef.current = window.setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('录音失败:', err);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    clearInterval(durationIntervalRef.current);
    setIsRecording(false);
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setRecordedBlob(null);
      setShowEmotionPicker(false);
      setSelectedEmotion(null);
      setTitle('');
      startRecording();
    }
  };

  const handleEmotionSelect = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
  };

  const handleUpload = async () => {
    if (!recordedBlob || !selectedEmotion) return;

    setIsUploading(true);
    try {
      const finalTitle = title.trim() || `我的录音 ${new Date().toLocaleTimeString()}`;
      const finalAudioData = audioDataRef.current.length > 0
        ? audioDataRef.current
        : Array(32).fill(0.5);

      const newAudio = await uploadAudio(
        recordedBlob,
        finalTitle,
        selectedEmotion,
        duration,
        finalAudioData
      );

      newAudio.id = newAudio.id || uuidv4();
      newAudio.audioData = finalAudioData;

      addAudio(newAudio);
      navigate('/');
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setShowEmotionPicker(false);
    setSelectedEmotion(null);
    setTitle('');
    setDuration(0);
    audioDataRef.current = [];
  };

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8">
      <div className="flex flex-col items-center gap-8 mb-12">
        <div className="relative">
          {isRecording && (
            <>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: '#E74C3C40',
                  animation: 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
                }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: '#E74C3C20',
                  animation: 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite 0.5s',
                }}
              />
            </>
          )}
          <button
            onClick={handleRecordClick}
            className="relative ripple-effect transition-transform hover:scale-105 active:scale-95"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: isRecording ? '#C0392B' : '#E74C3C',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRecording
                ? '0 0 30px #E74C3C60'
                : '0 4px 20px rgba(231, 76, 60, 0.4)',
            }}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-white" fill="white" />
            ) : (
              <Mic className="w-9 h-9 text-white" />
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-white text-lg font-medium mb-1">
            {isRecording ? '正在录音...' : recordedBlob ? '录音完成' : '点击开始录音'}
          </p>
          <p className="text-gray-400 text-sm">{formatDuration(duration)}</p>
        </div>
      </div>

      <div
        className="w-full max-w-2xl rounded-2xl p-4 mb-8"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={120}
          className="w-full"
        />
      </div>

      {showEmotionPicker && (
        <div className="w-full max-w-2xl animate-fade-in-up">
          {recordedBlob && !selectedEmotion && (
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">标题（可选）</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给这段音频起个名字..."
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-all focus:ring-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-300 text-sm mb-4 text-center">选择情绪标签</p>
            <div className="flex justify-center gap-4">
              {EMOTIONS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => handleEmotionSelect(key)}
                  className="flex flex-col items-center gap-2 transition-transform hover:scale-110"
                >
                  <div
                    className="flex items-center justify-center rounded-full transition-all"
                    style={{
                      width: '48px',
                      height: '48px',
                      background:
                        selectedEmotion === key
                          ? EMOTION_COLORS[key]
                          : EMOTION_COLORS[key] + '30',
                      border:
                        selectedEmotion === key
                          ? `2px solid ${EMOTION_COLORS[key]}`
                          : '2px solid transparent',
                      boxShadow:
                        selectedEmotion === key
                          ? `0 0 20px ${EMOTION_COLORS[key]}60`
                          : 'none',
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      color:
                        selectedEmotion === key ? EMOTION_COLORS[key] : '#9CA3AF',
                    }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={resetRecording}
              className="px-6 py-2.5 rounded-xl text-gray-300 transition-all hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              重新录制
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedEmotion || isUploading}
              className="px-8 py-2.5 rounded-xl text-white font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: selectedEmotion
                  ? EMOTION_COLORS[selectedEmotion]
                  : 'rgba(255, 255, 255, 0.2)',
                boxShadow: selectedEmotion
                  ? `0 4px 20px ${EMOTION_COLORS[selectedEmotion]}40`
                  : 'none',
              }}
            >
              {isUploading ? '上传中...' : '发布'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
