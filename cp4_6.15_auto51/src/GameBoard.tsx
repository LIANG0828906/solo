import React, { useCallback, useMemo } from 'react';
import { Card, CardStack } from './Card';
import { StatusBar } from './components/StatusBar';
import { ControlButtons } from './components/ControlButtons';
import { ResultModal } from './components/ResultModal';
import { useGameState } from './hooks/useGameState';
import { useDragDrop } from './hooks/useDragDrop';
import type { GameMode } from './types';
import { getSuitSymbol } from './gameLogic';
import { playFlip } from './utils/audio';

interface GameBoardProps {
  mode: GameMode;
  onBackToMenu: () => void;
}

const SUITS = ['hearts', 'diamonds', 'spades', 'clubs'] as const;

export const GameBoard: React.FC<GameBoardProps> = ({ mode, onBackToMenu }) => {
  const {
    gameState,
    invalidCardId,
    glowFoundation,
    handleDraw,
    handleMove,
    handleUndo,
    handleHint,
    handleRestart,
    isCardInHint,
  } = useGameState(mode);

  const { dragState, dropTarget, handleDragStart } = useDragDrop(
    (...args) => handleMove(...args) ?? false,
    !gameState.isGameOver
  );

  const isPlayerAreaEnabled = useCallback((playerId: number): boolean => {
    if (gameState.isGameOver) return false;
    if (mode === 'single') return true;
    return gameState.currentPlayer === playerId;
  }, [gameState.isGameOver, gameState.currentPlayer, mode]);

  const isCardDragging = useCallback((cardId: string): boolean => {
    return dragState.isDragging && dragState.draggedCards.some(c => c.id === cardId);
  }, [dragState]);

  const getDragPosition = useMemo(() => {
    if (!dragState.isDragging) return undefined;
    return { x: dragState.currentX, y: dragState.currentY };
  }, [dragState]);

  const renderStockPile = () => (
    <div
      className="stock-pile"
      data-pile-type="stock"
      data-pile-column="0"
      onClick={isPlayerAreaEnabled(gameState.currentPlayer) ? handleDraw : undefined}
    >
      {gameState.stock.length > 0 && (
        <>
          {[...Array(Math.min(3, gameState.stock.length))].map((_, i) => (
            <div
              key={i}
              className="card card--face-down"
              style={{
                top: -i * 2,
                left: -i * 2,
                zIndex: i,
              }}
            />
          ))}
          <div className="stock-pile__badge">{gameState.stock.length}</div>
        </>
      )}
      {gameState.stock.length === 0 && gameState.waste.length > 0 && (
        <div
          className="card card--face-down"
          style={{ opacity: 0.5 }}
        />
      )}
    </div>
  );

  const renderWastePile = () => (
    <div
      className="waste-pile"
      data-pile-type="waste"
      data-pile-column="0"
    >
      {gameState.waste.slice(-3).map((card, idx, arr) => {
        const isTop = idx === arr.length - 1;
        const isDragging = isCardDragging(card.id);
        const isInvalid = invalidCardId === card.id;
        const isHint = isCardInHint(card.id);

        return (
          <Card
            key={card.id}
            card={card}
            isDragging={isDragging && isTop}
            isInvalid={isInvalid}
            isHint={isHint}
            dragPosition={isDragging && isTop ? getDragPosition : undefined}
            stackIndex={idx}
            style={{
              left: idx * 25,
              top: 0,
            }}
            onDragStart={isTop && isPlayerAreaEnabled(gameState.currentPlayer)
              ? (e) => {
                  playFlip();
                  handleDragStart(e, [card], 'waste', gameState.waste.length - 1, 0);
                }
              : undefined
            }
          />
        );
      })}
    </div>
  );

  const renderFoundation = (playerId: number) => {
    const foundation = playerId === 0 ? gameState.foundation : gameState.foundationP2;
    const isGlowing = (index: number) =>
      glowFoundation?.player === playerId && glowFoundation?.index === index;

    return (
      <div className="foundation-area">
        {SUITS.map((suit, idx) => {
          const pile = foundation[idx];
          const hasCards = pile.length > 0;
          const topCard = hasCards ? pile[pile.length - 1] : null;
          const isDropTarget = dropTarget?.type === 'foundation' && dropTarget?.column === idx;
          const isEnabled = isPlayerAreaEnabled(playerId);

          return (
            <div
              key={suit}
              className="foundation-slot"
              data-pile-type="foundation"
              data-pile-column={idx}
              style={{ pointerEvents: isEnabled ? 'auto' : 'none' }}
            >
              {!hasCards && (
                <span className={`foundation-slot__suit ${suit === 'hearts' || suit === 'diamonds' ? 'card--red' : 'card--black'}`}>
                  {getSuitSymbol(suit)}
                </span>
              )}
              {hasCards && topCard && (
                <>
                  <div
                    className={`foundation-slot__badge ${isGlowing(idx) ? 'animate-glow-gold' : ''}`}
                  >
                    {pile.length}
                  </div>
                  <Card
                    card={topCard}
                    isDragging={isCardDragging(topCard.id)}
                    isInvalid={invalidCardId === topCard.id}
                    isHint={isCardInHint(topCard.id)}
                    dragPosition={isCardDragging(topCard.id) ? getDragPosition : undefined}
                    stackIndex={0}
                    onDragStart={isEnabled
                      ? (e) => {
                          playFlip();
                          handleDragStart(e, [topCard], 'foundation', idx, idx);
                        }
                      : undefined
                    }
                  />
                </>
              )}
              {isDropTarget && <div className="drop-highlight" />}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTableau = (playerId: number) => {
    const tableau = playerId === 0 ? gameState.tableau : gameState.tableauP2;
    const isEnabled = isPlayerAreaEnabled(playerId);

    return (
      <div className="tableau-area">
        {tableau.map((pile, colIdx) => {
          const isDropTarget = dropTarget?.type === 'tableau' && dropTarget?.column === colIdx;
          const dragStartIndex = useMemo(() => {
            if (!dragState.isDragging || dragState.sourceType !== 'tableau' || dragState.sourceColumn !== colIdx) {
              return -1;
            }
            return dragState.sourceIndex;
          }, [dragState, colIdx]);



          return (
            <div
              key={colIdx}
              className="tableau-column"
              data-pile-type="tableau"
              data-pile-column={colIdx}
              style={{ pointerEvents: isEnabled ? 'auto' : 'none' }}
            >
              <div className="tableau-column__label">{colIdx + 1}</div>
              
              {pile.length === 0 && (
                <div
                  className="foundation-slot"
                  style={{ marginTop: 0 }}
                />
              )}
              
              {pile.map((card, cardIdx) => {
                const cardsToDrag = pile.slice(cardIdx);
                const isDraggingThisStack = dragStartIndex === cardIdx;
                const isAnyDraggingFromHere = dragStartIndex >= 0 && cardIdx >= dragStartIndex;
                const isHint = isCardInHint(card.id);
                const isInvalid = invalidCardId === card.id;

                if (isAnyDraggingFromHere && !isDraggingThisStack) {
                  return null;
                }

                return (
                  <CardStack
                    key={card.id}
                    cards={cardsToDrag}
                    startIndex={cardIdx}
                    isDragging={isDraggingThisStack}
                    isInvalid={isInvalid}
                    isHint={isHint}
                    dragPosition={isDraggingThisStack ? getDragPosition : undefined}
                    onDragStart={card.faceUp && isEnabled
                      ? (e) => {
                          playFlip();
                          handleDragStart(e, cardsToDrag, 'tableau', cardIdx, colIdx);
                        }
                      : undefined
                    }
                  />
                );
              })}
              
              {isDropTarget && pile.length > 0 && <div className="drop-highlight" style={{ top: pile.length * 32 }} />}
              {isDropTarget && pile.length === 0 && <div className="drop-highlight" style={{ top: 0 }} />}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPlayerArea = (playerId: number) => {
    const isP2 = playerId === 1;
    const isDisabled = !isPlayerAreaEnabled(playerId);
    const areaClass = `game-board__player-area ${isP2 ? 'game-board__player-area--p2' : ''} ${isDisabled ? 'game-board__player-area--disabled' : ''}`;

    return (
      <div className={areaClass}>
        <div className="top-row">
          <div className="stock-area">
            {renderStockPile()}
            {renderWastePile()}
          </div>
          {renderFoundation(playerId)}
        </div>
        {renderTableau(playerId)}
      </div>
    );
  };

  return (
    <div className="game-board">
      {mode === 'dual' && renderPlayerArea(1)}
      {renderPlayerArea(0)}
      
      <StatusBar gameState={gameState} />
      
      <ControlButtons
        onDraw={handleDraw}
        onHint={handleHint}
        onUndo={handleUndo}
        onRestart={handleRestart}
        canUndo={gameState.history.length > 0}
        disabled={gameState.isGameOver}
      />
      
      {gameState.isGameOver && (
        <ResultModal
          gameState={gameState}
          onRestart={handleRestart}
          onBackToMenu={onBackToMenu}
        />
      )}
    </div>
  );
};
