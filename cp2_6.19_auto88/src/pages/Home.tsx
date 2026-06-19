import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MasonryGrid from '../components/MasonryGrid';
import SocialFeed from '../components/SocialFeed';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { useUiController as useStore } from '../module3/uiController';
import { ChefHat } from 'lucide-react';
import debounce from '../utils/debounce';

export default function Home() {
  const navigate = useNavigate();
  const {
    recipes,
    activities,
    loading,
    searchKeyword,
    toast,
    currentUser,
    loadRecipes,
    loadActivities,
    searchRecipes,
    initUser,
    hideToast,
    loadUserProfile,
  } = useStore();

  useEffect(() => {
    if (!currentUser) {
      initUser();
    }
    loadRecipes();
    loadActivities();
  }, [currentUser, initUser, loadRecipes, loadActivities]);

  useEffect(() => {
    if (currentUser) {
      loadUserProfile(currentUser.id);
    }
  }, [currentUser, loadUserProfile]);

  const debouncedSearch = useCallback(
    debounce((keyword: string) => {
      searchRecipes(keyword);
    }, 300),
    [searchRecipes]
  );

  const handleSearchChange = (value: string) => {
    useStore.getState().setSearchKeyword(value);
    debouncedSearch(value);
  };

  const handleSearch = (value: string) => {
    searchRecipes(value);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar
        searchKeyword={searchKeyword}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        currentUser={currentUser}
      />
      
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {searchKeyword && (
              <div className="mb-4">
                <h2 className="text-lg font-medium text-[var(--text-secondary)]">
                  搜索结果："{searchKeyword}"
                  <span className="text-[var(--text-primary)] ml-2">
                    ({recipes.length} 个食谱)
                  </span>
                </h2>
              </div>
            )}
            
            {!loading && recipes.length === 0 && searchKeyword ? (
              <EmptyState
                icon={<ChefHat className="empty-state-icon" />}
                title="未找到相关食谱"
                description={`没有找到与"${searchKeyword}"相关的食谱，试试其他关键词吧！`}
              />
            ) : (
              <MasonryGrid
                recipes={recipes}
                loading={loading}
              />
            )}
          </div>
          
          <div className="hidden lg:block">
            <SocialFeed activities={activities} />
          </div>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
