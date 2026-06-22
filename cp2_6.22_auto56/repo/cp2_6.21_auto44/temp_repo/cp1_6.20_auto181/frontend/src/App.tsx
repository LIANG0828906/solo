import React, { useState, useEffect } from 'react';
import CardEditor from './CardEditor';
import BattleSimulator from './BattleSimulator';
import CardGallery from './CardGallery';
import { Card } from './types';
import { fetchCards } from './apiService';

type View = 'editor' | 'battle' | 'gallery';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('editor');
  const [cards, setCards] = useState<Card[]>([]);
  const [viewKey, setViewKey] = useState(0);

  const loadCards = async () => {
    try {
      const savedCards = await fetchCards();

      const draftStr = localStorage.getItem('card_draft');
      const draftCard: Card | null = draftStr ? JSON.parse(draftStr) : null;

      const allCards: Card[] = [...savedCards];
      if (draftCard) {
        allCards.push({ ...draftCard, isDraft: true });
      }

      setCards(allCards);
    } catch (error) {
      console.error('加载卡牌失败:', error);
      const draftStr = localStorage.getItem('card_draft');
      if (draftStr) {
        const draftCard: Card = JSON.parse(draftStr);
        setCards([{ ...draftCard, isDraft: true }]);
      }
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setViewKey(prev => prev + 1);
    if (view === 'gallery' || view === 'battle') {
      loadCards();
    }
  };

  const handleCardSaved = () => {
    loadCards();
  };

  const renderView = () => {
    switch (currentView) {
      case 'editor':
        return (
          <CardEditor
            key={viewKey}
            onCardSaved={handleCardSaved}
          />
        );
      case 'battle':
        return (
          <BattleSimulator
            key={viewKey}
            cards={cards.filter(c => !c.isDraft)}
          />
        );
      case 'gallery':
        return (
          <CardGallery
            key={viewKey}
            cards={cards}
            onRefresh={loadCards}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">卡牌效果组合与战斗力模拟器</h1>
        <nav className="nav-tabs">
          <button
            className={`nav-btn ${currentView === 'editor' ? 'active' : ''}`}
            onClick={() => handleViewChange('editor')}
          >
            卡牌编辑
          </button>
          <button
            className={`nav-btn ${currentView === 'gallery' ? 'active' : ''}`}
            onClick={() => handleViewChange('gallery')}
          >
            卡牌图鉴
          </button>
          <button
            className={`nav-btn ${currentView === 'battle' ? 'active' : ''}`}
            onClick={() => handleViewChange('battle')}
          >
            对战模拟
          </button>
        </nav>
      </header>

      <div key={viewKey} className="view-fade-in">
        {renderView()}
      </div>
    </div>
  );
};

export default App;
