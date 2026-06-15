import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  usePlantsStore,
  CareRecord,
  CareType,
  fetchPlantById,
  fetchRecordsByPlantId,
} from '../plants/plantsStore';
import CareButton from '../../shared/components/CareButton';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px) translateZ(0);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateZ(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96) translateZ(0);
  }
  to {
    opacity: 1;
    transform: scale(1) translateZ(0);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  max-width: 720px;
  margin: 0 auto;
`;

const HeroBanner = styled.div<{ $src: string }>`
  position: relative;
  height: 240px;
  background-image: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4)),
    url(${({ $src }) => $src});
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  padding: 20px;
  animation: ${scaleIn} 0.4s ease-out;
  transform: translateZ(0);
  will-change: transform, opacity;
`;

const BackBtn = styled.button`
  position: absolute;
  top: 16px;
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateZ(0);
  will-change: transform;
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.9) translateZ(0);
  }
`;

const HeroInfo = styled.div`
  color: white;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
`;

const HeroName = styled.h1`
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 2px;
`;

const HeroSpecies = styled.p`
  font-size: 14px;
  opacity: 0.85;
`;

const ContentArea = styled.div`
  padding: 20px 16px 100px;
`;

const CareActions = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const TimelineSection = styled.section``;

const SectionTitle = styled.h2`
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 16px;
`;

const TimelineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding-left: 28px;

  &::before {
    content: '';
    position: absolute;
    left: 9px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: var(--color-primary-soft);
    border-radius: 1px;
  }
`;

const TimelineItem = styled.div`
  position: relative;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.06);
  animation: ${fadeIn} 0.3s ease-out backwards;
  transform: translateZ(0);
  will-change: transform, opacity;

  &::before {
    content: '';
    position: absolute;
    left: -23px;
    top: 18px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid white;
    box-shadow: 0 0 0 2px var(--color-primary-soft);
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ItemType = styled.span<{ $type: CareType }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 500;
  color: ${({ $type }) =>
    $type === 'water'
      ? '#42A5F5'
      : $type === 'fertilize'
        ? '#66BB6A'
        : '#FFA726'};
`;

const ItemTime = styled.span`
  font-size: 12px;
  color: var(--color-text-muted);
`;

const ItemNote = styled.p`
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ActionBtn = styled.button`
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--color-text-secondary);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
`;

const DeleteBtn = styled(ActionBtn)`
  color: var(--color-warning);
  background: var(--color-warning-bg);

  &:hover {
    background: var(--color-warning-soft);
  }
`;

const EmptyTimeline = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
  font-size: 14px;
`;

const EditModalOverlay = styled.div`
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

const EditModalCard = styled.div`
  background: var(--color-bg-warm);
  border-radius: var(--radius-xl);
  padding: 28px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15);
  animation: ${scaleIn} 0.3s ease-out;
  transform: translateZ(0);
