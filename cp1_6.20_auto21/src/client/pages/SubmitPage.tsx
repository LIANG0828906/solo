import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { FormData } from '../types';
import FormModule from '../components/FormModule';
import './SubmitPage.css';

export default function SubmitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setRepairs, addNotification } = useApp();
  const navigate = useNavigate();

  const handleSubmit = useCallback(async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const newRepair = await api.createRepair(data);
      setRepairs(prev => [newRepair, ...prev]);
      addNotification('success', `报修提交成功！工单号：${newRepair.ticketNumber}`);
      navigate('/repairs');
    } catch (error) {
      addNotification('error', error instanceof Error ? error.message : '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [setRepairs, addNotification, navigate]);

  return (
    <div className="submit-page">
      <div className="page-header">
        <h1 className="page-title">提交报修</h1>
        <p className="page-subtitle">请填写以下信息，我们会尽快处理您的报修请求</p>
      </div>
      
      <div className="form-container">
        <FormModule onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
