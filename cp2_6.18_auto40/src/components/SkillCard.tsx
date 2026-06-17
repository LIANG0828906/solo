import { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiPencil, mdiDelete, mdiSwapHorizontal } from '@mdi/js';
import type { Skill, User } from '@/types';
import { useStore } from '@/store/useStore';
import { Modal } from './Modal';

interface SkillCardProps {
  skill: Skill;
  user?: User;
  showActions?: boolean;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skillId: string) => void;
  onExchange?: (skill: Skill) => void;
}

export const SkillCard = memo(function SkillCard({
  skill,
  user,
  showActions = false,
  onEdit,
  onDelete,
  onExchange,
}: SkillCardProps) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const cardUser = user || useStore((state) => state.getUserById(skill.userId));

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.skill-card-actions')) return;
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

  return (
    <>
      <div className="skill-card" onClick={handleCardClick}>
        <div className="skill-card-header">
          <div className="skill-card-avatar">{cardUser?.avatar || 'U'}</div>
          <div className="skill-card-info">
            <div className="skill-card-name">{cardUser?.nickname || '未知用户'}</div>
            <div className="skill-card-category">{skill.category}</div>
          </div>
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
