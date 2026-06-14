import { useState, useCallback } from 'react';
import { Refrigerator, ChefHat, ShoppingCart } from 'lucide-react';
import IngredientsPage from './IngredientsPage';
import RecommendationPage from './RecommendationPage';
import ShoppingListPage from './ShoppingListPage';

type TabId = 'ingredients' | 'recommend' | 'shopping';

const TABS: { id: TabId; label: string; icon: typeof Refrigerator }[] = [
  { id: 'ingredients', label: '食材', icon: Refrigerator },
  { id: 'recommend', label: '推荐', icon: ChefHat },
  { id: 'shopping', label: '购物', icon: ShoppingCart },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('ingredients');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);

  const tabIndex = (id: TabId) => TABS.findIndex((t) => t.id === id);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return;
      const dir = tabIndex(tab) > tabIndex(activeTab) ? 'right' : 'left';
      setSlideDirection(dir);
      setIsAnimating(true);
      setActiveTab(tab);
      setTimeout(() => setIsAnimating(false), 300);
    },
    [activeTab]
  );

  const renderPage = () => {
    switch (activeTab) {
      case 'ingredients':
        return <IngredientsPage />;
      case 'recommend':
        return <RecommendationPage />;
      case 'shopping':
        return <ShoppingListPage />;
    }
  };

  return (
    <div className="app-container">
      <div
        className={`page-content ${isAnimating ? (slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left') : ''}`}
        key={activeTab}
      >
        {renderPage()}
      </div>
      <nav className="bottom-tab-bar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`tab-item ${isActive ? 'tab-active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={20} />
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