`;

const EditTitle = styled.h2`
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text);
`;

const FormGroup = styled.div`
  margin-bottom: 12px;
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

  &:focus {
    border-color: var(--color-primary);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: var(--radius-sm);
  font-size: 15px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text);
  outline: none;
  resize: vertical;
  min-height: 60px;

  &:focus {
    border-color: var(--color-primary);
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const CancelBtn = styled.button`
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 14px;
  color: var(--color-text-secondary);
  background: rgba(0, 0, 0, 0.05);
`;

const SaveBtn = styled.button`
  padding: 10px 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: var(--color-primary);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
`;

const CARE_LABELS: Record<CareType, { icon: string; label: string }> = {
  water: { icon: '💧', label: '浇水' },
  fertilize: { icon: '🌱', label: '施肥' },
  repot: { icon: '🪴', label: '换盆' },
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addCareRecord, updateCareRecord, deleteCareRecord } = usePlantsStore();

  const [plant, setPlant] = useState<{ name: string; species: string; photo: string } | null>(null);
  const [records, setRecords] = useState<CareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRecord, setEditRecord] = useState<CareRecord | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editTimestamp, setEditTimestamp] = useState('');

  const loadTimeline = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await fetchPlantById(id);
      if (p) {
        setPlant({ name: p.name, species: p.species, photo: p.photo });
      }
      const r = await fetchRecordsByPlantId(id);
      setRecords(r.sort((a, b) => b.timestamp - a.timestamp));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const handleCare = useCallback(
    async (type: CareType) => {
      if (!id) return;
      await addCareRecord({ plantId: id, type });
      await loadTimeline();
    },
    [id, addCareRecord, loadTimeline],
  );

  const handleEdit = useCallback((record: CareRecord) => {
    setEditRecord(record);
    setEditNote(record.note ?? '');
    setEditTimestamp(new Date(record.timestamp).toISOString().slice(0, 16));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editRecord) return;
    const updated: CareRecord = {
      ...editRecord,
      note: editNote.trim() || undefined,
      timestamp: editTimestamp ? new Date(editTimestamp).getTime() : editRecord.timestamp,
    };
    await updateCareRecord(updated);
    setEditRecord(null);
    await loadTimeline();
  }, [editRecord, editNote, editTimestamp, updateCareRecord, loadTimeline]);

  const handleDelete = useCallback(
    async (recordId: string) => {
      await deleteCareRecord(recordId);
      await loadTimeline();
    },
    [deleteCareRecord, loadTimeline],
  );

  if (!id) return null;

  return (
    <PageContainer>
      <HeroBanner $src={plant?.photo ?? ''}>
        <BackBtn onClick={() => navigate(-1)}>←</BackBtn>
        {plant && (
          <HeroInfo>
            <HeroName>{plant.name}</HeroName>
            <HeroSpecies>{plant.species}</HeroSpecies>
          </HeroInfo>
        )}
      </HeroBanner>

      <ContentArea>
        <CareActions>
          <CareButton type="water" onClick={() => handleCare('water')} />
          <CareButton type="fertilize" onClick={() => handleCare('fertilize')} />
          <CareButton type="repot" onClick={() => handleCare('repot')} />
        </CareActions>

        <TimelineSection>
          <SectionTitle>照料时间线</SectionTitle>

          {loading ? (
            <EmptyTimeline>加载中...</EmptyTimeline>
          ) : records.length === 0 ? (
            <EmptyTimeline>还没有照料记录，点击上方按钮记录第一次照料吧 🌱</EmptyTimeline>
          ) : (
            <TimelineList>
              {records.map((record, idx) => {
                const cfg = CARE_LABELS[record.type];
                return (
                  <TimelineItem
                    key={record.id}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    data-testid={`timeline-record-${record.id}`}
                  >
                    <ItemHeader>
                      <ItemType $type={record.type}>
                        {cfg.icon} {cfg.label}
                      </ItemType>
                      <ItemTime>{formatTimestamp(record.timestamp)}</ItemTime>
                    </ItemHeader>
                    {record.note && <ItemNote>{record.note}</ItemNote>}
                    <ItemActions>
                      <ActionBtn onClick={() => handleEdit(record)}>编辑</ActionBtn>
                      <DeleteBtn onClick={() => handleDelete(record.id)}>删除</DeleteBtn>
                    </ItemActions>
                  </TimelineItem>
                );
              })}
            </TimelineList>
          )}
        </TimelineSection>
      </ContentArea>

      {editRecord && (
        <EditModalOverlay onClick={() => setEditRecord(null)}>
          <EditModalCard onClick={(e) => e.stopPropagation()}>
            <EditTitle>编辑记录</EditTitle>
            <FormGroup>
              <FormLabel>时间</FormLabel>
              <FormInput
                type="datetime-local"
                value={editTimestamp}
                onChange={(e) => setEditTimestamp(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>备注</FormLabel>
              <FormTextarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="添加备注..."
              />
            </FormGroup>
            <ModalActions>
              <CancelBtn onClick={() => setEditRecord(null)}>取消</CancelBtn>
              <SaveBtn onClick={handleSaveEdit}>保存</SaveBtn>
            </ModalActions>
          </EditModalCard>
        </EditModalOverlay>
      )}
    </PageContainer>
  );
}
