import { Routes, Route } from 'react-router-dom';
import ProjectManager from '@/modules/project/ProjectManager';
import StoryEditor from '@/modules/editor/StoryEditor';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProjectManager />} />
      <Route path="/project/:projectId" element={<StoryEditor />} />
      <Route path="*" element={<ProjectManager />} />
    </Routes>
  );
}
