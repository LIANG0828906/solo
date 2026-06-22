import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Clock, ChefHat, Utensils, X } from 'lucide-react';
import type { MealAssignment, MealGrid } from '../types';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const MEALS = ['早餐', '午餐', '晚餐'];

const flip = keyframes`
  0% { transform: perspective(1000px) rotateY(0deg); }
  50% { transform: perspective(1000px) rotateY(90deg); }
  100% { transform: perspective(1000px) rotateY(0deg); }
`;

const modalFade = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
`;

const Container = styled.div`
  @media (min-width: 769px) {
    display: block;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 70px repeat(7, 1fr);
  gap: 10px;
  @media (max-width: 768px) {
    display: none;
  }
`;

const HeaderCell = styled.div`
  padding: 10px 0;
  text-align: center;
  font-weight: 600;
  color: #5c3a1e;
  font-size: 14px;
  background: #fff3dc;
  border-radius: 12px;
`;

const RowLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #8b6a45;
  font-size: 14px;
  background: #fff3dc;
  border-radius: 12px;
`;

const MealCard = styled.div<{
  $dragging: boolean;
  $isDropTarget: boolean;
  $flipping: boolean;
}>`
  background: #ffffff;
  border-radius: 12px;
  padding: 14px 12px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: grab;
  border: ${(p) => (p.$isDropTarget ? '2px dashed #f4a460' : '2px solid transparent')};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  opacity: ${(p) => (p.$dragging ? 0.5 : 1)};
  transition: all 200ms ease;
  animation: ${(p) => (p.$flipping ? flip : 'none')} 400ms ease-in-out;
  transform-style: preserve-3d;
  perspective: 1000px;
  user-select: none;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  &:active {
    cursor: grabbing;
  }
`;

const EmptyCard = styled(MealCard)`
  background: #fffdf5;
  cursor: default;
  border: 2px dashed #e0d5c5;
  align-items: center;
  justify-content: center;
  color: #c0a984;
  font-size: 13px;
  &:hover {
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const MealName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #3a2e1f;
  line-height: 1.3;
  margin-bottom: 8px;
`;

const MealMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8b6a45;
`;

const CuisineTag = styled.span`
  padding: 2px 8px;
  background: #fff3dc;
  border-radius: 10px;
  font-size: 11px;
  color: #8b6a45;
`;

// Mobile swipe view
const MobileContainer = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
    overflow: hidden;
    position: relative;
  }
`;

const Slides = styled.div<{ $index: number }>`
  display: flex;
  transition: transform 350ms ease;
  transform: translateX(-${(p) => p.$index * 100}%);
`;

const DaySlide = styled.div`
  flex: 0 0 100%;
  padding: 0 4px;
`;

const DayTitle = styled.div`
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #5c3a1e;
  margin-bottom: 12px;
  font-family: 'Noto Serif SC', serif;
`;

const MealStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SlideBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #f4a460;
  color: #fff8e7;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 5;
`;

const PrevBtn = styled(SlideBtn)`
  left: 0;
`;
const NextBtn = styled(SlideBtn)`
  right: 0;
`;

// Modal
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(58, 46, 31, 0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: ${modalFade} 200ms ease;
`;

const ModalCard = styled.div`
  background: #fff8e7;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  animation: ${modalFade} 250ms ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  background: #f4a460;
  color: #fff8e7;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  h2 {
    color: #fff8e7;
    font-size: 20px;
  }
`;

const CloseBtn = styled.button`
  background: rgba(255, 248, 231, 0.2);
  color: #fff8e7;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms;
  &:hover {
    background: rgba(255, 248, 231, 0.35);
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const SectionTitle = styled.h4`
  font-size: 15px;
  margin-bottom: 10px;
  color: #5c3a1e;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const IngredientList = styled.ul`
  list-style: none;
  margin-bottom: 20px;
  li {
    padding: 8px 12px;
    background: #fffdf5;
    border-radius: 10px;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
  }
`;

const StepList = styled.ol`
  padding-left: 20px;
  li {
    padding: 6px 0;
    font-size: 14px;
    color: #3a2e1f;
    line-height: 1.6;
  }
`;

export interface CalendarViewProps {
  meals: MealGrid;
  onSwap: (a: [number, number], b: [number, number]) => void;
}

export default function CalendarView({ meals, onSwap }: CalendarViewProps) {
  const [dragging, setDragging] = useState<[number, number] | null>(null);
  const [dropTarget, setDropTarget] = useState<[number, number] | null>(null);
  const [flipping, setFlipping] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<{ meal: MealAssignment; pos: string } | null>(null);
  const [dayIndex, setDayIndex] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetail(null);
      if (detail) return;
      if (e.key === 'ArrowLeft') setDayIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setDayIndex((i) => Math.min(6, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail]);

  const handleDrop = (d: number, m: number) => {
    if (!dragging) return;
    if (dragging[0] === d && dragging[1] === m) return;
    const keyA = `${dragging[0]}-${dragging[1]}`;
    const keyB = `${d}-${m}`;
    setFlipping(new Set([keyA, keyB]));
    onSwap(dragging, [d, m]);
    setTimeout(() => setFlipping(new Set()), 400);
    setDragging(null);
    setDropTarget(null);
  };

  const renderMealCard = (d: number, m: number) => {
    const meal = meals[d][m];
    const key = `${d}-${m}`;
    const isDrag = dragging?.[0] === d && dragging?.[1] === m;
    const isDrop = dropTarget?.[0] === d && dropTarget?.[1] === m;
    const isFlip = flipping.has(key);

    if (!meal) {
      return (
        <EmptyCard
          $dragging={false}
          $isDropTarget={isDrop}
          $flipping={false}
          onDragOver={(e) => {
            e.preventDefault();
            setDropTarget([d, m]);
          }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={() => handleDrop(d, m)}
        >
          空
        </EmptyCard>
      );
    }

    return (
      <MealCard
        $dragging={isDrag}
        $isDropTarget={isDrop}
        $flipping={isFlip}
        draggable
        onDragStart={() => setDragging([d, m])}
        onDragEnd={() => {
          setDragging(null);
          setDropTarget(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDropTarget([d, m]);
        }}
        onDragLeave={() => setDropTarget(null)}
        onDrop={() => handleDrop(d, m)}
        onClick={() => setDetail({ meal, pos: key })}
      >
        <div>
          <MealName>{meal.name}</MealName>
          <CuisineTag>{meal.cuisine}</CuisineTag>
        </div>
        <MealMeta>
          <Clock size={12} /> {meal.cookTime} 分钟
        </MealMeta>
      </MealCard>
    );
  };

  return (
    <>
      <Container>
        <Grid>
          <HeaderCell>餐段</HeaderCell>
          {DAYS.map((d) => (
            <HeaderCell key={d}>{d}</HeaderCell>
          ))}
          {MEALS.map((meal, mi) => (
            <>
              <RowLabel key={`lbl-${mi}`}>{meal}</RowLabel>
              {DAYS.map((_, di) => (
                <div key={`cell-${di}-${mi}`}>{renderMealCard(di, mi)}</div>
              ))}
            </>
          ))}
        </Grid>
      </Container>

      <MobileContainer>
        <PrevBtn onClick={() => setDayIndex((i) => Math.max(0, i - 1))}>‹</PrevBtn>
        <NextBtn onClick={() => setDayIndex((i) => Math.min(6, i + 1))}>›</NextBtn>
        <Slides $index={dayIndex}>
          {DAYS.map((day, di) => (
            <DaySlide key={day}>
              <DayTitle>{day}</DayTitle>
              <MealStack>
                {MEALS.map((mealLabel, mi) => (
                  <div key={mi}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#8b6a45', marginBottom: 4 }}>
                      {mealLabel}
                    </div>
                    {renderMealCard(di, mi)}
                  </div>
                ))}
              </MealStack>
            </DaySlide>
          ))}
        </Slides>
      </MobileContainer>

      {detail && (
        <Overlay onClick={() => setDetail(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>
                <ChefHat size={22} style={{ verticalAlign: 'sub', marginRight: 6 }} />
                {detail.meal.name}
              </h2>
              <CloseBtn onClick={() => setDetail(null)}>
                <X size={18} />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <CuisineTag style={{ padding: '4px 12px', fontSize: 13 }}>{detail.meal.cuisine}</CuisineTag>
                <span style={{ padding: '4px 12px', background: '#fff3dc', borderRadius: 10, fontSize: 13, color: '#8b6a45' }}>
                  <Clock size={12} style={{ verticalAlign: 'sub' }} /> {detail.meal.cookTime} 分钟
                </span>
              </div>
              <SectionTitle>
                <Utensils size={16} /> 所需食材
              </SectionTitle>
              <IngredientList>
                {detail.meal.ingredients.map((ing, i) => (
                  <li key={i}>
                    <span>{ing.name}</span>
                    <span style={{ color: '#8b6a45', fontSize: 13 }}>{ing.amount}</span>
                  </li>
                ))}
              </IngredientList>
              <SectionTitle>
                <ChefHat size={16} /> 简要步骤
              </SectionTitle>
              <StepList>
                {detail.meal.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </StepList>
            </ModalBody>
          </ModalCard>
        </Overlay>
      )}
    </>
  );
}
