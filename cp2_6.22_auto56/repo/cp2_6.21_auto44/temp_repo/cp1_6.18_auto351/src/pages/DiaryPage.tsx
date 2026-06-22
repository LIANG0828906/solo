import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WaveformRenderer from '../components/WaveformRenderer';
import EmotionChart from '../components/EmotionChart';
import ParticleRenderer from '../components/ParticleRenderer';
import AudioAnalyzer from '../components/AudioAnalyzer';
import { useDiaryStore, coordsToEmotion } from '../store/diaryStore';
import { mockDiaryApi } from '../api/diaryApi';
import type { EmotionCoords } from '../types';

type RecordingState = 'idle' | 'recording' | 'finished';

const MAX_RECORDING_SECONDS = 10;

export default function DiaryPage() {
  const navigate = useNavigate();
  const addDiary = useDiaryStore((s) => s.addDiary);
  const currentUser = useDiaryStore((s) => s.currentUser);

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [countdown, setCountdown] = useState(MAX_RECORDING_SECONDS);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [emotionCoords, setEmotionCoords] = useState<EmotionCoords | null>(null);
  const [emotionKeyword, setEmotionKeyword] = useState('');
  const [emotionType, setEmotionType] = useState<'happy' | 'calm' | 'sad' | 'anxious' | 'angry'>('calm');
  const [textContent, setTextContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const { analyzeAudio } = AudioAnalyzer({});

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [mediaStream]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);

      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setRecordingState('finished');

        setIsAnalyzing(true);
        try {
          const { coords } = await analyzeAudio(blob);
          setEmotionCoords(coords);
          const { type, keyword } = coordsToEmotion(coords);
          setEmotionType(type);
          setEmotionKeyword(keyword);
        } catch (err) {
          console.error('分析失败:', err);
          const fallbackCoords: EmotionCoords = {
            arousal: 30 + Math.random() * 40,
            valence: 40 + Math.random() * 30,
          };
          setEmotionCoords(fallbackCoords);
          const { type, keyword } = coordsToEmotion(fallbackCoords);
          setEmotionType(type);
          setEmotionKeyword(keyword);
        } finally {
          setIsAnalyzing(false);
        }

        stream.getTracks().forEach((t) => t.stop());
        setMediaStream(null);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingState('recording');
      setCountdown(MAX_RECORDING_SECONDS);

      countdownTimerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('无法访问麦克风:', err);
      alert('请允许访问麦克风权限');
    }
  };

  const stopRecording = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRecordClick = () => {
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  const resetRecording = () => {
    setRecordingState('idle');
    setAudioBlob(null);
    setEmotionCoords(null);
    setEmotionKeyword('');
    setCountdown(MAX_RECORDING_SECONDS);
  };

  const handleSubmit = async () => {
    if (!emotionCoords || !currentUser) return;

    const newDiary = await mockDiaryApi.createDiary({
      audioUrl: audioBlob ? 'audio-url' : undefined,
      emotionCoords,
      emotionType,
      emotionKeyword,
      textContent,
      isPublic,
      userId: currentUser.id,
    });

    addDiary(newDiary);
    navigate(`/diary/${newDiary.id}`);
  };

  const buttonColor =
    recordingState === 'idle'
      ? '#BBBBBB'
      : recordingState === 'recording'
      ? '#FF4D4D'
      : '#4CAF50';

  return (
    <div className="page-container">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
        <h2 style={{ fontSize: '24px' }}>记录今日心情</h2>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleRecordClick}
            disabled={recordingState === 'finished'}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: buttonColor,
              border: 'none',
              cursor: recordingState === 'finished' ? 'default' : 'pointer',
              animation: recordingState === 'recording' ? 'pulse 0.8s infinite' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: '#ffffff',
              transition: 'background-color 0.3s',
            }}
          >
            {recordingState === 'recording' ? '⏹' : recordingState === 'finished' ? '✓' : '🎙'}
          </button>

          {recordingState === 'recording' && (
            <div style={{ fontSize: '18px', color: '#FF4D4D', fontWeight: 600 }}>
              {countdown}s
            </div>
          )}

          {recordingState !== 'idle' && (
            <WaveformRenderer
              isRecording={recordingState === 'recording'}
              mediaStream={mediaStream}
              width={400}
              height={120}
            />
          )}

          {recordingState === 'finished' && (
            <button
              onClick={resetRecording}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'transparent',
                color: '#e0e0e0',
                fontSize: '13px',
              }}
            >
              重新录制
            </button>
          )}
        </div>

        {isAnalyzing && (
          <div style={{ color: '#00E5FF', fontSize: '14px' }}>正在分析声纹情感特征...</div>
        )}

        {emotionCoords && !isAnalyzing && (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px' }}>情绪分析</h3>
              <EmotionChart emotionCoords={emotionCoords} emotionKeyword={emotionKeyword} width={300} height={300} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px' }}>粒子预览</h3>
              <ParticleRenderer
                emotionCoords={emotionCoords}
                emotionType={emotionType}
                particleCount={120}
                width={300}
                height={300}
              />
            </div>
          </div>
        )}

        {emotionCoords && !isAnalyzing && (
          <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value.slice(0, 200))}
              placeholder="写下此刻的心情..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #2a2a3e',
                backgroundColor: '#1E1E2E',
                color: '#e0e0e0',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#888' }}>{textContent.length}/200</span>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>公开</span>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: isPublic ? '#00E5FF' : '#333',
                    padding: '2px',
                    transition: 'background-color 0.3s',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      marginLeft: isPublic ? '20px' : '0',
                      transition: 'margin-left 0.3s',
                    }}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              style={{
                padding: '14px 32px',
                borderRadius: '28px',
                background: 'linear-gradient(90deg, #00E5FF, #00BFFF)',
                color: '#0D0D1A',
                fontSize: '16px',
                fontWeight: 600,
                alignSelf: 'center',
              }}
            >
              保存日记
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          button[style*="width: 100px"] {
            width: 80px !important;
            height: 80px !important;
          }
        }
      `}</style>
    </div>
  );
}
