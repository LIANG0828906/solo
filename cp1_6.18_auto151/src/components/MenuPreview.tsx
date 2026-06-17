import React, { useRef, useState, useEffect } from 'react';
import { SeasonMenu, Drink, Review, useMenuStore, TagType, Season } from '@/stores/menuStore';
import { Ingredient, CATEGORY_LABELS } from '@/data/ingredients';
import { buildLayers, generateCupThumbnail } from '@/renderer/cupRenderer';
import { X, ChevronDown, Star } from 'lucide-react';
import CupPreview from '@/components/CupPreview';

interface MenuPreviewProps {
  onClose: () => void;
}

const SEASONS: { key: Season; label: string; color: string }[] = [
  { key: 'spring', label: '春', color: '#B8D4A5' },
  { key: 'summer', label: '夏', color: '#FFB07C' },
  { key: 'autumn', label: '秋', color: '#D4A574' },
  { key: 'winter', label: '冬', color: '#A8C0D8' },
];

const tagConfig: Record<TagType, { label: string; className: string }> = {
  recommended: { label: '店主推荐', className: 'bg-tag-red text-white' },
  limited: { label: '限量', className: 'bg-tag-red text-white' },
  popular: { label: '人气爆款', className: 'bg-tag-green text-white' },
};

function renderStars(rating: number): string {
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < rating ? '★' : '☆';
  }
  return stars;
}

const MenuPreview: React.FC<MenuPreviewProps> = ({ onClose }) => {
  const seasonMenus = useMenuStore((s) => s.seasonMenus);
  const currentSeason = useMenuStore((s) => s.currentSeason);
  const [activeSeasonTab, setActiveSeasonTab] = useState<Season>(currentSeason);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveSeasonTab(currentSeason);
  }, [currentSeason]);

  const activeMenu = seasonMenus.find((m) => m.season === activeSeasonTab);
  const drinks = activeMenu?.drinks ?? [];

  const scrollToDetail = (drinkId: string) => {
    const el = scrollContainerRef.current?.querySelector(`#drink-detail-${drinkId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 cursor-pointer"
      >
        <X size={24} />
      </button>

      <div
        className="w-[375px] max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          backgroundColor: '#FDF5E6',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '2px solid #D4A574',
        }}
        ref={scrollContainerRef}
      >
        <div className="py-3 border-b text-center" style={{ borderColor: 'rgba(212,165,116,0.3)' }}>
          <div className="font-display text-lg font-bold text-coffee-dark">
            季节饮品菜单
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: SEASONS.find((s) => s.key === activeSeasonTab)?.color }}
            />
            <span className="text-sm text-coffee-mid">
              {SEASONS.find((s) => s.key === activeSeasonTab)?.label}季
            </span>
          </div>
        </div>

        <div className="flex border-b" style={{ borderColor: 'rgba(212,165,116,0.3)' }}>
          {SEASONS.map((season) => (
            <button
              key={season.key}
              type="button"
              onClick={() => setActiveSeasonTab(season.key)}
              className="flex-1 py-2 text-sm font-display cursor-pointer transition-colors duration-200"
              style={{
                backgroundColor: activeSeasonTab === season.key ? season.color : 'transparent',
                color: activeSeasonTab === season.key ? '#fff' : '#8B7355',
              }}
            >
              {season.label}
            </button>
          ))}
        </div>

        <div className="p-3">
          {drinks.length === 0 ? (
            <div className="py-12 text-center text-coffee-mid text-sm">暂无饮品</div>
          ) : (
            <>
              <div className="space-y-3">
                {drinks.map((drink) => {
                  const thumbnail = generateCupThumbnail(
                    buildLayers(drink.base, drink.syrups, drink.foamLevel, drink.garnishes)
                  );
                  return (
                    <div
                      key={drink.id}
                      className="bg-white rounded-xl p-3 flex gap-3"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    >
                      <img
                        src={thumbnail}
                        alt={drink.name}
                        className="w-[120px] h-[180px] rounded-lg object-cover cursor-pointer shrink-0"
                        onClick={() => scrollToDetail(drink.id)}
                      />
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="font-display font-semibold text-coffee-dark truncate">
                          {drink.name}
                        </div>
                        <div className="text-sm text-coffee-light mt-0.5">
                          ¥{drink.price}
                        </div>
                        {drink.tags && drink.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {drink.tags.map((tag) => {
                              const config = tagConfig[tag];
                              if (!config) return null;
                              return (
                                <span
                                  key={tag}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${config.className}`}
                                >
                                  {config.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {drink.description && (
                          <p className="text-xs text-coffee-mid mt-2 line-clamp-2">
                            {drink.description}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => scrollToDetail(drink.id)}
                          className="mt-auto self-start flex items-center gap-0.5 text-xs text-coffee-light cursor-pointer bg-transparent border-none hover:text-coffee-dark"
                        >
                          查看详情
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-6">
                {drinks.map((drink) => (
                  <div
                    key={drink.id}
                    id={`drink-detail-${drink.id}`}
                    className="bg-white rounded-xl p-4"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  >
                    <div className="font-display text-base font-bold text-coffee-dark mb-3">
                      {drink.name}
                    </div>

                    <div className="flex justify-center mb-4">
                      <CupPreview
                        base={drink.base}
                        syrups={drink.syrups}
                        foamLevel={drink.foamLevel}
                        garnishes={drink.garnishes}
                        width={200}
                        height={300}
                      />
                    </div>

                    <div className="space-y-2 text-sm">
                      {drink.base && (
                        <div className="flex items-center gap-2">
                          <span className="text-coffee-mid">{CATEGORY_LABELS.base}:</span>
                          <span className="text-coffee-dark">{drink.base.name}</span>
                        </div>
                      )}
                      {drink.syrups.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-coffee-mid">{CATEGORY_LABELS.syrup}:</span>
                          <span className="text-coffee-dark">{drink.syrups.map((s) => s.name).join('、')}</span>
                        </div>
                      )}
                      {drink.foamLevel > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-coffee-mid">{CATEGORY_LABELS.foam}:</span>
                          <span className="text-coffee-dark">{drink.foamLevel}%</span>
                        </div>
                      )}
                      {drink.garnishes.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-coffee-mid">{CATEGORY_LABELS.garnish}:</span>
                          <span className="text-coffee-dark">{drink.garnishes.map((g) => g.name).join('、')}</span>
                        </div>
                      )}
                    </div>

                    {drink.steps.length > 0 && (
                      <div className="mt-4">
                        <div className="font-display text-sm font-semibold text-coffee-dark mb-2">
                          制作步骤
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-coffee-mid">
                          {drink.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {drink.reviews.length > 0 && (
                      <div className="mt-4">
                        <div className="font-display text-sm font-semibold text-coffee-dark mb-2">
                          用户评价
                        </div>
                        <div className="space-y-2">
                          {drink.reviews.slice(-3).map((review) => (
                            <div
                              key={review.id}
                              className="rounded-lg p-2"
                              style={{ backgroundColor: '#FFF8EE' }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-coffee-dark">
                                  {review.author}
                                </span>
                                <span className="text-[10px] text-coffee-light">
                                  {review.date}
                                </span>
                              </div>
                              <div
                                className="text-sm mt-0.5"
                                style={{ color: '#FFD700', fontSize: '16px' }}
                              >
                                {renderStars(review.rating)}
                              </div>
                              <p className="text-xs text-coffee-mid mt-0.5">
                                {review.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPreview;
