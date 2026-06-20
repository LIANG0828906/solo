import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const containerStyle: React.CSSProperties = {
    minHeight: 'calc(100vh - 60px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  };

  const logoStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '60px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '64px',
    fontWeight: 800,
    color: '#4ECDC4',
    letterSpacing: '4px',
    textShadow: '0 0 40px rgba(78, 205, 196, 0.3)',
    marginBottom: '16px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '20px',
    color: '#94A3B8',
    letterSpacing: '2px',
  };

  const svgContainerStyle: React.CSSProperties = {
    marginBottom: '60px',
  };

  const featuresStyle: React.CSSProperties = {
    maxWidth: '500px',
    marginBottom: '48px',
    textAlign: 'center',
    width: '100%',
  };

  const featureItemStyle: React.CSSProperties = {
    padding: '12px 24px',
    margin: '8px 0',
    background: 'rgba(45, 74, 108, 0.5)',
    borderRadius: '8px',
    color: '#E2E8F0',
    fontSize: '15px',
    borderLeft: '3px solid #4ECDC4',
    textAlign: 'left',
  };

  const features = [
    '🎯 拖拽拼写，互动记忆更牢固',
    '💡 词义匹配，强化理解与运用',
    '🚀 智能难度，循序渐进学得快',
  ];

  return (
    <div style={containerStyle}>
      <div style={logoStyle}>
        <div style={titleStyle}>单词方舟</div>
        <div style={subtitleStyle}>Word Ark - 穿越词汇海洋的冒险之旅</div>
      </div>

      <div style={svgContainerStyle}>
        <svg
          width="200"
          height="120"
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.6 }}
        >
          <path
            d="M100 20L140 60H60L100 20Z"
            fill="#4ECDC4"
          />
          <path
            d="M95 25V55H105V25H95Z"
            fill="#4ECDC4"
          />
          <path
            d="M40 60H160L145 85H55L40 60Z"
            fill="#4ECDC4"
          />
          <path
            d="M10 95C20 88 30 92 40 95C50 98 60 88 70 95C80 102 90 88 100 95C110 102 120 88 130 95C140 102 150 88 160 95C170 102 180 88 190 95"
            stroke="#4ECDC4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M10 108C20 101 30 105 40 108C50 111 60 101 70 108C80 115 90 101 100 108C110 115 120 101 130 108C140 115 150 101 160 108C170 115 180 101 190 108"
            stroke="#4ECDC4"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div style={featuresStyle}>
        {features.map((feature, index) => (
          <div key={index} style={featureItemStyle}>
            {feature}
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={onStart}>
        开始冒险
      </button>
    </div>
  );
};

export default StartScreen;
