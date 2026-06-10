import React from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  position: absolute;
  left: 20px;
  bottom: 20px;
  width: 300px;
  background-color: rgba(26, 58, 42, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(90, 138, 74, 0.3);
  padding: 16px;
  color: var(--mist-white);
`;

const Title = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--mist-white);
`;

const ControlPanel: React.FC = () => {
  return (
    <PanelContainer>
      <Title>控制面板</Title>
    </PanelContainer>
  );
};

export default ControlPanel;
