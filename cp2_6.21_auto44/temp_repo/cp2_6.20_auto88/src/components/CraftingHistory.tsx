// ============================================================
// 合成历史记录侧边栏 CraftingHistory.tsx
// 职责: 显示最近10次合成记录 (材料列表缩略、成功/失败状态、时间戳)
//       成功记录绿色背景，失败记录半透明红色背景
//       点击记录 -> 调用useCrafting.loadHistoryToSlots恢复组合到合成面板
// 数据流: Zustand history数组 -> map渲染 -> 点击触发loadHistoryToSlots
//                             -> CraftingPanel/CraftingSlot响应更新槽位
// ============================================================

import React, { memo } from 'react';
import { useCrafting } from '../hooks/useCrafting';
import type { CraftingHistoryItem, AttributeKey } from '../types';
import { RARITY_CONFIG } from '../types';

const ATTR_LABELS: Record<AttributeKey, string> = {
  attack: '攻击',
  defense: '防御',
  magic: '魔力',
  durability: '耐久',
};

// 格式化时间戳为 MM-DD HH:mm:ss
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

function HistoryRow({ item }: { item: CraftingHistoryItem }) {
  const { loadHistoryToSlots, currentEquipment } = useCrafting();
  const { result, materials } = item;

  // 成功绿色，失败半透明红
  const rowStyle: React.CSSProperties = result.success
    ? { background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))', borderLeft: '3px solid #22c55e' }
    : { background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.03))', borderLeft: '3px solid #ef4444', opacity: 0.85 };

  const handleClick = () => {
    loadHistoryToSlots(item.id); // 恢复该组合到槽位
  };

  // 判断是否为当前选中的组合 - 高亮显示
  const isActive = currentEquipment?.id === item.equipmentId;

  return (
    <div
      className={`history-row ${isActive ? 'history-row--active' : ''}`}
      style={rowStyle}
      onClick={handleClick}
      title="点击加载到合成面板"
    >
      {/* 状态徽章 */}
      <div className="history-row__header">
        <span
          className={`history-row__badge ${result.success ? 'badge--success' : 'badge--fail'}`}
        >
          {result.success ? '✓ 成功' : '✗ 失败'}
        </span>
        <span className="history-row__rate">
          成功率 {result.successRate}%
        </span>
        <span className="history-row__time">{formatTime(item.timestamp)}</span>
      </div>

      {/* 材料缩略 */}
      <div className="history-row__materials">
        {materials.map((m, idx) => (
          <span
            key={idx}
            className="history-row__mat"
            style={{
              color: RARITY_CONFIG[m.rarity].color,
              border: `1px solid ${RARITY_CONFIG[m.rarity].color}`,
            }}
            title={m.name}
          >
            {m.icon}
          </span>
        ))}
        {materials.length === 0 && <span className="history-row__empty">无材料</span>}
      </div>

      {/* 属性变化摘要 */}
      {result.success && (
        <div className="history-row__diff">
          {Object.entries(result.attributeDiff)
            .filter(([, v]) => v !== 0)
            .map(([k, v]) => (
              <span
                key={k}
                className={`diff-chip ${v > 0 ? 'diff--up' : 'diff--down'}`}
              >
                {ATTR_LABELS[k as AttributeKey]} {v > 0 ? '+' : ''}{v}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

function CraftingHistoryComponent() {
  const { history } = useCrafting();

  return (
    <aside className="crafting-history">
      <div className="crafting-history__header">
        <h3 className="crafting-history__title">
          <span className="title-icon">📜</span>
          合成历史
        </h3>
        <span className="crafting-history__count">{history.length}/10</span>
      </div>

      <div className="crafting-history__list">
        {history.length === 0 ? (
          <div className="crafting-history__empty">
            <div className="empty-icon">⚔️</div>
            <div className="empty-text">暂无合成记录</div>
            <div className="empty-hint">完成第一次合成后，记录将显示在这里</div>
          </div>
        ) : (
          history.map((item) => <HistoryRow key={item.id} item={item} />)
        )}
      </div>
    </aside>
  );
}

export const CraftingHistory = memo(CraftingHistoryComponent);
