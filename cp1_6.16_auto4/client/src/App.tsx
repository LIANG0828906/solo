import React, { StrictMode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Workspace from './pages/Workspace';
import Editor from './pages/Editor';
import { createWSService } from './services/wsService';

createWSService({ url: 'ws://localhost:3001/ws' });

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return token && user ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/workspace"
            element={
              <PrivateRoute>
                <Workspace />
              </PrivateRoute>
            }
          />
          <Route
            path="/editor/:docId"
            element={
              <PrivateRoute>
                <Editor />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
};

export default App;
