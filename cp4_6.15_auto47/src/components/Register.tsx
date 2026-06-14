import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/types';
import { getAllCommunities, getAvatarEmoji } from '@/data';

interface RegisterProps {
  onComplete: (user: User) => void;
}

const avatarOptions = ['🍜', '🥟', '🍱', '🍲', '🍛', '🥗', '🍕', '🍔', '🍣', '🍤'];
const spicyLabels = ['不辣', '微辣', '中辣', '特辣', '变态辣'];

const Register: React.FC<RegisterProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [community, setCommunity] = useState('');
  const [spicyLevel, setSpicyLevel] = useState(2);
  const [eatCilantro, setEatCilantro] = useState(true);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [bio, setBio] = useState('');
  const communities = getAllCommunities();

  const handleSubmit = () => {
    if (!nickname.trim() || !community) return;
    const user: User = {
      id: uuidv4(),
      nickname: nickname.trim(),
      avatar: avatarOptions[selectedAvatar],
      community,
      taste: { spicyLevel, eatCilantro, isVegetarian },
      bio: bio.trim() || '很高兴认识大家！',
    };
    onComplete(user);
  };

  const canNext = step === 1 && nickname.trim() && community;

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-logo">🍲</div>
        <h1 className="register-title">欢迎加入拼桌小饭桌</h1>
        <p className="register-subtitle">
          和邻居一起吃顿热乎饭，认识新朋友
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 24,
        }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? 32 : 10,
                height: 6,
                borderRadius: 3,
                background: s <= step ? 'var(--coral)' : 'var(--border)',
                transition: 'all 300ms ease',
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="view-wrapper">
            <div className="form-group">
              <label className="form-label">你的昵称</label>
              <input
                type="text"
                className="form-input"
                placeholder="比如：爱吃红烧肉的小李"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={16}
              />
            </div>

            <div className="form-group">
              <label className="form-label">选择头像</label>
              <div className="avatar-options">
                {avatarOptions.map((a, i) => (
                  <div
                    key={i}
                    className={`avatar-option ${selectedAvatar === i ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(i)}
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                你的小区或地标
                <span className="form-label-hint">方便附近的邻居找到你</span>
              </label>
              <select
                className="form-select"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
              >
                <option value="">请选择...</option>
                {communities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={() => setStep(2)}
              disabled={!canNext}
              style={{ marginTop: 8, opacity: canNext ? 1 : 0.5, cursor: canNext ? 'pointer' : 'not-allowed' }}
            >
              下一步：口味偏好
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="view-wrapper">
            <div className="form-group">
              <label className="form-label">
                辣度偏好
                <span className="slider-value">{spicyLabels[spicyLevel]}</span>
              </label>
              <div className="slider-wrap">
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={1}
                  value={spicyLevel}
                  onChange={(e) => setSpicyLevel(parseInt(e.target.value))}
                  onInput={(e) => setSpicyLevel(parseInt((e.target as HTMLInputElement).value))}
                  className="slider"
                />
                <div className="slider-labels">
                  {spicyLabels.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--cream)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 14px',
              marginBottom: 18,
            }}>
              <div className="switch-row">
                <span className="switch-label">🌿 吃香菜</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={eatCilantro}
                    onChange={(e) => setEatCilantro(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div className="switch-row">
                <span className="switch-label">🥬 素食主义者</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isVegetarian}
                    onChange={(e) => setIsVegetarian(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                一句自我介绍
                <span className="form-label-hint">让邻居更了解你</span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="比如：程序员一枚，擅长做川菜，喜欢养猫"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={60}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setStep(1)}
                style={{ flex: 1 }}
              >
                上一步
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                style={{ flex: 2 }}
              >
                进入拼桌大厅
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
