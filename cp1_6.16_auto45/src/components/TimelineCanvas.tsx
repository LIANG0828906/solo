import { useRef, useEffect } from "react";

interface TimelineCanvasProps {
  tracks: string[];
}

export default function TimelineCanvas({ tracks }: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || tracks.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const centerX = w / 2;
    const centerY = h * 0.85;
    const radius = Math.min(w, h) * 0.35;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    ctx.clearRect(0, 0, w, h);

    const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    gradient.addColorStop(0, "#6B21A8");
    gradient.addColorStop(1, "#F97316");

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.stroke();

    tracks.forEach((track, i) => {
      const t = tracks.length === 1 ? 0.5 : i / (tracks.length - 1);
      const angle = startAngle + t * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = t < 0.5 ? "#6B21A8" : "#F97316";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      const labelX = centerX + (radius + 24) * Math.cos(angle);
      const labelY = centerY + (radius + 24) * Math.sin(angle);

      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(track, labelX, labelY, 80);
      ctx.restore();
    });
  }, [tracks]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-56 md:h-64"
      style={{ display: "block" }}
    />
  );
}
