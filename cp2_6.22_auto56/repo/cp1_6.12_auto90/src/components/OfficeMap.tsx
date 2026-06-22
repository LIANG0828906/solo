import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import {
  DESK_ORIENTATION_OPTIONS,
  PLANT_OPTIONS,
  SNACK_OPTIONS,
  LIGHT_OPTIONS,
  REST_OPTIONS,
  type PreferenceRecord,
  type User,
} from '@/types';

const GRID_COLS = 10;
const GRID_ROWS = 8;

const AVATAR_COLORS = [
  '#5B7B8A', '#C98B7B', '#7B8F5B', '#8A5B7B',
  '#5B8A7B', '#8A7B5B', '#6B7BA0', '#A06B6B',
  '#5B8A9F', '#B88B5B',
];

function hashColor(userId: string): string {
  let sum = 0;
  for (let i = 0; i < userId.length; i++) sum += userId.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getInitial(name: string): string {
  return name ? name.charAt(name.length - 2) || name.charAt(0) : '?';
}

function getNoiseTip(level: number, name: string): string {
  if (level <= 2) return `🤫 ${name}喜欢安静，请轻拿轻放`;
  if (level <= 4) return `🔇 ${name}偏好适中音量，正常交流即可`;
  if (level <= 6) return `🔊 ${name}接受一定噪音，正常办公没问题`;
  return `🎉 ${name}不怕吵闹，高谈阔论也OK`;
}

function getLabel<T extends { value: string; label: string }>(
  arr: T[],
  value: string,
): string {
  return arr.find((o) => o.value === value)?.label || value;
}

interface BubbleState {
  record: PreferenceRecord;
  user: User;
  x: number;
  y: number;
}

interface DetailState {
  record: PreferenceRecord;
  user: User;
}

export default function OfficeMap() {
  const users = useAppStore((s) => s.users);
  const preferences = useAppStore((s) => s.preferences);
  const currentUser = useAppStore((s) => s.currentUser);

  const [bubble, setBubble] = useState<BubbleState | null>(null);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [thanksToast, setThanksToast] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 });
  const mapWrapRef = useRef<HTMLDivElement>(null);

  const seatMap = useMemo(() => {
    const map = new Map<string, { record: PreferenceRecord; user: User }>();
    preferences.forEach((record) => {
      const user = users.find((u) => u.id === record.userId);
      if (user) {
        map.set(`${record.seatX}-${record.seatY}`, { record, user });
      }
    });
    return map;
  }, [preferences, users]);

  const cells = useMemo(() => {
    const arr: { x: number; y: number; data?: { record: PreferenceRecord; user: User } }[] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const key = `${x}-${y}`;
        arr.push({ x, y, data: seatMap.get(key) });
      }
    }
    return arr;
  }, [seatMap]);

  const handleSeatClick = (cellData: { record: PreferenceRecord; user: User }, cellIndex: number) => {
    setDetail({ record: cellData.record, user: cellData.user });

    const x = cellIndex % GRID_COLS;
    const y = Math.floor(cellIndex / GRID_COLS);

    const cellSize = 40;
    const gap = 4;
    const totalWidth = GRID_COLS * cellSize + (GRID_COLS - 1) * gap;
    const totalHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * gap;

    const cellCenterX = x * (cellSize + gap) + cellSize / 2;
    const cellCenterY = y * (cellSize + gap) + cellSize / 2;

    const scale = 1.6;
    const centerX = totalWidth / 2;
    const centerY = totalHeight / 2;
    const tx = (centerX - cellCenterX) * scale;
    const ty = (centerY - cellCenterY) * scale;

    setTransform({ scale, tx, ty });
  };

  const closeDetail = () => {
    setDetail(null);
    setTransform({ scale: 1, tx: 0, ty: 0 });
  };

  const handleSendThanks = () => {
    setThanksToast(true);
    setTimeout(() => setThanksToast(false), 2000);
  };

  useEffect(() => {
    if (thanksToast) return;
  }, [thanksToast]);

  const renderBubbleSummary = (rec: PreferenceRecord, user: User) => {
    const p = rec.preferences;
    return (
      <>
        <div className="bubble-name">{user.name}</div>
        <div className="bubble-item">朝向：<strong>{getLabel(DESK_ORIENTATION_OPTIONS, p.deskOrientation)}</strong></div>
        <div className="bubble-item">温度：<strong>{p.temperature}℃</strong></div>
        <div className="bubble-item">亮度：<strong>{p.screenBrightness}%</strong></div>
        <div className="bubble-item">植物：<strong>{getLabel(PLANT_OPTIONS, p.plantPreference)}</strong></div>
        <div className="bubble-item">零食：<strong>{getLabel(SNACK_OPTIONS, p.snackFlavor)}</strong></div>
        <div className="bubble-item">灯光：<strong>{getLabel(LIGHT_OPTIONS, p.lightType)}</strong></div>
        <div className="bubble-item">休息：<strong>{getLabel(REST_OPTIONS, p.restPreference)}</strong></div>
        <div className="bubble-item">噪音：<strong>{p.noiseTolerance}/7</strong></div>
        <div className="bubble-tip">{getNoiseTip(p.noiseTolerance, user.name)}</div>
      </>
    );
  };

  return (
    <div className="office-wrapper">
      <div className="map-scroll">
        <div
          className="map-svg-wrap"
          ref={mapWrapRef}
          style={{
            transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
          }}
        >
          <div className="office-grid">
            {cells.map((cell, idx) => (
              <div
                key={`${cell.x}-${cell.y}`}
                className={`seat-cell ${cell.data ? 'seat-occupied' : ''}`}
                onMouseEnter={() => {
                  if (cell.data) {
                    setBubble({
                      record: cell.data.record,
                      user: cell.data.user,
                      x: cell.x,
                      y: cell.y,
                    });
                  }
                }}
                onMouseLeave={() => setBubble(null)}
                onClick={() => cell.data && handleSeatClick(cell.data, idx)}
              >
                {cell.data && (
                  <div
                    className={`avatar ${currentUser?.id === cell.data.user.id ? 'self' : ''}`}
                    style={{ background: hashColor(cell.data.user.id) }}
                  >
                    {getInitial(cell.data.user.name)}
                  </div>
                )}
                {bubble && cell.data && bubble.record.id === cell.data.record.id && (
                  <div
                    className="bubble-pop"
                    style={{
                      left: '50%',
                      top: '-8px',
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    {renderBubbleSummary(bubble.record, bubble.user)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {detail && (
        <div className="detail-backdrop" onClick={closeDetail}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <div
                className="detail-avatar"
                style={{ background: hashColor(detail.user.id) }}
              >
                {getInitial(detail.user.name)}
              </div>
              <div>
                <div className="detail-name">{detail.user.name}</div>
                <div className="detail-seat">
                  工位：第 {detail.record.seatY + 1} 排 第 {detail.record.seatX + 1} 列
                  {currentUser?.id === detail.user.id && '（我的座位）'}
                </div>
              </div>
            </div>
            <div className="detail-body">
              <div className="detail-pref-row">
                <span className="detail-pref-label">🧭 工位朝向</span>
                <span className="detail-pref-value">{getLabel(DESK_ORIENTATION_OPTIONS, detail.record.preferences.deskOrientation)}</span>
              </div>
              <div className="detail-pref-row">
                <span className="detail-pref-label">🌡️ 空调温度</span>
                <span className="detail-pref-value">{detail.record.preferences.temperature} ℃</span>
              </div>
              <div className="detail-pref-row">
                <span className="detail-pref-label">💻 屏幕亮度</span>
                <span className="detail-pref-value">{detail.record.preferences.screenBrightness} %</span>
              </div>
              <div className="detail-pref-row">
                <span className="detail-pref-label">🪴 植物偏好</span>
                <span className="detail-pref-value">{getLabel(PLANT_OPTIONS, detail.record.preferences.plantPreference)}</span>
              </div>
              <div className="detail-pref-row">
                <span className="detail-pref-label">🍬 零食口味</span>
                <span className="detail-pref-value">{getLabel(SNACK_OPTIONS, detail.record.preferences.snackFlavor)}</span>
              </div>
              <div className="detail-pref-row">
                <span className="detail-pref-label">🔊 噪音容忍度</span>
                <span className="detail-pref-value">{detail.record.preferences.noiseTolerance} / 7</span>
              </div>
              <div className="detail-pref-row">
                <span className="detail-pref-label">💡 灯光类型</span>
                <span className="detail-pref-value">{getLabel(LIGHT_OPTIONS, detail.record.preferences.lightType)}</span>
              </div>
              <div className="detail-pref-row">
                <span className="detail-pref-label">☕ 休息偏好</span>
                <span className="detail-pref-value">{getLabel(REST_OPTIONS, detail.record.preferences.restPreference)}</span>
              </div>

              <div className="detail-tip">
                💡 {getNoiseTip(detail.record.preferences.noiseTolerance, detail.user.name)}
              </div>
            </div>
            <div className="detail-footer">
              <button className="btn-accent" onClick={handleSendThanks}>
                💌 发送谢谢
              </button>
              <button className="btn-close" onClick={closeDetail}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {thanksToast && <div className="thanks-toast">✅ 感谢已发送！</div>}
    </div>
  );
}
