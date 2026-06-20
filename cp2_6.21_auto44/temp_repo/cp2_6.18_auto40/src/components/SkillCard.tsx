import { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiPencil, mdiDelete, mdiSwapHorizontal, mdiAccountSearch } from '@mdi/js';
import type { Skill, User } from '@/types';
import { useStore, useMatchScore, getMatchBadgeColor } from '@/store/useStore';
import { Modal } from './Modal';

interface SkillCardProps {
  skill: Skill;
  user?: User;
  showActions?: boolean;
  showMatchBadge?: boolean;
  highlighted?: boolean;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skillId: string) => void;
  onExchange?: (skill: Skill) => void;
  onFindPartner?: (skill: Skill) => void;
}

export const SkillCard = memo(function SkillCard({
  skill,
  user,
  showActions = false,
  showMatchBadge = false,
  highlighted = false,
  onEdit,
  onDelete,
  onExchange,
  onFindPartner,
}: SkillCardProps) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const cardUser = user || useStore((state) => state.getUserById(skill.userId));
  const currentUserId = useStore((state) => state.currentUser.id);
  const isOwnSkill = skill.userId === currentUserId;
  const matchScore = useMatchScore(skill.userId);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.skill-card-actions')) return;
      if ((e.target as HTMLElement).closest('.match-badge')) return;
      if (cardUser) {
        navigate(`/profile/${cardUser.id}`);
      }
    },
    [navigate, cardUser]
  );

  const handleDelete = useCallback(() => {
    onDelete?.(skill.id);
    setShowDeleteConfirm(false);
  }, [onDelete, skill.id]);

  const badgeColor = showMatchBadge && !isOwnSkill ? getMatchBadgeColor(matchScore) : null;

  return (
    <>
      <div
        className={`skill-card ${highlighted ? 'skill-card-highlighted' : ''}`}
        onClick={handleCardClick}
        style={
          highlighted
            ? {
                border: '2px dashed #6366F1',
                animation: 'pulse-border 2s ease-in-out infinite',
              }
            : undefined
        }
      >
        <div className="skill-card-header">
          <div className="skill-card-avatar">{cardUser?.avatar || 'U'}</div>
          <div className="skill-card-info">
            <div className="skill-card-name">{cardUser?.nickname || '未知用户'}</div>
            <div className="skill-card-category">{skill.category}</div>
          </div>
          {badgeColor !== null && (
            <span
              className="match-badge"
              style={{
                background: badgeColor,
                color: 'white',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                alignSelf: 'flex-start',
                flexShrink: 0,
              }}
            >
              {matchScore}% 匹配
            </span>
          )}
        </div>

        <div className="skill-card-title">{skill.title}</div>

        <div className="skill-card-tags">
          {skill.tags.map((tag, idx) => (
            <span key={idx} className="skill-tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="skill-card-desc">{skill.description}</div>

        {showActions && (
          <div className="skill-card-actions">
            <button
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(skill);
              }}
              title="编辑"
            >
              <Icon path={mdiPencil} size={0.8} />
            </button>
            <button
              className="icon-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              title="删除"
            >
              <Icon path={mdiDelete} size={0.8} />
            </button>
          </div>
        )}

        {onFindPartner && (
          <div className="skill-card-actions">
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: 6 }}
              onClick={(e) => {
                e.stopPropagation();
                onFindPartner(skill);
              }}
            >
              <Icon path={mdiAccountSearch} size={0.8} /> 寻找交换伙伴
            </button>
          </div>
        )}

        {onExchange && (
          <div className="skill-card-actions">
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                onExchange(skill);
              }}
            >
              <Icon path={mdiSwapHorizontal} size={0.8} /> 发起交换
            </button>
          </div>
        )}
      </div>

      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除"
      >
        <p style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
          确定要删除技能 "{skill.title}" 吗？此操作不可撤销。
        </p>
        <div className="form-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            取消
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            确认删除
          </button>
        </div>
      </Modal>
    </>
  );
});
