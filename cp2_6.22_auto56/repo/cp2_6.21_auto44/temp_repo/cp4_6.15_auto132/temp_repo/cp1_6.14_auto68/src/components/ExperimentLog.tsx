import { useState } from 'react';
import { X, Plus, Thermometer, Droplets, Calendar, Tag as TagIcon } from 'lucide-react';
import type { Experiment } from '../types';
import { StarRating } from './StarRating';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface ExperimentLogProps {
  experiments: Experiment[];
  onAdd: (data: Omit<Experiment, 'id' | 'recipeId' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

export function ExperimentLog({ experiments, onAdd, onDelete }: ExperimentLogProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [modification, setModification] = useState('');
  const [temperature, setTemperature] = useState<number>(25);
  const [humidity, setHumidity] = useState<number>(60);
  const [rating, setRating] = useState<number>(0);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('请给成品评分');
      return;
    }
    onAdd({
      date,
      modification,
      temperature,
      humidity,
      rating,
      tags,
    });
    setShowForm(false);
    setModification('');
    setTemperature(25);
    setHumidity(60);
    setRating(0);
    setTags([]);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      onDelete(id);
      setDeletingId(null);
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">实验记录</h3>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-400 text-white rounded-xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-100"
            style={{ borderRadius: '10px' }}
          >
            <Plus size={18} />
            添加记录
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white rounded-2xl shadow-lg space-y-4 border border-orange-100"
          style={{
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar size={16} />
                实验日期
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                style={{ borderRadius: '10px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Thermometer size={16} />
                环境温度 (°C)
              </label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                style={{ borderRadius: '10px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Droplets size={16} />
                环境湿度 (%)
              </label>
              <input
                type="number"
                value={humidity}
                onChange={(e) => setHumidity(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                style={{ borderRadius: '10px' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">修改描述</label>
            <textarea
              value={modification}
              onChange={(e) => setModification(e.target.value)}
              placeholder="例如：减少面粉20g，增加水15ml"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 resize-none min-h-[80px]"
              style={{ borderRadius: '10px' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">成品评分</label>
            <StarRating value={rating} onChange={setRating} size={32} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <TagIcon size={16} />
              备注标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                  style={{ animation: 'scaleIn 0.2s ease-out' }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="hover:text-orange-900 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="输入标签后按回车添加"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
              style={{ borderRadius: '10px' }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
              style={{ borderRadius: '10px' }}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-400 text-white rounded-xl transition-transform hover:scale-105 active:scale-100"
              style={{ borderRadius: '10px' }}
            >
              保存记录
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {experiments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>暂无实验记录</p>
            <p className="text-sm mt-1">点击上方按钮添加第一条记录</p>
          </div>
        ) : (
          experiments.map((exp, index) => (
            <ExperimentItem
              key={exp.id}
              experiment={exp}
              index={index}
              onDelete={() => handleDelete(exp.id)}
              isDeleting={deletingId === exp.id}
            />
          ))
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}

function ExperimentItem({
  experiment,
  index,
  onDelete,
  isDeleting,
}: {
  experiment: Experiment;
  index: number;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    delay: index * 80,
  });

  return (
    <div
      ref={ref}
      className="relative p-5 bg-white rounded-2xl shadow-sm border border-gray-100"
      style={{
        opacity: isVisible ? (isDeleting ? 0 : 1) : 0,
        transform: isVisible ? (isDeleting ? 'scale(0.95)' : 'translateY(0)') : 'translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
    >
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <X size={18} />
      </button>

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm flex items-center gap-1">
            <Calendar size={14} />
            {experiment.date}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Thermometer size={14} />
              {experiment.temperature}°C
            </span>
            <span className="flex items-center gap-1">
              <Droplets size={14} />
              {experiment.humidity}%
            </span>
          </div>
        </div>
        <StarRating value={experiment.rating} readonly size={18} />
      </div>

      <p className="text-gray-700 mb-3">{experiment.modification}</p>

      {experiment.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {experiment.tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-gradient-to-r from-orange-50 to-pink-50 text-orange-700 rounded-full text-xs"
              style={{ animation: `scaleIn 0.2s ease-out ${i * 0.05}s both` }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
