import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, Difficulty, calculateNextReview, isDueForReview, sortByReviewDate } from '../utils/spacedRepetition';

interface FlashCardStudyProps {
  deckId: string;
  onBack: () => void;
}

interface Deck {
  id: string;
  name: string;
  cards: Card[];
}

const FlashCardStudy: React.FC<FlashCardStudyProps> = ({ deckId, onBack }) => {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const fetchDeck = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:3001/api/decks/${deckId}`);
        setDeck(response.data);
      } catch (error) {
        console.error('Failed to fetch deck:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeck();
  }, [deckId]);

  const dueCards = deck ? deck.cards.filter(isDueForReview) : [];
  const sortedCards = sortByReviewDate(dueCards);
  const currentCard = sortedCards[currentIndex] || null;

  const handleFlip = useCallback(() => {
    if (currentCard && !showAnswer) {
      setIsFlipped(prev => !prev);
      setTimeout(() => {
        setShowAnswer(prev => !prev);
      }, 300);
    }
  }, [currentCard, showAnswer]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && currentCard) {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleFlip, currentCard]);

  const handleDifficulty = async (difficulty: Difficulty) => {
    if (!currentCard) return;

    const updatedCard = calculateNextReview(currentCard, difficulty);
    try {
      await axios.put(`http://localhost:3001/api/decks/${deckId}/cards/${currentCard.id}`, updatedCard);
      setDeck(prev => prev ? {
        ...prev,
        cards: prev.cards.map(c => c.id === currentCard.id ? updatedCard : c),
        lastReviewed: new Date().toISOString().split('T')[0]
      } : null);
    } catch (error) {
      console.error('Failed to update card:', error);
    }

    setIsFlipped(false);
    setShowAnswer(false);

    if (currentIndex < sortedCards.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  };

  const handleSkip = () => {
    setIsFlipped(false);
    setShowAnswer(false);
    if (currentIndex < sortedCards.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  };

  if (isLoading) {
    return (
      <div className="study-loading">
        <div className="loading-spinner"></div>
        <p>Loading deck...</p>
      </div>
    );
  }

  if (!deck || sortedCards.length === 0) {
    return (
      <div className="study-empty">
        <h2>No cards due for review</h2>
        <p>All cards are up to date!</p>
        <button onClick={onBack} className="back-button">
          Back to Decks
        </button>
      </div>
    );
  }

  return (
    <div className="flashcard-study">
      <button onClick={onBack} className="back-button">
        ← Back
      </button>
      
      <div className="study-header">
        <h1>{deck.name}</h1>
        <p>Card {currentIndex + 1} of {sortedCards.length}</p>
      </div>

      <div className="flashcard-container" onClick={handleFlip}>
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
          <div className="flashcard-face flashcard-front">
            <h2>Question</h2>
            <p>{currentCard?.question}</p>
          </div>
          <div className="flashcard-face flashcard-back">
            <h2>Answer</h2>
            <p>{currentCard?.answer}</p>
          </div>
        </div>
      </div>

      {showAnswer && (
        <div className="difficulty-buttons">
          <button 
            className="btn btn-hard" 
            onClick={(e) => { e.stopPropagation(); handleDifficulty('hard'); }}
          >
            Hard
          </button>
          <button 
            className="btn btn-medium" 
            onClick={(e) => { e.stopPropagation(); handleDifficulty('medium'); }}
          >
            Medium
          </button>
          <button 
            className="btn btn-easy" 
            onClick={(e) => { e.stopPropagation(); handleDifficulty('easy'); }}
          >
            Easy
          </button>
          <button 
            className="btn btn-skip" 
            onClick={(e) => { e.stopPropagation(); handleSkip(); }}
          >
            Skip
          </button>
        </div>
      )}

      <style>{`
        .flashcard-study {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
          background: #F9FAFB;
        }

        .back-button {
          padding: 10px 20px;
          background: #4F46E5;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 20px;
          font-size: 16px;
          transition: background 0.2s;
        }

        .back-button:hover {
          background: #4338CA;
        }

        .study-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .study-header h1 {
          color: #1F2937;
          margin-bottom: 8px;
        }

        .study-header p {
          color: #6B7280;
        }

        .flashcard-container {
          perspective: 1000px;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
        }

        .flashcard {
          position: relative;
          width: 100%;
          padding-bottom: 66.67%;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }

        .flashcard.flipped {
          transform: rotateY(180deg);
        }

        .flashcard-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 30px;
          box-sizing: border-box;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .flashcard-front {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: white;
        }

        .flashcard-back {
          transform: rotateY(180deg);
          background: white;
          border: 2px solid #E5E7EB;
        }

        .flashcard-face h2 {
          margin-bottom: 20px;
          font-size: 18px;
          opacity: 0.8;
        }

        .flashcard-face p {
          font-size: 24px;
          line-height: 1.6;
          text-align: center;
          max-height: 60%;
          overflow-y: auto;
        }

        .flashcard-back h2 {
          color: #6B7280;
        }

        .flashcard-back p {
          color: #1F2937;
        }

        .difficulty-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 40px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
        }

        .btn-hard {
          background: #EF4444;
          color: white;
        }

        .btn-hard:hover {
          background: #DC2626;
        }

        .btn-medium {
          background: #F59E0B;
          color: white;
        }

        .btn-medium:hover {
          background: #D97706;
        }

        .btn-easy {
          background: #10B981;
          color: white;
        }

        .btn-easy:hover {
          background: #059669;
        }

        .btn-skip {
          background: #E5E7EB;
          color: #374151;
        }

        .btn-skip:hover {
          background: #D1D5DB;
        }

        .study-loading, .study-empty {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #E5E7EB;
          border-top-color: #4F46E5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .flashcard-study {
            padding: 15px;
          }

          .flashcard-face p {
            font-size: 20px;
          }

          .difficulty-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default FlashCardStudy;