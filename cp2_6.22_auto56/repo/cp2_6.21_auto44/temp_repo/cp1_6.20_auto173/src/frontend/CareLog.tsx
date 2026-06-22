import React, { useState } from 'react';

export interface CareLogEntry {
  id: string;
  plantId: string;
  type: '浇水' | '施肥' | '修剪';
  date: string;
  note: string;
}

interface CareLogProps {
  plantId: string;
  logs: CareLogEntry[];
  onAdd: (entry: Omit<CareLogEntry, 'id'>) => void;
  onDelete: (id: string) => void;
  showModal: boolean;
  onCloseModal: () => void;
}

const typeOptions: CareLogEntry['type'][] = ['浇水', '施肥', '修剪'];

const typeIcons: Record<string, string> = {
  '浇水': '💧',
  '施肥': '🌱',
  '修剪': '✂️',
};

const CareLog: React.FC<CareLogProps> = ({
  plantId,
  logs,
  onAdd,
  onDelete,
  showModal,
  onCloseModal,
}) => {
  const [selectedType, setSelectedType] = useState<CareLogEntry['type']>('浇水');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onAdd({
      plantId,
      type: selectedType,
      date: selectedDate,
      note,
    });
    setNote('');
    setSelectedType('浇水');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      {showModal && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加记录</h2>
              <button className="modal-close" onClick={onCloseModal}>✕</button>
            </div>
            <div className="modal-body">
              <label className="form-label">操作类型</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as CareLogEntry['type'])}
                className="form-select"
              >
                {typeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <label className="form-label">日期</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="form-input"
              />

              <label className="form-label">备注</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="记录观察情况..."
                className="form-textarea"
                rows={3}
              />

              <button className="submit-btn" onClick={handleSubmit}>
                提交
              </button>
            </div>
          </div>
        </div>
      )}

      {sortedLogs.length > 0 && (
        <div className="care-log-list">
          <h3 className="log-title">养护日志</h3>
          {sortedLogs.map(log => (
            <div key={log.id} className="log-entry">
              <div className="log-entry-left">
                <span className="log-type-icon">{typeIcons[log.type]}</span>
                <div className="log-entry-info">
                  <span className="log-type">{log.type}</span>
                  <span className="log-date">{log.date}</span>
                  {log.note && <span className="log-note">{log.note}</span>}
                </div>
              </div>
              <button className="log-delete-btn" onClick={() => onDelete(log.id)}>
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default CareLog;
