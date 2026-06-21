import { useState, useEffect } from 'react';
import { User, Target, Trash2, Save } from 'lucide-react';
import { Input, Slider, Modal, Button, message } from 'antd';
import { api } from './services/api';
import { storage } from './services/storage';
import type { User as UserType } from './types';
import './settings-page.css';

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [nickname, setNickname] = useState('');
  const [dailyGoal, setDailyGoal] = useState(60);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.getUser();
      if (res.success && res.data) {
        setUser(res.data);
        setNickname(res.data.nickname);
        setDailyGoal(res.data.dailyGoal);
        storage.setUser(res.data);
      }
    } catch {
      const localUser = storage.getUser();
      if (localUser) {
        setUser(localUser);
        setNickname(localUser.nickname);
        setDailyGoal(localUser.dailyGoal);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateUser({ nickname, dailyGoal });
      if (res.success && res.data) {
        setUser(res.data);
        storage.setUser(res.data);
        message.success('设置已保存');
      }
    } catch {
      if (user) {
        const updated = { ...user, nickname, dailyGoal };
        setUser(updated);
        storage.setUser(updated);
        message.success('设置已保存');
      }
    }
    setSaving(false);
  };

  const handleReset = () => {
    setResetModalOpen(true);
  };

  const confirmReset = () => {
    storage.clearAll();
    localStorage.clear();
    message.success('数据已重置，页面即将刷新...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const marks = {
    15: '15分',
    60: '1小时',
    120: '2小时',
    180: '3小时',
    240: '4小时',
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">个人设置</h1>
        <p className="page-subtitle">管理你的学习偏好</p>
      </div>

      <div className="settings-content">
        <div className="setting-card glass-card">
          <div className="setting-card-header">
            <div className="setting-icon user-icon">
              <User size={20} />
            </div>
            <h3 className="setting-title">个人信息</h3>
          </div>
          <div className="setting-body">
            <div className="form-item">
              <label className="form-label">昵称</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                maxLength={20}
                className="setting-input"
                prefix={<User size={16} style={{ color: '#6b7280' }} />}
              />
            </div>
          </div>
        </div>

        <div className="setting-card glass-card">
          <div className="setting-card-header">
            <div className="setting-icon target-icon">
              <Target size={20} />
            </div>
            <h3 className="setting-title">学习目标</h3>
          </div>
          <div className="setting-body">
            <div className="goal-display">
              <span className="goal-label">每日学习目标</span>
              <span className="goal-value">{dailyGoal} 分钟</span>
            </div>
            <div className="slider-wrapper">
              <Slider
                min={15}
                max={240}
                step={15}
                value={dailyGoal}
                onChange={setDailyGoal}
                marks={marks}
                tooltip={{
                  formatter: (value) => `${value}分钟`,
                }}
                className="goal-slider"
              />
            </div>
            <div className="goal-hint">
              {dailyGoal < 30
                ? '🐢 轻松模式，慢慢来'
                : dailyGoal < 60
                ? '📚 适度学习，保持节奏'
                : dailyGoal < 120
                ? '💪 努力模式，加油！'
                : '🔥 学霸模式，冲鸭！'}
            </div>
          </div>
        </div>

        <Button
          type="primary"
          block
          size="large"
          onClick={handleSave}
          loading={saving}
          className="save-btn"
          icon={<Save size={16} />}
        >
          保存设置
        </Button>

        <div className="setting-card danger-card glass-card">
          <div className="setting-card-header">
            <div className="setting-icon danger-icon">
              <Trash2 size={20} />
            </div>
            <h3 className="setting-title danger-title">数据管理</h3>
          </div>
          <div className="setting-body">
            <p className="danger-desc">
              重置将清除所有学习记录、项目和设置数据，此操作不可恢复，请谨慎操作。
            </p>
            <Button danger block onClick={handleReset} className="reset-btn">
              <Trash2 size={16} />
              重置所有数据
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title="确认重置数据"
        open={resetModalOpen}
        onOk={confirmReset}
        onCancel={() => setResetModalOpen(false)}
        okText="确认重置"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        className="reset-modal"
        transitionName="reset-modal-zoom"
      >
        <div className="reset-modal-content">
          <div className="reset-warning-icon">
            <Trash2 size={32} />
          </div>
          <p className="reset-warning-text">
            确定要重置所有数据吗？
            <br />
            此操作将永久删除所有学习记录、项目和设置，无法恢复。
          </p>
        </div>
      </Modal>
    </div>
  );
}
