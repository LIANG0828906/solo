import React, { useState, useCallback } from 'react';
import { useFlashCards } from './hooks/useFlashCards';
import { DeckList } from './components/DeckList';
import { ReviewPage } from './components/ReviewPage';
import type { Page, Deck } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const {
    decks,
    addDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    importCardsFromFile,
    updateCardReview,
    getTodayReviewCount,
    getDeckById,
  } = useFlashCards();

  const handleStartReview = useCallback((deckId: string) => {
    setSelectedDeckId(deckId);
    setCurrentPage('review');
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentPage('home');
    setSelectedDeckId(null);
  }, []);

  const handleUpdateReview = useCallback(
    (cardId: string, isCorrect: boolean) => {
      if (selectedDeckId) {
        updateCardReview(selectedDeckId, cardId, isCorrect);
      }
    },
    [selectedDeckId, updateCardReview]
  );

  const handleImport = useCallback(
    async (deckId: string, file: File) => {
      await importCardsFromFile(deckId, file);
    },
    [importCardsFromFile]
  );

  const selectedDeck: Deck | undefined = selectedDeckId
    ? getDeckById(selectedDeckId)
    : undefined;

  return (
    <div className="app-container">
      {currentPage === 'home' && (
        <DeckList
          decks={decks}
          onAddDeck={addDeck}
          onDeleteDeck={deleteDeck}
          onAddCard={addCard}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onImport={handleImport}
          onStartReview={handleStartReview}
          getTodayReviewCount={getTodayReviewCount}
        />
      )}

      {currentPage === 'review' && selectedDeck && (
        <ReviewPage
          key={selectedDeckId}
          deck={selectedDeck}
          onBack={handleBackToHome}
          onUpdateReview={handleUpdateReview}
        />
      )}
    </div>
  );
}

export default App;
