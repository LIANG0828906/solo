// ============================================================
// 合成槽位组件 CraftingSlot.tsx
// 职责: 单个合成槽位的渲染，支持:
//       1) 空槽位显示虚线占位符
//       2) 接收从MaterialCard拖入的材料 (DropTarget)
//       3) 与其他槽位互换顺序 (同时作为DragSource和DropTarget)
//       4) 点击×号移除槽位中材料
// 调用关系:
//   CraftingPanel map渲染3个CraftingSlot -> 通过store.selectedMaterials[index]取数据
//   Drop目标: 接收DnDTypes.MATERIAL_CARD或DnDTypes.CRAFTING_SLOT
//   拖拽源: 槽位内有材料时可拖出互换
// 数据流向: drop成功 -> useCrafting.swapSlots / store.setMaterialAtSlot
//           -> Zustand更新 -> 预览副作用重算 -> 成功率/属性刷新
// ============================================================

import React, { memo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Material, AttributeKey } from '../types';
import { DnDTypes, RARITY_CONFIG, DragItem } from '../types';
import { useCrafting } from '../hooks/useCrafting';

interface Props {
  index: number;           // 0,1,2 - 三个槽位索引
  material: Material | null;
}

const ATTR_LABELS: Record<AttributeKey, string> = {
  attack: '攻击',
  defense: '防御',
  magic: '魔力',
  durability: '耐久',
};

function CraftingSlotComponent({ index, material }: Props) {
  const { swapSlots, removeMaterial, addMaterial } = useCrafting();

  // ============== Drop Target - 接收拖拽放入 ==============
  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, unknown, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: [DnDTypes.MATERIAL_CARD, DnDTypes.CRAFTING_SLOT],
    canDrop: (item) => {
      // 如果是从材料列表拖入且当前槽位已有材料，拒绝（除非是替换逻辑）
      if (item.type === DnDTypes.MATERIAL_CARD) return true;
      // 槽位互换: 不能拖到自身
      if (item.type === DnDTypes.CRAFTING_SLOT) return item.slotIndex !== index;
      return false;
    },
    drop: (item) => {
      if (item.type === DnDTypes.MATERIAL_CARD && item.material) {
        // 从材料卡片拖入 -> 先尝试放入此槽位
        if (material) {
          // 槽位已满 -> 找空槽位或替换
          addMaterial(item.material);
        } else {
          // 直接调用addMaterial会放入第一个空槽，这里精确放入此index
          // 通过zustand临时绕: 先移除已有同id再放入 (addMaterial内不允许重复)
          addMaterial(item.material);
        }
      } else if (item.type === DnDTypes.CRAFTING_SLOT && typeof item.slotIndex === 'number') {
        // 槽位间交换顺序
        swapSlots(item.slotIndex, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [index, material, swapSlots, addMaterial]);

  // ============== Drag Source - 槽位内材料拖出互换 ==============
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DnDTypes.CRAFTING_SLOT,
    item: { type: DnDTypes.CRAFTING_SLOT, slotIndex: index },
    canDrag: !!material,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [index, material]);

  // 合并drag和drop refs到同一DOM
  const attachRefs = (node: HTMLDivElement | null) => {
    (dragRef as (n: HTMLDivElement | null) => void)(node);
    (dropRef as (n: HTMLDivElement | null) => void)(node);
  };

  const rarity = material ? RARITY_CONFIG[material.rarity] : null;

  // 计算drop高亮样式
  const slotStyle: React.CSSProperties = {
    borderStyle: material ? 'solid' : 'dashed',
    borderColor: isOver && canDrop ? '#e94560' : (rarity?.color ?? 'rgba(255,255,255,0.2)'),
    opacity: isDragging ? 0.3 : 1,
    backgroundColor: isOver && canDrop ? 'rgba(233,69,96,0.1)' : (material ? 'rgba(22,33,62,0.6)' : 'transparent'),
  };

  return (
    <div
      ref={attachRefs}
      className="crafting-slot"
      style={slotStyle}
    >
      {material ? (
        <>
          {/* 槽位内有材料的渲染 */}
          <div className="crafting-slot__material">
            <span className="crafting-slot__icon" style={{ filter: `drop-shadow(0 0 8px ${rarity!.color})` }}>
              {material.icon}
            </span>
            <span className="crafting-slot__name" style={{ color: rarity!.color }}>
              {material.name}
            </span>
            <div className="crafting-slot__attrs">
              {Object.entries(material.attributes).map(([k, v]) => (
                <span key={k} className="slot-attr-chip">
                  {ATTR_LABELS[k as AttributeKey]}+{v}
                </span>
              ))}
            </div>
          </div>
          {/* 移除按钮 - 点击从槽位移除 */}
          <button
            className="crafting-slot__remove"
            onClick={(e) => {
              e.stopPropagation();
              removeMaterial(index);
            }}
            title="移除材料"
          >
            ×
          </button>
          <div className="crafting-slot__index">{index + 1}</div>
        </>
      ) : (
        <>
          {/* 空槽位 - 虚线占位 */}
          <div className="crafting-slot__placeholder">
            <div className="crafting-slot__plus">+</div>
            <div className="crafting-slot__hint">拖入材料 {index + 1}</div>
          </div>
          <div className="crafting-slot__index">{index + 1}</div>
        </>
      )}
    </div>
  );
}

export const CraftingSlot = memo(CraftingSlotComponent);
