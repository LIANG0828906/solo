import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantStore, Plant } from '../store/plantStore';
import { getDaysSinceLastWatering, getWateringStatus, getStatusColor, getSpeciesList } from '../utils/plantData';
import { format } from 'date-fns';

const AddPlantModal = ({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    species: '绿萝',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    avatar: null as string | null,
    notes: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      species: '绿萝',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      avatar: null,
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="animate-slide-up">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>🌱 添加新植物</h2>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.avatarUpload}>
            <div style={styles.avatarPreview}>
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" style={styles.avatarImage} />
              ) : (
                <span style={styles.avatarPlaceholder}>📷</span>
              )}
            </div>
            <label style={styles.uploadButton}>
              上传头像
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>植物名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="给你的植物起个名字吧"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>植物种类 *</label>
            <select
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              style={styles.select}
            >
              {getSpeciesList().map((species) => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>购买日期</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="养护位置、特殊注意事项等..."
              style={styles.textarea}
              rows={3}
            />
          </div>

          <button type="submit" style={styles.submitButton}>
            ✨ 添加植物
          </button>
        </form>
      </div>
    </div>
  );
};

const PlantCard = ({ plant, onClick }: { plant: Plant; onClick: () => void }) => {
  const getLastWateringDate = usePlantStore((state) => state.getLastWateringDate);
  const lastWateringDate = getLastWateringDate(plant.id);
  const daysSinceWatering = getDaysSinceLastWatering(lastWateringDate);
  const status = getWateringStatus(daysSinceWatering, plant.wateringInterval);
  const statusColor = getStatusColor(status);

  const getStatusText = () => {
    if (daysSinceWatering === 999) return '还未浇水';
    return `距上次浇水 ${daysSinceWatering} 天`;
  };

  return (
    <div
      style={styles.card}
      onClick={onClick}
      className="animate-fade-in"
    >
      <div style={styles.cardAvatar}>
        {plant.avatar ? (
          <img src={plant.avatar} alt={plant.name} style={styles.avatarImg} />
        ) : (
          <span style={styles.avatarEmoji}>{plant.emoji}</span>
        )}
      </div>
      
      <div style={styles.cardContent}>
        <h3 style={styles.cardName}>{plant.name}</h3>
        <p style={styles.cardSpecies}>{plant.emoji} {plant.species}</p>
        
        <div style={styles.cardInfo}>
          <span style={styles.cardInfoLabel}>浇水周期</span>
          <span style={styles.cardInfoValue}>{plant.wateringInterval}天</span>
        </div>
        
        <div style={styles.cardInfo}>
          <span style={styles.cardInfoLabel}>光照需求</span>
          <span style={styles.cardInfoValue}>{plant.lightRequirement}</span>
        </div>
      </div>

      <div style={{
        ...styles.cardFooter,
        backgroundColor: statusColor + '15',
        borderTopColor: statusColor
      }}>
        <div style={{
          ...styles.statusDot,
          backgroundColor: statusColor
        }} />
        <span style={{ ...styles.statusText, color: statusColor }}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const plants = usePlantStore((state) => state.plants);
  const addPlant = usePlantStore((state) => state.addPlant);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'good' | 'warning' | 'danger'>('all');

  const filteredPlants = useMemo(() => {
    if (filter === 'all') return plants;
    
    return plants.filter((plant) => {
      const getLastWateringDate = usePlantStore.getState().getLastWateringDate;
      const lastWateringDate = getLastWateringDate(plant.id);
      const daysSinceWatering = getDaysSinceLastWatering(lastWateringDate);
      const status = getWateringStatus(daysSinceWatering, plant.wateringInterval);
      return status === filter;
    });
  }, [plants, filter]);

  const handleAddPlant = (data: any) => {
    addPlant(data);
  };

  const stats = useMemo(() => {
    const getLastWateringDate = usePlantStore.getState().getLastWateringDate;
    let good = 0, warning = 0, danger = 0;
    
    plants.forEach((plant) => {
      const lastWateringDate = getLastWateringDate(plant.id);
      const daysSinceWatering = getDaysSinceLastWatering(lastWateringDate);
      const status = getWateringStatus(daysSinceWatering, plant.wateringInterval);
      if (status === 'good') good++;
      else if (status === 'warning') warning++;
      else danger++;
    });
    
    return { total: plants.length, good, warning, danger };
  }, [plants]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>我的植物园</h1>
          <p style={styles.subtitle}>共 {stats.total} 株植物 · 让每一棵都茁壮成长</p>
        </div>
        
        <div style={styles.filterBar}>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'all' ? styles.filterBtnActive : {})
            }}
            onClick={() => setFilter('all')}
          >
            全部 ({stats.total})
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'good' ? { ...styles.filterBtnActive, backgroundColor: 'rgba(76, 175, 80, 0.2)', color: 'var(--status-green)' } : {})
            }}
            onClick={() => setFilter('good')}
          >
            状态良好 ({stats.good})
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'warning' ? { ...styles.filterBtnActive, backgroundColor: 'rgba(255, 193, 7, 0.2)', color: 'var(--status-yellow)' } : {})
            }}
            onClick={() => setFilter('warning')}
          >
            需关注 ({stats.warning})
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'danger' ? { ...styles.filterBtnActive, backgroundColor: 'rgba(244, 67, 54, 0.2)', color: 'var(--status-red)' } : {})
            }}
            onClick={() => setFilter('danger')}
          >
            急需浇水 ({stats.danger})
          </button>
        </div>
      </div>

      {filteredPlants.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🌱</span>
          <h3 style={styles.emptyTitle}>还没有植物</h3>
          <p style={styles.emptyDesc}>点击右下角的 + 按钮添加你的第一株植物吧</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredPlants.map((plant, index) => (
            <div
              key={plant.id}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <PlantCard
                plant={plant}
                onClick={() => navigate(`/plant/${plant.id}`)}
              />
            </div>
          ))}
        </div>
      )}

      <button
        style={styles.fab}
        onClick={() => setIsModalOpen(true)}
      >
        <span style={styles.fabIcon}>+</span>
      </button>

      <AddPlantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddPlant}
      />
    </div>
  );
};

