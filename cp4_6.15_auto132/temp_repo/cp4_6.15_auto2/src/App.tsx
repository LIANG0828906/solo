import { useState, useCallback, useRef } from 'react';
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
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const tabIndex = (id: TabId) => TABS.findIndex((t) => t.id === id);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      if (tab === activeTab || isAnimating) return;

      setIsAnimating(true);

      const direction = tabIndex(tab) > tabIndex(activeTab) ? 1 : -1;

      if (contentRef.current) {
        contentRef.current.style.transition = 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s ease-out';
        contentRef.current.style.transform = `translateX(${-direction * 20}px)`;
        contentRef.current.style.opacity = '0';
      }

      setTimeout(() => {
        setActiveTab(tab);
        if (contentRef.current) {
          contentRef.current.style.transform = `translateX(${direction * 20}px)`;
          contentRef.current.style.opacity = '0';
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (contentRef.current) {
              contentRef.current.style.transform = 'translateX(0)';
              contentRef.current.style.opacity = '1';
            }
            setTimeout(() => {
              if (contentRef.current) {
                contentRef.current.style.transition = '';
              }
              setIsAnimating(false);
            }, 300);
          });
        });
      }, 10);
    },
    [activeTab, isAnimating]
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
        ref={contentRef}
        className="page-content"
        style={{
          willChange: 'transform, opacity',
        }}
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
              disabled={isAnimating}
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
