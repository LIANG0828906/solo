import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import EditorUI from "@/modules/editor/EditorUI";

function VersionHistoryPage() {
  const { roomId } = useParams<{ roomId: string }>();
  return (
    <div style={{ backgroundColor: '#1E1E2E', minHeight: '100vh', color: '#E0E0E0', padding: 24 }}>
      <h1 className="text-xl font-bold mb-4">版本历史 - {roomId}</h1>
      <EditorUI />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EditorUI />} />
        <Route path="/version/:roomId" element={<VersionHistoryPage />} />
      </Routes>
    </Router>
  );
}
