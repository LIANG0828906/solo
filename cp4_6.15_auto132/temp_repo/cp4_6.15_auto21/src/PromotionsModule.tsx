import { useState, memo, useCallback } from 'react';
import type { Promotion } from './types';
import { formatCurrency, formatDate, generateId } from './utils';

interface PromotionsModuleProps {
  promotions: Promotion[];
  onAddPromotion: (promotion: Promotion) => void;
  onDeletePromotion: (id: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface PromoFormData {
  code: string;
  minAmount: string;
  discountAmount: string;
  maxUsage: string;
  expiresDays: string;
}

const emptyPromoForm: PromoFormData = {
  code: '',
  minAmount: '',
  discountAmount: '',
  maxUsage: '',
  expiresDays: '30'
};

interface PromoCardProps {
  promotion: Promotion;
  onDelete: (promo: Promotion) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const PromoCard = memo(function PromoCard({ promotion, onDelete, onShowToast }: PromoCardProps) {
  const isExpired = promotion.expiresAt < Date.now();
  const isDepleted = promotion.usedCount >= promotion.maxUsage;
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const isExpiringSoon = !isExpired && promotion.expiresAt - Date.now() < threeDays;
  const daysLeft = Math.ceil((promotion.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

  const handleCopyCode = () => {
    navigator.clipboard.writeText(promotion.code)
      .then(() => onShowToast(`折扣码「${promotion.code}」已复制`, 'success'))
      .catch(() => onShowToast('复制失败，请手动复制', 'error'));
  };

  return (
    <div
      className={`promo-card ${isExpired || isDepleted ? 'expired' : ''}`}
    >
      <div
        className="promo-code-display"
        onClick={handleCopyCode}
        style={{ cursor: 'pointer' }}
        title="点击复制"
      >
        {promotion.code}
      </div>
      <div className="promo-rule">
        满 <strong>{formatCurrency(promotion.minAmount)}</strong> 减{' '}
        <strong>{formatCurrency(promotion.discountAmount)}</strong>
      </div>
      <div className="promo-usage">
        已使用 {promotion.usedCount} / {promotion.maxUsage} 次
        <div style={{
          height: '6px',
          background: '#DEE2E6',
          borderRadius: '3px',
          marginTop: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min((promotion.usedCount / promotion.maxUsage) * 100, 100)}%`,
            background: isDepleted ? '#E74C3C' : '#4A6FA5',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      <div className={`promo-expiry ${isExpiringSoon && !isExpired ? 'warning' : ''}`}>
        {isExpired
          ? '已过期'
          : isDepleted
            ? '已用完'
            : `有效期至 ${formatDate(promotion.expiresAt)}（剩余${daysLeft}天）`
        }
      </div>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-danger btn-sm"
          style={{ flex: 1 }}
          onClick={() => onDelete(promotion)}
          disabled={isExpired || isDepleted}
        >
          删除
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.promotion === nextProps.promotion;
});

const PromotionsModule = ({
  promotions,
  onAddPromotion,
  onDeletePromotion,
  onShowToast
}: PromotionsModuleProps) => {
  const [formData, setFormData] = useState<PromoFormData>(emptyPromoForm);

  const validateForm = useCallback((): string | null => {
    if (!formData.code.trim()) return '请输入折扣码';
    if (!/^[A-Za-z0-9]+$/.test(formData.code.trim())) return '折扣码只能包含字母和数字';
    const minAmount = parseFloat(formData.minAmount);
    if (isNaN(minAmount) || minAmount <= 0) return '请输入有效的满减金额';
    const discountAmount = parseFloat(formData.discountAmount);
    if (isNaN(discountAmount) || discountAmount <= 0) return '请输入有效的减免金额';
    if (discountAmount >= minAmount) return '减免金额必须小于满减金额';
    const maxUsage = parseInt(formData.maxUsage, 10);
    if (isNaN(maxUsage) || maxUsage <= 0) return '请输入有效的使用次数上限';
    const expiresDays = parseInt(formData.expiresDays, 10);
    if (isNaN(expiresDays) || expiresDays <= 0) return '请输入有效的有效期天数';
    const codeExists = promotions.some(
      p => p.code.toUpperCase() === formData.code.trim().toUpperCase()
    );
    if (codeExists) return '该折扣码已存在';
    return null;
  }, [formData, promotions]);

  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      onShowToast(error, 'error');
      return;
    }

    const newPromo: Promotion = {
      id: generateId(),
      code: formData.code.trim().toUpperCase(),
      minAmount: parseFloat(formData.minAmount),
      discountAmount: parseFloat(formData.discountAmount),
      maxUsage: parseInt(formData.maxUsage, 10),
      usedCount: 0,
      expiresAt: Date.now() + parseInt(formData.expiresDays, 10) * 24 * 60 * 60 * 1000,
      createdAt: Date.now()
    };

    onAddPromotion(newPromo);
    onShowToast(`折扣码「${newPromo.code}」创建成功`, 'success');
    setFormData(emptyPromoForm);
  };

  const handleDelete = useCallback((promo: Promotion) => {
    onDeletePromotion(promo.id);
    onShowToast(`折扣码「${promo.code}」已删除`, 'info');
  }, [onDeletePromotion, onShowToast]);

  const activePromotions = promotions.filter(p => p.expiresAt >= Date.now() && p.usedCount < p.maxUsage);
  const inactivePromotions = promotions.filter(p => p.expiresAt < Date.now() || p.usedCount >= p.maxUsage);

  return (
    <div className="module">
      <div className="section-header">
        <h2 className="section-title">促销活动管理</h2>
      </div>

      <div className="promo-form">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#2C3E50' }}>
          创建折扣码
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">折扣码</label>
            <input
              type="text"
              className="form-input"
              placeholder="如：NEW5"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label className="form-label">满减金额（元）</label>
            <input
              type="number"
              className="form-input"
              placeholder="50"
              value={formData.minAmount}
              onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label className="form-label">减免金额（元）</label>
            <input
              type="number"
              className="form-input"
              placeholder="5"
              value={formData.discountAmount}
              onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label className="form-label">使用次数上限</label>
            <input
              type="number"
              className="form-input"
              placeholder="100"
              value={formData.maxUsage}
              onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
              min="1"
              step="1"
            />
          </div>
          <div className="form-group">
            <label className="form-label">有效期（天）</label>
            <input
              type="number"
              className="form-input"
              placeholder="30"
              value={formData.expiresDays}
              onChange={(e) => setFormData({ ...formData, expiresDays: e.target.value })}
              min="1"
              step="1"
            />
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#7F8C8D' }}>
          示例：满50减5，使用次数100次，有效期30天
        </div>
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <button className="btn" onClick={handleSubmit}>
            创建折扣码
          </button>
        </div>
      </div>

      <div className="promo-list">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#2C3E50' }}>
          可用折扣码（{activePromotions.length}）
        </h3>
        {activePromotions.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">🎫</div>
            <div className="empty-state-text">暂无可用折扣码</div>
          </div>
        ) : (
          <div className="promo-cards">
            {activePromotions.map(promo => (
              <PromoCard
                key={promo.id}
                promotion={promo}
                onDelete={handleDelete}
                onShowToast={onShowToast}
              />
            ))}
          </div>
        )}
      </div>

      {inactivePromotions.length > 0 && (
        <div className="promo-list">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#7F8C8D' }}>
            已失效折扣码（{inactivePromotions.length}）
          </h3>
          <div className="promo-cards">
            {inactivePromotions.map(promo => (
              <PromoCard
                key={promo.id}
                promotion={promo}
                onDelete={handleDelete}
                onShowToast={onShowToast}
              />
            ))}
          </div>
        </div>
      )}

      <div className="promo-list">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#2C3E50' }}>
          折扣码使用说明
        </h3>
        <ul style={{ fontSize: '13px', color: '#7F8C8D', lineHeight: '2', paddingLeft: '20px' }}>
          <li>在订单管理中，点击待支付订单的「展开」按钮，输入折扣码并点击「应用折扣」</li>
          <li>系统会自动校验折扣码的有效性（是否存在、是否过期、次数是否用尽、是否满足金额门槛）</li>
          <li>校验通过后会自动计算折后价，并更新折扣码的使用次数</li>
          <li>过期或次数用完的折扣码会显示为灰色，并给出明确的Toast提示</li>
          <li>点击折扣码可以快速复制到剪贴板</li>
        </ul>
      </div>
    </div>
  );
};

export default PromotionsModule;