const styles = {
  container: {
    position: 'relative' as const,
    minHeight: 'calc(100vh - 100px)'
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '16px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const
  },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid transparent'
  },
  filterBtnActive: {
    backgroundColor: 'rgba(107, 142, 35, 0.1)',
    color: 'var(--primary-green)',
    borderColor: 'var(--border-color)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'var(--card-bg)',
    border: '2px solid var(--border-color)',
    borderRadius: '14px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    opacity: 0,
    animationFillMode: 'forwards' as const,
    boxShadow: '0 2px 8px rgba(107, 142, 35, 0.08)'
  },
  cardAvatar: {
    height: '160px',
    backgroundColor: 'rgba(107, 142, 35, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    overflow: 'hidden'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const
  },
  avatarEmoji: {
    fontSize: '64px'
  },
  cardContent: {
    padding: '16px',
    flex: 1
  },
  cardName: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '4px'
  },
  cardSpecies: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '12px'
  },
  cardInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0'
  },
  cardInfoLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)'
  },
  cardInfoValue: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)'
  },
  cardFooter: {
    padding: '12px 16px',
    borderTop: '1px solid',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  statusText: {
    fontSize: '12px',
    fontWeight: 600
  },
  fab: {
    position: 'fixed' as const,
    bottom: '32px',
    right: '32px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--gradient-green-start), var(--gradient-green-end))',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(107, 142, 35, 0.4)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  fabIcon: {
    fontSize: '28px',
    color: 'white',
    fontWeight: 300
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center' as const
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px'
  },
  emptyDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)'
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
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto' as const
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(107, 142, 35, 0.1)'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  },
  form: {
    padding: '24px'
  },
  avatarUpload: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '24px'
  },
  avatarPreview: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: 'rgba(107, 142, 35, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const
  },
  avatarPlaceholder: {
    fontSize: '36px',
    opacity: 0.5
  },
  uploadButton: {
    padding: '8px 16px',
    backgroundColor: 'rgba(107, 142, 35, 0.1)',
    color: 'var(--primary-green)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
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
    transition: 'border-color 0.3s ease',
    outline: 'none',
    backgroundColor: 'white'
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid rgba(107, 142, 35, 0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s ease',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid rgba(107, 142, 35, 0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s ease',
    outline: 'none',
    resize: 'vertical' as const,
    backgroundColor: 'white'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, var(--gradient-green-start), var(--gradient-green-end))',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '8px'
  }
};

export default Dashboard;
