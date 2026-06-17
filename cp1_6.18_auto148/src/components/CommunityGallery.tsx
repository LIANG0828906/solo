import React from 'react';
import { Heart, Trash2, Check } from 'lucide-react';
import type { GradientScheme, ColorStop } from '@/types';
import { generateGradient } from '@/engine/gradientEngine';
import { useUserStore } from '@/stores/userStore';

interface CommunityGalleryProps {
  presets: GradientScheme[];
  onApply: (colorStops: ColorStop[], angle: number) => void;
}

const CommunityGallery: React.FC<CommunityGalleryProps> = ({ presets, onApply }) => {
  const { favorites, addFavorite, removeFavorite, isFavorite } = useUserStore();

  const handleApply = (scheme: GradientScheme, e: React.MouseEvent) => {
    e.stopPropagation();
    onApply(scheme.colorStops, scheme.angle);
  };

  const handleToggleFavorite = (scheme: GradientScheme, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite(scheme.id)) {
      removeFavorite(scheme.id);
    } else {
      addFavorite(scheme);
    }
  };

  const handleRemoveFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-medium text-gray-200 flex items-center gap-2">
          <span>🌐</span> 社区画廊
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
          {presets.map((scheme) => {
            const gradient = generateGradient(scheme.colorStops, scheme.angle);
            const favorited = isFavorite(scheme.id);
            
            return (
              <div
                key={scheme.id}
                className="flex-shrink-0 group relative"
              >
                <div
                  className="w-[100px] h-[60px] rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg overflow-hidden"
                  style={{ background: gradient.cssString }}
                  onClick={(e) => handleApply(scheme, e)}
                  title={`应用「${scheme.name}」`}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleApply(scheme, e)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="应用到画布"
                    >
                      <Check size={14} className="text-white" />
                    </button>
                    <button
                      onClick={(e) => handleToggleFavorite(scheme, e)}
                      className={`p-2 rounded-lg transition-colors ${
                        favorited
                          ? 'bg-red-500 text-white'
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                      title={favorited ? '取消收藏' : '收藏'}
                    >
                      <Heart
                        size={14}
                        className={favorited ? 'text-white fill-white' : 'text-white'}
                      />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center truncate w-[100px]">
                  {scheme.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-medium text-gray-200 flex items-center gap-2">
          <Heart size={18} className="text-red-400" /> 我的收藏
          {favorites.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({favorites.length})</span>
          )}
        </h3>
        
        {favorites.length === 0 ? (
          <div className="p-8 bg-white/5 rounded-xl text-center text-gray-500 text-sm">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
              <Heart size={20} className="text-gray-600" />
            </div>
            <p>暂无收藏</p>
            <p className="text-xs text-gray-600 mt-1">点击社区画廊中的心形图标收藏喜欢的渐变</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {favorites.map((scheme) => {
              const gradient = generateGradient(scheme.colorStops, scheme.angle);
              
              return (
                <div
                  key={scheme.id}
                  className="group relative bg-white/5 rounded-xl p-3 transition-all duration-200 hover:bg-white/10"
                >
                  <div
                    className="w-full h-[100px] rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] overflow-hidden"
                    style={{ background: gradient.cssString }}
                    onClick={(e) => handleApply(scheme, e)}
                    title={`应用「${scheme.name}」`}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-gray-300 truncate flex-1">
                      {scheme.name}
                    </p>
                    <button
                      onClick={(e) => handleRemoveFavorite(scheme.id, e)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      title="删除收藏"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CommunityGallery);
