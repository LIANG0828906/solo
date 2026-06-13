import { useState, useCallback, useMemo, useEffect } from 'react';
import InventoryGrid from './components/InventoryGrid';
import CraftResult from './components/CraftResult';
import ResourceDepot from './components/ResourceDepot';
import ParticleCanvas from './components/ParticleCanvas';
import { detectRecipes } from './utils/recipeEngine';
import { playCraftSound } from './utils/audioUtils';
import { loadState, saveState, createEmptyInventory, createInitialDepot } from './utils/storageUtils';
import { Inventory, CraftableResult, CraftedItem, ResourceType, RESOURCE_METAS } from './types';
import { RECIPES } from './data/recipes';

interface ParticleEvent {
  id: string;
  x: number;
  y: number;
}

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

  const [particleEvents, setParticleEvents] = useState<ParticleEvent[]>([]);

  const craftableItems: CraftableResult[] = useMemo(() => {
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

  const handleCraft = useCallback(
    (recipeId: string, eventPos: { x: number; y: number }) => {
      const recipe = RECIPES.find((r) => r.id === recipeId);
      if (!recipe) return;

      setInventory((prev) => {
        const countMap: Record<ResourceType, number> = {} as Record<ResourceType, number>;
        const keys = Object.keys(RESOURCE_METAS) as ResourceType[];
        for (let i = 0; i < keys.length; i++) {
          countMap[keys[i]] = 0;
        }

        for (let i = 0; i < prev.length; i++) {
          const slot = prev[i];
          if (slot.resource && slot.count > 0) {
            countMap[slot.resource] += slot.count;
          }
        }

        const reqKeys = Object.keys(recipe.requirements) as ResourceType[];
        for (let i = 0; i < reqKeys.length; i++) {
          const k = reqKeys[i];
          const needed = recipe.requirements[k] ?? 0;
          if (countMap[k] < needed) {
            return prev;
          }
        }

        const newInv = prev.map((s) => ({ ...s }));
        const remaining: Record<ResourceType, number> = {} as Record<ResourceType, number>;
        for (let i = 0; i < reqKeys.length; i++) {
          const k = reqKeys[i];
          remaining[k] = recipe.requirements[k] ?? 0;
        }

        for (let i = 0; i < newInv.length; i++) {
          const slot = newInv[i];
          if (!slot.resource || slot.count <= 0) continue;

          const need = remaining[slot.resource] ?? 0;
          if (need <= 0) continue;

          if (slot.count >= need) {
            slot.count -= need;
            remaining[slot.resource] = 0;
            if (slot.count <= 0) {
              slot.resource = null;
              slot.count = 0;
            }
          } else {
            remaining[slot.resource] = need - slot.count;
            slot.resource = null;
            slot.count = 0;
          }
        }

        return newInv;
      });

      setCraftedItems((prev) => [
        ...prev,
        {
          id: `${recipe.id}_${Date.now()}`,
          recipeId: recipe.id,
          name: recipe.name,
          iconColor: recipe.iconColor,
          timestamp: Date.now(),
        },
      ]);

      const eventId = `particle_${Date.now()}_${Math.random()}`;
      setParticleEvents((prev) => [...prev, { id: eventId, x: eventPos.x, y: eventPos.y }]);

      try {
        playCraftSound();
      } catch {
        // ignore
      }
    },
    []
  );

  const handleEventConsumed = useCallback((id: string) => {
    setParticleEvents((prev) => prev.filter((e) => e.id !== id));
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
      <ParticleCanvas
        particleEvents={particleEvents}
        onEventConsumed={handleEventConsumed}
      />
    </div>
  );
}

export default App;
