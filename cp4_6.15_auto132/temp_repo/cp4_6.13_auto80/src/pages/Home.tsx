import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, Skill, TimeSlot } from '../store';
import SkillCard from '../components/SkillCard';
import ExchangeCard from '../components/ExchangeCard';
import Modal from '../components/Modal';

const PRESET_SKILLS = [
  '吉他', '钢琴', '编程', '外语', '英语', '日语',
  '手工', '绘画', '设计', '摄影', '写作', '数学'
];

const WEEK_DAYS = [
  '周一', '周二', '周三', '周四', '周五', '周六', '周日'
];

function Home() {
  const navigate = useNavigate();
  const {
    user,
    mySkills,
    exchanges,
    fetchMySkills,
    fetchExchanges,
    fetchProfile,
    createSkill,
    updateSkill,
    deleteSkill,
    updateExchangeStatus,
    logout,
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillName, setSkillName] = useState('');
  const [skillType, setSkillType] = useState('');
  const [customType, setCustomType] = useState('');
  const [description, setDescription] = useState('');
  const [requirement, setRequirement] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine');
  const { skills, fetchAllSkills, createExchange } = useAppStore();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingSkill, setBookingSkill] = useState<Skill | null>(null);
  const [bookingTime, setBookingTime] = useState('');

  useEffect(() => {
    fetchMySkills();
    fetchExchanges();
    fetchProfile();
    fetchAllSkills();
  }, [fetchMySkills, fetchExchanges, fetchProfile, fetchAllSkills]);

  const handlePublish = () => {
    setEditingSkill(null);
    setSkillName('');
    setSkillType('');
    setCustomType('');
    setDescription('');
    setRequirement('');
    setTimeSlots([]);
    setIsModalOpen(true);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillName(skill.skill_name);
    setSkillType(skill.skill_type);
    setCustomType('');
    setDescription(skill.description);
    setRequirement(skill.requirement);
    const slots = typeof skill.time_slots === 'string'
      ? JSON.parse(skill.time_slots || '[]')
      : skill.time_slots;
    setTimeSlots(slots);
    setIsModalOpen(true);
  };

  const handleDelete = async (skill: Skill) => {
    if (confirm('确定要下架这个技能吗？')) {
      await deleteSkill(skill.id);
    }
  };

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { day: '周一', startTime: '19:00', endTime: '21:00', repeat: 'weekly' }]);
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: string) => {
    const newSlots = [...timeSlots];
    (newSlots[index] as any)[field] = value;
    setTimeSlots(newSlots);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const actualType = skillType === 'custom' ? customType : skillType;
    if (!skillName || !actualType || timeSlots.length === 0) {
      alert('请填写完整信息');
      return;
    }

    const skillData = {
      skill_name: skillName,
      skill_type: actualType,
      description,
      requirement,
      time_slots: JSON.stringify(timeSlots),
    };

    if (editingSkill) {
      await updateSkill(editingSkill.id, skillData);
    } else {
      await createSkill(skillData);
    }
    setIsModalOpen(false);
  };

  const handleBook = (skill: Skill) => {
    setBookingSkill(skill);
    setBookingTime('');
    setIsBookModalOpen(true);
  };

  const handleConfirmBook = async () => {
    if (!bookingSkill || !bookingTime) return;
    await createExchange(bookingSkill.id, bookingTime);
    setIsBookModalOpen(false);
    setBookingSkill(null);
  };

  const handleExchangeConfirm = async (exchange: any) => {
    await updateExchangeStatus(exchange.id, 'confirmed');
  };

  const handleExchangeComplete = async (exchange: any) => {
    await updateExchangeStatus(exchange.id, 'completed');
  };

  const handleExchangeCancel = async (exchange: any) => {
    if (confirm('确定要取消这个交换吗？')) {
      await updateExchangeStatus(exchange.id, 'cancelled');
    }
  };

  const maxPoints = 500;
  const progress = user ? (user.points / maxPoints) * 100 : 0;

  const pendingExchanges = exchanges.filter(e => e.status === 'pending');
  const activeExchanges = exchanges.filter(e => e.status === 'confirmed');
  const completedExchanges = exchanges.filter(e => e.status === 'completed' || e.status === 'cancelled');

  return (
    <div className="home-page">
      <header className="top-bar">
        <div className="logo">
          <span className="logo-icon">⏱</span>
          <span className="logo-text">时间银行</span>
        </div>
        <div className="user-menu">
          <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>
            退出
          </button>
        </div>
      </header>

      <div className="user-profile-section">
        <div className="profile-card">
          <div className="avatar-section">
            <div className="progress-ring">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="6"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div
                className="avatar-inner"
                style={{ backgroundColor: user?.avatar || '#ccc' }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="user-info">
            <h2 className="username">{user?.username || '用户'}</h2>
            <div className="points-display">
              <span className="points-value">{user?.points || 0}</span>
              <span className="points-label">积分</span>
            </div>
            <p className="points-hint">距离下一等级还需 {Math.max(0, maxPoints - (user?.points || 0))} 积分</p>
          </div>
          <button className="publish-btn" onClick={handlePublish}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            发布技能
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="skills-section">
          <div className="section-tabs">
            <button
              className={activeTab === 'mine' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('mine')}
            >
              我发布的
            </button>
            <button
              className={activeTab === 'all' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('all')}
            >
              全部技能
            </button>
          </div>

          <div className="section-title">
            <h3>{activeTab === 'mine' ? '我的技能时间轴' : '可预约技能'}</h3>
            <span className="count-badge">
              {activeTab === 'mine' ? mySkills.length : skills.length} 个
            </span>
          </div>

          <div className="timeline">
            {activeTab === 'mine' ? (
              mySkills.length > 0 ? (
                mySkills.map((skill, index) => (
                  <div key={skill.id} className="timeline-item">
                    <div className="timeline-dot" style={{ backgroundColor: getSkillColor(skill.skill_type) }} />
                    <div className="timeline-content">
                      <SkillCard
                        skill={skill}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewHistory={() => {}}
                        index={index}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>还没有发布技能</p>
                  <button className="empty-btn" onClick={handlePublish}>去发布</button>
                </div>
              )
            ) : (
              skills.length > 0 ? (
                skills.map((skill, index) => (
                  <div key={skill.id} className="timeline-item">
                    <div className="timeline-dot" style={{ backgroundColor: getSkillColor(skill.skill_type) }} />
                    <div className="timeline-content">
                      <SkillCard
                        skill={skill}
                        onBook={handleBook}
                        showActions={true}
                        index={index}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>暂无可预约技能</p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="exchanges-section">
          <div className="section-title">
            <h3>我的交换预约</h3>
            <span className="count-badge">{exchanges.length} 个</span>
          </div>

          {pendingExchanges.length > 0 && (
            <div className="exchange-group">
              <h4 className="group-title">待确认 ({pendingExchanges.length})</h4>
              <div className="exchange-list">
                {pendingExchanges.map((exchange, index) => (
                  <ExchangeCard
                    key={exchange.id}
                    exchange={exchange}
                    onConfirm={handleExchangeConfirm}
                    onCancel={handleExchangeCancel}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {activeExchanges.length > 0 && (
            <div className="exchange-group">
              <h4 className="group-title">进行中 ({activeExchanges.length})</h4>
              <div className="exchange-list">
                {activeExchanges.map((exchange, index) => (
                  <ExchangeCard
                    key={exchange.id}
                    exchange={exchange}
                    onComplete={handleExchangeComplete}
                    onCancel={handleExchangeCancel}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {completedExchanges.length > 0 && (
            <div className="exchange-group">
              <h4 className="group-title">已完成/已取消 ({completedExchanges.length})</h4>
              <div className="exchange-list">
                {completedExchanges.map((exchange, index) => (
                  <ExchangeCard
                    key={exchange.id}
                    exchange={exchange}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {exchanges.length === 0 && (
            <div className="empty-state">
              <p>还没有交换记录</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSkill ? '编辑技能' : '发布技能'}>
        <form onSubmit={handleSubmit} className="skill-form">
          <div className="form-group">
            <label>技能名称</label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="例如：吉他入门教学"
              required
            />
          </div>

          <div className="form-group">
            <label>技能类型</label>
            <select value={skillType} onChange={(e) => setSkillType(e.target.value)} required>
              <option value="">请选择技能类型</option>
              {PRESET_SKILLS.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
              <option value="custom">自定义...</option>
            </select>
            {skillType === 'custom' && (
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="输入自定义类型"
                className="mt-2"
              />
            )}
          </div>

          <div className="form-group">
            <label>技能描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="介绍一下你的技能水平和教学经验..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>交换要求</label>
            <input
              type="text"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="希望对方具备什么技能？"
            />
          </div>

          <div className="form-group">
            <div className="form-group-header">
              <label>可选时间段</label>
              <button type="button" className="add-slot-btn" onClick={handleAddTimeSlot}>
                + 添加时间段
              </button>
            </div>
            {timeSlots.length === 0 && (
              <p className="form-hint">请添加至少一个时间段</p>
            )}
            <div className="time-slots-list">
              {timeSlots.map((slot, index) => (
                <div key={index} className="time-slot-row">
                  <select
                    value={slot.day}
                    onChange={(e) => handleTimeSlotChange(index, 'day', e.target.value)}
                  >
                    {WEEK_DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                  />
                  <span className="time-separator">-</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                  />
                  <select
                    value={slot.repeat}
                    onChange={(e) => handleTimeSlotChange(index, 'repeat', e.target.value)}
                  >
                    <option value="weekly">每周</option>
                    <option value="biweekly">每两周</option>
                  </select>
                  <button
                    type="button"
                    className="remove-slot-btn"
                    onClick={() => handleRemoveTimeSlot(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
              取消
            </button>
            <button type="submit" className="submit-btn">
              {editingSkill ? '保存修改' : '发布技能'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title="预约技能交换">
        <div className="booking-form">
          <div className="booking-skill-info">
            <h4>{bookingSkill?.skill_name}</h4>
            <p>提供方：{bookingSkill?.provider?.username}</p>
          </div>
          <div className="form-group">
            <label>选择交换时间</label>
            <input
              type="datetime-local"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              required
            />
          </div>
          <div className="form-hint">
            交换将消耗 10 积分，完成后积分将转入提供方账户
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setIsBookModalOpen(false)}>
              取消
            </button>
            <button type="button" className="submit-btn" onClick={handleConfirmBook}>
              确认预约
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        .home-page {
          min-height: 100vh;
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          margin-bottom: 20px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
        }

        .logo-icon {
          font-size: 28px;
        }

        .logo-text {
          font-size: 22px;
          font-weight: 700;
        }

        .logout-btn {
          padding: 8px 20px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-radius: 10px;
          font-size: 14px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .user-profile-section {
          margin-bottom: 28px;
        }

        .profile-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .avatar-section {
          flex-shrink: 0;
        }

        .progress-ring {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .avatar-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 84px;
          height: 84px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
          font-weight: 600;
        }

        .user-info {
          flex: 1;
          color: white;
        }

        .username {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .points-display {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 4px;
        }

        .points-value {
          font-size: 36px;
          font-weight: 700;
          background: linear-gradient(135deg, #a78bfa, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .points-label {
          font-size: 16px;
          opacity: 0.8;
        }

        .points-hint {
          font-size: 13px;
          opacity: 0.6;
        }

        .publish-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: white;
          color: var(--accent-purple);
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
        }

        .publish-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .skills-section,
        .exchanges-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 24px;
          max-height: calc(100vh - 340px);
          overflow-y: auto;
        }

        .section-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          padding: 4px;
          background: var(--bg-secondary);
          border-radius: 12px;
        }

        .section-tabs .tab {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
        }

        .section-tabs .tab.active {
          background: white;
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-title h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .count-badge {
          padding: 4px 12px;
          background: var(--bg-secondary);
          border-radius: 20px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .timeline {
          position: relative;
          padding-left: 24px;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--border-color);
        }

        .timeline-item {
          position: relative;
          margin-bottom: 16px;
        }

        .timeline-item:last-child {
          margin-bottom: 0;
        }

        .timeline-dot {
          position: absolute;
          left: -20px;
          top: 20px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }

        .timeline-content {
          animation: slideInLeft 0.3s ease;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }

        .empty-state p {
          margin-bottom: 16px;
          font-size: 14px;
        }

        .empty-btn {
          padding: 10px 24px;
          background: var(--accent-purple);
          color: white;
          border-radius: 10px;
          font-size: 14px;
        }

        .exchange-group {
          margin-bottom: 24px;
        }

        .exchange-group:last-child {
          margin-bottom: 0;
        }

        .group-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .exchange-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skill-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px 14px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          font-size: 14px;
          background: white;
          color: var(--text-primary);
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: var(--accent-purple);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .form-hint {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .mt-2 {
          margin-top: 8px;
        }

        .add-slot-btn {
          padding: 6px 14px;
          background: var(--bg-secondary);
          color: var(--accent-purple);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
        }

        .add-slot-btn:hover {
          background: var(--border-color);
        }

        .time-slots-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .time-slot-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background: var(--bg-secondary);
          border-radius: 10px;
        }

        .time-slot-row select,
        .time-slot-row input {
          padding: 8px 10px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 13px;
          background: white;
          min-width: 70px;
        }

        .time-separator {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .remove-slot-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: var(--accent-red);
          color: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
        }

        .remove-slot-btn:hover {
          opacity: 1;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }

        .cancel-btn {
          padding: 12px 24px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
        }

        .cancel-btn:hover {
          background: var(--border-color);
        }

        .submit-btn {
          padding: 12px 28px;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
          color: white;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          border: none;
        }

        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .booking-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .booking-skill-info {
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 12px;
        }

        .booking-skill-info h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--text-primary);
        }

        .booking-skill-info p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        @media (max-width: 1024px) {
          .main-content {
            grid-template-columns: 1fr;
          }

          .skills-section,
          .exchanges-section {
            max-height: none;
          }
        }

        @media (max-width: 640px) {
          .home-page {
            padding: 16px;
          }

          .profile-card {
            flex-direction: column;
            text-align: center;
            padding: 24px;
          }

          .user-info {
            text-align: center;
          }

          .publish-btn {
            width: 100%;
            justify-content: center;
          }

          .time-slot-row {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}

const skillColors: Record<string, string> = {
  '吉他': '#f97316',
  '钢琴': '#f97316',
  '音乐': '#f97316',
  '编程': '#3b82f6',
  '前端': '#3b82f6',
  '后端': '#3b82f6',
  '外语': '#10b981',
  '英语': '#10b981',
  '日语': '#10b981',
  '手工': '#8b5cf6',
  '绘画': '#8b5cf6',
  '设计': '#8b5cf6',
  '运动': '#ec4899',
  '健身': '#ec4899',
  '摄影': '#f59e0b',
  '写作': '#6366f1',
  '数学': '#14b8a6',
  '物理': '#14b8a6',
};

function getSkillColor(type: string) {
  return skillColors[type] || '#6b7280';
}

export default Home;
