import React, { useState, useRef, useEffect } from 'react';
import type { Garden, CropType } from '../../../shared/types';
import { useGardenStore } from '../../store/useGardenStore';
import { PlantingDetail } from './PlantingDetail';
import { Droplets, Wheat } from 'lucide-react';

interface Props {
  garden: Garden;
}

const CROP_EMOJI: Record<CropType, string> = {
  tomato: '🍅',
  lettuce: '🥬',
  carrot: '🥕',
  strawberry: '🍓',
};

function formatTimeAgo(timestamp?: number): string {
  if (!timestamp) return '暂无浇水';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? '刚刚' : `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '昨天';
  return `${days}天前`;
}

export const GardenCard: React.FC<Props> = ({ garden }) => {
  const addWaterLog = useGardenStore((s) => s.addWaterLog);
  const harvestGarden = useGardenStore((s) => s.harvestGarden);
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const lastWaterTime = garden.waterLogs.length > 0
    ? garden.waterLogs[garden.waterLogs.length - 1].timestamp
    : undefined;
  const needsWater = lastWaterTime ? Date.now() - lastWaterTime > 24 * 60 * 60 * 1000 : false;

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded, garden.waterLogs.length]);

  const handleWater = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addWaterLog(garden.id, { amount: 200 + Math.floor(Math.random() * 100) });
  };

  const handleHarvest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await harvestGarden(garden.id);
    setExpanded(false);
  };

  const sortedLogs = [...garden.waterLogs].sort((a, b) => b.timestamp - a.timestamp);

  if (!garden.claimed) {
    return (
      <div
        className="rounded-xl bg-white/40 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[220px] transition-all duration-200 hover:border-gray-400 hover:bg-white/60 cursor-pointer"
        onClick={() => setShowModal(true)}
        style={{ borderRadius: '12px' }}
      >
        <span className="text-4xl mb-3 opacity-40">🌱</span>
        <div className="text-sm text-gray-500 mb-4">待认领菜畦</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
          className="px-6 py-2.5 text-white text-sm font-medium transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: '#4CAF50', borderRadius: '8px' }}
        >
          认领菜畦
        </button>
        <PlantingDetail garden={showModal ? garden : null} onClose={() => setShowModal(false)} />
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md"
      style={{ borderRadius: '8px' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{CROP_EMOJI[garden.cropType!]}</span>
            <div>
              <div className="font-semibold text-gray-800">{garden.ownerName}</div>
              <div className="text-xs text-gray-500">#{garden.id.split('-')[1]}号菜畦</div>
            </div>
          </div>
          {garden.progress >= 100 && (
            <span
              className="text-xs font-medium px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: '#FFA000' }}
            >
              待收获
            </span>
          )}
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">种植进度</span>
            <span className="text-xs font-medium" style={{ color: '#388E3C' }}>
              {garden.progress}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${garden.progress}%`,
                background: 'linear-gradient(90deg, #81C784 0%, #388E3C 100%)',
              }}
            />
          </div>
        </div>

        <div className="mt-2">
          {needsWater ? (
            <span style={{ color: '#E53935', fontWeight: 600, fontSize: '12px' }}>
              需要浇水
            </span>
          ) : (
            <span className="text-xs text-gray-500">上次浇水：{formatTimeAgo(lastWaterTime)}</span>
          )}
        </div>
      </div>

      <div
        className="overflow-hidden transition-all ease-out"
        style={{
          maxHeight: expanded ? `${contentHeight}px` : '0px',
          transitionDuration: '0.3s',
        }}
      >
        <div ref={contentRef} className="px-4 pb-4 border-t border-gray-50">
          <div className="pt-3">
            <div className="text-xs font-medium text-gray-700 mb-2">浇水日志</div>
            {sortedLogs.length === 0 ? (
              <div className="text-xs text-gray-400 py-2 text-center">暂无浇水记录</div>
            ) : (
              <div className="max-h-28 overflow-y-auto space-y-1.5 mb-3">
                {sortedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs"
                  >
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-medium" style={{ color: '#42A5F5' }}>
                      💧 {log.amount}ml
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleWater}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                style={{ backgroundColor: '#42A5F5' }}
              >
                <Droplets size={16} />
                浇水
              </button>
              {garden.progress >= 100 && (
                <button
                  onClick={handleHarvest}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={{ backgroundColor: '#FFA000' }}
                >
                  <Wheat size={16} />
                  收获
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
