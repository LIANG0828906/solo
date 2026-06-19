import { useState, useRef, useCallback } from "react";
import { GripVertical, Pipette, Trash2 } from "lucide-react";
import type { GradientLayer as GradientLayerType } from "@/utils/gradientUtils";
import { generateLayerGradientCSS } from "@/utils/gradientUtils";
import ColorPicker from "@/components/ColorPicker";

interface GradientLayerProps {
  layer: GradientLayerType;
  index: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<GradientLayerType>) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  dragOverIndex: number | null;
  dragStartIndex: number | null;
  eyedropperMode: boolean;
  onToggleEyedropper: (target: { layerId: string; field: "startColor" | "endColor" }) => void;
}

export default function GradientLayerCard({
  layer,
  index,
  onRemove,
  onUpdate,
  onDragStart,
  onDragOver,
  onDragEnd,
  dragOverIndex,
  dragStartIndex,
  eyedropperMode,
  onToggleEyedropper,
}: GradientLayerProps) {
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [isDraggingKnob, setIsDraggingKnob] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const isDragTarget = dragOverIndex === index && dragStartIndex !== index;

  const handleAngleChange = useCallback(
    (clientX: number, clientY: number) => {
      if (!knobRef.current) return;
      const rect = knobRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      angle = Math.round(angle) % 360;
      onUpdate(layer.id, { angle });
    },
    [layer.id, onUpdate]
  );

  const handleKnobPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDraggingKnob(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          handleAngleChange(ev.clientX, ev.clientY);
        });
      };

      const onUp = () => {
        cancelAnimationFrame(rafRef.current);
        setIsDraggingKnob(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [handleAngleChange]
  );

  const handleStopChange = useCallback(
    (field: "stop1" | "stop2", value: number) => {
      onUpdate(layer.id, { [field]: value });
    },
    [layer.id, onUpdate]
  );

  const handleStartColorChange = useCallback(
    (color: string) => {
      onUpdate(layer.id, { startColor: color });
    },
    [layer.id, onUpdate]
  );

  const handleEndColorChange = useCallback(
    (color: string) => {
      onUpdate(layer.id, { endColor: color });
    },
    [layer.id, onUpdate]
  );

  const toggleStartPicker = useCallback(() => {
    setStartPickerOpen((prev) => !prev);
    setEndPickerOpen(false);
  }, []);

  const toggleEndPicker = useCallback(() => {
    setEndPickerOpen((prev) => !prev);
    setStartPickerOpen(false);
  }, []);

  const handleEyedropper = useCallback(
    (field: "startColor" | "endColor") => {
      onToggleEyedropper({ layerId: layer.id, field });
    },
    [layer.id, onToggleEyedropper]
  );

  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      style={{
        position: "relative",
        background: "#1e1e1e",
        borderRadius: 8,
        padding: 16,
        borderBottom: "1px solid #333",
        transition: isDragTarget
          ? "border-top 300ms, transform 0.5s"
          : "transform 0.5s",
        borderTop: isDragTarget ? "2px solid #4a9eff" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div
          draggable
          onDragStart={() => onDragStart(index)}
          onDragEnd={onDragEnd}
          style={{
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            padding: 4,
            color: "#666",
          }}
        >
          <GripVertical size={18} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              height: 24,
              borderRadius: 4,
              background: generateLayerGradientCSS(layer),
              transition: "background 200ms",
            }}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 140px", minWidth: 140 }}>
              <div style={{ fontSize: 12, color: "#999" }}>Start Color</div>
              <div style={{ position: "relative" }}>
                <button
                  onClick={toggleStartPicker}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "#ccc",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 2,
                      background: layer.startColor,
                      border: "1px solid #555",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12 }}>{layer.startColor}</span>
                </button>
                <button
                  onClick={() => handleEyedropper("startColor")}
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: eyedropperMode ? "#4a9eff" : "#555",
                    transition: "color 150ms",
                    padding: 2,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#888";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = eyedropperMode ? "#4a9eff" : "#555";
                  }}
                >
                  <Pipette size={14} />
                </button>
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: startPickerOpen ? 200 : 0,
                    opacity: startPickerOpen ? 1 : 0,
                    transition: "max-height 200ms, opacity 200ms",
                    marginTop: 4,
                  }}
                >
                  <ColorPicker color={layer.startColor} onChange={handleStartColorChange} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 140px", minWidth: 140 }}>
              <div style={{ fontSize: 12, color: "#999" }}>End Color</div>
              <div style={{ position: "relative" }}>
                <button
                  onClick={toggleEndPicker}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "#ccc",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 2,
                      background: layer.endColor,
                      border: "1px solid #555",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12 }}>{layer.endColor}</span>
                </button>
                <button
                  onClick={() => handleEyedropper("endColor")}
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: eyedropperMode ? "#4a9eff" : "#555",
                    transition: "color 150ms",
                    padding: 2,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#888";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = eyedropperMode ? "#4a9eff" : "#555";
                  }}
                >
                  <Pipette size={14} />
                </button>
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: endPickerOpen ? 200 : 0,
                    opacity: endPickerOpen ? 1 : 0,
                    transition: "max-height 200ms, opacity 200ms",
                    marginTop: 4,
                  }}
                >
                  <ColorPicker color={layer.endColor} onChange={handleEndColorChange} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 12, color: "#999" }}>Angle</div>
              <div
                ref={knobRef}
                onPointerDown={handleKnobPointerDown}
                style={{
                  width: 60,
                  height: 60,
                  position: "relative",
                  cursor: isDraggingKnob ? "grabbing" : "grab",
                  userSelect: "none",
                  touchAction: "none",
                }}
              >
                <svg
                  width="60"
                  height="60"
                  viewBox="0 0 60 60"
                  style={{ position: "absolute", top: 0, left: 0 }}
                >
                  <circle cx="30" cy="30" r="26" fill="none" stroke="#444" strokeWidth="1.5" />
                  {ticks.map((deg) => {
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const innerR = 22;
                    const outerR = 26;
                    return (
                      <line
                        key={deg}
                        x1={30 + innerR * Math.cos(rad)}
                        y1={30 + innerR * Math.sin(rad)}
                        x2={30 + outerR * Math.cos(rad)}
                        y2={30 + outerR * Math.sin(rad)}
                        stroke="#666"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                  <line
                    x1="30"
                    y1="30"
                    x2={30 + 18 * Math.cos(((layer.angle - 90) * Math.PI) / 180)}
                    y2={30 + 18 * Math.sin(((layer.angle - 90) * Math.PI) / 180)}
                    stroke="#4a9eff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ transition: "200ms" }}
                  />
                  <circle cx="30" cy="30" r="3" fill="#4a9eff" />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: 11,
                    color: "#ccc",
                    fontWeight: 600,
                    pointerEvents: "none",
                  }}
                >
                  {layer.angle}°
                </div>
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", marginBottom: 4 }}>
                  <span>Stop 1</span>
                  <span>{layer.stop1}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={layer.stop1}
                  onChange={(e) => handleStopChange("stop1", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#4a9eff" }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", marginBottom: 4 }}>
                  <span>Stop 2</span>
                  <span>{layer.stop2}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={layer.stop2}
                  onChange={(e) => handleStopChange("stop2", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#4a9eff" }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onRemove(layer.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#555",
            transition: "color 150ms, transform 150ms",
            padding: 4,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#888";
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#555";
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
