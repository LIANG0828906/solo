// ============================================================
// 合成面板组件 CraftingPanel.tsx
// 职责: 页面核心容器，编排材料选择区、合成槽位、成功率、属性预览、合成按钮
// 模块编排:
//   左侧材料列表:   map(materials -> <MaterialCard />)
//   中部合成区:     装备选择 + 3个<CraftingSlot /> + <SuccessRateCircle />
//                   + <AttributeDiff /> + 合成按钮
// 数据流核心链路:
//   1. 用户点击/拖拽MaterialCard
//      -> useCrafting.addMaterial/swapSlots
//      -> Zustand store.selectedMaterials 更新
//      -> useCrafting内部Effect检测变化 -> calculateCraftingPreview()
//      -> store.preview 更新
//      -> SuccessRateCircle + AttributeDiff 重新渲染
//   2. 用户点击合成按钮
//      -> useCrafting.executeCrafting()
//      -> craftingApi.submitCrafting() -> FastAPI
//      -> store.lastResult + store.history 更新
//      -> EquipmentViewer 收到lastResult变化 -> 播放3D粒子特效
// ============================================================

import React, { useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useCrafting } from '../hooks/useCrafting';
import { MaterialCard } from './MaterialCard';
import { CraftingSlot } from './CraftingSlot';
import { SuccessRateCircle } from './SuccessRateCircle';
import { AttributeDiff } from './AttributeDiff';
import type { Material, AttributeKey } from '../types';

export function CraftingPanel() {
  const {
    materials,
    equipmentList,
    currentEquipment,
    selectedMaterials,
    preview,
    isCrafting,
    setCurrentEquipment,
    executeCrafting,
  } = useCrafting();

  // 计算已在槽位中的材料id集合，用于MaterialCard置灰去重
  const selectedIds = useMemo(() => {
    const s = new Set<string>();
    selectedMaterials.forEach((m) => {
      if (m) s.add(m.id);
    });
    return s;
  }, [selectedMaterials]);

  // 合成按钮可点击条件
  const canCraft =
    !!currentEquipment &&
    !isCrafting &&
    selectedMaterials.some((m: Material | null) => m !== null);

  // 基础属性（无材料则取装备原始属性，有预览取预览前的原始值）
  const originalAttrs: Record<AttributeKey, number> = currentEquipment
    ? currentEquipment.baseAttributes
    : { attack: 0, defense: 0, magic: 0, durability: 0 };

  // 预览差值（无材料则全为0）
  const previewDiff: Record<AttributeKey, number> = preview
    ? preview.attributeDiff
    : { attack: 0, defense: 0, magic: 0, durability: 0 };

  // 当前预览成功率（无材料默认70%占位）
  const displayRate = preview ? preview.successRate : 0;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="crafting-layout">
        {/* ================ 左侧: 材料列表 ================ */}
        <section className="materials-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">🧪</span>材料库
            </h2>
            <span className="section-count">共 {materials.length} 种</span>
          </div>
          <div className="materials-grid">
            {materials.length === 0 ? (
              <div className="loading-placeholder">加载材料中...</div>
            ) : (
              materials.map((m) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  disabled={selectedIds.has(m.id)}
                />
              ))
            )}
          </div>
        </section>

        {/* ================ 中部: 合成控制面板 ================ */}
        <section className="crafting-section">
          {/* 装备选择下拉框 */}
          <div className="equipment-selector">
            <label className="equipment-label">基础装备</label>
            <select
              className="equipment-select"
              value={currentEquipment?.id ?? ''}
              onChange={(e) => {
                const eq = equipmentList.find((x) => x.id === e.target.value);
                if (eq) setCurrentEquipment(eq);
              }}
            >
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.type === 'weapon' ? '武器' : eq.type === 'armor' ? '防具' : '饰品'})
                </option>
              ))}
            </select>
          </div>

          {/* 合成槽位区 - 3个CraftingSlot排列 */}
          <div className="slots-wrapper">
            <h3 className="slots-title">
              <span className="title-icon">🔧</span>合成槽位
            </h3>
            <div className="slots-row">
              {selectedMaterials.map((mat, idx) => (
                <React.Fragment key={idx}>
                  <CraftingSlot index={idx} material={mat} />
                  {idx < selectedMaterials.length - 1 && (
                    <div className="slot-plus">+</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 成功率与属性预览区 - 左右排布 */}
          <div className="preview-row">
            <div className="preview-rate">
              <h4 className="preview-title">
                <span className="title-icon">🎯</span>成功率
              </h4>
              {displayRate > 0 || selectedMaterials.some((m) => m) ? (
                <SuccessRateCircle rate={displayRate} size={150} />
              ) : (
                <div className="rate-placeholder">
                  <div className="placeholder-text">请放入材料</div>
                  <div className="placeholder-sub">系统将自动计算成功率</div>
                </div>
              )}
            </div>

            <div className="preview-attrs">
              {currentEquipment ? (
                <AttributeDiff original={originalAttrs} diff={previewDiff} />
              ) : (
                <div className="attrs-placeholder">请选择基础装备</div>
              )}
            </div>
          </div>

          {/* 合成按钮区 */}
          <div className="craft-btn-row">
            <button
              className={`craft-button ${canCraft ? 'craft-button--ready' : ''}`}
              disabled={!canCraft}
              onClick={executeCrafting}
            >
              {isCrafting ? (
                <>
                  <span className="craft-btn__spinner" />
                  合成中...
                </>
              ) : (
                <>
                  <span className="craft-btn__icon">⚒️</span>
                  <span className="craft-btn__text">开始合成</span>
                </>
              )}
            </button>
            <p className="craft-btn__hint">
              ⚠ 合成存在风险，成功率低于50%时谨慎操作
            </p>
          </div>
        </section>
      </div>
    </DndProvider>
  );
}
