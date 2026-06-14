import { useState, useCallback, useMemo } from 'react';
import { Plus, X, Phone, CalendarDays, Pencil } from 'lucide-react';
import Modal from '@/components/Modal';
import { useStore, ROLE_COLORS, validatePhone, validateName } from '@/hooks/useStore';
import { todayStr } from '@/utils/format';
import type { Member, MemberRole } from '@/types';

const ROLES: MemberRole[] = ['社长', '副社长', '干事', '普通成员'];

interface MemberFormData {
  name: string;
  role: MemberRole;
  joinDate: string;
  phone: string;
}

const emptyForm: MemberFormData = {
  name: '',
  role: '普通成员',
  joinDate: todayStr(),
  phone: '',
};

export default function Members() {
  const members = useStore(s => s.members);
  const addMember = useStore(s => s.addMember);
  const updateMember = useStore(s => s.updateMember);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean }>({});

  const nameError = useMemo(() => {
    if (!form.name) return '请输入姓名';
    if (!validateName(form.name)) return '姓名为2-10个汉字';
    return '';
  }, [form.name]);

  const phoneError = useMemo(() => {
    if (!form.phone) return '';
    if (!validatePhone(form.phone)) return '请输入正确的11位手机号';
    return '';
  }, [form.phone]);

  const canSubmit = !nameError && !phoneError && form.name.length > 0;

  const openAdd = useCallback(() => {
    setForm(emptyForm);
    setTouched({});
    setAddOpen(true);
  }, []);

  const openEdit = useCallback((m: Member) => {
    setForm({
      name: m.name,
      role: m.role,
      joinDate: m.joinDate,
      phone: m.phone || '',
    });
    setTouched({});
    setEditing(m);
  }, []);

  const closeAll = useCallback(() => {
    setAddOpen(false);
    setEditing(null);
    setSaving(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) {
      setTouched({ name: true, phone: true });
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      if (editing) {
        updateMember(editing.id, {
          name: form.name,
          role: form.role,
          joinDate: form.joinDate,
          phone: form.phone || undefined,
        });
      } else {
        addMember({
          name: form.name,
          role: form.role,
          joinDate: form.joinDate,
          phone: form.phone || undefined,
        });
      }
      setSaving(false);
      closeAll();
    }, 500);
  }, [canSubmit, editing, form, addMember, updateMember, closeAll]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">成员管理</h1>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} />
          添加成员
        </button>
      </div>

      <div className="member-grid">
        {members.map(m => (
          <div
            key={m.id}
            className="member-card"
            onClick={() => openEdit(m)}
          >
            <div className="member-card-header">
              <span className="member-name">{m.name}</span>
              <Pencil size={14} color="#94a3b8" className="member-edit-icon" />
            </div>
            <span
              className="role-tag"
              style={{ backgroundColor: ROLE_COLORS[m.role] }}
            >
              {m.role}
            </span>
            <div className="member-info-row">
              <CalendarDays size={14} color="#64748b" />
              <span>{m.joinDate}</span>
            </div>
            {m.phone && (
              <div className="member-info-row">
                <Phone size={14} color="#64748b" />
                <span>{m.phone}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={addOpen || !!editing}
        onClose={closeAll}
        width={440}
      >
        <div className="modal-header">
          <h3 className="modal-title">{editing ? '编辑成员' : '添加成员'}</h3>
          <button className="modal-close" onClick={closeAll}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">姓名 <span className="required">*</span></label>
            <input
              type="text"
              className={'form-input' + (touched.name && nameError ? ' error' : '')}
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              placeholder="请输入2-10个汉字"
            />
            {touched.name && nameError && (
              <div className="form-error">{nameError}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">角色 <span className="required">*</span></label>
            <select
              className="form-input"
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value as MemberRole }))}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">入社日期 <span className="required">*</span></label>
            <input
              type="date"
              className="form-input"
              value={form.joinDate}
              onChange={(e) => setForm(f => ({ ...f, joinDate: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">联系方式</label>
            <input
              type="text"
              className={'form-input' + (touched.phone && phoneError ? ' error' : '')}
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, phone: true }))}
              placeholder="选填，11位手机号"
              maxLength={11}
            />
            {touched.phone && phoneError && (
              <div className="form-error">{phoneError}</div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={closeAll}
            disabled={saving}
          >
            取消
          </button>
          <button
            className="btn-success"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
