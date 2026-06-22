import React, { useMemo } from 'react';
import { MoodBoardCanvas } from './moodboard/MoodBoardCanvas';
import { MaterialManager } from './moodboard/MaterialManager';
import { ColorExtractor } from './moodboard/ColorExtractor';
import { AnnotationManager } from './moodboard/AnnotationManager';

const App: React.FC = () => {
  const materialManager = useMemo(() => new MaterialManager(), []);
  const annotationManager = useMemo(() => new AnnotationManager(), []);

  return (
    <MoodBoardCanvas
      materialManager={materialManager}
      colorExtractor={ColorExtractor}
      annotationManager={annotationManager}
    />
  );
};

export default App;
