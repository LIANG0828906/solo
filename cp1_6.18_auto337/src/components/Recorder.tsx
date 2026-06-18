import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../lib/store';
import { analyzeEmotion, type AudioFeatures } from '../lib/api';

const MAX_DURATION = 10;
const MIN_DURATION = 1;

export const Recorder: React.FC = () => {
  const { isRecording, setIsRecording, setIsAnalyzing, addRecording, setActiveTab } = useStore();
  const [countdown, setCountdown] = useState(MAX_DURATION);
  const [status, setStatus] = useState<'idle' | 'recording' | 'complete'>('idle');
  const [showRipple, setShowRipple] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioDataRef = useRef<Float32Array[]>([]);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const extractFeatures = useCallback((): AudioFeatures => {
    const allData = audioDataRef.current;
    if (allData.length === 0) {
      return { pitch: 0, energy: 0, zeroCrossingRate: 0, duration: 0 };
    }

    let totalEnergy = 0;
    let totalZeroCrossings = 0;
    let totalSamples = 0;
    let maxPitch = 0;

    const sampleRate = audioContextRef.current?.sampleRate || 44100;

    for (const buffer of allData) {
      for (let i = 0; i < buffer.length; i++) {
        totalEnergy += buffer[i] * buffer[i];
        if (i > 0 && Math.sign(buffer[i]) !== Math.sign(buffer[i - 1])) {
          totalZeroCrossings++;
        }
      }
      totalSamples += buffer.length;

      const rms = Math.sqrt(totalEnergy / totalSamples);
      const zcr = totalZeroCrossings / totalSamples;
      const pitchEstimate = (zcr * sampleRate) / 2;
      if (pitchEstimate > maxPitch && rms > 0.01) {
        maxPitch = pitchEstimate;
      }
    }

    const duration = (Date.now() - startTimeRef.current) / 1000;
    const avgEnergy = Math.sqrt(totalEnergy / totalSamples) * 100;
    const avgZCR = (totalZeroCrossings / totalSamples) * 1000;
    const normalizedPitch = Math.min(maxPitch / 2000, 1) * 100;

    return {
      pitch: normalizedPitch,
      energy: avgEnergy,
      zeroCrossingRate: avgZCR,
      duration: Math.max(MIN_DURATION, Math.min(MAX_DURATION, duration)),
    };
  }, []);

  const finishRecording = useCallback(async () => {
    cleanup();
    setIsRecording(false);
    setStatus('complete');
    setShowRipple(true);

    setTimeout(() => setShowRipple(false), 600);

    const features = extractFeatures();

    if (features.duration < MIN_DURATION) {
      setTimeout(() => {
        setStatus('idle');
        setCountdown(MAX_DURATION);
        audioDataRef.current = [];
      }, 1000);
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await analyzeEmotion(features);
      addRecording(result);
      setActiveTab('result');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }

    setTimeout(() => {
      setStatus('idle');
      setCountdown(MAX_DURATION);
      audioDataRef.current = [];
    }, 2000);
  }, [cleanup, extractFeatures, setIsRecording, setIsAnalyzing, addRecording, setActiveTab]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      startTimeRef.current = Date.now();
      audioDataRef.current = [];
      setIsRecording(true);
      setStatus('recording');
      setCountdown(MAX_DURATION);

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0.1) {
            finishRecording();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);

      const drawWaveform = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const analyser = analyserRef.current;

        if (!canvas || !ctx || !analyser) {
          animationFrameRef.current = requestAnimationFrame(drawWaveform);
          return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(dataArray);

        audioDataRef.current.push(new Float32Array(dataArray));

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#667EEA');
        gradient.addColorStop(1, '#764BA2');

        ctx.lineWidth = 2;
        ctx.strokeStyle = gradient;
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i];
          const y = canvas.height / 2 + v * canvas.height * 0.8;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        animationFrameRef.current = requestAnimationFrame(drawWaveform);
      };

      drawWaveform();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  }, [setIsRecording, finishRecording]);

  const handleButtonClick = useCallback(() => {
    if (status === 'idle') {
      startRecording();
    } else if (status === 'recording') {
      finishRecording();
    }
  }, [status, startRecording, finishRecording]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const getButtonColor = () => {
    if (status === 'recording') return '#FF4444';
    if (status === 'complete') return '#44CC44';
    return '#CCCCCC';
  };

  return (
    <div style={styles.container}>
      <div style={styles.buttonContainer}>
        <div style={{
          ...styles.ripple,
          ...(showRipple ? styles.rippleActive : {}),
          backgroundColor: '#44CC44',
        }} />
        <div style={{
          ...styles.ripple,
          ...(status === 'recording' ? styles.ripplePulse : {}),
          backgroundColor: '#FF4444',
        }} />
        <button
          style={{
            ...styles.recordButton,
            backgroundColor: getButtonColor(),
            transform: status === 'recording' ? 'scale(1.05)' : 'scale(1)',
          }}
          onClick={handleButtonClick}
        >
          <span style={styles.buttonIcon}>
            {status === 'idle' ? '🎤' : status === 'recording' ? '⏹' : '✓'}
          </span>
        </button>
      </div>

      <div style={styles.countdownContainer}>
        <span style={styles.countdownText}>
          {countdown.toFixed(1)}s
        </span>
        <div style={styles.progressBar}>
          <div style={{
            ...styles.progressFill,
            width: `${(countdown / MAX_DURATION) * 100}%`,
            backgroundColor: getButtonColor(),
          }} />
        </div>
      </div>

      <div style={styles.waveformContainer}>
        <canvas
          ref={canvasRef}
          width={400}
          height={80}
          style={styles.waveformCanvas}
        />
      </div>

      <div style={styles.hintContainer}>
        {status === 'idle' && (
          <p style={styles.hintText}>点击按钮开始录音（1-10秒）</p>
        )}
        {status === 'recording' && (
          <p style={styles.hintText}>正在录音...再次点击或10秒后自动结束</p>
        )}
        {status === 'complete' && (
          <p style={styles.hintText}>录音完成，正在分析...</p>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '16px',
    backgroundColor: '#0F172A',
    borderRadius: '16px',
  },
  buttonContainer: {
    position: 'relative',
    width: '120px',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    zIndex: 2,
  },
  buttonIcon: {
    fontSize: '36px',
  },
  ripple: {
    position: 'absolute',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    opacity: 0,
    zIndex: 1,
  },
  rippleActive: {
    animation: 'rippleExpand 0.6s ease-out forwards',
  },
  ripplePulse: {
    animation: 'ripplePulse 1.5s ease-in-out infinite',
  },
  countdownContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  countdownText: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#E2E2E2',
    fontVariantNumeric: 'tabular-nums',
  },
  progressBar: {
    width: '200px',
    height: '6px',
    backgroundColor: '#16213E',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.1s linear, background-color 0.3s ease',
  },
  waveformContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  waveformCanvas: {
    width: '400px',
    height: '80px',
    backgroundColor: '#16213E',
    borderRadius: '8px',
  },
  hintContainer: {
    minHeight: '24px',
  },
  hintText: {
    fontSize: '14px',
    color: '#8892B0',
    textAlign: 'center',
  },
};

const keyframesStyle = `
  @keyframes rippleExpand {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  @keyframes ripplePulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.3); opacity: 0.6; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

if (typeof document !== 'undefined') {
  const styleId = 'recorder-keyframes';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = keyframesStyle;
    document.head.appendChild(styleElement);
  }
}
