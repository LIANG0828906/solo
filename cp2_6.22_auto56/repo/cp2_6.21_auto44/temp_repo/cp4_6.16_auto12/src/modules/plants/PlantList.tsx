import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { usePlantsStore, PlantWithStats } from './plantsStore';
import CareButton from '../../shared/components/CareButton';

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

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 20px 16px 100px;
  max-width: 720px;
  margin: 0 auto;
`;

const PageHeader = styled.header`
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PageTitle = styled.h1`
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.5px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  transform: translateZ(0);
  will-change: transform;

  &:active {
    transform: scale(0.96) translateZ(0);
  }
`;

const PlantGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const PlantCard = styled.div<{ $warning: boolean }>`
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-card);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  cursor: pointer;
  transform: translateZ(0);
  will-change: transform;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px) translateZ(0);
    box-shadow: var(--shadow-card-hover);
  }

  &:active {
    transform: scale(0.98) translateZ(0);
  }

  ${({ $warning }) =>
    $warning &&
    css`
      &::before {
        content: '⚠️ 需要浇水';
        position: absolute;
        top: 12px;
        right: 12px;
        background: var(--color-warning-soft);
        color: var(--color-warning);
        font-size: 12px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
        animation: ${pulseWarning} 2s ease-in-out infinite;
        will-change: opacity, transform;
        transform: translateZ(0);
        z-index: 2;
      }
    `}
`;

const CardTop = styled.div`
  display: flex;
  gap: 14px;
  margin-bottom: 12px;
`;

const PlantPhoto = styled.div<{ $src: string }>`
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  background-image: url(${({ $src }) => $src});
  background-size: cover;
  background-position: center;
  background-color: var(--color-primary-soft);
  flex-shrink: 0;
  transform: translateZ(0);
  will-change: transform;
`;

const PlantInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlantName = styled.h3`
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PlantSpecies = styled.p`
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
`;

const DaysBadge = styled.span<{ $overdue: boolean }>`
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ $overdue }) => ($overdue ? 'var(--color-warning-soft)' : 'var(--color-primary-soft)')};
  color: ${({ $overdue }) => ($overdue ? 'var(--color-warning)' : 'var(--color-primary-dark)')};
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid rgba(76, 175, 80, 0.1);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: var(--color-text-muted);
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  margin-bottom: 8px;
`;

const EmptyHint = styled.p`
  font-size: 13px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`;

const ModalCard = styled.div`
  background: var(--color-bg-warm);
  border-radius: var(--radius-xl);
  padding: 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15);
`;

const ModalTitle = styled.h2`
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--color-text);
`;

const FormGroup = styled.div`
  margin-bottom: 14px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: var(--radius-sm);
  font-size: 15px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--color-primary);
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const CancelBtn = styled.button`
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 14px;
  color: var(--color-text-secondary);
  background: rgba(0, 0, 0, 0.05);
  transition: background 0.2s ease;
`;

const SubmitBtn = styled.button`
  padding: 10px 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: var(--color-primary);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.96);
  }
`;

const PLANT_PHOTO_URL = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green%20potted%20plant%20on%20white%20background%2C%20soft%20natural%20lighting%2C%20minimalist%20style&image_size=square';

function formatDaysSince(days: number | null): string {
  if (days === null) return '从未浇水';
  if (days === 0) return '今天浇过';
  return `${days}天前浇水`;
}

export default function PlantList() {
  const navigate = useNavigate();
  const { plants, loading, hydrated, loadPlants, addPlant, addCareRecord } = usePlantsStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSpecies, setFormSpecies] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPhoto, setFormPhoto] = useState('');

  useEffect(() => {
    if (!hydrated) {
      loadPlants();
    }
  }, [hydrated, loadPlants]);

  const handleAddPlant = useCallback(async () => {
    if (!formName.trim()) return;
    await addPlant({
      name: formName.trim(),
      species: formSpecies.trim() || '未知品种',
      purchaseDate: formDate ? new Date(formDate).getTime() : Date.now(),
      photo: formPhoto || PLANT_PHOTO_URL,
    });
    setShowAddModal(false);
    setFormName('');
    setFormSpecies('');
    setFormDate('');
    setFormPhoto('');
  }, [formName, formSpecies, formDate, formPhoto, addPlant]);

  const handleCare = useCallback(
    async (plantId: string, type: 'water' | 'fertilize' | 'repot') => {
      await addCareRecord({ plantId, type });
    },
    [addCareRecord],
  );

  const handleCardClick = useCallback(
    (plantId: string) => {
      navigate(`/plant/${plantId}`);
    },
    [navigate],
  );

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>🌿 我的植物</PageTitle>
        <AddButton onClick={() => setShowAddModal(true)}>+ 添加植物</AddButton>
      </PageHeader>

      {loading && !hydrated ? (
        <EmptyState>
          <EmptyIcon>🌱</EmptyIcon>
          <EmptyText>加载中...</EmptyText>
        </EmptyState>
      ) : plants.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🪴</EmptyIcon>
          <EmptyText>还没有添加任何植物</EmptyText>
          <EmptyHint>点击右上角添加你的第一盆绿植吧</EmptyHint>
        </EmptyState>
      ) : (
        <PlantGrid>
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              $warning={plant.needsWaterWarning}
              onClick={() => handleCardClick(plant.id)}
              data-testid={`plant-card-${plant.id}`}
            >
              <CardTop>
                <PlantPhoto $src={plant.photo} />
                <PlantInfo>
                  <PlantName>{plant.name}</PlantName>
                  <PlantSpecies>{plant.species}</PlantSpecies>
                  <DaysBadge $overdue={plant.needsWaterWarning}>
                    {formatDaysSince(plant.daysSinceLastWater)}
                  </DaysBadge>
                </PlantInfo>
              </CardTop>
              <CardActions onClick={(e) => e.stopPropagation()}>
                <CareButton
                  type="water"
                  size="sm"
                  onClick={() => handleCare(plant.id, 'water')}
                />
                <CareButton
                  type="fertilize"
                  size="sm"
                  onClick={() => handleCare(plant.id, 'fertilize')}
                />
                <CareButton
                  type="repot"
                  size="sm"
                  onClick={() => handleCare(plant.id, 'repot')}
                />
              </CardActions>
            </PlantCard>
          ))}
        </PlantGrid>
      )}

      {showAddModal && (
        <ModalOverlay onClick={() => setShowAddModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>🌱 添加新植物</ModalTitle>
            <FormGroup>
              <FormLabel>植物名称 *</FormLabel>
              <FormInput
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="例如：小绿"
                data-testid="input-plant-name"
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>品种</FormLabel>
              <FormInput
                value={formSpecies}
                onChange={(e) => setFormSpecies(e.target.value)}
                placeholder="例如：绿萝"
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>购买日期</FormLabel>
              <FormInput
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>照片URL（可选）</FormLabel>
              <FormInput
                value={formPhoto}
                onChange={(e) => setFormPhoto(e.target.value)}
                placeholder="留空使用默认图片"
              />
            </FormGroup>
            <ModalActions>
              <CancelBtn onClick={() => setShowAddModal(false)}>取消</CancelBtn>
              <SubmitBtn
                onClick={handleAddPlant}
                disabled={!formName.trim()}
                data-testid="submit-add-plant"
              >
                添加
              </SubmitBtn>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}
