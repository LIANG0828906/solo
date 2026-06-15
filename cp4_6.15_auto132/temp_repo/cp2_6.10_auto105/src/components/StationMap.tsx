import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle, Play, X, Plus, Minus } from 'lucide-react';
import { useStore } from '@/store';
import { CargoType, CARGO_COLORS, CARGO_NAMES, Station } from '@/types';

const StationMap: React.FC = () => {
  const {
    stations,
    caravans,
    selectedStation,
    highlightedRoute,
    showRouteDialog,
    routeStart,
    routeEnd,
    movingCaravan,
    setSelectedStation,
    updateInventory,
    addInventory,
    removeInventory,
    setShowRouteDialog,
    setRouteStart,
    setRouteEnd,
    setHighlightedRoute,
    calculateSuppliesNeeded,
    checkSuppliesSufficient,
    consumeSupplies,
    startCaravan,
    updateCaravanProgress,
    completeCaravanMove,
    playBellSound,
  } = useStore();

  const [scale, setScale] = useState(1);
  const [selectedCaravanId, setSelectedCaravanId] = useState<string | null>(null);
  const [supplyWarning, setSupplyWarning] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setScale(window.innerWidth < 768 ? 0.5 : 1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (movingCaravan && movingCaravan.currentIndex < movingCaravan.path.length - 1) {
      const duration = 2000;
      const startTime = Date.now();
      let animationId: number;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        updateCaravanProgress(movingCaravan.caravanId, progress);

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          const nextIndex = movingCaravan.currentIndex + 1;
          const nextStationId = movingCaravan.path[nextIndex];
          
          if (nextIndex < movingCaravan.path.length - 1) {
            startCaravan(movingCaravan.caravanId, movingCaravan.path);
            const state = useStore.getState();
            if (state.movingCaravan) {
              useStore.setState({
                movingCaravan: { ...state.movingCaravan, currentIndex: nextIndex, progress: 0 },
              });
            }
          } else {
            completeCaravanMove(movingCaravan.caravanId, nextStationId);
          }
        }
      };

      animationId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationId);
    }
  }, [movingCaravan?.caravanId, movingCaravan?.currentIndex]);

  const hasLowInventory = (station: Station) => {
    return Object.values(station.inventory).some((count) => count < 5);
  };

  const getTotalInventory = (station: Station) => {
    return Object.values(station.inventory).reduce((sum, count) => sum + count, 0);
  };

  const isPathHighlighted = (fromId: string, toId: string) => {
    for (let i = 0; i < highlightedRoute.length - 1; i++) {
      if (
        (highlightedRoute[i] === fromId && highlightedRoute[i + 1] === toId) ||
        (highlightedRoute[i] === toId && highlightedRoute[i + 1] === fromId)
      ) {
        return true;
      }
    }
    return false;
  };

  const caravanPosition = useMemo(() => {
    if (!movingCaravan || movingCaravan.currentIndex >= movingCaravan.path.length - 1) {
      return null;
    }

    const fromStation = stations.find((s) => s.id === movingCaravan.path[movingCaravan.currentIndex]);
    const toStation = stations.find((s) => s.id === movingCaravan.path[movingCaravan.currentIndex + 1]);

    if (!fromStation || !toStation) return null;

    const x = fromStation.x + (toStation.x - fromStation.x) * movingCaravan.progress;
    const y = fromStation.y + (toStation.y - fromStation.y) * movingCaravan.progress;

    return { x, y };
  }, [movingCaravan, stations]);

  const plannedRoute = useMemo(() => {
    if (!routeStart || !routeEnd) return null;
    const startIndex = stations.findIndex((s) => s.id === routeStart);
    const endIndex = stations.findIndex((s) => s.id === routeEnd);
    if (startIndex === -1 || endIndex === -1) return null;

    const path: string[] = [];
    const step = startIndex < endIndex ? 1 : -1;
    for (let i = startIndex; step > 0 ? i <= endIndex : i >= endIndex; i += step) {
      path.push(stations[i].id);
    }

    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      const station = stations.find((s) => s.id === path[i]);
      if (station) totalDistance += station.distanceFromPrev;
    }

    return { stations: path, totalDistance };
  }, [routeStart, routeEnd, stations]);

  const suppliesNeeded = useMemo(() => {
    if (!plannedRoute) return null;
    return calculateSuppliesNeeded(plannedRoute);
  }, [plannedRoute, calculateSuppliesNeeded]);

  const handleStartJourney = () => {
    if (!routeStart || !plannedRoute || !suppliesNeeded || !selectedCaravanId) {
      setSupplyWarning('请选择驼队和完整路线');
      return;
    }

    if (!checkSuppliesSufficient(routeStart, suppliesNeeded)) {
      setSupplyWarning('补给不足！请先补充水、草料和马蹄铁。');
      return;
    }

    consumeSupplies(routeStart, suppliesNeeded);
    playBellSound();
    startCaravan(selectedCaravanId, plannedRoute.stations);
    setShowRouteDialog(false);
    setRouteStart(null);
    setRouteEnd(null);
    setSupplyWarning(null);
    setSelectedCaravanId(null);
  };

  useEffect(() => {
    if (plannedRoute) {
      setHighlightedRoute(plannedRoute.stations);
    } else {
      if (!movingCaravan) {
        setHighlightedRoute([]);
      }
    }
  }, [plannedRoute, movingCaravan, setHighlightedRoute]);

  const selectedStationData = stations.find((s) => s.id === selectedStation);

  const svgWidth = 1300;
  const svgHeight = 400;

  return (
    <div className="flex flex-grow w-full h-full min-h-0">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        @keyframes camelRun {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(5deg); }
        }
        .station-low {
          animation: shake 0.5s infinite;
        }
        .camel-running {
          animation: camelRun 0.4s infinite;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div className="flex-grow flex items-center justify-center w-full overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full max-w-full max-h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="50%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fcd34d" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width={svgWidth} height={svgHeight} fill="url(#bgGradient)" rx="16" />

            <g transform={`scale(${scale}) translate(${(1 - scale) * svgWidth / 2}, ${(1 - scale) * svgHeight / 2})`}>
              {stations.map((station, index) => {
                if (index === 0) return null;
                const prevStation = stations[index - 1];
                const highlighted = isPathHighlighted(prevStation.id, station.id);

                return (
                  <line
                    key={`path-${prevStation.id}-${station.id}`}
                    x1={prevStation.x}
                    y1={prevStation.y}
                    x2={station.x}
                    y2={station.y}
                    stroke={highlighted ? '#22c55e' : '#92400e'}
                    strokeWidth={highlighted ? 3 : 2}
                    strokeDasharray={highlighted ? 'none' : '5,5'}
                    opacity={0.7}
                  />
                );
              })}

              {stations.map((station) => {
                const lowInventory = hasLowInventory(station);
                const isSelected = selectedStation === station.id;
                const isRouteStart = routeStart === station.id;
                const isRouteEnd = routeEnd === station.id;

                return (
                  <g
                    key={station.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (showRouteDialog) {
                        if (!routeStart) {
                          setRouteStart(station.id);
                        } else if (!routeEnd && station.id !== routeStart) {
                          setRouteEnd(station.id);
                        } else if (station.id === routeStart) {
                          setRouteStart(null);
                          setRouteEnd(null);
                        } else {
                          setRouteEnd(null);
                          setTimeout(() => setRouteEnd(station.id), 0);
                        }
                      } else {
                        setSelectedStation(isSelected ? null : station.id);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={28 / scale}
                      fill="transparent"
                      onClick={() => {}}
                    />

                    <motion.circle
                      cx={station.x}
                      cy={station.y}
                      r={18}
                      fill={isRouteStart ? '#22c55e' : isRouteEnd ? '#ef4444' : '#f59e0b'}
                      stroke={lowInventory ? '#e74c3c' : isSelected ? '#3b82f6' : '#92400e'}
                      strokeWidth={lowInventory || isSelected ? 3 : 2}
                      className={lowInventory ? 'station-low' : ''}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      filter={isSelected ? 'url(#glow)' : undefined}
                    />

                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={8}
                      fill="#fff"
                      pointerEvents="none"
                    />

                    {lowInventory && (
                      <g transform={`translate(${station.x + 12}, ${station.y - 12})`}>
                        <AlertTriangle size={16} className="text-red-500" fill="#e74c3c" />
                      </g>
                    )}

                    <text
                      x={station.x}
                      y={station.y + 38}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#78350f"
                      pointerEvents="none"
                    >
                      {station.name}
                    </text>

                    {station.distanceFromPrev > 0 && (
                      <text
                        x={station.x}
                        y={station.y + 52}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#92400e"
                        pointerEvents="none"
                      >
                        {station.distanceFromPrev}km
                      </text>
                    )}

                    <text
                      x={station.x}
                      y={station.y + 64}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#b45309"
                      pointerEvents="none"
                    >
                      库存: {getTotalInventory(station)}
                    </text>
                  </g>
                );
              })}

              {caravanPosition && (
                <g transform={`translate(${caravanPosition.x}, ${caravanPosition.y - 25})`}>
                  <g className="camel-running">
                    <ellipse cx="0" cy="0" rx="12" ry="8" fill="#b68a5c" />
                    <ellipse cx="-5" cy="-5" rx="5" ry="6" fill="#a0724a" />
                    <ellipse cx="5" cy="-5" rx="5" ry="6" fill="#a0724a" />
                    <circle cx="-12" cy="-3" r="5" fill="#b68a5c" />
                    <circle cx="-14" cy="-4" r="2" fill="#000" />
                    <line x1="-8" y1="5" x2="-8" y2="12" stroke="#8b5a2b" strokeWidth="2" />
                    <line x1="-3" y1="6" x2="-3" y2="14" stroke="#8b5a2b" strokeWidth="2" />
                    <line x1="3" y1="6" x2="3" y2="12" stroke="#8b5a2b" strokeWidth="2" />
                    <line x1="8" y1="5" x2="8" y2="14" stroke="#8b5a2b" strokeWidth="2" />
                  </g>
                </g>
              )}
            </g>
          </svg>

          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowRouteDialog(true);
                setRouteStart(null);
                setRouteEnd(null);
                setSupplyWarning(null);
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg shadow-lg flex items-center gap-2 hover:bg-amber-700 transition-colors"
            >
              <MapPin size={18} />
              规划路线
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedStationData && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="glass-panel w-80 h-full overflow-y-auto p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <MapPin className="text-amber-600" />
                {selectedStationData.name}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedStation(null)}
                className="p-1 hover:bg-amber-200 rounded-full transition-colors"
              >
                <X size={20} className="text-amber-800" />
              </motion.button>
            </div>

            {selectedStationData.distanceFromPrev > 0 && (
              <p className="text-amber-700 mb-4">
                距前一站: <span className="font-semibold">{selectedStationData.distanceFromPrev}km</span>
              </p>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-3">库存明细</h3>
              <div className="space-y-3">
                {(Object.keys(selectedStationData.inventory) as CargoType[]).map((type) => {
                  const count = selectedStationData.inventory[type];
                  const low = count < 5;

                  return (
                    <div
                      key={type}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        low ? 'bg-red-100 border border-red-300' : 'bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: CARGO_COLORS[type] }}
                        />
                        <span className="font-medium text-amber-900">{CARGO_NAMES[type]}</span>
                        {low && <AlertTriangle size={16} className="text-red-500" />}
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeInventory(selectedStationData.id, type, 1)}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          <Minus size={14} />
                        </motion.button>

                        <input
                          type="number"
                          value={count}
                          onChange={(e) =>
                            updateInventory(
                              selectedStationData.id,
                              type,
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-12 text-center bg-white border border-amber-300 rounded px-2 py-1 text-amber-900 font-semibold"
                        />

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => addInventory(selectedStationData.id, type, 1)}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          <Plus size={14} />
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-3">补给储备</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-blue-600">水</p>
                  <p className="text-lg font-bold text-blue-800">{selectedStationData.supplies.water}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-green-600">草料</p>
                  <p className="text-lg font-bold text-green-800">{selectedStationData.supplies.forage}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-amber-600">马蹄铁</p>
                  <p className="text-lg font-bold text-amber-800">{selectedStationData.supplies.horseshoes}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRouteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => {
              setShowRouteDialog(false);
              setRouteStart(null);
              setRouteEnd(null);
              setSupplyWarning(null);
              setHighlightedRoute([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <MapPin className="text-amber-600" />
                  路线规划
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowRouteDialog(false);
                    setRouteStart(null);
                    setRouteEnd(null);
                    setSupplyWarning(null);
                    setHighlightedRoute([]);
                  }}
                  className="p-1 hover:bg-amber-200 rounded-full transition-colors"
                >
                  <X size={24} className="text-amber-800" />
                </motion.button>
              </div>

              <div className="mb-6">
                <label className="block text-amber-800 font-medium mb-2">选择驼队</label>
                <select
                  value={selectedCaravanId || ''}
                  onChange={(e) => setSelectedCaravanId(e.target.value)}
                  className="w-full p-3 rounded-lg border border-amber-300 bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">请选择驼队</option>
                  {caravans.map((caravan) => (
                    <option key={caravan.id} value={caravan.id}>
                      {caravan.name} (当前: {stations.find((s) => s.id === caravan.currentStation)?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                <p className="text-amber-700 text-sm">
                  {!routeStart && !routeEnd && '👆 点击地图选择起点驿站'}
                  {routeStart && !routeEnd && `✅ 起点: ${stations.find((s) => s.id === routeStart)?.name}，请选择终点`}
                  {routeStart && routeEnd && `✅ ${stations.find((s) => s.id === routeStart)?.name} → ${stations.find((s) => s.id === routeEnd)?.name}`}
                </p>
              </div>

              {plannedRoute && suppliesNeeded && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-3">补给需求</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-sm text-blue-600">水</p>
                      <p className="text-xl font-bold text-blue-800">{suppliesNeeded.water}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600">草料</p>
                      <p className="text-xl font-bold text-blue-800">{suppliesNeeded.forage}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600">马蹄铁</p>
                      <p className="text-xl font-bold text-blue-800">{suppliesNeeded.horseshoes}</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 mt-2 text-center">
                    总里程: {plannedRoute.totalDistance}km · 约 {Math.ceil(plannedRoute.totalDistance / 50)} 天
                  </p>
                </div>
              )}

              {supplyWarning && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{supplyWarning}</p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartJourney}
                disabled={!routeStart || !routeEnd || !suppliesNeeded || !selectedCaravanId}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={20} />
                启程出发
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StationMap;
