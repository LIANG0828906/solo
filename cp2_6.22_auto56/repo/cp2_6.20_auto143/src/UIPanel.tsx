import { useEffect, useState } from "react";
import type { Season } from "./oceanCurrents";
import { useStore } from "./store";
import type { OceanCurrent } from "./oceanCurrents";

const SEASONS: { key: Season; label: string; icon: string }[] = [
  { key: "spring", label: "春季", icon: "🌱" },
  { key: "summer", label: "夏季", icon: "☀️" },
  { key: "autumn", label: "秋季", icon: "🍂" },
  { key: "winter", label: "冬季", icon: "❄️" },
];

const SEASON_LABEL_CN: Record<Season, string> = {
  spring: "春季",
  summer: "夏季",
  autumn: "秋季",
  winter: "冬季",
};

export default function UIPanel() {
  const {
    season,
    particleSpeed,
    visibleCurrents,
    highlightCurrent,
    mainCurrents,
    seasonalCurrents,
    temperatureGrid,
    setSeason,
    setParticleSpeed,
    toggleCurrent,
    setHighlightCurrent,
  } = useStore();

  const [viewportW, setViewportW] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = viewportW < 768;

  const minTemp = Math.min(...temperatureGrid.map((t) => t.temp));
  const maxTemp = Math.max(...temperatureGrid.map((t) => t.temp));

  const allCurrents: OceanCurrent[] = [...mainCurrents, ...seasonalCurrents];

  const panelContent = (
    <>
      <div className="panel-header">
        <div className="header-title">
          <span className="globe-icon">🌍</span>
          <span>全球洋流可视化</span>
        </div>
        <div className="season-display">
          <span className="season-badge" data-season={season}>
            {SEASONS.find((s) => s.key === season)?.icon}{" "}
            {SEASON_LABEL_CN[season]}
          </span>
          <span className="temp-range">
            温度 {minTemp.toFixed(1)}° ~ {maxTemp.toFixed(1)}°C
          </span>
        </div>
      </div>

      <div className="section">
        <div className="section-title">季节切换</div>
        <div className="season-buttons">
          {SEASONS.map((s) => (
            <button
              key={s.key}
              className={`season-btn ${season === s.key ? "active" : ""}`}
              onClick={() => setSeason(s.key)}
            >
              <span className="season-icon">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          粒子速度 <span className="value">{particleSpeed.toFixed(1)} 单位/秒</span>
        </div>
        <input
          type="range"
          className="speed-slider"
          min={1}
          max={5}
          step={0.1}
          value={particleSpeed}
          onChange={(e) => setParticleSpeed(parseFloat(e.target.value))}
        />
        <div className="slider-labels">
          <span>慢</span>
          <span>快</span>
        </div>
      </div>

      <div className="section">
        <div className="section-title">洋流列表（点击隐藏/高亮）</div>
        <div className="current-list">
          {allCurrents.map((c) => {
            const visible = !!visibleCurrents[c.id];
            const highlighted = highlightCurrent === c.id;
            return (
              <div
                key={c.id}
                className={`current-item ${visible ? "" : "hidden"} ${
                  highlighted ? "highlighted" : ""
                } ${c.seasonal ? "seasonal" : ""}`}
                onClick={() => {
                  if (highlighted) setHighlightCurrent(null);
                  else setHighlightCurrent(c.id);
                }}
              >
                <span
                  className="color-dot"
                  style={{
                    background: `linear-gradient(90deg, ${c.colorStart}, ${c.colorEnd})`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCurrent(c.id);
                  }}
                  title="点击显示/隐藏"
                />
                <div className="current-info">
                  <div className="current-name">
                    {c.name}
                    {c.seasonal && <span className="season-tag">季节</span>}
                  </div>
                  <div className="current-en">{c.nameEn}</div>
                </div>
                <div className={`status-badge ${visible ? "on" : "off"}`}>
                  {visible ? "●" : "○"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section legend">
        <div className="section-title">温度图例</div>
        <div className="temp-gradient-bar" />
        <div className="temp-labels">
          <span>-10°C</span>
          <span>0°C</span>
          <span>10°C</span>
          <span>20°C</span>
          <span>30°C</span>
        </div>
        <div className="legend-row">
          <div className="legend-sample warm" />
          <span>暖流 (红-橙渐变)</span>
        </div>
        <div className="legend-row">
          <div className="legend-sample cold" />
          <span>寒流 (蓝-青渐变)</span>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <style>{mobileStyles}</style>
        <style>{sharedStyles}</style>
        <div className={`mobile-drawer ${drawerOpen ? "open" : ""}`}>
          <div
            className="drawer-handle"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <div className="drawer-handle-bar" />
            <span className="drawer-title">
              {drawerOpen ? "▼ 收起面板" : "▲ 展开面板"}
            </span>
          </div>
          {drawerOpen && <div className="drawer-content">{panelContent}</div>}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{sharedStyles}</style>
      <style>{desktopStyles}</style>
      <div className="desktop-panel">{panelContent}</div>
    </>
  );
}

const sharedStyles = `
.section {
  padding: 12px 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.section:first-child {
  border-top: none;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #c8d4ee;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  letter-spacing: 0.3px;
}
.section-title .value {
  color: #9ec5ff;
  font-weight: 400;
  font-size: 12px;
}

.panel-header {
  padding: 16px 14px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Orbitron", "Noto Sans SC", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #eaf1ff;
  letter-spacing: 1px;
}
.globe-icon {
  font-size: 18px;
}
.season-display {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.season-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  font-size: 13px;
  border: 1px solid rgba(255,255,255,0.15);
}
.season-badge[data-season="summer"] { background: rgba(255,140,60,0.2); border-color: rgba(255,150,60,0.35); }
.season-badge[data-season="winter"] { background: rgba(80,160,255,0.18); border-color: rgba(80,160,255,0.35); }
.season-badge[data-season="spring"] { background: rgba(120,255,140,0.15); border-color: rgba(120,255,140,0.3); }
.season-badge[data-season="autumn"] { background: rgba(255,180,80,0.18); border-color: rgba(255,180,80,0.35); }
.temp-range {
  font-size: 12px;
  color: #a8b8d8;
}

.season-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.season-btn {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #cfdbf5;
  border-radius: 8px;
  padding: 8px 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.2s;
  font-family: inherit;
}
.season-btn:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.28);
  transform: translateY(-1px);
}
.season-btn.active {
  background: rgba(100,160,255,0.25);
  border-color: rgba(120,180,255,0.55);
  color: #fff;
  box-shadow: 0 0 10px rgba(100,160,255,0.25);
}
.season-icon {
  font-size: 15px;
}

.speed-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.12);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}
.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5da8ff, #7ad8ff);
  cursor: pointer;
  box-shadow: 0 0 8px rgba(100,180,255,0.5);
  border: 1px solid rgba(255,255,255,0.3);
}
.speed-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5da8ff, #7ad8ff);
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.3);
}
.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8899bb;
  margin-top: 4px;
}

.current-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}
.current-list::-webkit-scrollbar { width: 4px; }
.current-list::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
}
.current-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: all 0.18s;
}
.current-item:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.18);
}
.current-item.highlighted {
  background: rgba(100,160,255,0.15);
  border-color: rgba(120,180,255,0.4);
  box-shadow: inset 0 0 0 1px rgba(120,180,255,0.2);
}
.current-item.hidden {
  opacity: 0.45;
}
.current-item.seasonal .current-name::after {
  content: "";
}
.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(255,255,255,0.15);
  cursor: pointer;
  transition: transform 0.15s;
}
.color-dot:hover {
  transform: scale(1.2);
}
.current-info {
  flex: 1;
  min-width: 0;
}
.current-name {
  font-size: 12.5px;
  color: #e2ebff;
  display: flex;
  align-items: center;
  gap: 6px;
}
.current-en {
  font-size: 10.5px;
  color: #8093b5;
  margin-top: 2px;
}
.season-tag {
  font-size: 9.5px;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(255,180,80,0.22);
  color: #ffd494;
  border: 1px solid rgba(255,180,80,0.3);
}
.status-badge {
  font-size: 10px;
  color: #6f89b8;
}
.status-badge.on { color: #6effa5; }
.status-badge.off { color: #5a6e94; }

.legend {
  padding-bottom: 16px;
}
.temp-gradient-bar {
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(90deg,
    #001f80 0%,
    #0066ff 20%,
    #00c8ff 40%,
    #7cf0a0 50%,
    #ffdd33 65%,
    #ff6a1f 85%,
    #b30000 100%);
  box-shadow: 0 0 8px rgba(100,180,255,0.2);
}
.temp-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: #8899bb;
  margin-top: 4px;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 12px;
  color: #b8c6e4;
}
.legend-sample {
  width: 28px;
  height: 6px;
  border-radius: 3px;
}
.legend-sample.warm {
  background: linear-gradient(90deg, #ff2d2d, #ff9a3c);
  box-shadow: 0 0 6px rgba(255,100,60,0.4);
}
.legend-sample.cold {
  background: linear-gradient(90deg, #0066ff, #00e0ff);
  box-shadow: 0 0 6px rgba(60,160,255,0.4);
}
`;

const desktopStyles = `
.desktop-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 280px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  background: rgba(10, 15, 30, 0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.06);
  color: #eaf1ff;
  z-index: 100;
  font-family: "Noto Sans SC", system-ui, sans-serif;
}
.desktop-panel::-webkit-scrollbar {
  width: 6px;
}
.desktop-panel::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 3px;
}
`;

const mobileStyles = `
.mobile-drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 15, 30, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border: 1px solid rgba(255,255,255,0.1);
  border-bottom: none;
  color: #eaf1ff;
  z-index: 100;
  box-shadow: 0 -6px 24px rgba(0,0,0,0.5);
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 56px;
  overflow: hidden;
  font-family: "Noto Sans SC", system-ui, sans-serif;
}
.mobile-drawer.open {
  max-height: 40vh;
}
.drawer-handle {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}
.drawer-handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.3);
}
.drawer-title {
  font-size: 12px;
  color: #a8b8d8;
}
.drawer-content {
  max-height: calc(40vh - 56px);
  overflow-y: auto;
  padding-bottom: 12px;
}
.drawer-content::-webkit-scrollbar {
  width: 4px;
}
.drawer-content::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 2px;
}
`;
