import { useState, useRef } from "react";
import { useColorStore, type ColorItem } from "../../store/colorStore";
import {
  copyToClipboard,
  rgbToString,
  hslToString,
  getContrastColor,
} from "../../utils/colorUtils";
import "./ColorCard.css";

interface ColorCardProps {
  color: ColorItem;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
  isDragOver: boolean;
}

export default function ColorCard({
  color,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
}: ColorCardProps) {
  const { expandedCardId, setExpandedCardId, toggleLock, removeColor } =
    useColorStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyAnimRef = useRef<number | null>(null);

  const isExpanded = expandedCardId === color.id;
  const contrastColor = getContrastColor(color.rgb.r, color.rgb.g, color.rgb.b);

  const handleCardClick = () => {
    setExpandedCardId(isExpanded ? null : color.id);
  };

  const handleCopy = async (value: string, key: string) => {
    try {
      await copyToClipboard(value);
      setCopiedKey(key);
      if (copyAnimRef.current) {
        window.clearTimeout(copyAnimRef.current);
      }
      copyAnimRef.current = window.setTimeout(() => {
        setCopiedKey(null);
      }, 1000);
    } catch (e) {
      console.error("复制失败:", e);
    }
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLock(color.id);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeColor(color.id);
  };

  return (
    <div
      className={`color-card ${isExpanded ? "expanded" : ""} ${
        isDragging ? "dragging" : ""
      } ${isDragOver ? "drag-over" : ""}`}
      onClick={handleCardClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(e, index);
      }}
      onDragLeave={() => onDragOver({} as React.DragEvent, -1)}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
    >
      <div
        className="color-swatch"
        style={{
          backgroundColor: color.hex,
          color: contrastColor,
        }}
      >
        <button
          className="lock-btn"
          onClick={handleLockClick}
          title={color.locked ? "解锁" : "锁定"}
          style={{ color: contrastColor }}
        >
          {color.locked ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          )}
        </button>
        <button
          className="remove-btn"
          onClick={handleRemoveClick}
          title="删除"
          style={{ color: contrastColor }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="color-info">
        <div className="color-hex-row">
          <span className="color-hex">{color.hex}</span>
          {copiedKey === "hex" && <span className="copy-check">✓</span>}
        </div>
        <div className="color-percentage">占比 {color.percentage}%</div>
      </div>

      {isExpanded && (
        <div className="expanded-panel">
          <div className="color-format-row">
            <span className="format-label">HEX</span>
            <span
              className={`format-value ${copiedKey === "hex" ? "copied" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(color.hex, "hex");
              }}
            >
              {color.hex}
            </span>
          </div>
          <div className="color-format-row">
            <span className="format-label">RGB</span>
            <span
              className={`format-value ${copiedKey === "rgb" ? "copied" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(rgbToString(color.rgb), "rgb");
              }}
            >
              {rgbToString(color.rgb)}
            </span>
          </div>
          <div className="color-format-row">
            <span className="format-label">HSL</span>
            <span
              className={`format-value ${copiedKey === "hsl" ? "copied" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(hslToString(color.hsl), "hsl");
              }}
            >
              {hslToString(color.hsl)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
