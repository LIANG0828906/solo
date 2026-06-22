import { useEffect, useRef } from 'react';

interface WaveformRendererProps {
  audioData?: number[];
  isRecording: boolean;
  mediaStream?: MediaStream | null;
  width?: number;
  height?: number;
}

export default function WaveformRenderer({
  audioData,
  isRecording,
  mediaStream,
  width = 400,
  height = 120,
}: WaveformRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isRecording && mediaStream) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, mediaStream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#00E5FF');
      gradient.addColorStop(1, '#00BFFF');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();

      let data: number[] | Uint8Array;

      if (isRecording && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current as Uint8Array<ArrayBuffer>);
        data = dataArrayRef.current as unknown as number[];
      } else if (audioData && audioData.length > 0) {
        data = audioData;
      } else {
        const sliceWidth = width / 100;
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < 100; i++) {
          ctx.lineTo(i * sliceWidth, height / 2);
        }
        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const sliceWidth = width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording, audioData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        borderRadius: '8px',
        backgroundColor: '#1A1A2E',
      }}
    />
  );
}
