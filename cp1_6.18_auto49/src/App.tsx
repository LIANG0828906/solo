import React from 'react';
import { ToolPanel } from './components/ToolPanel';
import { TimelineCanvas } from './components/TimelineCanvas';
import { EditPanel } from './components/EditPanel';
import { PlayMode } from './components/PlayMode';
import { useTimelineStore } from './store/timelineStore';

const App: React.FC = () => {
  const { selectedNodeId, isPlaying, nodes } = useTimelineStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="app-container">
      <ToolPanel />
      <TimelineCanvas />
      {selectedNode && <EditPanel node={selectedNode} />}
      {isPlaying && <PlayMode />}
    </div>
  );
};

export default App;
