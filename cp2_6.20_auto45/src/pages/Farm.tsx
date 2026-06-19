import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Users, X, Clock, Heart } from 'lucide-react';
import { Plot } from '../components/Plot';
import { useGameStore, CROP_TYPES, BUILDING_TYPES, Animal, BuildingType } from '../stores/useGameStore';

const GRID_SIZE = 8;
const PLOT_SIZE = 64;

interface AnimalCardProps {
  animal: Animal;
  buildingType: BuildingType | undefined;
  formatCountdown: (timestamp: number) => string;
  getHealthStatus: (health: number) => { text: string; className: string };
}

const AnimalCard: React.FC<AnimalCardProps> = ({ animal, buildingType, formatCountdown, getHealthStatus }) => {
  const [countdownKey, setCountdownKey] = useState(0);
  const isProductReady = animal.productReadyAt <= Date.now();

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownKey(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{animal.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-farm-darkGreen">
            {animal.type === 'chicken' ? '母鸡' : animal.type === 'cow' ? '奶牛' : '绵羊'}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Heart className="w-4 h-4 text-red-400" />
            <span>健康状况</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">产出</div>
          <div className="flex items-center gap-1">
            <span className="text-2xl">{buildingType?.productIcon}</span>
            {isProductReady ? (
              <span className="text-green-600 font-bold text-sm animate-pulse">
                可收获!
              </span>
            ) : (
              <span key={countdownKey} className="text-farm-brown font-mono font-bold animate-scale-pop">
                {formatCountdown(animal.productReadyAt)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* 健康条 */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-1">
        <div
          className="h-full health-gradient transition-all duration-500"
          style={{ width: `${animal.health}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>健康值: {animal.health}%</span>
        <span className={getHealthStatus(animal.health).className}>
          {getHealthStatus(animal.health).text}
        </span>
      </div>
    </div>
  );
};

export const Farm: React.FC = () => {
  const {
    user,
    plots,
    buildings,
    animals,
    orders,
    selectedPlotId,
    showPlantMenu,
    showBuildingDetail,
    feedParticles,
    selectPlot,
    plantCrop,
    openBuildingDetail,
    feedAnimals,
    collectProduct,
    formatCountdown,
    updateTime,
    tickGrowth,
    getBuildingType,
    getAnimalsInBuilding,
  } = useGameStore();

  const [lastCountdownUpdate, setLastCountdownUpdate] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      updateTime();
      tickGrowth();
      setLastCountdownUpdate(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [updateTime, tickGrowth]);

  const getHealthStatus = (health: number): { text: string; className: string } => {
    if (health > 60) {
      return { text: '健康', className: 'text-green-600' };
    }
    if (health > 30) {
      return { text: '一般', className: 'text-yellow-600' };
    }
    return { text: '需喂食', className: 'text-red-600' };
  };

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

  return (
    <div className="min-h-screen bg-farm-bg flex flex-col">
      {/* 导航栏 */}
      <nav className="bg-farm-darkGreen px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌾</span>
          <h1 className="text-farm-yellow text-2xl font-bold tracking-wide">
            快乐农场
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-farm-green/50 px-4 py-2 rounded-full">
            <Coins className="w-5 h-5 text-yellow-300" />
            <span className="text-farm-yellow font-bold text-lg">{user.coins}</span>
          </div>
          <div className="flex items-center gap-2 text-farm-yellow">
            <span className="text-xl">👤</span>
            <span className="font-medium">{user.username}</span>
          </div>
          <Link
            to="/coop"
            className="flex items-center gap-2 bg-farm-yellow text-farm-darkGreen px-4 py-2 rounded-full font-bold hover:bg-yellow-200 transition-colors"
          >
            <Users className="w-5 h-5" />
            合作任务
          </Link>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* 农场网格 */}
          <div
            className="relative mx-auto bg-green-800/20 p-4 rounded-2xl shadow-inner"
            style={{
              width: GRID_SIZE * PLOT_SIZE + 32,
              height: GRID_SIZE * PLOT_SIZE + 32,
            }}
          >
            <div
              className="grid gap-0.5"
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
                      className="relative dashed-border rounded-lg bg-amber-100/90 cursor-pointer hover:bg-amber-50 transition-colors"
                      style={{
                        width: buildingType.size.width * PLOT_SIZE + (buildingType.size.width - 1) * 2,
                        height: buildingType.size.height * PLOT_SIZE + (buildingType.size.height - 1) * 2,
                        gridColumn: `span ${buildingType.size.width}`,
                        gridRow: `span ${buildingType.size.height}`,
                      }}
                      onClick={() => openBuildingDetail(building)}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl mb-1">{buildingType.icon}</span>
                        <span className="text-sm font-bold text-amber-800">{buildingType.name}</span>
                        <div className="flex gap-1 mt-1">
                          {getAnimalsInBuilding(building!.id).slice(0, 3).map((animal, idx) => (
                            <span key={animal.id} className="text-xl" style={{ animationDelay: `${idx * 100}ms` }}>
                              {animal.icon}
                            </span>
                          ))}
                        </div>
                      </div>
                      {feedParticles.filter(p => p.buildingId === building!.id).map(particle => (
                        <div
                          key={particle.id}
                          className="absolute w-3 h-3 bg-green-400 rounded-full animate-particle"
                          style={{
                            left: '50%',
                            top: '50%',
                            '--tx': `${particle.x - 50}px`,
                            '--ty': `${particle.y - 50}px`,
                          } as React.CSSProperties}
                        />
                      ))}
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
          <div className="mt-6 bg-white/60 rounded-xl p-4 shadow">
            <h3 className="text-farm-darkGreen font-bold mb-2 flex items-center gap-2">
              <span className="text-xl">📦</span> 我的仓库
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(user.inventory).map(([item, count]) => (
                <div key={item} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                  <span className="text-xl">
                    {item === 'wheat' ? '🌾' : item === 'egg' ? '🥚' : item === 'milk' ? '🥛' : item === '胡萝卜' ? '🥕' : item === '番茄' ? '🍅' : item === '玉米' ? '🌽' : '📦'}
                  </span>
                  <span className="text-sm font-medium text-gray-700 capitalize">{item}</span>
                  <span className="bg-farm-green text-white px-2 py-0.5 rounded-full text-sm font-bold">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 底部订单面板 */}
      <div className="bg-white/90 border-t border-amber-200 p-4 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-farm-darkGreen font-bold mb-3 flex items-center gap-2">
            <span className="text-xl">📋</span> 团队订单
          </h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {[...activeOrders, ...completedOrders].map(order => (
              <div
                key={order.id}
                className={`
                  flex-shrink-0 w-72 rounded-xl p-4 shadow-md
                  transition-all duration-300
                  ${order.completed ? 'bg-gray-100 opacity-75' : 'bg-white'}
                `}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{order.icon}</span>
                  <div className="flex-1">
                    <h4 className={`font-bold ${order.completed ? 'text-gray-500 line-through' : 'text-farm-darkGreen'}`}>
                      {order.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      奖励: <span className="text-yellow-600 font-bold">+{order.reward} 金币</span>
                    </p>
                  </div>
                  {order.completed && (
                    <span className="text-yellow-500 text-2xl animate-scale-pop">✓</span>
                  )}
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${order.completed ? 'bg-gray-400' : 'order-progress-gradient'}`}
                    style={{ width: `${(order.currentAmount / order.targetAmount) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className={`font-medium ${order.completed ? 'text-gray-500' : 'text-farm-green'}`}>
                    {order.currentAmount} / {order.targetAmount}
                  </span>
                  <span className="text-gray-500">
                    {Math.round((order.currentAmount / order.targetAmount) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 种植菜单弹窗 */}
      {showPlantMenu && selectedPlot && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => selectPlot(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-scale-pop"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-farm-darkGreen flex items-center gap-2">
                <span className="text-3xl">🌱</span> 选择要种植的作物
              </h2>
              <button
                onClick={() => selectPlot(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {CROP_TYPES.map(crop => (
                <button
                  key={crop.id}
                  onClick={() => plantCrop(selectedPlot.id, crop.id)}
                  disabled={user.coins < crop.seedPrice}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    flex flex-col items-center gap-2
                    ${user.coins >= crop.seedPrice
                      ? 'border-farm-green hover:bg-farm-green/10 hover:scale-105 cursor-pointer'
                      : 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="text-5xl">{crop.matureIcon}</span>
                  <span className="font-bold text-farm-darkGreen">{crop.name}</span>
                  <div className="text-sm text-gray-600 space-y-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{crop.growTime}秒</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-green-600 font-medium">+{crop.harvestReward}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-yellow-600">💰</span>
                      <span className={user.coins >= crop.seedPrice ? 'text-farm-brown' : 'text-red-500'}>
                        种子 {crop.seedPrice} 金币
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 建筑详情弹窗 */}
      {showBuildingDetail && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => openBuildingDetail(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xl w-full mx-4 shadow-2xl animate-scale-pop"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-farm-darkGreen flex items-center gap-2">
                <span className="text-3xl">
                  {getBuildingType(showBuildingDetail.typeId)?.icon}
                </span>
                {getBuildingType(showBuildingDetail.typeId)?.name}
              </h2>
              <button
                onClick={() => openBuildingDetail(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {getAnimalsInBuilding(showBuildingDetail.id).map(animal => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  buildingType={getBuildingType(showBuildingDetail.typeId)}
                  formatCountdown={formatCountdown}
                  getHealthStatus={getHealthStatus}
                />
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => feedAnimals(showBuildingDetail.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-farm-green text-white py-3 px-6 rounded-xl font-bold hover:bg-farm-darkGreen transition-colors active:scale-95"
              >
                <span className="text-2xl">🥣</span>
                喂食所有动物
              </button>
              <button
                onClick={() => {
                  collectProduct(showBuildingDetail.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-white py-3 px-6 rounded-xl font-bold hover:bg-yellow-600 transition-colors active:scale-95"
              >
                <span className="text-2xl">{getBuildingType(showBuildingDetail.typeId)?.productIcon}</span>
                收集产品
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
