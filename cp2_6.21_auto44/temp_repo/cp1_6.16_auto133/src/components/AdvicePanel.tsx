import React from 'react';
import { EnvironmentData, PlantType } from '../types';
import { generateAdvice, getPlantName } from '../utils/adviceGenerator';

interface AdvicePanelProps {
  data: EnvironmentData | null;
  plant: PlantType;
}

const AdvicePanel: React.FC<AdvicePanelProps> = ({ data, plant }) => {
  if (!data) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>养护建议</h3>
        <p style={styles.noData}>暂无数据，无法生成建议</p>
      </div>
    );
  }

  const adviceList = generateAdvice(data, plant);
  const plantName = getPlantName(plant);

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <h3 style={styles.title}>养护建议</h3>
        <span style={styles.plantTag}>🌿 {plantName}</span>
      </div>
      <div style={styles.adviceList}>
        {adviceList.map((advice, index) => (
          <div key={index} style={styles.adviceItem}>
            <span style={styles.adviceIcon}>💡</span>
            <span style={styles.adviceText}>{advice}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#FFF3E0',
    borderLeft: '4px solid #FF9800',
    borderRadius: '0 12px 12px 0',
    padding: '20px 24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#5D4037',
    margin: 0,
    fontFamily: 'Georgia, serif'
  },
  plantTag: {
    backgroundColor: '#FFE0B2',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#E65100'
  },
  noData: {
    color: '#8D6E63',
    fontSize: '14px',
    fontFamily: 'Roboto, sans-serif'
  },
  adviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  adviceItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  },
  adviceIcon: {
    fontSize: '18px',
    flexShrink: 0
  },
  adviceText: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#5D4037'
  }
};

export default AdvicePanel;
