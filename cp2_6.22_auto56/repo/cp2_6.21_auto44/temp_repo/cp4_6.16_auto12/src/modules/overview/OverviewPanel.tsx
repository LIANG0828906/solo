import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import {
  usePlantsStore,
  PlantWithStats,
  PaginatedResult,
  CARE_THRESHOLDS,
} from '../plants/plantsStore';
import CareButton from '../../shared/components/CareButton';

const PAGE_SIZE = 20;

const pulseWarning = keyframes`
  0%, 100% {
    opacity: 1;
    transform: translateZ(0);
  }
  50% {
    opacity: 0.4;
    transform: translateZ(0);
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px) translateZ(0);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateZ(0);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 0 0 100px;
  max-width: 720px;
  margin: 0 auto;
  overscroll-behavior-y: contain;
`;

const HeroSection = styled.section`
  position: relative;
  padding: 32px 20px 24px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  margin-bottom: 20px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -30px;
    left: 20px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    pointer-events: none;
  }
`;

const HeroTitle = styled.h1`
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
`;

const HeroSubtitle = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 16px;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
`;

const StatChip = styled.div<{ $variant?: 'default' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  ${({ $variant }) =>
    $variant === 'warning' &&
    css`
      background: rgba(239, 83, 80, 0.35);
      animation: ${pulseWarning} 2s ease-in-out infinite;
      will-change: opacity, transform;
      transform: translateZ(0);
    `}
`;

const ContentSection = styled.section`
  padding: 0 16px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
`;

const ViewAllBtn = styled.button`
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
  padding: 4px 8px;
`;

const PullIndicator = styled.div<{ $visible: boolean; $pulling: boolean }>`
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: var(--color-text-muted);
  transition: opacity 0.3s ease;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateZ(0);
  will-change: opacity;
`;

const PlantScrollList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PlantCard = styled.div<{ $warning: boolean; $delay: number }>`
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transform: translateZ(0);
  will-change: transform;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  animation: ${fadeInUp} 0.4s ease-out backwards;
  animation-delay: ${({ $delay }) => $delay * 60}ms;
  overflow: hidden;

  &:active {
    transform: scale(0.98) translateZ(0);
  }

  ${({ $warning }) =>
    $warning &&
    css`
      border-left: 3px solid var(--color-warning);
      &::after {
        content: '💧';
        position: absolute;
        top: 8px;
        right: 10px;
        font-size: 14px;
        animation: ${pulseWarning} 2s ease-in-out infinite;
        will-change: opacity, transform;
        transform: translateZ(0);
      }
    `}
`;

const CardPhoto = styled.div<{ $src: string }>`
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background-image: url(${({ $src }) => $src});
  background-size: cover;
  background-position: center;
  background-color: var(--color-primary-soft);
  flex-shrink: 0;
  transform: translateZ(0);
  will-change: transform;
  transition: transform 0.3s ease;

  ${PlantCard}:hover & {
    transform: scale(1.05) translateZ(0);
  }
`;

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardMeta = styled.p`
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
`;

const CardCareButtons = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const LoadMoreBtn = styled.button`
  display: block;
  width: 100%;
  padding: 14px;
  margin-top: 12px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
  text-align: center;
  transition: background 0.2s ease;
  will-change: transform;
  transform: translateZ(0);

  &:active {
    background: var(--color-primary-soft);
  }
`;

const EmptyOverview = styled.div`
  text-align: center;
  padding: 60px 20px;
`;

const EmptyIcon = styled.div`
  font-size: 56px;
  margin-bottom: 12px;
`;

const EmptyText = styled.p`
  font-size: 15px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
`;

function formatDaysLabel(days: number | null, label: string): string {
  if (days === null) return `${label}: 从未`;
  if (days === 0) return `${label}: 今天`;
  return `${label}: ${days}天前`;
}

interface TouchState {
  startY: number;
  currentY: number;
  isPulling: boolean;
}

