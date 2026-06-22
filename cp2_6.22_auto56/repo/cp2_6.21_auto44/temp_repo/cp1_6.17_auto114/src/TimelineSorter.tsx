import React, { useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { useTimelineStore } from './store';
import EventCard from './components/EventCard';
import FeedbackOverlay from './components/FeedbackOverlay';
import ScoreDisplay from './components/ScoreDisplay';
import answersData from './data/answers.json';
import type { CheckResult } from './types';

const TimelineSorter: React.FC = () => {
  const userOrder = useTimelineStore((state) => state.userOrder);
  const score = useTimelineStore((state) => state.score);
  const results = useTimelineStore((state) => state.results);
  const isSubmitted = useTimelineStore((state) => state.isSubmitted);
  const setUserOrder = useTimelineStore((state) => state.setUserOrder);
  const setScore = useTimelineStore((state) => state.setScore);
  const setResults = useTimelineStore((state) => state.setResults);
  const setSubmitted = useTimelineStore((state) => state.setSubmitted);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || isSubmitted) return;

      const items = Array.from(userOrder);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setUserOrder(items);
    },
    [userOrder, isSubmitted, setUserOrder]
  );

  const handleSubmit = useCallback(() => {
    const correctOrder = [...answersData].sort((a, b) => a.year - b.year);

    const checkResults: CheckResult[] = userOrder.map((question, index) => {
      const correctAnswer = correctOrder.find((a) => a.id === question.id);
      const correctPosition = correctOrder.findIndex((a) => a.id === question.id);

      return {
        id: question.id,
        isCorrect: index === correctPosition,
        userPosition: index,
        correctPosition,
        correctYear: correctAnswer?.year ?? 0,
        correctEvent: correctAnswer?.event ?? '',
      };
    });

    const correctCount = checkResults.filter((r) => r.isCorrect).length;
    const finalScore = correctCount * 20;

    setResults(checkResults);
    setScore(finalScore);
    setSubmitted(true);
  }, [userOrder, setResults, setScore, setSubmitted]);

  if (userOrder.length === 0) {
    return null;
  }

  return (
    <div className="timeline-sorter">
      {score !== null && <ScoreDisplay score={score} />}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="timeline-list">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: snapshot.isDraggingOver
                  ? 'rgba(62, 39, 35, 0.05)'
                  : 'transparent',
                borderRadius: '12px',
                padding: snapshot.isDraggingOver ? '12px' : '0',
                transition: 'background 0.2s ease',
              }}
            >
              {userOrder.map((question, index) => (
                <Draggable
                  key={question.id}
                  draggableId={question.id}
                  index={index}
                  isDragDisabled={isSubmitted}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        position: 'relative',
                        ...provided.draggableProps.style,
                      }}
                    >
                      <EventCard
                        question={question}
                        index={index}
                        isDragging={snapshot.isDragging}
                      />
                      {isSubmitted && results.length > 0 && (
                        <FeedbackOverlay
                          result={
                            results.find((r) => r.id === question.id) || {
                              id: question.id,
                              isCorrect: false,
                              userPosition: index,
                              correctPosition: 0,
                              correctYear: 0,
                              correctEvent: '',
                            }
                          }
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {!isSubmitted && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={handleSubmit}
            className="submit-btn"
            style={{
              background: '#3E2723',
              color: '#FFD700',
              border: 'none',
              padding: '14px 48px',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(62, 39, 35, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(62, 39, 35, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(62, 39, 35, 0.3)';
            }}
          >
            提交答案
          </button>
        </div>
      )}
    </div>
  );
};

export default TimelineSorter;
