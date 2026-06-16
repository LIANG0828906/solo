import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { usePlantStore, CareRecord } from '../store/plantStore';
import { getDaysSinceLastWatering, getWateringStatus, getStatusColor } from '../utils/plantData';
import { CARE_TYPE_COLORS, CARE_TYPE_LABELS, CARE_TYPE_ICONS } from '../utils/calendarHelper';

const AddRecordModal = ({
  isOpen,
  onClose,
  onSubmit,
  type
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  type: 'watering' | 'fertilizing' | 'repotting';
}) => {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    completed: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, type });
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      completed: true
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="animate-slide-up">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {CARE_TYPE_ICONS[type]} 添加{CARE_TYPE_LABELS[type]}记录
          </h2>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>日期</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="记录养护情况..."
              style={styles.textarea}
              rows={3}
            />
          </div>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.completed}
                onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
                style={styles.checkbox}
              />
              标记为已完成
            </label>
          </div>
          <button type="submit" style={{
            ...styles.submitButton,
            backgroundColor: CARE_TYPE_COLORS[type]
          }}>
            ✨ 添加记录
          </button>
        </form>
      </div>
    </div>
  );
};

const TimelineSection = ({
  title,
  type,
  records,
  onAddRecord,
  plantId
}: {
  title: string;
  type: 'watering' | 'fertilizing' | 'repotting';
  records: CareRecord[];
  onAddRecord: () => void;
  plantId: string;
}) => {
  const toggleRecordCompletion = usePlantStore((state) => state.toggleRecordCompletion);
  const deleteCareRecord = usePlantStore((state) => state.deleteCareRecord);
  const today = format(new Date(), 'yyyy-MM-dd');

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  return (
    <div style={styles.timelineSection}>
      <div style={styles.timelineHeader}>
        <h3 style={styles.timelineTitle}>
          <span style={styles.timelineIcon}>{CARE_TYPE_ICONS[type]}</span>
          {title}
          <span style={styles.recordCount}>{records.length}</span>
        </h3>
        <button style={{
          ...styles.addRecordBtn,
          backgroundColor: CARE_TYPE_COLORS[type] + '20',
          color: CARE_TYPE_COLORS[type]
        }} onClick={onAddRecord}>
          + 添加
        </button>
      </div>
      
      <div style={styles.timeline}>
        {sortedRecords.length === 0 ? (
          <div style={styles.emptyTimeline}>
            <span style={styles.emptyIcon}>📝</span>
            <p style={styles.emptyText}>还没有{CARE_TYPE_LABELS[type]}记录</p>
          </div>
        ) : (
          sortedRecords.map((record, index) => {
            const isToday = record.date === today;
            const isPast = record.date < today;
            
            return (
              <div
                key={record.id}
                style={{
                  ...styles.timelineItem,
                  animationDelay: `${index * 0.05}s`
                }}
                className="animate-fade-in"
              >
                <div style={styles.timelineLine} />
                <div style={{
                  ...styles.timelineDot,
                  backgroundColor: CARE_TYPE_COLORS[type],
                  borderColor: record.completed ? CARE_TYPE_COLORS[type] : 'transparent'
                }}>
                  {record.completed && <span style={styles.dotCheck}>✓</span>}
                </div>
                
                <div style={{
                  ...styles.timelineBubble,
                  backgroundColor: isToday ? CARE_TYPE_COLORS[type] + '15' : 'rgba(107, 142, 35, 0.05)',
                  borderColor: isToday ? CARE_TYPE_COLORS[type] : 'rgba(107, 142, 35, 0.1)',
                  opacity: isPast && !record.completed ? 0.5 : 1
                }}>
                  <div style={styles.bubbleHeader}>
                    <span style={{
                      ...styles.bubbleDate,
                      color: isToday ? CARE_TYPE_COLORS[type] : 'var(--text-secondary)'
                    }}>
                      {format(new Date(record.date), 'MM月dd日')}
                      {isToday && <span style={styles.todayTag}>今天</span>}
                    </span>
                    <div style={styles.bubbleActions}>
                      <button
                        style={{
                          ...styles.actionBtn,
                          color: record.completed ? 'var(--status-green)' : 'var(--text-muted)'
                        }}
                        onClick={() => toggleRecordCompletion(record.id)}
                        title={record.completed ? '标记为未完成' : '标记为已完成'}
                      >
                        {record.completed ? '✓' : '○'}
                      </button>
                      <button
                        style={{ ...styles.actionBtn, color: 'var(--status-red)' }}
                        onClick={() => deleteCareRecord(record.id)}
                        title="删除记录"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {record.notes && (
                    <p style={styles.bubbleNotes}>{record.notes}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const PlantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getPlantById = usePlantStore((state) => state.getPlantById);
  const getRecordsByType = usePlantStore((state) => state.getRecordsByType);
  const getLastWateringDate = usePlantStore((state) => state.getLastWateringDate);
  const addCareRecord = usePlantStore((state) => state.addCareRecord);
  const deletePlant = usePlantStore((state) => state.deletePlant);

  const [modalType, setModalType] = useState<'watering' | 'fertilizing' | 'repotting' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const plant = id ? getPlantById(id) : undefined;

  const wateringRecords = useMemo(() => 
    id ? getRecordsByType(id, 'watering') : [], 
    [id, getRecordsByType]
  );
  
  const fertilizingRecords = useMemo(() => 
    id ? getRecordsByType(id, 'fertilizing') : [], 
    [id, getRecordsByType]
  );
  
  const repottingRecords = useMemo(() => 
    id ? getRecordsByType(id, 'repotting') : [], 
    [id, getRecordsByType]
  );

  if (!plant) {
    return (
      <div style={styles.notFound}>
        <span style={styles.notFoundIcon}>🌿</span>
        <h2 style={styles.notFoundTitle}>找不到这株植物</h2>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          ← 返回首页
        </button>
      </div>
    );
  }

  const lastWateringDate = getLastWateringDate(plant.id);
  const daysSinceWatering = getDaysSinceLastWatering(lastWateringDate);
  const status = getWateringStatus(daysSinceWatering, plant.wateringInterval);
  const statusColor = getStatusColor(status);
  const daysOwned = differenceInDays(new Date(), new Date(plant.purchaseDate));

  const handleAddRecord = (data: any) => {
    if (id) {
      addCareRecord({
        plantId: id,
        ...data
      });
    }
  };

  const handleDeletePlant = () => {
    if (id) {
      deletePlant(id);
      navigate('/');
    }
  };

  const getImageUrl = () => {
    const prompts: Record<string, string> = {
      '绿萝': 'green%20pothos%20plant%20in%20white%20pot%20indoor',
      '多肉': 'succulent%20plants%20in%20ceramic%20pot',
      '龟背竹': 'monstera%20deliciosa%20plant%20large%20leaves',
      '琴叶榕': 'fiddle%20leaf%20fig%20tree%20in%20modern%20pot',
      '吊兰': 'spider%20plant%20hanging%20basket',
      '发财树': 'money%20tree%20plant%20pachira%20aquatica',
      '虎皮兰': 'snake%20plant%20sansevieria%20in%20pot',
      '常春藤': 'english%20ivy%20plant%20green%20leaves',
      '文竹': 'asparagus%20fern%20plant%20delicate%20leaves',
      '君子兰': 'clivia%20plant%20orange%20flowers'
    };
    const prompt = prompts[plant.species] || 'house%20plant%20in%20pot';
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=portrait_4_3`;
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1 style={styles.title}>{plant.name}</h1>
        <button
          style={styles.deleteBtn}
          onClick={() => setShowDeleteConfirm(true)}
        >
          🗑️ 删除
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.leftPanel}>
          <div style={styles.imageContainer}>
            {plant.avatar ? (
              <img src={plant.avatar} alt={plant.name} style={styles.plantImage} />
            ) : (
              <div style={styles.imageWrapper}>
                <img src={getImageUrl()} alt={plant.name} style={styles.plantImage} />
                <div style={styles.imageOverlay} />
                <div style={styles.imageGlow} />
              </div>
            )}
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <span style={styles.infoEmoji}>{plant.emoji}</span>
              <div>
                <h2 style={styles.infoName}>{plant.name}</h2>
                <p style={styles.infoSpecies}>{plant.species}</p>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>浇水周期</span>
                <span style={styles.infoValue}>{plant.wateringInterval}天</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>光照需求</span>
                <span style={styles.infoValue}>{plant.lightRequirement}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>养护天数</span>
                <span style={styles.infoValue}>{daysOwned}天</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>上次浇水</span>
                <span style={{ ...styles.infoValue, color: statusColor }}>
                  {daysSinceWatering === 999 ? '未记录' : `${daysSinceWatering}天前`}
                </span>
              </div>
            </div>

            {plant.notes && (
              <div style={styles.notesSection}>
                <span style={styles.notesLabel}>备注</span>
                <p style={styles.notesText}>{plant.notes}</p>
              </div>
            )}

            <div style={styles.healthScore}>
              <span style={styles.healthLabel}>健康状态</span>
              <div style={{
                ...styles.healthBadge,
                backgroundColor: statusColor + '20',
                color: statusColor
              }}>
                <div style={{ ...styles.healthDot, backgroundColor: statusColor }} />
                {status === 'good' ? '状态良好' : status === 'warning' ? '需要关注' : '急需浇水'}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.rightPanel}>
          <TimelineSection
            title="浇水记录"
            type="watering"
            records={wateringRecords}
            onAddRecord={() => setModalType('watering')}
            plantId={plant.id}
          />
          <TimelineSection
            title="施肥记录"
            type="fertilizing"
            records={fertilizingRecords}
            onAddRecord={() => setModalType('fertilizing')}
            plantId={plant.id}
          />
          <TimelineSection
            title="换盆记录"
            type="repotting"
            records={repottingRecords}
            onAddRecord={() => setModalType('repotting')}
            plantId={plant.id}
          />
        </div>
      </div>

      {modalType && (
        <AddRecordModal
          isOpen={true}
          onClose={() => setModalType(null)}
          onSubmit={handleAddRecord}
          type={modalType}
        />
      )}

      {showDeleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()} className="animate-slide-up">
            <h3 style={styles.confirmTitle}>⚠️ 确认删除</h3>
            <p style={styles.confirmText}>确定要删除「{plant.name}」吗？所有相关的养护记录也会被删除。</p>
            <div style={styles.confirmActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button
                style={styles.confirmDeleteBtn}
                onClick={handleDeletePlant}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--card-bg)',
    border: '1px solid rgba(107, 142, 35, 0.2)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  deleteBtn: {
    padding: '10px 20px',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    border: '1px solid rgba(244, 67, 54, 0.3)',
    borderRadius: '8px',
    color: 'var(--status-red)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '24px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },
  imageContainer: {
    borderRadius: '14px',
    overflow: 'hidden',
    backgroundColor: 'var(--card-bg)',
    border: '2px solid var(--border-color)',
    height: '320px'
  },
  imageWrapper: {
    position: 'relative' as const,
    width: '100%',
    height: '100%'
  },
  plantImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const
  },
  imageOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(107, 142, 35, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)',
    pointerEvents: 'none' as const
  },
  imageGlow: {
    position: 'absolute' as const,
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
    pointerEvents: 'none' as const
  },
  infoCard: {
    backgroundColor: 'var(--card-bg)',
    border: '2px solid var(--border-color)',
    borderRadius: '14px',
    padding: '20px'
  },
  infoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(107, 142, 35, 0.1)'
  },
  infoEmoji: {
    fontSize: '48px'
  },
  infoName: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  infoSpecies: {
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  infoLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)'
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  notesSection: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'rgba(107, 142, 35, 0.05)',
    borderRadius: '8px'
  },
  notesLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '4px'
  },
  notesText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5
  },
  healthScore: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    borderTop: '1px solid rgba(107, 142, 35, 0.1)'
  },
  healthLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  healthBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500
  },
  healthDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  rightPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '1fr'
    }
  },
  timelineSection: {
    backgroundColor: 'var(--card-bg)',
    border: '2px solid var(--border-color)',
    borderRadius: '14px',
    padding: '16px',
    maxHeight: '600px',
    display: 'flex',
    flexDirection: 'column' as const
  },
  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  timelineTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  timelineIcon: {
    fontSize: '18px'
  },
  recordCount: {
    backgroundColor: 'rgba(107, 142, 35, 0.1)',
    color: 'var(--primary-green)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 500
  },
  addRecordBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  timeline: {
    flex: 1,
    overflowY: 'auto' as const,
    paddingRight: '8px',
    position: 'relative' as const
  },
  emptyTimeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center' as const
  },
  emptyIcon: {
    fontSize: '32px',
    marginBottom: '8px',
    opacity: 0.5
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--text-muted)'
  },
  timelineItem: {
    position: 'relative' as const,
    paddingLeft: '28px',
    marginBottom: '16px',
    opacity: 0,
    animationFillMode: 'forwards' as const
  },
  timelineLine: {
    position: 'absolute' as const,
    left: '7px',
    top: '20px',
    bottom: '-16px',
    width: '2px',
    backgroundColor: 'rgba(107, 142, 35, 0.2)'
  },
  timelineDot: {
    position: 'absolute' as const,
    left: 0,
    top: '4px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    zIndex: 1
  },
  dotCheck: {
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  timelineBubble: {
    backgroundColor: 'rgba(107, 142, 35, 0.05)',
    border: '1px solid rgba(107, 142, 35, 0.1)',
    borderRadius: '10px',
    padding: '12px',
    transition: 'all 0.3s ease'
  },
  bubbleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },
  bubbleDate: {
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  todayTag: {
    backgroundColor: 'currentColor',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px'
  },
  bubbleActions: {
    display: 'flex',
    gap: '4px'
  },
  actionBtn: {
    width: '22px',
    height: '22px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  bubbleNotes: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4
  },
  notFound: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center' as const
  },
  notFoundIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  notFoundTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '16px'
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '420px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(107, 142, 35, 0.1)'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  form: {
    padding: '24px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid rgba(107, 142, 35, 0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: 'white'
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid rgba(107, 142, 35, 0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical' as const,
    backgroundColor: 'white'
  },
  checkboxGroup: {
    marginBottom: '16px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    cursor: 'pointer'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  confirmModal: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    padding: '24px'
  },
  confirmTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '12px'
  },
  confirmText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '20px'
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: 'rgba(107, 142, 35, 0.1)',
    border: 'none',
    borderRadius: '8px',
    color: 'var(--primary-green)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  confirmDeleteBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--status-red)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
};

export default PlantDetail;
