import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiPlus, mdiSwapHorizontal } from '@mdi/js';
import { SkillCard } from '@/components/SkillCard';
import { CanvasRadar } from '@/components/CanvasRadar';
import { Modal } from '@/components/Modal';
import {
  useStore,
  useUserSkills,
  useUserExchangeRecords,
  useRadarScores,
} from '@/store/useStore';
import { formatRelativeTime } from '@/utils/time';
import type { Skill } from '@/types';
import { CATEGORIES, RADAR_LABELS, RadarDimension } from '@/types';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const {
    currentUser,
    getUserById,
    addSkill,
    updateSkill,
    removeSkill,
    updateRadarScores,
    sendInvite,
  } = useStore();

  const user = userId ? getUserById(userId) : currentUser;
  const isOwnProfile = user?.id === currentUser.id;
  const userSkills = useUserSkills(user?.id || '');
  const exchangeRecords = useUserExchangeRecords(user?.id || '');
  const radarScores = useRadarScores(user?.id || '');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [exchangeSkill, setExchangeSkill] = useState<Skill | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    tags: '',
    description: '',
    category: CATEGORIES[0],
  });

  const [exchangeForm, setExchangeForm] = useState({
    expectedTime: '',
    note: '',
  });

  const handleAddSkill = useCallback(() => {
    setFormData({ title: '', tags: '', description: '', category: CATEGORIES[0] });
    setShowAddModal(true);
  }, []);

  const handleEditSkill = useCallback((skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      title: skill.title,
      tags: skill.tags.join(', '),
      description: skill.description,
      category: skill.category,
    });
    setShowEditModal(true);
  }, []);

  const handleDeleteSkill = useCallback(
    (skillId: string) => {
      removeSkill(skillId);
    },
    [removeSkill]
  );

  const handleExchange = useCallback((skill: Skill) => {
    setExchangeSkill(skill);
    setExchangeForm({ expectedTime: '', note: '' });
    setShowExchangeModal(true);
  }, []);

  const submitAdd = useCallback(() => {
    if (!formData.title.trim()) return;
    addSkill({
      userId: currentUser.id,
      title: formData.title.trim(),
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      description: formData.description.trim(),
      category: formData.category,
    });
    setShowAddModal(false);
  }, [formData, addSkill, currentUser.id]);

  const submitEdit = useCallback(() => {
    if (!editingSkill || !formData.title.trim()) return;
    updateSkill(editingSkill.id, {
      title: formData.title.trim(),
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      description: formData.description.trim(),
      category: formData.category,
    });
    setShowEditModal(false);
    setEditingSkill(null);
  }, [editingSkill, formData, updateSkill]);

  const submitExchange = useCallback(() => {
    if (!exchangeSkill || !exchangeForm.expectedTime.trim()) return;
    sendInvite({
      fromUserId: currentUser.id,
      toUserId: user!.id,
      skillId: exchangeSkill.id,
      skillTitle: exchangeSkill.title,
      expectedTime: exchangeForm.expectedTime.trim(),
      note: exchangeForm.note.trim(),
    });
    setShowExchangeModal(false);
    setExchangeSkill(null);
  }, [exchangeSkill, exchangeForm, sendInvite, currentUser.id, user]);

  const handleRadarChange = useCallback(
    (scores: Record<RadarDimension, number>) => {
      updateRadarScores(scores);
    },
    [updateRadarScores]
  );

  const charCountClass = useMemo(() => {
    const len = exchangeForm.note.length;
    if (len > 200) return 'error';
    if (len > 160) return 'warning';
    return '';
  }, [exchangeForm.note.length]);

  if (!user) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-text">用户不存在</div>
        </div>
      </div>
    );
  }

  const radarDimensions: RadarDimension[] = ['frontend', 'backend', 'design', 'dataAnalysis', 'softSkills'];

  return (
    <div className="page">
      <div className="profile-header">
        <div className="profile-avatar">{user.avatar}</div>
        <div className="profile-info">
          <div className="profile-name">{user.nickname}</div>
          <div className="profile-bio">{user.bio}</div>
        </div>
        {!isOwnProfile && (
          <div className="profile-actions">
            <button className="btn btn-primary" onClick={handleAddSkill}>
              <Icon path={mdiSwapHorizontal} size={0.8} /> 发起交换
            </button>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">
          <span>我的技能</span>
          {isOwnProfile && (
            <button className="btn btn-primary" onClick={handleAddSkill}>
              <Icon path={mdiPlus} size={0.8} /> 添加技能
            </button>
          )}
        </div>

        {userSkills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💡</div>
            <div className="empty-state-text">
              {isOwnProfile ? '还没有发布技能，点击上方按钮添加吧' : '该用户还没有发布技能'}
            </div>
          </div>
        ) : (
          <div className="skill-board">
            {userSkills.map((skill) => (
              <div key={skill.id} className="skill-board-card">
                <SkillCard
                  skill={skill}
                  user={user}
                  showActions={isOwnProfile}
                  onEdit={handleEditSkill}
                  onDelete={handleDeleteSkill}
                  onExchange={!isOwnProfile ? handleExchange : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">
          <span>技能雷达图</span>
          {isOwnProfile && (
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              拖拽顶点可调整数值
            </span>
          )}
        </div>

        <div className="radar-section">
          <CanvasRadar
            scores={radarScores}
            size={320}
            editable={isOwnProfile}
            onChange={handleRadarChange}
          />
          <div className="radar-legend">
            {radarDimensions.map((dim) => (
              <div key={dim} className="radar-legend-item">
                <div className="radar-legend-dot" />
                <span className="radar-legend-label">{RADAR_LABELS[dim]}</span>
                <span className="radar-legend-value">{radarScores[dim]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          <span>交换记录</span>
          <span style={{ fontSize: 14, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
            共 {exchangeRecords.length} 次
          </span>
        </div>

        {exchangeRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">暂无交换记录</div>
          </div>
        ) : (
          <div className="exchange-list">
            {exchangeRecords.map((record) => {
              const partner = getUserById(
                record.fromUserId === user.id ? record.toUserId : record.fromUserId
              );
              return (
                <div key={record.id} className="exchange-item">
                  <div className="exchange-avatar">{partner?.avatar || '?'}</div>
                  <div className="exchange-content">
                    <div className="exchange-skill">
                      与 {partner?.nickname || '未知用户'} 交换了「{record.skillTitle}」
                    </div>
                    <div className="exchange-time">
                      {formatRelativeTime(record.createdAt)} · {record.exchangeTime}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="发布新技能"
      >
        <div className="form-group">
          <label className="form-label">技能名称</label>
          <input
            className="form-input"
            placeholder="例如：Python 编程入门"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">分类</label>
          <select
            className="form-input"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">标签（用逗号分隔）</label>
          <input
            className="form-input"
            placeholder="例如：Python, 编程, 入门"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">技能描述</label>
          <textarea
            className="form-input form-textarea"
            placeholder="介绍一下你的技能，以及你希望如何交换..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
            取消
          </button>
          <button className="btn btn-primary" onClick={submitAdd}>
            发布
          </button>
        </div>
      </Modal>

      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑技能"
      >
        <div className="form-group">
          <label className="form-label">技能名称</label>
          <input
            className="form-input"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">分类</label>
          <select
            className="form-input"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">标签（用逗号分隔）</label>
          <input
            className="form-input"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">技能描述</label>
          <textarea
            className="form-input form-textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
            取消
          </button>
          <button className="btn btn-primary" onClick={submitEdit}>
            保存
          </button>
        </div>
      </Modal>

      <Modal
        open={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        title={`发起「${exchangeSkill?.title}」交换`}
      >
        <div className="form-group">
          <label className="form-label">期望交换时间</label>
          <input
            className="form-input"
            placeholder="例如：每周三晚上 8 点"
            value={exchangeForm.expectedTime}
            onChange={(e) => setExchangeForm({ ...exchangeForm, expectedTime: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">附加说明</label>
          <div className="form-textarea-wrapper">
            <textarea
              className="form-input form-textarea"
              placeholder="简单介绍一下你想交换的内容和你的期望..."
              maxLength={200}
              value={exchangeForm.note}
              onChange={(e) => setExchangeForm({ ...exchangeForm, note: e.target.value })}
            />
            <span className={`char-count ${charCountClass}`}>
              {exchangeForm.note.length}/200
            </span>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setShowExchangeModal(false)}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={submitExchange}
            disabled={!exchangeForm.expectedTime.trim() || exchangeForm.note.length > 200}
          >
            发送邀请
          </button>
        </div>
      </Modal>
    </div>
  );
}
