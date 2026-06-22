import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { Skill, CATEGORY_COLORS } from '../types';

interface Props {
  skill: Skill;
  index: number;
}

export default function SkillCard({ skill, index }: Props) {
  const user = skill.user;
  if (!user) return null;

  const categoryColor = CATEGORY_COLORS[skill.category] || '#4A6741';
  const initial = user.name.charAt(0);
  const stars = Math.round(user.rating);

  return (
    <Link
      to={`/skills/${skill.id}`}
      className="card block overflow-hidden fade-in-up"
      style={{
        animationDelay: `${index * 80}ms`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(61, 51, 40, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(61, 51, 40, 0.08)';
      }}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="avatar"
            style={{
              width: 56, height: 56, fontSize: 22,
              background: `linear-gradient(135deg, ${user.avatarColor}, ${user.avatarColor}cc)`,
            }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg truncate" style={{ color: 'var(--text)' }}>
                {skill.title}
              </h3>
              <span
                className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
                style={{ background: `${categoryColor}15`, color: categoryColor }}
              >
                {skill.category}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
              {user.name}
              {user.badge && (
                <span className={`badge badge-${user.badge} ml-2`} style={{ fontSize: 10, padding: '1px 6px' }}>
                  {user.badge === 'gold' ? '金' : user.badge === 'silver' ? '银' : '铜'}
                </span>
              )}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={i <= stars ? 'star filled' : 'star'}
                  fill={i <= stars ? 'var(--accent)' : 'none'}
                />
              ))}
              <span className="text-xs ml-1" style={{ color: 'var(--text-light)' }}>
                {user.rating} · {user.reviewCount}条评价
              </span>
            </div>
          </div>
        </div>

        <p
          className="mt-4 text-sm line-clamp-2"
          style={{ color: 'var(--text-light)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {skill.description}
        </p>

        <div className="mt-4 flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--primary)' }}>
            <MapPin size={14} />
            <span>
              {skill.distance != null && skill.distance < 1
                ? `${Math.round(skill.distance * 1000)}m`
                : `${(skill.distance ?? 0).toFixed(1)}km`}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-light)' }}>
            服务半径 {skill.radius}km
          </span>
        </div>
      </div>
    </Link>
  );
}
