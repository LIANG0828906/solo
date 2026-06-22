import React, { useState } from 'react';
import { MatchResult } from './MoodMatcher';

interface Props {
  matchResults: MatchResult[];
}

const RecommendationList: React.FC<Props> = ({ matchResults }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (matchResults.length === 0) return null;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>为你推荐</h3>
      <div style={styles.cardList}>
        {matchResults.map((result) =>
          result.resources.map((resource) => (
            <div
              key={result.keyword + resource.id}
              className="recommendation-card"
              onClick={() =>
                setExpandedId(expandedId === resource.id ? null : resource.id)
              }
            >
              <div
                style={{
                  ...styles.label,
                  backgroundColor: result.labelBg,
                  color: result.labelColor,
                }}
              >
                {result.label}
              </div>
              <h4 style={styles.cardTitle}>{resource.title}</h4>
              <p style={styles.cardSummary}>
                {expandedId === resource.id
                  ? resource.summary
                  : resource.summary.slice(0, 40) + '…'}
              </p>
              <span style={styles.cardType}>
                {resource.type === 'exercise' ? '🧘 练习' : '📖 文章'}
              </span>
            </div>
          )),
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '24px',
    width: '100%',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px',
  },
  cardList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
  label: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px',
  },
  cardSummary: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '8px',
    transition: 'all 0.2s',
  },
  cardType: {
    fontSize: '12px',
    color: '#999',
  },
};

export default RecommendationList;
