import React from "react";
import { getAllRunes } from "./RuneData";
import { useAppStore } from "./store";
import type { HistoryRecord } from "./store";

const RUNES = getAllRunes();

export function RuneSelectPanel() {
  const selectedRuneId = useAppStore((s) => s.selectedRuneId);
  const selectRune = useAppStore((s) => s.selectRune);

  return (
    <div className="rune-panel rune-select-panel">
      <h3 className="panel-title">选择符箓</h3>
      <div className="rune-list">
        {RUNES.map((rune) => (
          <button
            key={rune.id}
            className={`rune-card ${selectedRuneId === rune.id ? "selected" : ""}`}
            onClick={() => selectRune(rune.id)}
          >
            <span className="rune-preview">{rune.preview}</span>
            <span className="rune-name">{rune.name}</span>
            <span className="rune-complexity">
              {"★".repeat(rune.complexity)}
              {"☆".repeat(5 - rune.complexity)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HistoryPanel() {
  const history = useAppStore((s) => s.history);

  return (
    <div className="rune-panel history-panel">
      <h3 className="panel-title">绘制记录</h3>
      {history.length === 0 ? (
        <p className="history-empty">暂无记录</p>
      ) : (
        <ul className="history-list">
          {history.map((record: HistoryRecord) => (
            <li key={record.id} className="history-item">
              <span
                className={`history-dot ${record.success ? "success" : "fail"}`}
              />
              <div className="history-info">
                <span className="history-rune-name">{record.runeName}</span>
                <span className="history-date">{record.date}</span>
              </div>
              <span className="history-score">{record.matchScore}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ActionButtons() {
  const resetCanvas = useAppStore((s) => s.resetCanvas);
  const selectedRuneId = useAppStore((s) => s.selectedRuneId);

  return (
    <div className="action-buttons">
      <button
        className="copper-button"
        onClick={resetCanvas}
        disabled={!selectedRuneId}
      >
        清空画布
      </button>
      <button
        className="copper-button"
        onClick={resetCanvas}
        disabled={!selectedRuneId}
      >
        重新绘制
      </button>
    </div>
  );
}

export function MobileDrawer({
  type,
  isOpen,
  onToggle,
  children,
}: {
  type: "top" | "bottom";
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`mobile-drawer ${type} ${isOpen ? "open" : ""}`}>
      <button className="drawer-toggle" onClick={onToggle}>
        <span className="drawer-arrow">{type === "top" ? "▼" : "▲"}</span>
      </button>
      <div className="drawer-content">{children}</div>
    </div>
  );
}
