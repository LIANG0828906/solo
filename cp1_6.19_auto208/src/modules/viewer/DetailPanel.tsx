import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Tag, History, Sparkles } from 'lucide-react';
import type { Poster, DerivedVersion, BehaviorParams } from '@/types';

interface DetailPanelProps {
  poster: Poster;
  currentUUID: string;
  currentSnapshot: BehaviorParams;
  onSelectVersion: (version: DerivedVersion) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  poster,
  currentUUID,
  currentSnapshot,
  onSelectVersion,
}) => {
  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  const formatShortDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="absolute top-0 right-0 h-full z-30 flex-shrink-0 hidden md:flex flex-col overflow-hidden"
      style={{
        width: '320px',
        backgroundColor: '#FAFAFA',
        borderRadius: '12px 0 0 12px',
      }}
    >
      <div className="p-5 overflow-y-auto flex-1">
        <div className="mb-5">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md mb-3"
            style={{ backgroundColor: '#2C2C2C' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-white text-xs font-medium">当前衍生版本</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">唯一标识码</span>
          </div>
          <p
            className="font-mono text-lg tracking-wider"
            style={{ color: '#2C2C2C' }}
          >
            {currentUUID}
          </p>
        </div>

        <div
          className="mb-5 p-4 rounded-xl"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEE' }}
        >
          <h3
            className="font-bold text-lg mb-3"
            style={{ color: '#2C2C2C', fontFamily: '"Noto Sans SC", sans-serif' }}
          >
            {poster.name}
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span style={{ color: '#666' }}>作者:</span>
              <span className="font-medium" style={{ color: '#333' }}>
                {poster.author}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span style={{ color: '#666' }}>创作:</span>
              <span style={{ color: '#333' }}>{formatDate(poster.createdAt)}</span>
            </div>
          </div>
        </div>

        <div
          className="mb-5 p-4 rounded-xl"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEE' }}
        >
          <h4
            className="font-semibold text-sm mb-3 flex items-center gap-2"
            style={{ color: '#2C2C2C' }}
          >
            <Sparkles className="w-4 h-4" />
            实时行为参数
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-400 mb-1">停留时长</p>
              <p className="font-mono font-medium" style={{ color: '#333' }}>
                {currentSnapshot.dwellTime.toFixed(1)}s
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">色相偏移</p>
              <p className="font-mono font-medium" style={{ color: '#333' }}>
                {currentSnapshot.hueShift > 0 ? '+' : ''}
                {currentSnapshot.hueShift.toFixed(1)}°
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">构图权重</p>
              <p className="font-mono font-medium" style={{ color: '#333' }}>
                {currentSnapshot.compositionWeight.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">粒子数量</p>
              <p className="font-mono font-medium" style={{ color: '#333' }}>
                {currentSnapshot.particleCount}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4
            className="font-semibold text-sm mb-3 flex items-center gap-2"
            style={{ color: '#2C2C2C' }}
          >
            <History className="w-4 h-4" />
            衍生时间线
            <span className="text-xs font-normal text-gray-400 ml-auto">
              {poster.derivedVersions.length}/20
            </span>
          </h4>

          {poster.derivedVersions.length === 0 ? (
            <div
              className="p-6 rounded-xl text-center"
              style={{ backgroundColor: '#FFFFFF', border: '1px dashed #DDD' }}
            >
              <p className="text-xs mb-1" style={{ color: '#999' }}>
                暂无历史版本
              </p>
              <p className="text-xs" style={{ color: '#BBB' }}>
                保存当前画面后将在此处显示
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {poster.derivedVersions.map((v, i) => (
                <motion.div
                  key={v.uuid}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onSelectVersion(v)}
                  className="cursor-pointer group relative"
                  style={{
                    borderRadius: '6px',
                    border: '1px solid #CCCCCC',
                    overflow: 'hidden',
                    aspectRatio: '1',
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={v.thumbnail}
                    alt={v.uuid}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                  >
                    <div className="text-white w-full">
                      <p className="font-mono text-[10px] leading-tight">{v.uuid}</p>
                      <p className="text-[10px] leading-tight opacity-80">
                        {formatShortDate(v.savedAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