export default function OverviewPanel() {
  const navigate = useNavigate();
  const { plants, loading, hydrated, loadPlants, addCareRecord, loadPlantsPaginated } =
    usePlantsStore();

  const [displayedPlants, setDisplayedPlants] = useState<PlantWithStats[]>([]);
  const [paginationCursor, setPaginationCursor] = useState<number | null>(null);
  const [hasMorePlants, setHasMorePlants] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const touchStateRef = useRef<TouchState>({
    startY: 0,
    currentY: 0,
    isPulling: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) {
      loadInitialPage();
    } else {
      setDisplayedPlants(plants.slice(0, PAGE_SIZE));
      setHasMorePlants(plants.length > PAGE_SIZE);
    }
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && plants.length > 0) {
      setDisplayedPlants(plants.slice(0, PAGE_SIZE));
      setHasMorePlants(plants.length > PAGE_SIZE);
      setPaginationCursor(null);
    }
  }, [plants]);

  const loadInitialPage = useCallback(async () => {
    await loadPlants();
  }, [loadPlants]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadPlants();
      setPaginationCursor(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadPlants]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMorePlants) return;
    setIsLoadingMore(true);
    try {
      const nextPage = plants.slice(
        displayedPlants.length,
        displayedPlants.length + PAGE_SIZE,
      );
      setDisplayedPlants((prev) => [...prev, ...nextPage]);
      setHasMorePlants(displayedPlants.length + nextPage.length < plants.length);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMorePlants, plants, displayedPlants]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStateRef.current = {
      startY: touch.clientY,
      currentY: touch.clientY,
      isPulling: false,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const state = touchStateRef.current;
    state.currentY = touch.clientY;
    const diff = state.currentY - state.startY;

    if (diff > 60 && !state.isPulling) {
      state.isPulling = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const state = touchStateRef.current;
    if (state.isPulling) {
      handleRefresh();
    }
    touchStateRef.current = {
      startY: 0,
      currentY: 0,
      isPulling: false,
    };
  }, [handleRefresh]);

  const handleTouchCancel = useCallback(() => {
    touchStateRef.current = {
      startY: 0,
      currentY: 0,
      isPulling: false,
    };
  }, []);

  const handleCare = useCallback(
    async (plantId: string, type: 'water' | 'fertilize' | 'repot') => {
      await addCareRecord({ plantId, type });
    },
    [addCareRecord],
  );

  const warningCount = plants.filter((p) => p.needsWaterWarning).length;
  const totalPlants = plants.length;

  return (
    <PageContainer
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <HeroSection>
        <HeroTitle>🌿 绿植照料</HeroTitle>
        <HeroSubtitle>记录成长，用心陪伴</HeroSubtitle>
        <StatsRow>
          <StatChip>🌱 {totalPlants} 盆植物</StatChip>
          {warningCount > 0 && <StatChip $variant="warning">⚠️ {warningCount} 盆需浇水</StatChip>}
          <StatChip>💧 7天浇水周期</StatChip>
        </StatsRow>
      </HeroSection>

      <PullIndicator $visible={isRefreshing} $pulling={isRefreshing}>
        {isRefreshing ? '🔄 刷新中...' : '↓ 下拉刷新'}
      </PullIndicator>

      <ContentSection>
        <SectionHeader>
          <SectionTitle>植物概览</SectionTitle>
          <ViewAllBtn onClick={() => navigate('/plants')}>查看全部 →</ViewAllBtn>
        </SectionHeader>

        {loading && !hydrated ? (
          <EmptyOverview>
            <EmptyIcon>🌱</EmptyIcon>
            <EmptyText>加载中...</EmptyText>
          </EmptyOverview>
        ) : displayedPlants.length === 0 ? (
          <EmptyOverview>
            <EmptyIcon>🪴</EmptyIcon>
            <EmptyText>还没有添加任何植物</EmptyText>
          </EmptyOverview>
        ) : (
          <PlantScrollList>
            {displayedPlants.map((plant, index) => (
              <PlantCard
                key={plant.id}
                $warning={plant.needsWaterWarning}
                $delay={index}
                onClick={() => navigate(`/plant/${plant.id}`)}
                data-testid={`overview-plant-${plant.id}`}
              >
                <CardPhoto $src={plant.photo} />
                <CardInfo>
                  <CardName>{plant.name}</CardName>
                  <CardMeta>
                    {formatDaysLabel(plant.daysSinceLastWater, '浇水')}
                    {' · '}
                    {formatDaysLabel(plant.daysSinceLastFertilize, '施肥')}
                  </CardMeta>
                </CardInfo>
                <CardCareButtons onClick={(e) => e.stopPropagation()}>
                  <CareButton
                    type="water"
                    size="sm"
                    onClick={() => handleCare(plant.id, 'water')}
                  />
                </CardCareButtons>
              </PlantCard>
            ))}
          </PlantScrollList>
        )}

        {hasMorePlants && (
          <LoadMoreBtn onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? '加载中...' : '加载更多'}
          </LoadMoreBtn>
        )}
      </ContentSection>
    </PageContainer>
  );
}
