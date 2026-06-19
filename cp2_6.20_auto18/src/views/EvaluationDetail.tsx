import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import apiClient from '../services/apiClient';
import { useAppStore } from '../store/appStore';
import type { VoiceComment } from '../types';

const playbackRates = [1, 1.5, 2];

const EvaluationDetail: React.FC = () => {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentInterview = useAppStore((state) => state.currentInterview);
  const scores = useAppStore((state) => state.scores);
  const voiceComments = useAppStore((state) => state.voiceComments);
  const updateScore = useAppStore((state) => state.updateScore);
  const addVoiceComment = useAppStore((state) => state.addVoiceComment);
  const resetEvaluationState = useAppStore((state) => state.resetEvaluationState);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveAnimationFrame, setWaveAnimationFrame] = useState<number | null>(null);
  const [playWaveformData, setPlayWaveformData] = useState<{ [key: string]: number[] }>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const currentQuestion = currentInterview?.questions[currentQuestionIndex];
  const totalQuestions = currentInterview?.questions.length || 0;
  const currentScore = scores.find((s) => s.questionId === currentQuestion?.id);

  useEffect(() => {
    if (!currentInterview && interviewId) {
      apiClient.getInterview(interviewId).then((data) => {
        useAppStore.getState().setCurrentInterview(data);
      }).catch(() => {
        navigate('/evaluation');
      });
    }
    return () => {
      resetEvaluationState();
    };
  }, [interviewId, currentInterview, navigate, resetEvaluationState]);

  useEffect(() => {
    let timeout: number;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = window.setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple-effect';

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const animateWaveform = (commentId: string, waveform: number[]) => {
    if (playingVoiceId !== commentId) return;

    const animated = waveform.map((v) => {
      const variation = (Math.random() - 0.5) * 0.4;
      return Math.max(0.1, Math.min(1, v + variation));
    });

    setPlayWaveformData((prev) => ({ ...prev, [commentId]: animated }));

    const frame = requestAnimationFrame(() => animateWaveform(commentId, waveform));
    setWaveAnimationFrame(frame);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setIsRecording(true);
      setRecordingTime(0);
      setWaveformData([]);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      const updateWaveform = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = Array.from(dataArray).slice(0, 50).map((v) => v / 255);
          setWaveformData(avg);
          animationRef.current = requestAnimationFrame(updateWaveform);
        }
      };
      updateWaveform();
    } catch (err) {
      console.error('录音失败:', err);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopVoiceRecording = async () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    setTimeout(async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      const waveformPoints = 30;
      const step = Math.floor(waveformData.length / waveformPoints) || 1;
      const finalWaveform: number[] = [];
      for (let i = 0; i < waveformPoints; i++) {
        const idx = Math.min(i * step, waveformData.length - 1);
        finalWaveform.push(waveformData[idx] || 0.3 + Math.random() * 0.5);
      }

      const comment: VoiceComment = {
        id: uuidv4(),
        evaluatorId: 'evaluator-1',
        evaluatorName: '评估员',
        audioUrl: URL.createObjectURL(audioBlob),
        duration: recordingTime,
        createdAt: new Date().toISOString(),
        waveformData: finalWaveform,
      };

      addVoiceComment(comment);

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }, 100);
  };

  const handleScoreChange = (score: number) => {
    if (!currentQuestion) return;
    updateScore(currentQuestion.id, score, currentScore?.comment);
  };

  const handleCommentChange = (comment: string) => {
    if (!currentQuestion) return;
    updateScore(currentQuestion.id, currentScore?.score || 0, comment);
  };

  const playVoiceComment = (comment: VoiceComment) => {
    const audio = audioRefs.current[comment.id];
    if (!audio) return;

    if (playingVoiceId === comment.id) {
      audio.pause();
      setPlayingVoiceId(null);
      if (waveAnimationFrame) {
        cancelAnimationFrame(waveAnimationFrame);
        setWaveAnimationFrame(null);
      }
      setPlayWaveformData((prev) => {
        const next = { ...prev };
        delete next[comment.id];
        return next;
      });
    } else {
      if (playingVoiceId && audioRefs.current[playingVoiceId]) {
        audioRefs.current[playingVoiceId].pause();
      }
      if (waveAnimationFrame) {
        cancelAnimationFrame(waveAnimationFrame);
      }
      audio.currentTime = 0;
      audio.play();
      setPlayingVoiceId(comment.id);
      animateWaveform(comment.id, comment.waveformData);

      audio.onended = () => {
        setPlayingVoiceId(null);
        if (waveAnimationFrame) {
          cancelAnimationFrame(waveAnimationFrame);
          setWaveAnimationFrame(null);
        }
        setPlayWaveformData((prev) => {
          const next = { ...prev };
          delete next[comment.id];
          return next;
        });
      };
    }
  };

  const handleSubmit = async () => {
    if (!interviewId) return;

    const allScored = currentInterview?.questions.every((q) =>
      scores.some((s) => s.questionId === q.id && s.score > 0)
    );

    if (!allScored) {
      alert('请为所有问题打分后再提交');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.submitEvaluation({
        interviewId,
        scores,
        voiceComments,
      });
      alert('评估提交成功！');
      navigate('/evaluation');
    } catch (err) {
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentInterview) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="evaluation-detail">
      <header className="eval-header">
        <button className="btn-back" onClick={() => navigate('/evaluation')}>
          ← 返回
        </button>
        <div className="eval-title">
          <h1>{currentInterview.title}</h1>
          <p>候选人：{currentInterview.candidateName || currentInterview.candidateEmail}</p>
        </div>
      </header>

      <div className="eval-layout">
        <div className="video-section">
          <div
            className="video-wrapper"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <video
              ref={videoRef}
              className="eval-video"
              poster=""
              controls={false}
            >
              <source src="" type="video/webm" />
            </video>

            <div className={`video-overlay ${showControls ? 'visible' : ''}`}>
              <div className="video-controls">
                <button className="play-pause-btn" onClick={(e) => { createRipple(e); togglePlayPause(); }}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <div className="playback-rate-controls">
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      className={`rate-btn ${playbackRate === rate ? 'active' : ''}`}
                      onClick={(e) => { createRipple(e); handlePlaybackRateChange(rate); }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="question-progress">
              <div
                className="progress-fill"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          <div className="question-tabs">
            {currentInterview.questions.map((q, index) => (
              <button
                key={q.id}
                className={`question-tab ${index === currentQuestionIndex ? 'active' : ''} ${
                  scores.some((s) => s.questionId === q.id && s.score > 0) ? 'scored' : ''
                }`}
                onClick={(e) => { createRipple(e); setCurrentQuestionIndex(index); }}
              >
                <span className="tab-number">{index + 1}</span>
                <span className="tab-label">第{index + 1}题</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="score-panel card">
            <div className="panel-header">
              <h3>第 {currentQuestionIndex + 1} 题评分</h3>
              <span className="question-duration">
                作答时间：{formatTime(currentQuestion?.duration || 0)}
              </span>
            </div>

            <div className="question-text-box">
              <p>{currentQuestion?.text}</p>
            </div>

            <div className="score-input">
              <label>评分</label>
              <div className="score-slider-wrapper">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={currentScore?.score || 5}
                  onChange={(e) => handleScoreChange(Number(e.target.value))}
                  className="score-slider"
                />
                <div className="score-value">{currentScore?.score || 0}</div>
              </div>
              <div className="score-labels">
                <span>1分</span>
                <span>10分</span>
              </div>
            </div>

            <div className="comment-input">
              <label>文字评语（选填）</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="请输入对该问题的评价..."
                value={currentScore?.comment || ''}
                onChange={(e) => handleCommentChange(e.target.value)}
              />
            </div>
          </div>

          <div className="voice-panel card">
            <div className="panel-header">
              <h3>语音评论</h3>
              <span className="comment-count">{voiceComments.length} 条</span>
            </div>

            <div className="voice-record-section">
              <button
                className={`record-btn ${isRecording ? 'recording' : ''}`}
                onMouseDown={(e) => { createRipple(e); startVoiceRecording(); }}
                onMouseUp={stopVoiceRecording}
                onMouseLeave={() => isRecording && stopVoiceRecording()}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startVoiceRecording();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopVoiceRecording();
                }}
              >
                {isRecording ? (
                  <>
                    <span className="record-dot" />
                    <span>松手结束录音 {formatTime(recordingTime)}</span>
                  </>
                ) : (
                  <span>长按录制语音评论</span>
                )}
              </button>

              {isRecording && (
                <div className="live-waveform">
                  {waveformData.slice(0, 30).map((value, i) => (
                    <div
                      key={i}
                      className="wave-bar"
                      style={{ height: `${Math.max(value * 100, 10)}%` }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="voice-list">
              {voiceComments.length === 0 ? (
                <div className="empty-voice">
                  <p>暂无语音评论</p>
                  <span>长按上方按钮录制语音评价</span>
                </div>
              ) : (
                voiceComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`voice-item ${playingVoiceId === comment.id ? 'playing' : ''}`}
                    onClick={() => playVoiceComment(comment)}
                  >
                    <button className="play-voice-btn" onClick={(e) => { e.stopPropagation(); createRipple(e); }}>
                      {playingVoiceId === comment.id ? '⏸' : '▶'}
                    </button>
                    <div className="waveform-container">
                      {(playingVoiceId === comment.id && playWaveformData[comment.id]
                        ? playWaveformData[comment.id]
                        : comment.waveformData
                      ).map((height, i) => (
                        <div
                          key={i}
                          className={`wave-bar ${playingVoiceId === comment.id ? 'playing' : ''}`}
                          style={{
                            height: `${Math.max(height * 100, 15)}%`,
                            animationDelay: `${i * 0.03}s`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="voice-info">
                      <span className="voice-duration">{formatTime(comment.duration)}</span>
                      <span className="voice-date">
                        {dayjs(comment.createdAt).format('HH:mm')}
                      </span>
                    </div>
                    <audio
                      ref={(el) => {
                        if (el) audioRefs.current[comment.id] = el;
                      }}
                      src={comment.audioUrl}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            className="btn btn-primary submit-eval-btn"
            onClick={(e) => { createRipple(e); handleSubmit(); }}
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交评估'}
          </button>
        </div>
      </div>

      <style>{`
        .evaluation-detail {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .eval-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px 24px;
          background: var(--color-bg-card);
          border-bottom: 1px solid var(--color-border);
        }
        .btn-back {
          background: none;
          color: var(--color-text-secondary);
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 6px;
        }
        .btn-back:hover {
          background: var(--color-primary-light);
          color: var(--color-text-primary);
        }
        .eval-title h1 {
          font-size: 20px;
          color: var(--color-text-primary);
          margin-bottom: 2px;
        }
        .eval-title p {
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        .eval-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        .video-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .video-wrapper {
          position: relative;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          aspect-ratio: 16 / 9;
        }
        .eval-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
        }
        .video-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .video-overlay.visible {
          opacity: 1;
        }
        .video-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .play-pause-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-accent-blue);
          color: white;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .play-pause-btn:hover {
          transform: scale(1.1);
          background: var(--color-accent-blue-hover);
        }
        .playback-rate-controls {
          display: flex;
          gap: 4px;
          background: rgba(0, 0, 0, 0.6);
          padding: 4px;
          border-radius: 8px;
        }
        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transform: scale(0);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
        }
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        .rate-btn,
        .play-pause-btn,
        .question-tab,
        .record-btn,
        .play-voice-btn,
        .submit-eval-btn {
          position: relative;
          overflow: hidden;
        }
        .rate-btn {
          padding: 6px 12px;
          background: transparent;
          color: var(--color-text-secondary);
          font-size: 13px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .rate-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .rate-btn.active {
          background: var(--color-accent-blue);
          color: white;
        }
        .question-progress {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.2);
        }
        .progress-fill {
          height: 100%;
          background: var(--color-accent-blue);
          transition: width 0.3s ease;
        }
        .question-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .question-tab {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          color: var(--color-text-secondary);
          transition: all 0.2s;
        }
        .question-tab:hover {
          border-color: var(--color-accent-blue);
          color: var(--color-text-primary);
        }
        .question-tab.active {
          background: var(--color-accent-blue);
          border-color: var(--color-accent-blue);
          color: white;
        }
        .question-tab.scored:not(.active) {
          border-color: var(--color-success);
        }
        .tab-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }
        .question-tab.active .tab-number {
          background: rgba(255, 255, 255, 0.2);
        }
        .tab-label {
          font-size: 12px;
        }
        .panel-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          max-height: calc(100vh - 100px);
        }
        .score-panel,
        .voice-panel {
          padding: 20px;
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .panel-header h3 {
          font-size: 16px;
          color: var(--color-text-primary);
        }
        .question-duration {
          font-size: 13px;
          color: var(--color-text-muted);
        }
        .question-text-box {
          padding: 12px;
          background: var(--color-bg-input);
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .question-text-box p {
          color: var(--color-text-secondary);
          font-size: 14px;
          line-height: 1.5;
        }
        .score-input {
          margin-bottom: 20px;
        }
        .score-input label {
          display: block;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .score-slider-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .score-slider {
          flex: 1;
          height: 8px;
          border-radius: 4px;
          background: var(--color-border);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }
        .score-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-accent-blue);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .score-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .score-value {
          width: 40px;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          color: var(--color-accent-blue);
        }
        .score-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 4px;
          padding: 0 56px 0 0;
        }
        .comment-input {
          margin-bottom: 8px;
        }
        .comment-input label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .comment-count {
          font-size: 13px;
          color: var(--color-accent-blue);
          background: rgba(59, 130, 246, 0.1);
          padding: 2px 10px;
          border-radius: 10px;
        }
        .voice-record-section {
          margin-bottom: 20px;
        }
        .record-btn {
          width: 100%;
          padding: 16px;
          background: var(--color-accent-orange);
          color: white;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          user-select: none;
          touch-action: none;
        }
        .record-btn:hover {
          background: var(--color-accent-orange-hover);
          transform: translateY(-1px);
        }
        .record-btn:active,
        .record-btn.recording {
          transform: scale(0.98);
          background: var(--color-error);
        }
        .record-dot {
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          animation: blink 1s ease infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .live-waveform {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          height: 40px;
          margin-top: 12px;
        }
        .live-waveform .wave-bar {
          width: 4px;
          background: linear-gradient(to top, var(--color-accent-blue), var(--color-accent-orange));
          border-radius: 2px;
          transition: height 0.05s ease;
        }
        .voice-list {
          max-height: 300px;
          overflow-y: auto;
        }
        .empty-voice {
          text-align: center;
          padding: 32px 16px;
        }
        .empty-voice p {
          color: var(--color-text-secondary);
          margin-bottom: 4px;
          font-size: 14px;
        }
        .empty-voice span {
          font-size: 12px;
          color: var(--color-text-muted);
        }
        .voice-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--color-bg-input);
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .voice-item:hover {
          background: var(--color-primary-light);
        }
        .voice-item.playing {
          border: 1px solid var(--color-accent-blue);
        }
        .play-voice-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-accent-blue);
          color: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .waveform-container {
          flex: 1;
          height: 32px;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .waveform-container .wave-bar {
          flex: 1;
          background: linear-gradient(to top, var(--color-accent-blue), var(--color-accent-orange));
          border-radius: 2px;
          min-height: 4px;
          transition: height 0.1s ease, opacity 0.1s ease;
        }
        .waveform-container .wave-bar.playing {
          animation: waveFlicker 0.15s ease-in-out infinite alternate;
        }
        @keyframes waveFlicker {
          from {
            opacity: 0.7;
            filter: brightness(1);
          }
          to {
            opacity: 1;
            filter: brightness(1.3);
            box-shadow: 0 0 8px var(--color-accent-blue);
          }
        }
        .voice-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }
        .voice-duration {
          font-size: 13px;
          color: var(--color-text-primary);
          font-weight: 500;
        }
        .voice-date {
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .submit-eval-btn {
          width: 100%;
          padding: 14px;
          font-size: 16px;
        }
        .submit-eval-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 1024px) {
          .eval-layout {
            grid-template-columns: 1fr;
          }
          .panel-section {
            max-height: none;
          }
        }
        @media (max-width: 640px) {
          .eval-header {
            padding: 12px 16px;
          }
          .eval-title h1 {
            font-size: 18px;
          }
          .eval-layout {
            padding: 16px;
            gap: 16px;
          }
          .score-panel,
          .voice-panel {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default EvaluationDetail;
