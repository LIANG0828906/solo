import React, { useState } from 'react';
import { X, Upload, Plus, Minus } from 'lucide-react';
import type { User, TableRequest } from '@/types';
import { createTable, getRandomFoodImage } from '@/data';

interface CreateTableModalProps {
  currentUser: User;
  onClose: () => void;
  onCreate: (table: TableRequest) => void;
}

const CreateTableModal: React.FC<CreateTableModalProps> = ({
  currentUser,
  onClose,
  onCreate,
}) => {
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [timeStr, setTimeStr] = useState('18:30');
  const [maxPeople, setMaxPeople] = useState(4);
  const [costPerPerson, setCostPerPerson] = useState(40);
  const [invitationText, setInvitationText] = useState('');
  const [foodImage, setFoodImage] = useState<string>('');
  const [showUploadHint, setShowUploadHint] = useState(true);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFoodImage(reader.result as string);
      setShowUploadHint(false);
    };
    reader.readAsDataURL(file);
  };

  const useRandomImage = () => {
    setFoodImage(getRandomFoodImage());
    setShowUploadHint(false);
  };

  const handleSubmit = () => {
    if (!dateStr || !timeStr || !invitationText.trim()) return;
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    const time = new Date(year, month - 1, day, hour, minute, 0, 0);

    const finalImage = foodImage || getRandomFoodImage();

    const table = createTable({
      hostId: currentUser.id,
      host: currentUser,
      time,
      maxPeople,
      costPerPerson,
      invitationText: invitationText.trim(),
      foodImage: finalImage,
    });
    onCreate(table);
  };

  const canSubmit = dateStr && timeStr && invitationText.trim().length >= 5;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">发起新的拼桌</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">美食参考图</label>
            {!showUploadHint && foodImage ? (
              <div className="image-preview-wrap" onClick={useRandomImage}>
                <img src={foodImage} alt="" className="image-preview" />
                <div className="image-preview-overlay">点击换一张</div>
              </div>
            ) : (
              <label className="image-upload">
                <div className="image-upload-icon">📷</div>
                <div className="image-upload-text">点击上传美食照片</div>
                <div className="image-upload-hint">或者点击下方"随机一张"试试</div>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </label>
            )}
            <button
              className="btn btn-ghost btn-sm btn-block"
              onClick={useRandomImage}
              style={{ marginTop: 10 }}
            >
              随机一张示例图
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">聚餐日期</label>
              <input
                type="date"
                className="form-input"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">聚餐时间</label>
              <input
                type="time"
                className="form-input"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                step="1800"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              计划人数
              <span className="form-label-hint">最少2人，最多8人</span>
            </label>
            <div className="people-stepper">
              <button
                className="stepper-btn"
                onClick={() => setMaxPeople(Math.max(2, maxPeople - 1))}
                disabled={maxPeople <= 2}
              >
                <Minus size={18} strokeWidth={2.5} />
              </button>
              <div>
                <span className="stepper-value">{maxPeople}</span>
                <span className="stepper-unit">人</span>
              </div>
              <button
                className="stepper-btn"
                onClick={() => setMaxPeople(Math.min(8, maxPeople + 1))}
                disabled={maxPeople >= 8}
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              预计人均费用
              <span className="form-label-hint">单位：元</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}>¥</span>
              <input
                type="number"
                inputMode="numeric"
                className="form-input"
                style={{ paddingLeft: 36 }}
                value={costPerPerson}
                onChange={(e) => setCostPerPerson(Math.max(0, parseInt(e.target.value) || 0))}
                min={5}
                max={500}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              邀请语
              <span className="form-label-hint">给邻居们说点什么~</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="比如：今晚做红烧排骨+清炒时蔬，有没有邻居一起来？食材我来负责~"
              value={invitationText}
              onChange={(e) => setInvitationText(e.target.value)}
              maxLength={150}
            />
            <div style={{
              textAlign: 'right',
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 4,
            }}>
              {invitationText.length}/150
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              marginTop: 8,
            }}
          >
            发布拼桌邀请
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTableModal;
