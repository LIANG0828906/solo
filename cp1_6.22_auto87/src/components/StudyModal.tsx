import { useState, useEffect } from 'react';
import { Modal, Input, InputNumber, Select } from 'antd';
import type { StudyRecord, Project } from '../types';
import { formatDate } from '../utils/date';
import './StudyModal.css';

const { TextArea } = Input;

interface StudyModalProps {
  open: boolean;
  date: Date | null;
  record?: StudyRecord | null;
  projects: Project[];
  onClose: () => void;
  onSave: (data: { date: string; content: string; minutes: number; projectId?: string }) => void;
}

export default function StudyModal({ open, date, record, projects, onClose, onSave }: StudyModalProps) {
  const [content, setContent] = useState('');
  const [minutes, setMinutes] = useState<number>(30);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (record) {
      setContent(record.content || '');
      setMinutes(record.minutes || 0);
      setProjectId(record.projectId);
    } else {
      setContent('');
      setMinutes(30);
      setProjectId(undefined);
    }
  }, [record, open]);

  const handleSave = () => {
    if (!date) return;
    onSave({
      date: formatDate(date),
      content,
      minutes,
      projectId,
    });
  };

  const dateLabel = date ? formatDate(date) : '';

  return (
    <Modal
      open={open}
      title={`编辑学习记录 - ${dateLabel}`}
      onCancel={onClose}
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
      className="study-modal"
      centered
    >
      <div className="study-modal-content">
        <div className="form-item">
          <label className="form-label">学习内容</label>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 200))}
            placeholder="记录今天学习了什么..."
            maxLength={200}
            rows={4}
            showCount
            className="glass-input"
          />
        </div>

        <div className="form-item">
          <label className="form-label">学习时长（分钟）</label>
          <InputNumber
            min={0}
            max={1440}
            value={minutes}
            onChange={(v) => setMinutes(v || 0)}
            className="glass-input-number"
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-item">
          <label className="form-label">所属项目（可选）</label>
          <Select
            value={projectId}
            onChange={setProjectId}
            placeholder="选择学习项目"
            allowClear
            className="glass-select"
            options={projects.map((p) => ({
              label: p.name,
              value: p.id,
            }))}
          />
        </div>
      </div>
    </Modal>
  );
}
