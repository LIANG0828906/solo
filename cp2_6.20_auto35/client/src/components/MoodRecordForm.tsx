import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MoodType, TagType, MoodData, MOOD_CONFIGS, TAG_LABELS } from '../types';

interface MoodRecordFormProps {
  onSubmit?: (data: MoodData) => void;
}

const MoodRecordForm: React.FC<MoodRecordFormProps> = ({ onSubmit }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moodTypes: MoodType[] = ['happy', 'calm', 'excited', 'sad', 'angry', 'anxious'];
  const tagTypes: TagType[] = ['work', 'family', 'social', 'exercise'];

  const handleTagToggle = (tag: TagType) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;

    setIsSubmitting(true);
    const newMood: MoodData = {
      id: uuidv4(),
      type: selectedMood,
      intensity,
      description,
      tags: selectedTags,
      timestamp: new Date().toISOString(),
    };

    await new Promise((resolve) => setTimeout(resolve, 500));
    onSubmit?.(newMood);

    setSelectedMood(null);
    setIntensity(5);
    setDescription('');
    setSelectedTags([]);
    setIsSubmitting(false);
  };

  const selectedConfig = selectedMood ? MOOD_CONFIGS[selectedMood] : null;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.1)',
        animation: 'slideInUp 0.5s ease-out',
      }}
    >
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
        记录此刻心情
      </h2>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#555', marginBottom: '16px' }}>
          你现在感觉如何？
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {moodTypes.map((mood) => {
            const config = MOOD_CONFIGS[mood];
            const isSelected = selectedMood === mood;
            return (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                style={{
                  padding: '20px 16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: isSelected ? config.color : '#f8f9fa',
                  color: isSelected ? 'white' : '#666',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected ? `0 8px 24px ${config.color}60` : 'none',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.background = `${config.color}30`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  {mood === 'happy' && '😊'}
                  {mood === 'calm' && '😌'}
                  {mood === 'excited' && '🤩'}
                  {mood === 'sad' && '😢'}
                  {mood === 'angry' && '😠'}
                  {mood === 'anxious' && '😰'}
                </div>
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#555', marginBottom: '16px' }}>
          情绪强度: <span style={{ color: selectedConfig?.color || '#667eea', fontSize: '20px' }}>{intensity}</span>/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: selectedConfig
              ? `linear-gradient(to right, ${selectedConfig.color} 0%, ${selectedConfig.color} ${(intensity - 1) * 11.11}%, #e0e0e0 ${(intensity - 1) * 11.11}%, #e0e0e0 100%)`
              : '#e0e0e0',
            appearance: 'none',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#999' }}>
          <span>轻微</span>
          <span>强烈</span>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#555', marginBottom: '16px' }}>
          发生了什么？（可选）
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="记录一下此刻的想法..."
          rows={4}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: '2px solid #eee',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.3s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = selectedConfig?.color || '#667eea';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#eee';
          }}
        />
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#555', marginBottom: '16px' }}>
          相关标签（可多选）
        </label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {tagTypes.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: '2px solid',
                  borderColor: isSelected ? (selectedConfig?.color || '#667eea') : '#eee',
                  background: isSelected ? `${selectedConfig?.color || '#667eea'}15` : 'white',
                  color: isSelected ? (selectedConfig?.color || '#667eea') : '#666',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedMood || isSubmitting}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '12px',
          border: 'none',
          background: selectedConfig
            ? `linear-gradient(135deg, ${selectedConfig.color}, ${selectedConfig.color}dd)`
            : 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 600,
          cursor: selectedMood && !isSubmitting ? 'pointer' : 'not-allowed',
          opacity: selectedMood ? 1 : 0.6,
          transform: 'translateY(0)',
          boxShadow: selectedConfig
            ? `0 4px 20px ${selectedConfig.color}40`
            : '0 4px 20px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          if (selectedMood && !isSubmitting) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = selectedConfig
              ? `0 8px 30px ${selectedConfig.color}60`
              : '0 8px 30px rgba(102, 126, 234, 0.6)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = selectedConfig
            ? `0 4px 20px ${selectedConfig.color}40`
            : '0 4px 20px rgba(102, 126, 234, 0.4)';
        }}
      >
        {isSubmitting ? '保存中...' : '保存记录'}
      </button>
    </div>
  );
};

export default MoodRecordForm;
