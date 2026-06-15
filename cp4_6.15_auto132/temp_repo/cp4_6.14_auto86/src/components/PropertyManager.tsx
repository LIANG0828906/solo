import { useState, useEffect, useCallback, memo } from 'react';
import type { Property, MessagePlatform } from '../types';
import { propertyApi } from '../api';

const platformLabels: Record<string, string> = {
  airbnb: 'Airbnb',
  xiaozhu: '小猪',
};

interface PropertyCardProps {
  property: Property;
  onDelete: (id: string) => void;
}

const PropertyCard = memo(function PropertyCard({ property, onDelete }: PropertyCardProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const prompts = [
      'modern%20minimalist%20apartment%20interior%20design%20with%20natural%20light',
      'cozy%20bedroom%20with%20large%20windows%20and%20wooden%20furniture',
      'stylish%20living%20room%20with%20city%20view%20high%20rise%20apartment',
      'traditional%20chinese%20style%20hotel%20room%20elegant%20decor',
    ];
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    e.currentTarget.src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square_hd`;
  };

  const monthsOperated = Math.floor(
    (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <div className="property-card">
      <button
        className="delete-btn"
        onClick={() => onDelete(property.id)}
        title="下架房源"
        aria-label={`下架 ${property.name}`}
      >
        ×
      </button>
      <img
        src={property.photoUrl}
        alt={property.name}
        className="property-photo"
        onError={handleImageError}
        loading="lazy"
      />
      <div className="property-body">
        <h3 className="property-name">{property.name}</h3>
        <div className="property-meta">
          <span className={`property-platform ${property.platform}`}>
            {platformLabels[property.platform]}
          </span>
          <div className="property-price">
            ¥{property.pricePerNight}
            <span>/晚</span>
          </div>
        </div>
        <div className="property-details">
          <span>👥 最多 {property.maxGuests} 人</span>
          <span>📅 已运营 {monthsOperated} 个月</span>
        </div>
      </div>
    </div>
  );
});

interface DeleteModalProps {
  propertyName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ propertyName, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">确认下架</h3>
        <p className="modal-message">
          确定要下架「<strong>{propertyName}</strong>」吗？下架后该房源将不再显示在日历看板中。
        </p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn-danger" onClick={onConfirm} autoFocus>
            确认下架
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PropertyManager() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'airbnb' as MessagePlatform,
    pricePerNight: '',
    maxGuests: '',
    photoUrl: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertyApi.getAll();
      setProperties(data.filter((p) => p.isActive));
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.name.trim() || !formData.pricePerNight || !formData.maxGuests) {
        return;
      }

      try {
        const prompts = [
          'modern%20minimalist%20apartment%20interior%20design%20with%20natural%20light',
          'cozy%20bedroom%20with%20large%20windows%20and%20wooden%20furniture',
          'stylish%20living%20room%20with%20city%20view%20high%20rise%20apartment',
          'traditional%20chinese%20style%20hotel%20room%20elegant%20decor',
        ];
        const prompt = prompts[Math.floor(Math.random() * prompts.length)];
        const defaultPhoto = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square_hd`;

        const newProp = await propertyApi.create({
          name: formData.name.trim(),
          platform: formData.platform,
          pricePerNight: Number(formData.pricePerNight),
          maxGuests: Number(formData.maxGuests),
          photoUrl: formData.photoUrl.trim() || defaultPhoto,
        });
        setProperties((prev) => [...prev, newProp]);
        setFormData({
          name: '',
          platform: 'airbnb',
          pricePerNight: '',
          maxGuests: '',
          photoUrl: '',
        });
      } catch (error) {
        console.error('Failed to create property:', error);
      }
    },
    [formData]
  );

  const handleDeleteClick = useCallback((id: string) => {
    setShowDeleteModal(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!showDeleteModal) return;

    try {
      await propertyApi.delete(showDeleteModal);
      setProperties((prev) => prev.filter((p) => p.id !== showDeleteModal));
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  }, [showDeleteModal]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(null);
  }, []);

  const deletingProperty = properties.find((p) => p.id === showDeleteModal);

  if (loading) {
    return (
      <div className="page-transition">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="page-header">
        <h1 className="page-title">房源管理</h1>
        <span className="property-count">共 {properties.length} 个房源</span>
      </div>

      <div className="card">
        <h2 className="section-title">添加新房源</h2>
        <form className="property-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="prop-name">房源名称</label>
            <input
              id="prop-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="如：西湖畔温馨一居室"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="prop-platform">平台</label>
            <select
              id="prop-platform"
              value={formData.platform}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, platform: e.target.value as MessagePlatform }))
              }
            >
              <option value="airbnb">Airbnb</option>
              <option value="xiaozhu">小猪</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="prop-price">每晚价格 (元)</label>
            <input
              id="prop-price"
              type="number"
              min="1"
              value={formData.pricePerNight}
              onChange={(e) => setFormData((prev) => ({ ...prev, pricePerNight: e.target.value }))}
              placeholder="399"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="prop-guests">最大入住人数</label>
            <input
              id="prop-guests"
              type="number"
              min="1"
              max="20"
              value={formData.maxGuests}
              onChange={(e) => setFormData((prev) => ({ ...prev, maxGuests: e.target.value }))}
              placeholder="2"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="prop-photo">照片URL (可选)</label>
            <input
              id="prop-photo"
              type="url"
              value={formData.photoUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, photoUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="form-group form-submit-group">
            <label>&nbsp;</label>
            <button type="submit" className="form-submit">
              添加房源
            </button>
          </div>
        </form>
      </div>

      <div className="properties-section">
        <h2 className="section-title">所有房源</h2>
        {properties.length > 0 ? (
          <div className="property-grid">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <div className="empty-icon">🏡</div>
            <div className="empty-text">还没有房源，添加一个吧！</div>
          </div>
        )}
      </div>

      {showDeleteModal && deletingProperty && (
        <DeleteModal
          propertyName={deletingProperty.name}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
