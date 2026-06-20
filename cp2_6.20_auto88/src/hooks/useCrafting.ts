// ============================================================
// 自定义钩子 useCrafting.ts
// 职责: 封装合成业务逻辑（API调用编排、状态更新、副作用处理）
// 调用关系:
//   CraftingPanel组件 -> useCrafting.{addMaterial,executeCrafting,...}
//                     -> craftingApi.* 发起请求
//                     -> useCraftingStore setters 更新全局状态
//                     -> 订阅该状态的组件 (EquipmentViewer等) 自动刷新
// 数据流向: 组件交互 -> hook方法 -> API层 -> Store更新 -> 响应式组件更新
// ============================================================

import { useEffect, useCallback } from 'react';
import { useCraftingStore } from '../store/useCraftingStore';
import {
  fetchMaterials,
  fetchEquipmentList,
  getEquipmentDetails,
  calculateCraftingPreview,
  submitCrafting,
} from '../api/craftingApi';
import type { Material, CraftingHistoryItem } from '../types';

export function useCrafting() {
  const {
    // 状态选择器（精确订阅，避免不必要re-render）
    materials,
    equipmentList,
    currentEquipment,
    selectedMaterials,
    preview,
    lastResult,
    isCrafting,
    history,
    // setters
    setMaterials,
    setEquipmentList,
    setCurrentEquipment,
    setPreview,
    setLastResult,
    setIsCrafting,
    addMaterial: storeAddMaterial,
    removeMaterial,
    clearAllSlots,
    swapSlots,
    addHistory,
    loadHistoryToSlots,
  } = useCraftingStore((s) => s);

  // ============== 初始化：加载材料和装备列表 ==============
  // 首次挂载时并行拉取材料和装备，填充store
  useEffect(() => {
    const init = async () => {
      const [matList, eqList] = await Promise.all([
        fetchMaterials(),
        fetchEquipmentList(),
      ]);
      setMaterials(matList);
      setEquipmentList(eqList);
    };
    init();
  }, [setMaterials, setEquipmentList]);

  // ============== 副作用：材料槽位变化时自动重新预计算 ==============
  // 依赖: selectedMaterials + currentEquipment，任一变化即触发
  // 输出: 更新store.preview -> SuccessRateCircle/AttributeDiff组件响应更新
  useEffect(() => {
    if (!currentEquipment) return;
    const matIds = selectedMaterials.filter((m): m is Material => m !== null).map((m) => m.id);

    // 无材料时清空预览
    if (matIds.length === 0) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await calculateCraftingPreview({
        equipmentId: currentEquipment.id,
        materialIds: matIds,
      });
      if (!cancelled) setPreview(result);
    })();

    return () => {
      cancelled = true; // 竞态防护：快速切换时丢弃过期结果
    };
  }, [selectedMaterials, currentEquipment, setPreview]);

  // ============== 公开方法：添加材料到槽位 ==============
  // 被 MaterialCard onClick 调用 -> 添加到首个空槽 -> 触发上述副作用重算预览
  const addMaterial = useCallback(
    (material: Material) => {
      storeAddMaterial(material);
    },
    [storeAddMaterial],
  );

  // ============== 公开方法：执行合成（点击合成按钮）===============
  // 调用链路:
  //   CraftingPanel 点击按钮
  //   → setIsCrafting(true) 显示loading
  //   → submitCrafting(POST /api/crafting/execute) 调用后端
  //   → setLastResult(result) 更新结果 → EquipmentViewer收到lastResult触发特效
  //   → addHistory(...) 写入最近10条记录 → CraftingHistory渲染
  const executeCrafting = useCallback(async () => {
    if (!currentEquipment || isCrafting) return;
    const matIds = selectedMaterials.filter((m): m is Material => m !== null).map((m) => m.id);
    if (matIds.length === 0) return;

    setIsCrafting(true);
    try {
      const result = await submitCrafting({
        equipmentId: currentEquipment.id,
        materialIds: matIds,
      });
      setLastResult(result);

      // 构造历史记录项并追加
      const historyItem: CraftingHistoryItem = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        materials: selectedMaterials.filter((m): m is Material => m !== null),
        result,
        equipmentId: currentEquipment.id,
        timestamp: result.timestamp,
      };
      addHistory(historyItem);
    } finally {
      setIsCrafting(false);
    }
  }, [currentEquipment, isCrafting, selectedMaterials, setIsCrafting, setLastResult, addHistory]);

  return {
    // 数据暴露给组件
    materials,
    equipmentList,
    currentEquipment,
    selectedMaterials,
    preview,
    lastResult,
    isCrafting,
    history,
    // 方法暴露给组件
    setCurrentEquipment,
    addMaterial,
    removeMaterial,
    clearAllSlots,
    swapSlots,
    executeCrafting,
    loadHistoryToSlots,
    getEquipmentDetails,
  };
}
