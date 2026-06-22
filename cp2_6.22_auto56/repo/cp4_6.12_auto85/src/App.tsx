import React, { useState, useEffect, useRef, useCallback } from 'react';
import EditorPanel from './EditorPanel';
import CanvasView from './CanvasView';
import CardDetailPanel from './CardDetailPanel';
import {
  CardData,
  ConnectionData,
  CanvasState,
  generateCardsFromText,
  generateConnections,
  saveToLocalStorage,
  loadFromLocalStorage,
  generateId,
} from './utils';
import { fabric } from 'fabric';

const App: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [zoom, setZoom] = useState(1);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [detailCard, setDetailCard] = useState<CardData | null>(null);
  const [lastSaved, setLastSaved] = useState<number>(0);
  const [sourceText, setSourceText] = useState('');
  const canvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      setCards(saved.cards || []);
      setConnections(saved.connections || []);
      setZoom(saved.zoom || 1);
      setLastSaved(saved.lastSaved || 0);
    }
  }, []);

  const saveState = useCallback(() => {
    const state: CanvasState = {
      cards,
      connections,
      zoom,
      panX: 0,
      panY: 0,
      lastSaved: Date.now(),
    };
    saveToLocalStorage(state);
    setLastSaved(Date.now());
  }, [cards, connections, zoom]);

  useEffect(() => {
    if (cards.length === 0) return;
    
    const timer = setTimeout(() => {
      saveState();
    }, 500);

    return () => clearTimeout(timer);
  }, [cards, connections, zoom, saveState]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSaved > 0) {
        setLastSaved((prev) => (prev > 0 ? prev : prev));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  const handleGenerate = (text: string) => {
    setSourceText(text);
    
    const canvas = canvasRef.current;
    const canvasWidth = canvas?.width ? canvas.width / (canvas.getZoom() || 1) : 800;
    const canvasHeight = canvas?.height ? canvas.height / (canvas.getZoom() || 1) : 600;
    
    const newCards = generateCardsFromText(text, canvasWidth, canvasHeight);
    setCards(newCards);
    
    const newConnections = generateConnections(newCards, text);
    setConnections(newConnections);
    
    setSelectedCardIds([]);
    setDetailCard(null);
  };

  const handleCardMove = (cardId: string, x: number, y: number) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, x, y } : card
      )
    );
  };

  const handleCardDoubleClick = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      setDetailCard(card);
    }
  };

  const handleSelectionChange = (cardIds: string[]) => {
    setSelectedCardIds(cardIds);
  };

  const handleRatingChange = (cardId: string, rating: number) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, rating } : card
      )
    );
    setDetailCard((prev) =>
      prev?.id === cardId ? { ...prev, rating } : prev
    );
  };

  const handleRelatedCardClick = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      setDetailCard(card);
    }
  };

  const handleGenerateConnections = () => {
    if (selectedCardIds.length < 2) return;

    const newConnections: ConnectionData[] = [];
    const existingPairs = new Set(
      connections.map((c) => `${c.fromCardId}-${c.toCardId}`)
    );

    for (let i = 0; i < selectedCardIds.length; i++) {
      for (let j = i + 1; j < selectedCardIds.length; j++) {
        const pair1 = `${selectedCardIds[i]}-${selectedCardIds[j]}`;
        const pair2 = `${selectedCardIds[j]}-${selectedCardIds[i]}`;
        
        if (!existingPairs.has(pair1) && !existingPairs.has(pair2)) {
          const fromCard = cards.find((c) => c.id === selectedCardIds[i]);
          const toCard = cards.find((c) => c.id === selectedCardIds[j]);
          
          if (fromCard && toCard) {
            let strength = 2;
            const sentences = sourceText.split(/[。！？.!?\n]+/).filter(s => s.trim().length > 0);
            for (const sentence of sentences) {
              if (sentence.includes(fromCard.title) && sentence.includes(toCard.title)) {
                strength += 2;
              }
            }
            strength = Math.min(strength, 5);
            
            newConnections.push({
              id: generateId(),
              fromCardId: selectedCardIds[i],
              toCardId: selectedCardIds[j],
              strength,
              description: `${fromCard.title} — ${toCard.title}`,
            });
          }
        }
      }
    }

    if (newConnections.length > 0) {
      setConnections((prev) => [...prev, ...newConnections]);
    }
  };

  const appStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  };

  return (
    <div style={appStyle}>
      <EditorPanel onGenerate={handleGenerate} />
      <CanvasView
        cards={cards}
        connections={connections}
        selectedCardIds={selectedCardIds}
        onCardDoubleClick={handleCardDoubleClick}
        onCardMove={handleCardMove}
        onSelectionChange={handleSelectionChange}
        onGenerateConnections={handleGenerateConnections}
        zoom={zoom}
        onZoomChange={setZoom}
        lastSaved={lastSaved}
        canvasRef={canvasRef}
      />
      <CardDetailPanel
        card={detailCard}
        allCards={cards}
        connections={connections}
        onClose={() => setDetailCard(null)}
        onRatingChange={handleRatingChange}
        onRelatedCardClick={handleRelatedCardClick}
      />
    </div>
  );
};

export default App;
