import { useState, useRef } from 'react';
import { useWorkersStore, ROLE_LABELS, ROLE_COLORS, Worker, WorkerRole } from '../workers';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23C9A84C' width='100' height='100'/%3E%3Ctext x='50' y='58' font-size='48' text-anchor='middle' fill='%235C3A21' font-family='serif' font-weight='bold'%3E⚔%3C/text%3E%3C/svg%3E";

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (worker: Omit<Worker, 'id'>) => void;
  editWorker?: Worker | null;
}

function WorkerModal({ isOpen, onClose, onSave, editWorker }: WorkerModalProps) {
  const [name, setName] = useState(editWorker?.name || '');
  const [role, setRole] = useState<WorkerRole>(editWorker?.role || 'bartender');
  const [hireDate, setHireDate] = useState(editWorker?.hireDate || new Date().toISOString().split('T')[0]);
  const [avatar, setAvatar] = useState(editWorker?.avatar || DEFAULT_AVATAR);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), role, hireDate, avatar });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-content" style={{ width: '420px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: '#5C3A21', marginBottom: '20px', fontFamily: 'Cinzel, serif', borderBottom: '2px solid #C9A84C', paddingBottom: '10px' }}>
          {editWorker ? '✦ 编辑冒险者 ✦' : '✦ 招募新冒险者 ✦'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <div className="avatar-frame" style={{ width: '100px', height: '100px', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              <img src={avatar} alt="头像" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button type="button" className="btn" style={{ marginTop: '12px', fontSize: '12px', padding: '6px 16px' }} onClick={() => fileInputRef.current?.click()}>
              📷 更换头像
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="input-label" style={{ color: '#5C3A21' }}>姓名</label>
            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="输入冒险者姓名" required />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="input-label" style={{ color: '#5C3A21' }}>角色</label>
            <select className="input-field" value={role} onChange={e => setRole(e.target.value as WorkerRole)}>
              <option value="bartender">🍺 调酒师</option>
              <option value="waiter">🍽️ 侍者</option>
              <option value="chef">👨‍🍳 厨师</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="input-label" style={{ color: '#5C3A21' }}>入职日期</label>
            <input type="date" className="input-field" value={hireDate} onChange={e => setHireDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">确认保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

function ConfirmDialog({ isOpen, onClose, onConfirm, message }: ConfirmDialogProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-content" style={{ width: '380px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#8B3A3A', marginBottom: '16px', fontFamily: 'Cinzel, serif' }}>⚠️ 警告</h3>
        <p style={{ color: '#5C3A21', marginBottom: '24px', lineHeight: '1.6' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-danger" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  );
}

export default function WorkersPage() {
  const { workers, addWorker, updateWorker, deleteWorker, hasWorkerShifts } = useWorkersStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; workerId: string | null }>({ open: false, workerId: null });

  const handleAddClick = () => {
    setEditingWorker(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (worker: Worker) => {
    setEditingWorker(worker);
    setIsModalOpen(true);
  };

  const handleSave = (workerData: Omit<Worker, 'id'>) => {
    if (editingWorker) {
      updateWorker(editingWorker.id, workerData);
    } else {
      addWorker(workerData);
    }
    setEditingWorker(null);
  };

  const handleDeleteClick = (workerId: string) => {
    if (hasWorkerShifts(workerId)) {
      setConfirmDialog({ open: true, workerId });
    } else {
      deleteWorker(workerId);
    }
  };

  const confirmDelete = () => {
    if (confirmDialog.workerId) {
      deleteWorker(confirmDialog.workerId);
    }
    setConfirmDialog({ open: false, workerId: null });
  };

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ color: '#E8C56D', fontFamily: 'Cinzel, serif', fontSize: '32px', textShadow: '0 0 20px rgba(201,168,76,0.4)' }}>
            ⚜️ 冒险者名册
          </h1>
          <p style={{ color: '#e8d5b7', opacity: 0.8, marginTop: '6px' }}>管理酒馆的所有员工</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddClick}>
          ➕ 招募冒险者
        </button>
      </div>

      {workers.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏰</div>
          <p style={{ color: '#e8d5b7', fontSize: '18px', opacity: 0.8 }}>酒馆还没有冒险者...</p>
          <p style={{ color: '#C9A84C', marginTop: '8px' }}>点击上方按钮招募你的第一位员工！</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {workers.map(worker => (
            <div key={worker.id} className="card bounce-animation" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div className="avatar-frame" style={{ width: '72px', height: '72px', flexShrink: 0 }}>
                  <img src={worker.avatar} alt={worker.name} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: '#5C3A21', fontFamily: 'Cinzel, serif', fontSize: '18px', marginBottom: '4px' }}>
                    {worker.name}
                  </h3>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'white',
                    background: ROLE_COLORS[worker.role]
                  }}>
                    {ROLE_LABELS[worker.role]}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: '#7B4F2C', marginBottom: '16px', paddingTop: '12px', borderTop: '1px dashed rgba(92,58,33,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>📅 入职日期</span>
                  <span style={{ fontWeight: 600 }}>{worker.hireDate}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }} onClick={() => handleEditClick(worker)}>
                  ✏️ 编辑
                </button>
                <button className="btn btn-danger" style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }} onClick={() => handleDeleteClick(worker.id)}>
                  🗑️ 解雇
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkerModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingWorker(null); }}
        onSave={handleSave}
        editWorker={editingWorker}
      />

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, workerId: null })}
        onConfirm={confirmDelete}
        message="该冒险者已被分配到排班中，删除后相关排班也会受到影响。确定要解雇吗？"
      />
    </div>
  );
}
