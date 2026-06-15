import { useState, useCallback, useMemo, useEffect } from 'react';
import InventoryGrid from './components/InventoryGrid';
import CraftResult from './components/CraftResult';
import ResourceDepot from './components/ResourceDepot';
import { detectRecipes, consumeResources, getRecipeById } from './utils/recipeEngine';
import { loadState, saveState, createEmptyInventory, createInitialDepot } from './utils/storageUtils';
import { Inventory, CraftedItem, ResourceType, RESOURCE_METAS } from './types';

function App() {
  const [inventory, setInventory] = useState<Inventory>(() => {
    if (typeof window === 'undefined') return createEmptyInventory();
    const saved = loadState();
    return saved.inventory;
  });

  const [depotResources, setDepotResources] = useState<Record<ResourceType, number>>(() => {
    if (typeof window === 'undefined') return createInitialDepot();
    const saved = loadState();
    return saved.depotResources;
  });

  const [craftedItems, setCraftedItems] = useState<CraftedItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = loadState();
    return saved.craftedItems;
  });

  const craftableItems = useMemo(() => {
    return detectRecipes(inventory);
  }, [inventory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveState({
        inventory,
        craftedItems,
        depotResources,
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [inventory, craftedItems, depotResources]);

  const handleDrop = useCallback((slotIndex: number, resource: ResourceType) => {
    setDepotResources((prev) => {
      const remaining = prev[resource] ?? 0;
      if (remaining <= 0) return prev;
      return { ...prev, [resource]: remaining - 1 };
    });

    setInventory((prev) => {
      const newInv = [...prev];
      const slot = { ...newInv[slotIndex] };

      if (slot.resource === null) {
        slot.resource = resource;
        slot.count = 1;
      } else if (slot.resource === resource) {
        slot.count += 1;
      } else {
        return prev;
      }

      newInv[slotIndex] = slot;
      return newInv;
    });
  }, []);

  const handleSwap = useCallback((fromIdx: number, toIdx: number) => {
    setInventory((prev) => {
      const newInv = [...prev];
      const temp = newInv[fromIdx];
      newInv[fromIdx] = { ...newInv[toIdx], id: fromIdx };
      newInv[toIdx] = { ...temp, id: toIdx };
      return newInv;
    });
  }, []);

  const handleCraft = useCallback((recipeId: string) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;

    setInventory((prev) => {
      const newInv = consumeResources(recipeId, prev);
      if (!newInv) return prev;
      return newInv;
    });

    setCraftedItems((prev) => [
      ...prev,
      {
        id: `${recipe.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        recipeId: recipe.id,
        name: recipe.name,
        iconColor: recipe.iconColor,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  return (
    <div className="app-container">
      <div className="app-left">
        <div>
          <h1 className="app-title">CraftPlanner</h1>
          <p className="app-subtitle">生存合成配方模拟器 · 拖拽资源规划装备升级</p>
        </div>
        <InventoryGrid
          inventory={inventory}
          onDrop={handleDrop}
          onSwap={handleSwap}
        />
        <CraftResult
          craftableItems={craftableItems}
          onCraft={handleCraft}
        />
      </div>
      <div className="app-right">
        <ResourceDepot depotResources={depotResources} />
        <div className="crafted-section">
          <div className="section-title">已合成</div>
          <div className="crafted-list">
            {craftedItems.length === 0 ? (
              <div className="empty-state" style={{ width: '100%', flex: 'none', padding: '20px 0' }}>
                <span>暂无合成记录</span>
              </div>
            ) : (
              craftedItems.map((item) => (
                <div
                  key={item.id}
                  className="crafted-item"
                  style={{ backgroundColor: item.iconColor }}
                  title={item.name}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
