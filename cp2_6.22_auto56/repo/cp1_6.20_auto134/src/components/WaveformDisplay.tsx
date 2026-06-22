import { useRef, useEffect } from "react";

interface WaveformDisplayProps {
  analyserNode: AnalyserNode | null;
}

export default function WaveformDisplay({ analyserNode }: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = "#16213e";
      ctx.fillRect(0, 0, width, height);

      if (!analyserNode) {
        ctx.strokeStyle = "#4ecdc4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);

      ctx.strokeStyle = "#4ecdc4";
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
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

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [analyserNode]);

  const handleResize = (el: HTMLCanvasElement | null) => {
    if (!el) return;
    const rect = el.parentElement!.getBoundingClientRect();
    el.width = Math.min(rect.width, 800);
    el.height = 150;
  };

  return (
    <div
      style={{
        maxWidth: 800,
        width: "100%",
        height: 150,
        overflow: "hidden",
        borderRadius: 8,
      }}
    >
      <canvas
        ref={(el) => {
          canvasRef.current = el;
          handleResize(el);
        }}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
