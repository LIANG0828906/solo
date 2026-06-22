import { useCallback, useEffect, useRef, useState } from "react";
import {
  GradientLayer,
  generateLayerGradientCSS,
  hexToRgb,
} from "@/utils/gradientUtils";

interface PreviewPanelProps {
  layers: GradientLayer[];
  eyedropperMode: boolean;
  onPickColor: (hex: string) => void;
}

const WIDTH = 400;
const HEIGHT = 300;

function angleToCanvasCoords(
  angleDeg: number,
  w: number,
  h: number
): [number, number, number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const diagLen = Math.sqrt(w * w + h * h) / 2;
  const dx = Math.cos(rad) * diagLen;
  const dy = Math.sin(rad) * diagLen;
  return [cx - dx, cy - dy, cx + dx, cy + dy];
}

function renderCanvasLayers(
  ctx: CanvasRenderingContext2D,
  layers: GradientLayer[],
  w: number,
  h: number
) {
  ctx.clearRect(0, 0, w, h);
  for (const layer of layers) {
    const [x0, y0, x1, y1] = angleToCanvasCoords(layer.angle, w, h);
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    const startRgb = hexToRgb(layer.startColor);
    const endRgb = hexToRgb(layer.endColor);
    if (startRgb && endRgb) {
      grad.addColorStop(
        Math.min(1, Math.max(0, layer.stop1 / 100)),
        `rgba(${startRgb.r},${startRgb.g},${startRgb.b},1)`
      );
      grad.addColorStop(
        Math.min(1, Math.max(0, layer.stop2 / 100)),
        `rgba(${endRgb.r},${endRgb.g},${endRgb.b},1)`
      );
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

export default function PreviewPanel({
  layers,
  eyedropperMode,
  onPickColor,
}: PreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderCanvasLayers(ctx, layers, WIDTH, HEIGHT);
  }, [layers]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        const clampedX = Math.min(WIDTH - 1, Math.max(0, x));
        const clampedY = Math.min(HEIGHT - 1, Math.max(0, y));
        const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          r: pixel[0],
          g: pixel[1],
          b: pixel[2],
        });
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setTooltip(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!eyedropperMode) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const clampedX = Math.min(WIDTH - 1, Math.max(0, x));
      const clampedY = Math.min(HEIGHT - 1, Math.max(0, y));
      const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      onPickColor(hex);
    },
    [eyedropperMode, onPickColor]
  );

  const cssBackground =
    layers.length > 0
      ? layers.map(generateLayerGradientCSS).join(", ")
      : "linear-gradient(0deg, #000000 0%, #ffffff 100%)";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        ref={previewRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          width: WIDTH,
          height: HEIGHT,
          overflow: "hidden",
          borderRadius: 8,
          background: cssBackground,
          cursor: eyedropperMode ? "crosshair" : "default",
        }}
      />
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: WIDTH,
          height: HEIGHT,
          pointerEvents: "none",
          opacity: 0,
        }}
      />
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y - 28,
            pointerEvents: "none",
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            fontSize: 12,
            fontFamily: "monospace",
            padding: "2px 6px",
            borderRadius: 4,
            whiteSpace: "nowrap",
          }}
        >
          rgb({tooltip.r}, {tooltip.g}, {tooltip.b})
        </div>
      )}
    </div>
  );
}
