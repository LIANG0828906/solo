import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProjectList from "@/pages/ProjectList";
import Editor from "@/pages/Editor";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/editor/:projectId" element={<Editor />} />
      </Routes>
    </Router>
  );
}
