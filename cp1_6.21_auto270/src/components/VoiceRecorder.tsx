import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';

interface VoiceRecorderProps {
  onResult: (result: { content: string; duration: number; audioUrl?: string }) => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function VoiceRecorder({ onResult }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const durationRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  const stopRecording = () => {
    setRecording(false);
    setTranscribing(true);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setTimeout(() => setTranscribing(false), 1500);
  };

  const startRecording = async () => {
    chunksRef.current = [];
    finalTranscriptRef.current = '';
    durationRef.current = 0;
    setTranscript('');
    setAudioUrl('');
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        try {
          const { data } = await axios.post('/api/upload/audio', formData);
          setAudioUrl(data.url);
          onResult({
            content: finalTranscriptRef.current || transcript || '语音录制完成',
            duration: durationRef.current,
            audioUrl: data.url,
          });
        } catch {
          onResult({
            content: finalTranscriptRef.current || transcript || '语音录制完成',
            duration: durationRef.current,
            audioUrl: url,
          });
        }
      };

      mediaRecorder.start();

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        try {
          const recognition = new SR();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'zh-CN';
          recognition.onresult = (event) => {
            let interim = '';
            let finalText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const tr = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalText += tr;
              } else {
                interim += tr;
              }
            }
            if (finalText) finalTranscriptRef.current += finalText;
            setTranscript(finalTranscriptRef.current + interim);
          };
          recognition.onerror = () => { /* ignore */ };
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          /* ignore */
        }
      }

      setRecording(true);
      timerRef.current = window.setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
        if (durationRef.current >= 60) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      alert('无法访问麦克风，请检查权限设置');
      console.error(err);
    }
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative mb-6">
        {!recording ? (
          <button
            onClick={startRecording}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <Mic size={36} />
          </button>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] animate-pulse-record" />
            <button
              onClick={stopRecording}
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] text-white flex items-center justify-center shadow-xl"
            >
              <Square size={32} fill="currentColor" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-gray-600 mb-4">
        <Clock size={16} />
        <span className="text-2xl font-mono font-semibold">{formatDuration(duration)}</span>
        <span className="text-sm text-gray-400">/ 01:00</span>
      </div>

      {recording && (
        <div className="flex items-end gap-1 h-10 mb-4">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-[#10B981] to-[#34D399] rounded-full animate-wave-bar"
              style={{ animationDelay: `${i * 0.04}s` }}
            />
          ))}
        </div>
      )}

      {!recording && audioUrl && (
        <div className="w-full space-y-3">
          <audio src={audioUrl} controls className="w-full" />
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              {transcribing ? <Loader2 size={12} className="animate-spin" /> : null}
              {transcribing ? '转写中...' : '转写结果'}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="语音转写结果..."
              rows={3}
              className="w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-md p-2 outline-none focus:border-accent-blue resize-none"
            />
          </div>
        </div>
      )}

      {!recording && !audioUrl && (
        <p className="text-sm text-gray-400 text-center max-w-xs">
          点击麦克风开始录制语音灵感，最长60秒
        </p>
      )}
    </div>
  );
}
