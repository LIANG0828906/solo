import { useState } from 'react';
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

const PromotionsModule = ({
  promotions,
  onAddPromotion,
  onDeletePromotion,
  onShowToast
}: PromotionsModuleProps) => {
  const [formData, setFormData] = useState<PromoFormData>(emptyPromoForm);

  const validateForm = (): string | null => {
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
  };

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

  const handleDelete = (promo: Promotion) => {
    onDeletePromotion(promo.id);
    onShowToast(`折扣码「${promo.code}」已删除`, 'info');
  };

  const isExpired = (promo: Promotion): boolean => promo.expiresAt < Date.now();
  const isDepleted = (promo: Promotion): boolean => promo.usedCount >= promo.maxUsage;
  const isExpiringSoon = (promo: Promotion): boolean => {
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return !isExpired(promo) && promo.expiresAt - Date.now() < threeDays;
  };

  const getDaysLeft = (promo: Promotion): number => {
    return Math.ceil((promo.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
  };

  return (
    <div className="module">
      <div className="section-header">
        <h2 className="section-title">促销活动管理</h2>
      </div>

      <div className="promo-form">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#2C3E50' }}>
          创建