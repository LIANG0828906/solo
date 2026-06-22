import { useState, useCallback, useMemo } from 'react';
import { Plus, X, MapPin, Users, CalendarClock } from 'lucide-react';
import Modal from '@/components/Modal';
import { useStore, getAvatarColor, validateName } from '@/hooks/useStore';
import { formatDateTime } from '@/utils/format';
import type { Activity } from '@/types';

interface ActivityFormData {
  name: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  description: string;
}

const emptyActivityForm: ActivityFormData = {
  name: '',
  startTime: '',
  endTime: '',
  location: '',
  maxParticipants: 50,
  description: '',
};

export default function Activities() {
  const activities = useStore(s => s.activities);
  const members = useStore(s => s.members);
  const addActivity = useStore(s => s.addActivity);
  const signUpActivity = useStore(s => s.signUpActivity);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<ActivityFormData>(emptyActivityForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [signupActivity, setSignupActivity] = useState<Activity | null>(null);
  const [signupMemberName, setSignupMemberName] = useState<string>('');
  const [signupMemberTouched, setSignupMemberTouched] = useState(false);

  const formErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name) e.name = '请输入活动名称';
    if (!form.startTime) e.startTime = '请选择开始时间';
    if (!form.endTime) e.endTime = '请选择结束时间';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      e.endTime = '结束时间需晚于开始时间';
    }
    if (!form.location) e.location = '请输入活动地点';
    if (!Number.isInteger(form.maxParticipants) || form.maxParticipants < 30 || form.maxParticipants > 100) {
      e.maxParticipants = '人数需为30-100的整数';
    }
    if (form.description.length > 500) {
      e.description = '简介不超过500字';
    }
    return e;
  }, [form]);

  const canCreate = Object.keys(formErrors).length === 0 && form.name.length > 0;

  const memberNameError = useMemo(() => {
    if (!signupMemberName) return '请输入报名人姓名';
    if (!validateName(signupMemberName)) return '姓名为2-10个汉字';
    if (signupActivity && signupActivity.participantIds.some(id => {
      const m = members.find(x => x.id === id);
      return m && m.name === signupMemberName;
    })) {
      return '该成员已报名';
    }
    return '';
  }, [signupMemberName, signupActivity, members]);

  const openAdd = useCallback(() => {
    setForm(emptyActivityForm);
    setTouched({});
    setAddOpen(true);
  }, []);

  const closeAdd = useCallback(() => {
    setAddOpen(false);
  }, []);

  const handleCreate = useCallback(() => {
    if (!canCreate) {
      setTouched({
        name: true, startTime: true, endTime: true,
        location: true, maxParticipants: true, description: true,
      });
      return;
    }
    addActivity(form);
    closeAdd();
  }, [canCreate, form, addActivity, closeAdd]);

  const openSignup = useCallback((a: Activity) => {
    setSignupActivity(a);
    setSignupMemberName('');
    setSignupMemberTouched(false);
  }, []);

  const closeSignup = useCallback(() => {
    setSignupActivity(null);
  }, []);

  const handleSignup = useCallback(() => {
    if (!signupActivity) return;
    if (memberNameError) {
      setSignupMemberTouched(true);
      return;
    }
    let member = members.find(m => m.name === signupMemberName);
    if (!member) {
      useStore.getState().addMember({
        name: signupMemberName,
        role: '普通成员',
        joinDate: new Date().toISOString().slice(0, 10),
      });
      const updated = useStore.getState().members;
      member = updated[updated.length - 1];
    }
    if (member) {
      signUpActivity(signupActivity.id, member.id);
    }
    closeSignup();
  }, [signupActivity, signupMemberName, memberNameError, members, signUpActivity, closeSignup]);

  const getMemberById = (id: string) => members.find(m => m.id === id);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">活动管理</h1>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} />
          创建活动
        </button>
      </div>

      <div className="activity-grid">
        {activities.map(a => {
          const full = a.participantIds.length >= a.maxParticipants;
          const percent = Math.min(100, (a.participantIds.length / a.maxParticipants) * 100);
          const visibleParticipants = a.participantIds.slice(0, 10);
          const remaining = a.participantIds.length - visibleParticipants.length;

          return (
            <div key={a.id} className="activity-card">
              <div className="activity-card-leftbar" />
              <div className="activity-card-inner">
                <div className="activity-time">
                  <CalendarClock size={14} />
                  {formatDateTime(a.startTime)}
                </div>
                <h3 className="activity-name">{a.name}</h3>
                <div className="activity-location">
                  <MapPin size={14} />
                  {a.location}
                </div>
                <p className="activity-desc">{a.description}</p>

                <div className="activity-participants">
                  {visibleParticipants.map((pid, idx) => {
                    const m = getMemberById(pid);
                    const name = m?.name || '?';
                    return (
                      <div
                        key={pid}
                        className="avatar"
                        style={{
                          backgroundColor: getAvatarColor(pid),
                          zIndex: visibleParticipants.length - idx,
                          marginLeft: idx > 0 ? -8 : 0,
                        }}
                        title={name}
                      >
                        {name.charAt(0)}
                      </div>
                    );
                  })}
                  {remaining > 0 && (
                    <div className="avatar-more" style={{ marginLeft: -8 }}>
                      +{remaining}
                    </div>
                  )}
                </div>

                <div className="activity-bottom">
                  <div className="activity-count">
                    <Users size={14} />
                    {a.participantIds.length}/{a.maxParticipants}人
                  </div>
                  <button
                    className={'btn-signup' + (full ? ' disabled' : '')}
                    onClick={() => !full && openSignup(a)}
                    disabled={full}
                  >
                    {full ? '已报满' : '报名'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={addOpen} onClose={closeAdd} width={480}>
        <div className="modal-header">
          <h3 className="modal-title">创建活动</h3>
          <button className="modal-close" onClick={closeAdd}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">活动名称 <span className="required">*</span></label>
            <input
              type="text"
              className={'form-input' + (touched.name && formErrors.name ? ' error' : '')}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
            />
            {touched.name && formErrors.name && <div className="form-error">{formErrors.name}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">开始时间 <span className="required">*</span></label>
              <input
                type="datetime-local"
                className={'form-input' + (touched.startTime && formErrors.startTime ? ' error' : '')}
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                onBlur={() => setTouched(t => ({ ...t, startTime: true }))}
              />
              {touched.startTime && formErrors.startTime && <div className="form-error">{formErrors.startTime}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">结束时间 <span className="required">*</span></label>
              <input
                type="datetime-local"
                className={'form-input' + (touched.endTime && formErrors.endTime ? ' error' : '')}
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                onBlur={() => setTouched(t => ({ ...t, endTime: true }))}
              />
              {touched.endTime && formErrors.endTime && <div className="form-error">{formErrors.endTime}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">地点 <span className="required">*</span></label>
            <input
              type="text"
              className={'form-input' + (touched.location && formErrors.location ? ' error' : '')}
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, location: true }))}
            />
            {touched.location && formErrors.location && <div className="form-error">{formErrors.location}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">最大参与人数 <span className="required">*</span></label>
            <input
              type="number"
              min={30}
              max={100}
              className={'form-input' + (touched.maxParticipants && formErrors.maxParticipants ? ' error' : '')}
              value={form.maxParticipants}
              onChange={e => setForm(f => ({ ...f, maxParticipants: parseInt(e.target.value) || 0 }))}
              onBlur={() => setTouched(t => ({ ...t, maxParticipants: true }))}
            />
            {touched.maxParticipants && formErrors.maxParticipants && <div className="form-error">{formErrors.maxParticipants}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">活动简介</label>
            <textarea
              className={'form-input' + (touched.description && formErrors.description ? ' error' : '')}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, description: true }))}
              rows={3}
              maxLength={500}
              placeholder="最多500字"
            />
            {touched.description && formErrors.description && <div className="form-error">{formErrors.description}</div>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={closeAdd}>取消</button>
          <button className="btn-primary" onClick={handleCreate}>创建</button>
        </div>
      </Modal>

      <Modal open={!!signupActivity} onClose={closeSignup} width={400}>
        {signupActivity && (
          <>
            <div className="modal-header">
              <h3 className="modal-title">报名确认</h3>
              <button className="modal-close" onClick={closeSignup}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
                {signupActivity.name}
              </h4>
              <div className="signup-progress-label">
                已报名 {signupActivity.participantIds.length} / {signupActivity.maxParticipants} 人
              </div>
              <div className="signup-progress-bar">
                <div
                  className="signup-progress-fill"
                  style={{ width: `${Math.min(100, (signupActivity.participantIds.length / signupActivity.maxParticipants) * 100)}%` }}
                />
              </div>
              <div className="signup-member-select">
                <label className="form-label">报名人姓名 <span className="required">*</span></label>
                <input
                  type="text"
                  className={'signup-member-input' + (signupMemberTouched && memberNameError ? ' error' : '')}
                  value={signupMemberName}
                  onChange={e => setSignupMemberName(e.target.value)}
                  onBlur={() => setSignupMemberTouched(true)}
                  placeholder="请输入2-10个汉字姓名"
                />
                {signupMemberTouched && memberNameError && (
                  <div className="signup-member-error">{memberNameError}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeSignup}>取消</button>
              <button className="btn-success" onClick={handleSignup}>确认报名</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
