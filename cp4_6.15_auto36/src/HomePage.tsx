import { useState, useMemo, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FilterBar } from './components/FilterBar';
import { ItemCard } from './components/ItemCard';
import { useItemStore } from './itemStore';
import { useUserStore } from './userStore';
import { cn } from './utils';

export const HomePage = () => {
  const navigate = useNavigate();
  const { getFilteredItems } = useItemStore();
  const { currentUser, getCommunityMemberCount } = useUserStore();

  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [minCondition, setMinCondition] = useState(1);
  const [maxCondition, setMaxCondition] = useState(10);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedItems, setDisplayedItems] = useState<ReturnType<typeof getFilteredItems>>([]);

  const filteredItems = useMemo(
    () =>
      getFilteredItems({
        category: selectedCategory,
        minCondition,
        maxCondition,
      }),
    [selectedCategory, minCondition, maxCondition, getFilteredItems]
  );

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayedItems(filteredItems);
      setIsTransitioning(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, minCondition, maxCondition, filteredItems]);

  useEffect(() => {
    setDisplayedItems(filteredItems);
  }, []);

  const community = currentUser?.community || '阳光花园小区';
  const memberCount = getCommunityMemberCount(community);

  const handleConditionChange = (min: number, max: number) => {
    setMinCondition(min);
    setMaxCondition(max);
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-orange-400 via-orange-300 to-amber-200 pt-8 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-1">{community}</h1>
            <p className="text-white/80 text-sm flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {memberCount} 位邻居在交换
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-10">
        <div className="max-w-4xl mx-auto">
          <FilterBar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            minCondition={minCondition}
            maxCondition={maxCondition}
            onConditionChange={handleConditionChange}
          />

          <div className="relative">
            <div
              className={cn(
                'transition-all duration-300 ease-out',
                isTransitioning
                  ? 'opacity-0 transform translate-y-2'
                  : 'opacity-100 transform translate-y-0'
              )}
            >
              {displayedItems.length > 0 ? (
                <div className="masonry">
                  {displayedItems.map((item, index) => (
                    <ItemCard key={item.id} item={item} index={index} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                  <div className="w-32 h-32 mb-4 relative">
                    <img
                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20orange%20tabby%20cat%20kitten%20sitting%20cartoon%20style%20soft%20colors&image_size=square"
                      alt="小猫咪"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    暂时没有人在交换这个哦
                  </p>
                  <p className="text-gray-400 text-sm">
                    换个类别看看？或者你来发布第一个吧~
                  </p>
                  <button
                    onClick={() => navigate('/publish')}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-full font-semibold btn-bounce shadow-lg"
                  >
                    发布物品
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/publish')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full shadow-xl flex items-center justify-center text-white btn-bounce z-50"
      >
        <Plus className="w-7 h-7" />
      </button>

      <div className="h-24" />
    </div>
  );
};
