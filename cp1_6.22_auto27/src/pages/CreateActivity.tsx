import { useState, useRef } from 'react';
import { api, parseCSV } from '@/utils/api';
import Modal from '@/components/Modal';
import type { CreateActivityData } from '@/types';

interface PrizeFormItem {
  name: string;
  quantity: string;
  icon: string;
}

interface CreateActivityProps {
  onCreated: (activityId: string) => void;
}

const DEFAULT_ICONS = ['🏆', '🥇', '🥈', '🥉', '🎁', '📱', '💻', '⌚'];

export default function CreateActivity({ onCreated }: CreateActivityProps) {
  const [name, setName] = useState('');
  const [prizes, setPrizes] = useState<PrizeFormItem[]>([
    { name: '一等奖', quantity: '1', icon: '🏆' },
    { name: '二等奖', quantity: '3', icon: '🥇' },
    { name: '三等奖', quantity: '5', icon: '🥈' },
  ]);
  const [participantsText, setParticipantsText] = useState('');
  const [importStats, setImportStats] = useState<{ total: number; duplicates: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPrize = () => {
    setPrizes([
      ...prizes,
      { name: '', quantity: '1', icon: DEFAULT_ICONS[prizes.length % DEFAULT_ICONS.length] },
    ]);
  };

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const updatePrize = (index: number, field: keyof PrizeFormItem, value: string) => {
    const newPrizes = [...prizes];
    newPrizes[index][field] = value;
    setPrizes(newPrizes);
  };

  const parseParticipants = () => {
    const lines = participantsText.trim().split('\n').filter(Boolean);
    const seen = new Set<string>();
    let duplicates = 0;

    lines.forEach((line) => {
      const values = line.split(',').map((v) => v.trim());
      const key = values.join('|');
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    });

    setImportStats({ total: lines.length, duplicates });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const participants = parseCSV(text);
      const formatted = participants.map((p) => [p.name, p.phone || '', p.email || ''].filter(Boolean).join(',')).join('\n');
      setParticipantsText(formatted);
      parseParticipants();
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitClick = () => {
    setError(null);

    if (!name.trim()) {
      setError('请输入活动名称');
      return;
    }

    const validPrizes = prizes.filter((p) => p.name.trim() && parseInt(p.quantity) > 0);
    if (validPrizes.length === 0) {
      setError('请至少添加一个有效奖品');
      return;
    }

    const participants = parseCSV(participantsText);
    if (participants.length === 0) {
      setError('请导入参与者名单');
      return;
    }

    setShowGlow(true);
    setTimeout(() => setShowGlow(false), 1000);

    setTimeout(() => {
      setShowConfirm(true);
    }, 500);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirm(false);

    try {
      const validPrizes = prizes.filter((p) => p.name.trim() && parseInt(p.quantity) > 0);
      const participants = parseCSV(participantsText);

      const data: CreateActivityData = {
        name: name.trim(),
        prizes: validPrizes.map((p) => ({
          name: p.name.trim(),
          quantity: p.quantity,
          icon: p.icon,
        })),
        participants,
      };

      const result = await api.createActivity(data);
      onCreated(result.activity.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建活动失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">创建抽奖活动</h1>

      <div className="card">
        <div className="form-group">
          <label className="form-label">活动名称</label>
          <div className="form-input-wrapper">
            <input
              type="text"
              className={`form-input ${showGlow ? 'glow' : ''}`}
              placeholder="请输入活动名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="form-input-border" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">奖品列表</label>
          {prizes.map((prize, index) => (
            <div key={index} className="prize-item">
              <div className="form-input-wrapper">
                <input
                  type="text"
                  className={`form-input icon-input ${showGlow ? 'glow' : ''}`}
                  value={prize.icon}
                  onChange={(e) => updatePrize(index, 'icon', e.target.value)}
                  placeholder="🎁"
                />
                <div className="form-input-border" />
              </div>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  className={`form-input ${showGlow ? 'glow' : ''}`}
                  placeholder="奖品名称"
                  value={prize.name}
                  onChange={(e) => updatePrize(index, 'name', e.target.value)}
                />
                <div className="form-input-border" />
              </div>
              <div className="form-input-wrapper">
                <input
                  type="number"
                  className={`form-input ${showGlow ? 'glow' : ''}`}
                  placeholder="数量"
                  min="1"
                  value={prize.quantity}
                  onChange={(e) => updatePrize(index, 'quantity', e.target.value)}
                />
                <div className="form-input-border" />
              </div>
              {prizes.length > 1 && (
                <button className="remove-btn" onClick={() => removePrize(index)}>
                  ×
                </button>
              )}
            </div>
          ))}
          <button className="add-btn" onClick={addPrize}>
            + 添加奖品
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">参与者名单</label>
          <div className="participants-section">
            <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              格式：每行一个参与者，格式为 姓名,电话,邮箱（电话和邮箱可选），或上传CSV文件
            </p>
            <textarea
              className={`participants-textarea ${showGlow ? 'glow' : ''}`}
              placeholder="张三,13800138000,zhangsan@example.com&#10;李四,13900139000&#10;王五"
              value={participantsText}
              onChange={(e) => {
                setParticipantsText(e.target.value);
                setImportStats(null);
              }}
              onBlur={parseParticipants}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <label className="file-upload">
                📁 上传CSV
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </label>
              {importStats && (
                <div className="import-stats">
                  <span className="import-success">
                    ✓ 成功导入 {importStats.total - importStats.duplicates} 人
                  </span>
                  {importStats.duplicates > 0 && (
                    <span className="import-duplicate">
                      ⚠ 重复 {importStats.duplicates} 人（已自动去重）
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: 12, background: '#FFE8E8', color: '#DC3545', borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmitClick}
          disabled={isSubmitting}
          style={{ fontSize: 16, padding: '14px 40px' }}
        >
          {isSubmitting ? '创建中...' : '✨ 创建活动'}
        </button>
      </div>

      <Modal
        open={showConfirm}
        title="确认创建活动"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
        confirmText="确认创建"
      >
        <p>确定要创建这个抽奖活动吗？活动创建后将跳转到抽奖页面。</p>
        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-light)', borderRadius: 8 }}>
          <p><strong>活动名称：</strong>{name}</p>
          <p><strong>奖品数量：</strong>{prizes.filter((p) => p.name && p.quantity).length} 种</p>
          <p><strong>参与人数：</strong>{parseCSV(participantsText).length} 人</p>
        </div>
      </Modal>
    </div>
  );
}
