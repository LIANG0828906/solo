import { useState, useCallback, DragEvent } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAppStore } from '../store';
import type { Cargo, RouteNode } from '../types';
import '../styles/InventoryPanel.css';

const InventoryPanel = () => {
  const [draggedCargo, setDraggedCargo] = useState<Cargo | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    cargoTypes,
    selectedCargo,
    towns,
    route,
    caravanSize,
    addCargo,
    removeCargo,
    updateCargoQuantity,
    removeTownFromRoute,
    reorderRoute,
    clearRoute,
    setCaravanSize,
  } = useAppStore((state) => ({
    cargoTypes: state.cargoTypes,
    selectedCargo: state.selectedCargo,
    towns: state.towns,
    route: state.route,
    caravanSize: state.caravanSize,
    addCargo: state.addCargo,
    removeCargo: state.removeCargo,
    updateCargoQuantity: state.updateCargoQuantity,
    removeTownFromRoute: state.removeTownFromRoute,
    reorderRoute: state.reorderRoute,
    clearRoute: state.clearRoute,
    setCaravanSize: state.setCaravanSize,
  }));

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, cargo: Cargo) => {
    setDraggedCargo(cargo);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCargo(null);
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedCargo) {
      addCargo({ ...draggedCargo, quantity: 1 });
    }
    setDraggedCargo(null);
    setIsDragOver(false);
  }, [draggedCargo, addCargo]);

  const handleAddCargo = useCallback((cargo: Cargo) => {
    addCargo({ ...cargo, quantity: 1 });
  }, [addCargo]);

  const getTownById = (townId: string) => towns.find((t) => t.id === townId);

  const totalWeight = selectedCargo.reduce((sum, c) => sum + c.weight * c.quantity, 0);
  const totalQuantity = selectedCargo.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="inventory-panel scroll-panel">
      <div className="panel-content">
        <section className="panel-section">
          <h2 className="section-title title-calligraphy">商队配置</h2>
          <div className="caravan-config">
            <label className="config-label">
              商队人数:
              <input
                type="range"
                min="5"
                max="50"
                value={caravanSize}
                onChange={(e) => setCaravanSize(Number(e.target.value))}
                className="range-input"
              />
              <span className="config-value">{caravanSize} 人</span>
            </label>
            <div className="config-stats">
              <div className="stat-item">
                <span className="stat-label">货物总量</span>
                <span className="stat-value">{totalQuantity} 件</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">总重量</span>
                <span className="stat-value">{totalWeight} 石</span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel-section">
          <h2 className="section-title title-calligraphy">货物清单</h2>
          <p className="section-hint">拖拽或点击货物添加到商队</p>

          <div className="cargo-grid">
            {cargoTypes.map((cargo) => (
              <motion.div
                key={cargo.id}
                className={`cargo-item ripple-target ${draggedCargo?.id === cargo.id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, cargo)}
                onDragEnd={handleDragEnd}
                onClick={() => handleAddCargo(cargo)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={cargo.description}
              >
                <span className="cargo-icon">{cargo.icon}</span>
                <span className="cargo-name">{cargo.name}</span>
                <span className="cargo-price">{cargo.basePrice} 贯</span>
              </motion.div>
            ))}
          </div>
        </section>

        <section
          className={`panel-section selected-section ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h2 className="section-title title-calligraphy">已选货物</h2>

          <AnimatePresence mode="popLayout">
            {selectedCargo.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="empty-hint"
              >
                暂无货物，请从上方选择
              </motion.p>
            ) : (
              <div className="selected-cargo-list">
                {selectedCargo.map((cargo) => (
                  <motion.div
                    key={cargo.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="selected-cargo-item ink-border"
                  >
                    <span className="cargo-icon">{cargo.icon}</span>
                    <div className="cargo-info">
                      <span className="cargo-name">{cargo.name}</span>
                      <span className="cargo-weight">重量: {cargo.weight * cargo.quantity} 石</span>
                    </div>
                    <div className="quantity-control">
                      <button
                        className="qty-btn ink-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCargoQuantity(cargo.id, cargo.quantity - 1);
                        }}
                      >
                        -
                      </button>
                      <span className="qty-value">{cargo.quantity}</span>
                      <button
                        className="qty-btn ink-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCargoQuantity(cargo.id, cargo.quantity + 1);
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="remove-btn ink-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCargo(cargo.id);
                      }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>

        <section className="panel-section">
          <div className="route-header">
            <h2 className="section-title title-calligraphy">规划路线</h2>
            {route.length > 0 && (
              <button
                className="clear-btn ink-button"
                onClick={() => clearRoute()}
              >
                清空路线
              </button>
            )}
          </div>
          <p className="section-hint">点击地图上的城镇添加到路线</p>

          <AnimatePresence mode="popLayout">
            {route.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="empty-hint"
              >
                暂无路线，请在地图上选择城镇
              </motion.p>
            ) : (
              <Reorder.Group axis="y" values={route} onReorder={(newOrder: RouteNode[]) => {
                newOrder.forEach((node, index) => {
                  if (node.order !== index) {
                    reorderRoute(node.order, index);
                  }
                });
              }} className="route-list">
                {route.map((node, index) => {
                  const town = getTownById(node.townId);
                  if (!town) return null;
                  return (
                    <Reorder.Item
                      key={node.townId}
                      value={node}
                      as="motion.div"
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="route-item ink-border drag-handle"
                    >
                      <span className="route-order">{index + 1}</span>
                      <span className="route-icon">
                        {town.type === 'fortress' && '🏰'}
                        {town.type === 'oasis' && '🌴'}
                        {town.type === 'desert' && '🏜️'}
                        {town.type === 'gobi' && '🪨'}
                      </span>
                      <div className="route-info">
                        <span className="route-name">{town.name}</span>
                        <span className="route-type">
                          {town.type === 'fortress' && '军事重镇'}
                          {town.type === 'oasis' && '绿洲城邦'}
                          {town.type === 'desert' && '沙漠驿站'}
                          {town.type === 'gobi' && '戈壁据点'}
                        </span>
                      </div>
                      <button
                        className="remove-btn ink-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTownFromRoute(node.townId);
                        }}
                      >
                        ×
                      </button>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            )}
          </AnimatePresence>
        </section>

        {selectedCargo.length > 0 && (
          <section className="panel-section cargo-summary">
            <h3 className="subsection-title">货物价值估算</h3>
            <div className="summary-list">
              {selectedCargo.map((cargo) => {
                const lastTown = route.length > 0 ? getTownById(route[route.length - 1].townId) : null;
                const modifier = lastTown?.priceModifiers[cargo.id] || 1;
                const value = cargo.basePrice * cargo.quantity * modifier;
                return (
                  <div key={cargo.id} className="summary-row">
                    <span>{cargo.icon} {cargo.name} × {cargo.quantity}</span>
                    <span className="summary-value">{Math.round(value)} 贯</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;
