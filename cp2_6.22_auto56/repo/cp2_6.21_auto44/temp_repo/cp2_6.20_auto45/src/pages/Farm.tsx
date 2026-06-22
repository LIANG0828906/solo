import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Users, X, Clock, Check } from 'lucide-react';
import { Plot } from '../components/Plot';
import { BuildingDetail } from '../components/BuildingDetail';
import { useGameStore, CROP_TYPES } from '../stores/useGameStore';

const GRID_SIZE = 8;
const PLOT_SIZE = 64;

export const Farm: React.FC = () => {
  const {
    user,
    plots,
    buildings,
    orders,
    selectedPlotId,
    showPlantMenu,
    showBuildingDetail,
    selectPlot,
    plantCrop,
    openBuildingDetail,
    updateTime,
    tickGrowth,
    getBuildingType,
    getAnimalsInBuilding,
  } = useGameStore();

  useEffect(() => {
    const timer = setInterval(() => {
      updateTime();
      tickGrowth();
    }, 1000);
    return () => clearInterval(timer);
  }, [updateTime, tickGrowth]);

  const getPlotBuilding = (x: number, y: number) => {
    return buildings.find(b => {
      const type = getBuildingType(b.typeId);
      if (!type) return false;
      return (
        x >= b.x && x < b.x + type.size.width &&
        y >= b.y && y < b.y + type.size.height
      );
    });
  };

  const isPlotOccupied = (x: number, y: number) => {
    return buildings.some(b => {
      const type = getBuildingType(b.typeId);
      if (!type) return false;
      if (b.x === x && b.y === y) return false;
      return (
        x >= b.x && x < b.x + type.size.width &&
        y >= b.y && y < b.y + type.size.height
      );
    });
  };

  const handlePlotClick = (plotId: string) => {
    const plot = plots.find(p => p.id === plotId);
    if (!plot) return;

    const building = getPlotBuilding(plot.x, plot.y);
    if (building && building.x === plot.x && building.y === plot.y) {
      openBuildingDetail(building);
      return;
    }

    selectPlot(plotId);
  };

  const selectedPlot = plots.find(p => p.id === selectedPlotId);
  const activeOrders = orders.filter(o => !o.completed).slice(0, 3);
  const completedOrders = orders.filter(o => o.completed).slice(0, 1);

  const getItemIcon = (item: string): string => {
    switch (item) {
      case 'wheat': return '🌾';
      case 'egg': return '🥚';
      case 'milk': return '🥛';
      case '鸡蛋': return '🥚';
      case '胡萝卜': return '🥕';
      case '番茄': return '🍅';
      case '玉米': return '🌽';
      default: return '📦';
    }
  };

  return (
    <div className="min-h-screen bg-farm-bg flex flex-col">
      {/* 导航栏 */}
      <nav className="bg-gradient-to-r from-farm-darkGreen via-farm-green to-farm-darkGreen px-6 py-4 flex items-center justify-between shadow-xl border-b-4 border-farm-yellow/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-4xl">🌾</span>
            <span className="absolute -top-1 -right-1 text-lg animate-bounce">✨</span>
          </div>
          <h1 className="text-farm-yellow text-2xl font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            快乐农场
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/50 to-amber-600/50 px-5 py-2 rounded-full border border-yellow-400/30 shadow-inner">
            <Coins className="w-5 h-5 text-yellow-300" />
            <span className="text-farm-yellow font-bold text-lg tabular-nums">{user.coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-farm-yellow bg-white/10 px-4 py-2 rounded-full">
            <span className="text-xl">👤</span>
            <span className="font-medium">{user.username}</span>
          </div>
          <Link
            to="/coop"
            className="flex items-center gap-2 bg-gradient-to-r from-farm-yellow to-yellow-300 text-farm-darkGreen px-5 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-yellow-400"
          >
            <Users className="w-5 h-5" />
            合作任务
          </Link>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* 农场网格容器 */}
          <div className="relative mx-auto p-5 rounded-3xl shadow-2xl border-4 border-green-900/20"
            style={{
              width: GRID_SIZE * PLOT_SIZE + 56,
              background: `
                radial-gradient(ellipse at 20% 20%, rgba(74, 124, 89, 0.3) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(74, 124, 89, 0.2) 0%, transparent 50%),
                linear-gradient(135deg, #4a7c59 0%, #5a8f6a 50%, #4a7c59 100%)
              `,
            }}
          >
            {/* 装饰性草丛 */}
            <div className="absolute -top-3 -left-3 text-3xl opacity-60">🌿</div>
            <div className="absolute -top-2 -right-4 text-2xl opacity-50">🌸</div>
            <div className="absolute -bottom-3 -left-4 text-3xl opacity-50">🌻</div>
            <div className="absolute -bottom-2 -right-3 text-2xl opacity-60">🌿</div>
            
            <div
              className="grid gap-0.5 bg-green-900/30 p-1 rounded-2xl"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${PLOT_SIZE}px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, ${PLOT_SIZE}px)`,
              }}
            >
              {plots.map(plot => {
                const building = getPlotBuilding(plot.x, plot.y);
                const isBuildingOrigin = building?.x === plot.x && building?.y === plot.y;
                const occupied = isPlotOccupied(plot.x, plot.y);
                const buildingType = building ? getBuildingType(building.typeId) : undefined;

                if (isBuildingOrigin && buildingType) {
                  return (
                    <div
                      key={plot.id}
                      className="relative rounded-xl cursor-pointer overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
                      style={{
                        width: buildingType.size.width * PLOT_SIZE + (buildingType.size.width - 1) * 2,
                        height: buildingType.size.height * PLOT_SIZE + (buildingType.size.height - 1) * 2,
                        gridColumn: `span ${buildingType.size.width}`,
                        gridRow: `span ${buildingType.size.height}`,
                        background: `
                          linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)
                        `,
                        border: '2px dashed #9ca3af',
                        boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.6), 0 4px 12px rgba(0,0,0,0.15)',
                      }}
                      onClick={() => openBuildingDetail(building)}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                        <span className="text-5xl mb-1 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                          {buildingType.icon}
                        </span>
                        <span className="text-sm font-bold text-amber-900 bg-white/60 px-3 py-0.5 rounded-full shadow-sm">
                          {buildingType.name}
                        </span>
                        <div className="flex gap-0.5 mt-1.5">
                          {getAnimalsInBuilding(building!.id).slice(0, 4).map((animal, idx) => (
                            <span 
                              key={animal.id} 
                              className="text-xl transform hover:scale-125 transition-transform"
                              style={{ 
                                animation: `bounce 0.6s ease-in-out infinite`,
                                animationDelay: `${idx * 0.1}s`,
                              }}
                            >
                              {animal.icon}
                            </span>
                          ))}
                        </div>
                        {getAnimalsInBuilding(building!.id).length > 4 && (
                          <span className="text-xs text-amber-700 font-medium mt-0.5">
                            +{getAnimalsInBuilding(building!.id).length - 4}只
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-farm-green text-white text-xs px-2 py-1 rounded-full shadow-md font-bold">
                          点击进入
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Plot
                    key={plot.id}
                    plot={plot}
                    isOccupied={occupied}
                    buildingId={building?.id}
                    onClick={() => handlePlotClick(plot.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* 库存显示 */}
          <div className="mt-8 bg-white/70 backdrop-blur rounded-2xl p-5 shadow-xl border border-amber-200">
            <h3 className="text-farm-darkGreen font-bold mb-4 flex items-center gap-2 text-lg">
              <span className="text-2xl">📦</span> 
              我的仓库
              <span className="text-sm font-normal text-gray-500 ml-auto">
                共 {Object.keys(user.inventory).length} 类物品
              </span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(user.inventory).length === 0 ? (
                <div className="text-gray-500 py-4 px-6 bg-gray-50 rounded-xl">
                  仓库空空如也，快去种植和养殖吧~ 🌱
                </div>
              ) : (
                Object.entries(user.inventory).map(([item, count]) => (
                  <div 
                    key={item} 
                    className="flex items-center gap-3 bg-gradient-to-r from-white to-amber-50 px-4 py-3 rounded-xl shadow-md hover:shadow-lg border border-amber-100 hover:border-amber-300 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="text-3xl drop-shadow-sm">
                      {getItemIcon(item)}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-gray-700 capitalize">{item}</span>
                      <div className="text-xs text-gray-400">库存</div>
                    </div>
                    <span className="ml-2 bg-gradient-to-r from-farm-green to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-inner">
                      x{count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部订单面板 */}
      <div className="bg-gradient-to-t from-white via-white/95 to-white/90 border-t-2 border-amber-200 p-5 shadow-[0_-8px_32px_rgba(0,0,0,0.1)]">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-farm-darkGreen font-bold mb-4 flex items-center gap-2 text-lg">
            <span className="text-2xl">📋</span> 
            团队订单
            <span className="text-xs font-normal bg-farm-green/10 text-farm-green px-2.5 py-1 rounded-full ml-2">
              {activeOrders.length} 个进行中
            </span>
          </h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1">
            {[...activeOrders, ...completedOrders].map((order, idx) => (
              <div
                key={order.id}
                className={`
                  flex-shrink-0 w-80 rounded-2xl p-5 shadow-lg transition-all duration-500 relative overflow-hidden
                  ${order.completed 
                    ? 'bg-gradient-to-br from-gray-100 to-gray-200 opacity-90 border-2 border-gray-300' 
                    : 'bg-gradient-to-br from-white to-amber-50 border-2 border-amber-200 hover:border-farm-green hover:shadow-xl hover:-translate-y-1'
                  }
                `}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* 完成角标 */}
                {order.completed && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-3 right-4 text-yellow-500 text-3xl animate-scale-pop drop-shadow-lg">
                      ✓
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner
                    ${order.completed 
                      ? 'bg-gray-200' 
                      : 'bg-gradient-to-br from-amber-100 to-yellow-200'
                    }
                  `}>
                    <span className={`text-4xl ${order.completed ? 'grayscale opacity-50' : ''}`}>
                      {order.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-lg ${order.completed ? 'text-gray-500 line-through' : 'text-farm-darkGreen'}`}>
                      {order.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">奖励:</span>
                      <span className="flex items-center gap-1 text-yellow-600 font-bold">
                        <Coins className="w-3.5 h-3.5" />
                        +{order.reward}
                      </span>
                    </div>
                  </div>
                  {order.completed && (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg animate-scale-pop">
                        <Check className="w-6 h-6 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-xs text-gray-500 mt-1 font-medium">已完成</span>
                    </div>
                  )}
                </div>

                {/* 进度条 */}
                <div className="relative mb-2">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${
                        order.completed 
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
                          : 'bg-gradient-to-r from-farm-green via-green-500 to-emerald-400 shadow-lg shadow-green-500/30'
                      }`}
                      style={{ 
                        width: `${(order.currentAmount / order.targetAmount) * 100}%`,
                      }}
                    >
                      {!order.completed && (
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-bold text-base ${order.completed ? 'text-gray-500' : 'text-farm-green'}`}>
                    {order.currentAmount} / {order.targetAmount}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-20 rounded-full overflow-hidden bg-gray-200`}>
                      <div 
                        className={`h-full rounded-full ${order.completed ? 'bg-gray-400' : 'bg-green-500'}`}
                        style={{ width: `${Math.round((order.currentAmount / order.targetAmount) * 100)}%` }}
                      />
                    </div>
                    <span className={`font-bold text-sm ${order.completed ? 'text-gray-500' : 'text-farm-green'}`}>
                      {Math.round((order.currentAmount / order.targetAmount) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 种植菜单弹窗 */}
      {showPlantMenu && selectedPlot && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => selectPlot(null)}
        >
          <div
            className="bg-gradient-to-br from-white via-amber-50 to-yellow-50 rounded-3xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-scale-pop border-4 border-farm-green/20"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-farm-darkGreen flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-farm-green/10 flex items-center justify-center">
                  <span className="text-3xl">🌱</span>
                </div>
                选择要种植的作物
              </h2>
              <button
                onClick={() => selectPlot(null)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {CROP_TYPES.map((crop, idx) => {
                const canAfford = user.coins >= crop.seedPrice;
                return (
                  <button
                    key={crop.id}
                    onClick={() => canAfford && plantCrop(selectedPlot.id, crop.id)}
                    disabled={!canAfford}
                    className={`
                      p-5 rounded-2xl border-2 transition-all duration-300
                      flex flex-col items-center gap-2 relative overflow-hidden
                      ${canAfford
                        ? 'border-farm-green bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:-translate-y-1 hover:shadow-xl hover:border-green-500 cursor-pointer group'
                        : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                      }
                    `}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="relative mb-2">
                      <span className={`text-6xl transition-transform group-hover:scale-110 group-hover:rotate-6 ${!canAfford ? 'grayscale' : ''}`}>
                        {crop.matureIcon}
                      </span>
                      <span className="absolute -bottom-1 -right-1 text-2xl animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }}>
                        {crop.icon}
                      </span>
                    </div>
                    <span className="font-bold text-xl text-farm-darkGreen">{crop.name}</span>
                    <div className="text-sm text-gray-600 space-y-2 text-center w-full">
                      <div className="flex items-center justify-center gap-1.5 bg-gray-50 py-1.5 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-700">{crop.growTime}秒成熟</span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 bg-green-50 py-1.5 rounded-lg">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-green-600">+{crop.harvestReward} 收益</span>
                      </div>
                      <div className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg ${
                        canAfford ? 'bg-amber-50' : 'bg-red-50'
                      }`}>
                        <span>🌰</span>
                        <span className={`font-bold ${
                          canAfford ? 'text-amber-700' : 'text-red-500'
                        }`}>
                          {canAfford ? `种子 ${crop.seedPrice} 金币` : '金币不足!'}
                        </span>
                      </div>
                    </div>
                    {canAfford && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-farm-green via-green-500 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 text-center text-sm text-gray-500 bg-white/60 py-3 rounded-xl">
              💡 作物会按照真实时间逐步生长，成熟后记得及时收获哦~
            </div>
          </div>
        </div>
      )}

      {/* 建筑详情弹窗 */}
      {showBuildingDetail && (
        <BuildingDetail
          building={showBuildingDetail}
          onClose={() => openBuildingDetail(null)}
        />
      )}
    </div>
  );
};
