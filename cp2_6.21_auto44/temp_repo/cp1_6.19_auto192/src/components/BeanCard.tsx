import { useState } from 'react';
import { motion } from 'framer-motion';
import { FlavorWheel } from './FlavorWheel';
import { RadarChart } from './RadarChart';
import type { CoffeeBean } from '../types';

interface BeanCardProps {
  bean: CoffeeBean;
  onClick?: () => void;
}

export const BeanCard = ({ bean, onClick }: BeanCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      layout
      className="bean-card"
      onClick={() => {
        setIsExpanded(!isExpanded);
        onClick?.();
      }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        width: 280,
        height: isExpanded ? 'auto' : 320,
        minHeight: 320,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E0D5C7',
        boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#6D4C41';
        e.currentTarget.style.boxShadow = '0px 8px 24px rgba(0,0,0,0.16)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E0D5C7';
        e.currentTarget.style.boxShadow = '0px 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#4E342E',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {bean.name}
          </h3>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 12,
              color: '#8D6E63',
            }}
          >
            {bean.origin}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FlavorWheel bean={bean} size={110} />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RadarChart profile={bean.flavorProfile} size={110} />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginBottom: 12,
          }}
        >
          {bean.flavorTags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '2px 8px',
                fontSize: 10,
                borderRadius: 4,
                backgroundColor: '#F5E6CC',
                color: '#6D4C41',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            fontSize: 11,
            color: '#795548',
          }}
        >
          <div>
            <span style={{ color: '#A1887F' }}>海拔：</span>
            {bean.altitude}m
          </div>
          <div>
            <span style={{ color: '#A1887F' }}>处理法：</span>
            {bean.processMethod}
          </div>
          <div>
            <span style={{ color: '#A1887F' }}>烘焙度：</span>
            {bean.roastLevel}
          </div>
          <div>
            <span style={{ color: '#A1887F' }}>入库：</span>
            {formatDate(bean.createdAt)}
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid #E0D5C7',
            }}
          >
            <h4
              style={{
                margin: '0 0 8px 0',
                fontSize: 13,
                color: '#4E342E',
                fontWeight: 600,
              }}
            >
              风味特征
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 8,
                textAlign: 'center',
              }}
            >
              {Object.entries(bean.flavorProfile).map(([key, value]) => (
                <div key={key}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#6D4C41',
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#A1887F',
                    }}
                  >
                    {key === 'acidity' && '酸度'}
                    {key === 'bitterness' && '苦度'}
                    {key === 'sweetness' && '甜度'}
                    {key === 'body' && '醇厚'}
                    {key === 'cleanliness' && '干净'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
