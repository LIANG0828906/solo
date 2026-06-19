import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import apiClient from '../services/apiClient';
import { useAppStore } from '../store/appStore';

type RecordingPhase = 'verify' | 'preparing' | 'recording' | 'uploading' | 'finished';

interface VerifyFormData {
  name: string;
  email: string;
}

const RecordingPortal: React.FC = () => {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentInterview = useAppStore((state) => state.currentInterview);
  const setCurrentInterview = useAppStore((state) => state.setCurrentInterview);

  const [phase, setPhase] = useState<RecordingPhase>('verify');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [prepareCountdown, setPrepareCountdown] = useState(3);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const { control, handleSubmit } = useForm<VerifyFormData>({
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const interview = currentInterview;
  const currentQuestion = interview?.questions[currentQuestionIndex];
  const totalQuestions = interview?.questions.length || 0;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  useEffect(() => {
    if (!currentInterview && interviewId) {
      apiClient.getInterview(interviewId).then((data) => {
        setCurrentInterview(data);
      }).catch(() => {
        setError('面试不存在或已过期');
      });
    }
  }, [interviewId, currentInterview, setCurrentInterview]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      setError('无法访问摄像头和麦克风，请检查权限设置');
      throw err;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current || !currentQuestion) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setTimeLeft(currentQuestion.duration);

    let remaining = currentQuestion.duration;
    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);

      if (remaining <= 0) {
        stopRecordingAndNext();
      }
    }, 1000);
  }, [currentQuestion]);

  const stopRecordingAndNext = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setPhase('uploading');
    setUploadProgress(0);

    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `question_${currentQuestionIndex}.webm`, {
        type: 'video/webm',
      });

      if (interviewId && currentQuestion?.id) {
        await apiClient.uploadFileByChunks(
          interviewId,
          currentQuestion.id,
          file,
          setUploadProgress
        );
      }

      if (isLastQuestion) {
        setPhase('finished');
        stopCamera();
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setPrepareCountdown(3);
        setPhase('preparing');
      }
    } catch (err) {
      setError('视频上传失败，请重试');
      setPhase('recording');
    }
  }, [interviewId, currentQuestion?.id, currentQuestionIndex, isLastQuestion, stopCamera]);

  const startPreparePhase = useCallback(() => {
    setPhase('preparing');
    setPrepareCountdown(3);

    const countdown = setInterval(() => {
      setPrepareCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setPhase('recording');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const onVerifySubmit = async (data: VerifyFormData) => {
    if (!interviewId) return;

    setIsLoading(true);
    setError(null);

    try {
      await startCamera();
      const response = await apiClient.verifyCandidate({
        interviewId,
        name: data.name,
        email: data.email,
      });

      if (response.success) {
        setCurrentInterview(response.interview);
        startPreparePhase();
      }
    } catch (err) {
      setError('验证失败，请检查信息是否正确');
      stopCamera();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRecording = () => {
    startRecording();
    setPhase('recording');
  };

  useEffect(() => {
    if (phase === 'recording' && prepareCountdown === 0 && !timerRef.current) {
      startRecording();
    }
  }, [phase, prepareCountdown, startRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((currentQuestionIndex) / totalQuestions) * 100;

  if (error) {
    return (
      <div className="recording-container">
        <div className="error-box card">
          <h3>出错了</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
        <style>{`
          .recording-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
            padding: 20px;
          }
          .error-box {
            padding: 40px;
            text-align: center;
            max-width: 400px;
          }
          .error-box h3 {
            margin-bottom: 12px;
            color: var(--color-error);
          }
          .error-box p {
            margin-bottom: 20px;
            color: var(--color-text-secondary);
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'verify') {
    return (
      <div className="verify-container animate-fade-in">
        <div className="card verify-card">
          <div className="verify-header">
            <h1>身份验证</h1>
            <p>请输入您的姓名和邮箱以进入面试</p>
          </div>

          <form onSubmit={handleSubmit(onVerifySubmit)} className="verify-form">
            <div className="form-group">
              <label>姓名</label>
              <Controller
                name="name"
                control={control}
                rules={{ required: '请输入您的姓名' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="input-field"
                    placeholder="请输入您的姓名"
                  />
                )}
              />
            </div>

            <div className="form-group">
              <label>邮箱</label>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: '请输入您的邮箱',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '请输入有效的邮箱地址',
                  },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    className="input-field"
                    placeholder="请输入您的邮箱"
                  />
                )}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary submit-btn"
              disabled={isLoading}
            >
              {isLoading ? '验证中...' : '开始面试'}
            </button>
          </form>

          {interview && (
            <div className="interview-info">
              <h4>{interview.title}</h4>
              <p>共 {totalQuestions} 道题目</p>
            </div>
          )}
        </div>

        <style>{`
          .verify-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
          }
          .verify-card {
            width: 100%;
            max-width: 440px;
            padding: 40px;
          }
          .verify-header {
            text-align: center;
            margin-bottom: 32px;
          }
          .verify-header h1 {
            font-size: 28px;
            margin-bottom: 8px;
            color: var(--color-text-primary);
          }
          .verify-header p {
            color: var(--color-text-secondary);
          }
          .verify-form .form-group {
            margin-bottom: 20px;
          }
          .verify-form label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 500;
            color: var(--color-text-secondary);
          }
          .submit-btn {
            width: 100%;
            padding: 14px;
            font-size: 16px;
            margin-top: 8px;
          }
          .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .interview-info {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid var(--color-border);
            text-align: center;
          }
          .interview-info h4 {
            color: var(--color-text-primary);
            margin-bottom: 4px;
          }
          .interview-info p {
            color: var(--color-text-muted);
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="finished-container animate-fade-in">
        <div className="card finished-card">
          <div className="finished-icon">✓</div>
          <h2>面试完成！</h2>
          <p>感谢您的参与，您的视频回答已成功提交。</p>
          <p className="sub-text">面试官将尽快审阅您的回答并给出评估。</p>
        </div>

        <style>{`
          .finished-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #000;
          }
          .finished-card {
            padding: 48px;
            text-align: center;
            max-width: 480px;
          }
          .finished-icon {
            width: 72px;
            height: 72px;
            margin: 0 auto 24px;
            background: var(--color-success);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            color: white;
            animation: scaleIn 0.5s ease;
          }
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          .finished-card h2 {
            font-size: 28px;
            margin-bottom: 12px;
            color: var(--color-text-primary);
          }
          .finished-card p {
            color: var(--color-text-secondary);
            margin-bottom: 8px;
          }
          .sub-text {
            font-size: 14px;
            color: var(--color-text-muted) !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="recording-fullscreen">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
        <span className="progress-text">
          第 {currentQuestionIndex + 1} / {totalQuestions} 题
        </span>
      </div>

      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="recording-video"
        />

        {phase === 'preparing' && (
          <div className="prepare-overlay animate-fade-in">
            <div className="prepare-content">
              <span className="prepare-label">准备作答</span>
              <div className="countdown-number">{prepareCountdown}</div>
              <h3 className="question-text-preview">
                {interview?.questions[currentQuestionIndex + 1]?.text ||
                  currentQuestion?.text}
              </h3>
              <button
                className="btn btn-orange start-btn"
                onClick={handleStartRecording}
              >
                立即开始作答
              </button>
            </div>
          </div>
        )}

        {phase === 'recording' && currentQuestion && (
          <div className="recording-overlay">
            <div className="question-display">
              <span className="question-badge">
                第 {currentQuestionIndex + 1} 题
              </span>
              <h2 className="question-text">{currentQuestion.text}</h2>
            </div>

            <div className="timer-display">
              <div
                className={`timer-ring ${timeLeft <= 10 ? 'warning' : ''}`}
              >
                <span className="timer-text">{formatTime(timeLeft)}</span>
              </div>
              <span className="recording-indicator">
                <span className="recording-dot" />
                录制中
              </span>
            </div>
          </div>
        )}

        {phase === 'uploading' && (
          <div className="upload-overlay animate-fade-in">
            <div className="upload-content">
              <div className="upload-spinner" />
              <h3>正在上传视频...</h3>
              <div className="upload-progress-bar">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="upload-percent">{uploadProgress}%</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .recording-fullscreen {
          width: 100%;
          height: 100vh;
          background: #000;
          position: relative;
          overflow: hidden;
        }
        .progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          z-index: 100;
        }
        .progress-fill {
          height: 100%;
          background: var(--color-accent-blue);
          transition: width 0.3s ease;
        }
        .progress-text {
          position: absolute;
          top: 16px;
          right: 20px;
          color: var(--color-text-secondary);
          font-size: 14px;
        }
        .video-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .recording-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }
        .prepare-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .prepare-content {
          text-align: center;
          color: white;
          padding: 40px;
          max-width: 600px;
        }
        .prepare-label {
          display: inline-block;
          padding: 6px 16px;
          background: var(--color-accent-orange);
          border-radius: 20px;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .countdown-number {
          font-size: 96px;
          font-weight: bold;
          margin-bottom: 24px;
          color: var(--color-accent-orange);
          animation: pulseCountdown 1s ease infinite;
        }
        @keyframes pulseCountdown {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .question-text-preview {
          font-size: 22px;
          font-weight: 500;
          line-height: 1.5;
          margin-bottom: 32px;
        }
        .start-btn {
          padding: 14px 40px;
          font-size: 18px;
        }
        .recording-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .question-display {
          position: absolute;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          padding: 20px 32px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          max-width: 80%;
        }
        .question-badge {
          display: inline-block;
          padding: 4px 12px;
          background: var(--color-accent-blue);
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 12px;
        }
        .question-text {
          font-size: 20px;
          line-height: 1.5;
          font-weight: 500;
        }
        .timer-display {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .timer-ring {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
        }
        .timer-ring.warning {
          border-color: var(--color-error);
          animation: warningPulse 1s ease infinite;
        }
        @keyframes warningPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }
        .timer-text {
          font-size: 24px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
        }
        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--color-error);
        }
        .recording-dot {
          width: 8px;
          height: 8px;
          background: var(--color-error);
          border-radius: 50%;
          animation: blink 1s ease infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-content {
          text-align: center;
        }
        .upload-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(59, 130, 246, 0.3);
          border-top-color: var(--color-accent-blue);
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .upload-content h3 {
          font-size: 20px;
          margin-bottom: 20px;
        }
        .upload-progress-bar {
          width: 240px;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          margin: 0 auto 8px;
          overflow: hidden;
        }
        .upload-progress-fill {
          height: 100%;
          background: var(--color-accent-blue);
          transition: width 0.3s ease;
        }
        .upload-percent {
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        @media (max-width: 768px) {
          .question-display {
            top: 60px;
            padding: 16px 20px;
            max-width: 90%;
          }
          .question-text {
            font-size: 16px;
          }
          .countdown-number {
            font-size: 72px;
          }
          .question-text-preview {
            font-size: 18px;
          }
          .timer-ring {
            width: 80px;
            height: 80px;
          }
          .timer-text {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default RecordingPortal;
