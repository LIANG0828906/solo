import { useState, useRef, useEffect } from "react";
import { useColorStore, type ColorItem } from "../../store/colorStore";
import {
  copyToClipboard,
  hexToRgb,
  rgbToHsl,
} from "../../utils/colorUtils";
import "./ExportPanel.css";

type ExportFormat = "css" | "json";

export default function ExportPanel() {
  const { getAllColors, addManualColor } = useColorStore();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState("#8B5CF6");
  const [copyAllAnimated, setCopyAllAnimated] = useState(false);
  const [exportAnimated, setExportAnimated] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const copyAnimRef = useRef<number | null>(null);
  const exportAnimRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildCSS = (colors: ColorItem[]): string => {
    const lines = colors.map((c, i) => {
      return `  --color-${c.isManual ? "custom" : "primary"}-${i + 1}: ${c.hex}; /* 占比 ${c.percentage}% */`;
    });
    return `:root {\n${lines.join("\n")}\n}`;
  };

  const buildJSON = (colors: ColorItem[]): string => {
    const data = {
      palette: {
        name: "ColorHunt Palette",
        generatedAt: new Date().toISOString(),
        colors: colors.map((c) => ({
          hex: c.hex,
          rgb: c.rgb,
          hsl: c.hsl,
          percentage: c.percentage,
          locked: c.locked,
        })),
      },
    };
    return JSON.stringify(data, null, 2);
  };

  const triggerFleeting = (
    setter: (v: boolean) => void,
    ref: React.MutableRefObject<number | null>
  ) => {
    setter(true);
    if (ref.current) window.clearTimeout(ref.current);
    ref.current = window.setTimeout(() => setter(false), 1200);
  };

  const handleExport = async (format: ExportFormat) => {
    const colors = getAllColors();
    if (colors.length === 0) return;
    const content = format === "css" ? buildCSS(colors) : buildJSON(colors);
    try {
      await copyToClipboard(content);
      triggerFleeting(setExportAnimated, exportAnimRef);
    } catch (e) {
      console.error("导出失败:", e);
    }
    setShowExportMenu(false);
  };

  const handleCopyAll = async () => {
    const colors = getAllColors();
    if (colors.length === 0) return;
    const hexList = colors.map((c) => c.hex).join(", ");
    try {
      await copyToClipboard(hexList);
      triggerFleeting(setCopyAllAnimated, copyAnimRef);
    } catch (e) {
      console.error("复制失败:", e);
    }
  };

  const handleAddColor = () => {
    const rgb = hexToRgb(pickerColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    addManualColor({
      hex: pickerColor.toUpperCase(),
      rgb,
      hsl,
      percentage: 0,
    });
    setShowColorPicker(false);
  };

  const colors = getAllColors();
  const hasColors = colors.length > 0;

  return (
    <div className="export-panel">
      <div className="panel-row">
        <div className="color-picker-wrap" ref={pickerRef}>
          <button
            className="action-btn add-btn"
            onClick={() => setShowColorPicker(!showColorPicker)}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
            <span>添加颜色</span>
            {showColorPicker && (
              <div
                className="color-picker-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="picker-header">选择颜色</div>
                <input
                  type="color"
                  value={pickerColor}
                  onChange={(e) => setPickerColor(e.target.value)}
                  className="picker-input"
                />
                <input
                  type="text"
                  value={pickerColor.toUpperCase()}
                  onChange={(e) =>
                    setPickerColor(e.target.value.startsWith("#") ? e.target.value : "#" + e.target.value)
                  }
                  className="picker-text"
                  placeholder="#8B5CF6"
                />
                <div className="picker-swatches">
                  {[
                    "#EF4444",
                    "#F97316",
                    "#F59E0B",
                    "#EAB308",
                    "#84CC16",
                    "#22C55E",
                    "#10B981",
                    "#14B8A6",
                    "#06B6D4",
                    "#0EA5E9",
                    "#3B82F6",
                    "#6366F1",
                    "#8B5CF6",
                    "#A855F7",
                    "#D946EF",
                    "#EC4899",
                    "#F43F5E",
                    "#64748B",
                    "#0F172A",
                    "#FFFFFF",
                  ].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="picker-swatch"
                      style={{ background: c }}
                      onClick={() => setPickerColor(c)}
                    />
                  ))}
                </div>
                <button
                  className="picker-confirm"
                  type="button"
                  onClick={handleAddColor}
                >
                  确认添加
                </button>
              </div>
            )}
          </button>
        </div>

        <div className="export-menu-wrap" ref={exportRef}>
          <button
            className="action-btn export-btn"
            disabled={!hasColors}
            onClick={() => setShowExportMenu(!showExportMenu)}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>导出</span>
            <svg
              className={`dropdown-arrow ${showExportMenu ? "up" : ""}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {exportAnimated && (
              <span className="btn-check-fleeting">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
            {showExportMenu && (
              <div
                className="export-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="export-option"
                  onClick={() => handleExport("css")}
                  type="button"
                >
                  <div className="option-icon css-icon" />
                  <div>
                    <div className="option-title">CSS 变量</div>
                    <div className="option-desc">:root 格式，可直接粘贴</div>
                  </div>
                </button>
                <button
                  className="export-option"
                  onClick={() => handleExport("json")}
                  type="button"
                >
                  <div className="option-icon json-icon" />
                  <div>
                    <div className="option-title">JSON</div>
                    <div className="option-desc">结构化数据，包含全部字段</div>
                  </div>
                </button>
              </div>
            )}
          </button>
        </div>

        <button
          className="action-btn copy-btn"
          disabled={!hasColors}
          onClick={handleCopyAll}
          type="button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>一键复制色值</span>
          {copyAllAnimated && (
            <span className="btn-check-fleeting">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
