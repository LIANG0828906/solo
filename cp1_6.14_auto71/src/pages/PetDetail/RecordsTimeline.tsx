import React, { useEffect, useState, useMemo } from 'react';
import { getRecords, createRecord, updateRecord, deleteRecord } from '../../api';
import type { Record, RecordType } from '../../types';

interface RecordsTimelineProps {
  petId: string;
}

const typeConfig: Record<RecordType, { icon: string; color: string; label: string }> = {
  feeding: { icon: '🍽️', color: '#fbbf24', label: '喂食' },
  walking: { icon: '🚶', color: '#34d399', label: '遛弯' },
  sleep: { icon: '😴', color: '#a78bfa', label: '睡眠' },
  other: { icon: '📝', color: '#9ca3af', label: '其他' },
};

const foodPresets = ['狗粮', '猫粮', '鸡胸肉', '牛肉', '鱼肉', '零食', '罐头'];

const RecordsTimeline: React.FC<RecordsTimelineProps> = ({ petId }) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [formData, setFormData] = useState({
    type: 'feeding' as RecordType,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    foodType: '',
    grams: '',
    duration: '',
    startTime: '',
    route: '',
    note: '',
  });

  useEffect(() => {
    loadRecords();
  }, [petId]);

  const loadRecords = async () => {
    try {
      const response = await getRecords(petId);
      if (response.data) {
        setRecords(response.data);
      }
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: Record[] } = {};

    if (viewMode === 'day') {
      records.forEach((record) => {
        if (!groups[record.date]) {
          groups[record.date] = [];
        }
        groups[record.date].push(record);
      });
    } else {
      records.forEach((record) => {
        const date = new Date(record.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!groups[weekKey]) {
          groups[weekKey] = [];
        }
        groups[weekKey].push(record);
      });
    }

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([key, items]) => ({
        key,
        records: items.sort((a, b) => b.time.localeCompare(a.time)),
      }));
  }, [records, viewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        petId,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        foodType: formData.foodType || undefined,
        grams: formData.grams ? parseFloat(formData.grams) : undefined,
        duration: formData.duration ? parseFloat(formData.duration) : undefined,
        startTime: formData.startTime || undefined,
        route: formData.route || undefined,
        note: formData.note || undefined,
      };

      if (editingRecord) {
        await updateRecord(editingRecord.id, data);
      } else {
        await createRecord(data);
      }

      loadRecords();
      closeModal();
    } catch (error) {
      console.error('Failed to save record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await deleteRecord(id);
        loadRecords();
        setExpandedId(null);
      } catch (error) {
        console.error('Failed to delete record:', error);
      }
    }
  };

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      date: record.date,
      time: record.time,
      foodType: record.foodType || '',
      grams: record.grams?.toString() || '',
      duration: record.duration?.toString() || '',
      startTime: record.startTime || '',
      route: record.route || '',
      note: record.note || '',
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingRecord(null);
    setFormData({
      type: 'feeding',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      foodType: '',
      grams: '',
      duration: '',
      startTime: '',
      route: '',
      note: '',
    });
  };

  const getRecordSummary = (record: Record) => {
    switch (record.type) {
      case 'feeding':
        return `${record.foodType || '未指定'} · ${record.grams || 0}g`;
      case 'walking':
        return `时长 ${record.duration || 0}分钟${record.route ? ` · ${record.route}` : ''}`;
      case 'sleep':
        return `时长 ${record.duration || 0}小时${record.note ? ` · ${record.note}` : ''}`;
      default:
        return record.note || '无备注';
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === yesterday.toDateString()) return '昨天';

    if (viewMode === 'week') {
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `${date.getMonth() + 1}月${date.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
    }

    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-shimmer rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'day'
                ? 'bg-pink-100 text-pink-600'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            按日
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-pink-100 text-pink-600'
                : 'bg-white text-gray-500 hover: