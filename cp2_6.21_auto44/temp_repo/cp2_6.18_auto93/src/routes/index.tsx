import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectBoard } from '../pages/ProjectBoard';
import { ProjectEditor } from '../pages/ProjectEditor';
import { ProjectPreview } from '../pages/ProjectPreview';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectBoard />} />
        <Route path="/project/:id" element={<ProjectEditor />} />
        <Route path="/project/:id/preview" element={<ProjectPreview />} />
        <Route
          path="/invite/:token"
          element={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">邀请已接受</h2>
                <p className="text-slate-500 mb-6">你已成功加入项目</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  返回首页
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
