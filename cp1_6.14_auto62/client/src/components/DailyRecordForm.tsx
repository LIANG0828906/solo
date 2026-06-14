import React, { useState, useRef } from 'react';
import { Challenge, DailyRecord } from '../types';

interface DailyRecordFormProps {
  challenge: Challenge;
  todayRecord: DailyRecord | null;
  onSubmit: (count: number) => Promise<void>;
}

const DailyRecordForm: React.FC<DailyRecordFormProps> = ({ challenge, todayRecord, onSubmit }) => {
  const [count, setCount] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const startDate = new Date(challenge.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + challenge.duration);
  const todayDate = new Date(today);

  const isActive = todayDate >= startDate && todayDate <= endDate;
  const isPast = todayDate > endDate;

  const progress = todayRecord
    ? Math.min((todayRecord.count / challenge.dailyGoal) * 100, 100)
    : 0;

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numCount = Number(count);
    if (isNaN(numCount) || numCount < 0) {
      setError('请输入有效的数字');
      return;
    }

    if (numCount === 0) {
      setError('请输入大于0的数字');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(numCount);
      setIsSuccess(true);
      setCount('');
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPast) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>挑战已结束</h3>
        <p style={{