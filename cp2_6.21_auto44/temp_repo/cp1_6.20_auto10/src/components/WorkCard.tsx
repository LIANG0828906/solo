import { useNavigate } from 'react-router-dom';
import type { Work } from '../types';

interface WorkCardProps {
  work: Work;
}

const categoryLabels: Record<string, string> = {
  article: '文章',
  video: '视频',
  image: '图片',
};

const categoryColors: Record<string, string> = {
  article: '#89b4fa',
  video: '#f38ba8',
  image: '#a6e3a1',
};

const WorkCard = ({ work }: WorkCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/work/${work.id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#1e1e2e',
        border: '1px solid #313244',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      }}
    >
      <img
        src={work.coverUrl}
        alt={work.title}
        style={{
          width: '100%',
          height: '180px',
          objectFit: 'cover',
        }}
      />
      <div style={{ padding: '16px' }}>
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#cdd6f4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {work.title}
        </h3>
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#1e1e2e',
              backgroundColor: categoryColors[work.category],
            }}
          >
            {categoryLabels[work.category]}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '14px',
            color: '#6c7086',
          }}
        >
          <span>
          👁️ {work.views}
          </span>
          <span>
          ❤️ {work.likes}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WorkCard;
