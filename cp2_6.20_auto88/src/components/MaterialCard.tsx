// ============================================================
// 材料卡片组件 MaterialCard.tsx
// 职责: 以卡片形式展示单个材料 (名称、emoji图标、属性加成、稀有度颜色)
// 交互: 1) 悬停放大1.1倍显示详细属性
//       2) 点击添加到合成槽 (调用useCrafting.addMaterial)
//       3) 支持react-dnd拖拽: 从材料列表拖入CraftingSlot
// 数据流向: 父组件(CraftingPanel) map遍历materials传入material prop
//           拖拽源 -> CraftingSlot作为drop target接收
// ============================================================

import { memo } from 'react';
import { useDrag } from 'react-dnd';
import type { Material, AttributeKey } from '../types';
import { RARITY_CONFIG, DnDTypes } from '../types';
import { useCrafting } from '../hooks/useCrafting';

interface Props {
  material: Material;
  disabled?: boolean; // 当材料已在槽位中时置灰
}

const ATTR_LABELS: Record<AttributeKey, string> = {
  attack: '攻击',
  defense: '防御',
  magic: '魔力',
  durability: '耐久',
};

function MaterialCardComponent({ material, disabled }: Props) {
  const { addMaterial } = useCrafting();
  const rarity = RARITY_CONFIG[material.rarity];

  // react-dnd拖拽源配置 - 拖拽时携带material数据
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DnDTypes.MATERIAL_CARD,
    item: { type: DnDTypes.MATERIAL_CARD, material },
    canDrag: !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [material, disabled]);

  const handleClick = () => {
    if (disabled) return;
    addMaterial(material); // 点击添加 -> useCrafting.storeAddMaterial -> 触发预览重算
  };

  return (
    <div
      ref={dragRef}
      onClick={handleClick}
      className="material-card"
      style={{
        borderColor: rarity.color,
        opacity: disabled ? 0.4 : isDragging ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {/* 稀有度标签条 */}
      <div className="material-card__rarity" style={{ backgroundColor: rarity.color }}>
        {rarity.label}
      </div>

      {/* 图标区 */}
      <div className="material-card__icon">{material.icon}</div>

      {/* 名称 */}
      <div className="material-card__name" style={{ color: rarity.color }}>
        {material.name}
      </div>

      {/* 属性摘要 - 非悬停态显示简要 */}
      <div className="material-card__attrs">
        {Object.entries(material.attributes).map(([k, v]) => (
          <span key={k} className="material-card__attr">
            {ATTR_LABELS[k as AttributeKey]} +{v}
          </span>
        ))}
      </div>

      {/* 悬停浮层 - 显示详细描述 */}
      <div className="material-card__tooltip">
        <div className="material-card__tooltip-title" style={{ color: rarity.color }}>
          {material.name}
        </div>
        <div className="material-card__tooltip-desc">{material.description}</div>
        <div className="material-card__tooltip-attrs">
          {Object.entries(material.attributes).map(([k, v]) => (
            <div key={k} className="tooltip-attr-row">
              <span>{ATTR_LABELS[k as AttributeKey]}</span>
              <span style={{ color: '#22c55e' }}>+{v}</span>
            </div>
          ))}
        </div>
        <div className="material-card__tooltip-rarity">
          稀有度倍率: ×{rarity.multiplier}
        </div>
      </div>
    </div>
  );
}

export const MaterialCard = memo(MaterialCardComponent);
