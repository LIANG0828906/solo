import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import styled from 'styled-components';
import ValleyScene from './components/ValleyScene';
import ControlPanel from './components/ControlPanel';
import LogPanel from './components/LogPanel';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: var(--deep-green);
  position: relative;
  overflow: hidden;
`;

const CanvasWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const App: React.FC = () => {
  return (
    <AppContainer>
      <CanvasWrapper>
        <Canvas
          camera={{
            position: [0, 5, 15],
            fov: 60,
          }}
        >
          <Suspense fallback={null}>
            <ValleyScene />
          </Suspense>
        </Canvas>
        <Loader />
      </CanvasWrapper>
      <ControlPanel />
      <LogPanel />
    </AppContainer>
  );
};

export default App;
