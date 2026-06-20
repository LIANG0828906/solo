import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <div className="main-container">
      <Routes>
        <Route path="/" element={<div className="fade-in"><h1>首页 - 员工入口</h1></div>} />
        <Route path="/hr" element={<div className="fade-in"><h1>HR 入口</h1></div>} />
        <Route path="/result/:id" element={<div className="fade-in"><h1>分析结果页</h1></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
