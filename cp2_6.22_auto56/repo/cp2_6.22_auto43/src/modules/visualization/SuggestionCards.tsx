import React, { useState, useEffect, useMemo } from 'react';
import type { Suggestion } from '../shared/types';
import { generateSuggestions } from './VisualizationModule';
import { storageService } from '../shared/storageService';
import './SuggestionCards.css';

interface SuggestionCardsProps {
  refreshTrigger: number;
}

const SuggestionCards: React.FC<SuggestionCardsProps> = ({ refreshTrigger }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      setIsVisible(false);
      try {
        const records = await storageService.getRecentRecords(7);
        const newSuggestions = generateSuggestions(records);
        setSuggestions(newSuggestions);
      } catch (err) {
        console.error('生成建议失败:', err);
        setSuggestions(generateSuggestions([]));
      } finally {
        setTimeout(() => setIsVisible(true), 100);
      }
    };
    loadSuggestions();
  }, [refreshTrigger]);

  const categoryIcons = useMemo(() => ({
    relaxation: '💆',
    reflection: '💭',
    activity: '✨'
  }), []);

  return (
    <div className="suggestion-cards">
      <h2 className="section-title">
        <span className="title-icon">💡</span>
        个性化建议
      </h2>

      <div className="cards-container">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`suggestion-card ${isVisible ? 'visible' : ''}`}
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <div className="card-glow" />
            <div className="card-content">
              <div className="card-header">
                <span className="card-icon">{suggestion.icon}</span>
                <span className="card-category">
                  {categoryIcons[suggestion.category]}
                  {suggestion.category === 'relaxation' ? '放松' : 
                   suggestion.category === 'reflection' ? '反思' : '行动'}
                </span>
              </div>
              <h3 className="card-title">{suggestion.title}</h3>
              <p className="card-description">{suggestion.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestionCards;
