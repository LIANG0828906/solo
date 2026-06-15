import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import ObjectiveForm from './components/ObjectiveForm';
import Dashboard from './pages/Dashboard';
import ObjectiveList from './pages/ObjectiveList';
import ObjectiveDetail from './pages/ObjectiveDetail';
import { objectivesApi } from './utils/api';
import type { Objective, CreateObjectiveRequest } from '../types';

const App: React.FC = () => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadObjectives();
  }, []);

  const loadObjectives = async () => {
    try {
      setLoading(true);
      const data = await objectivesApi.getAll();
      setObjectives(data);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '加载失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObjective = async (data: CreateObjectiveRequest) => {
    try {
      await objectivesApi.create(data);
      await loadObjectives();
      setToast({ message: '目标创建成功', type: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '创建失败', type: 'error' });
      throw error;
    }
  };

  const handleConfidenceChange = async (objectiveId: string, krId: string, value: number) => {
    const objective = objectives.find(o => o.id === objectiveId);
    if (!objective) return;

    const updatedKRs = objective.keyResults.map(kr =>
      kr.id === krId ? { ...kr, confidence: value } : kr
    );

    try {
      await objectivesApi.update(objectiveId, { keyResults: updatedKRs });
      await loadObjectives();
    } catch (error) {
      setToast({ message: '更新置信度失败', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <Navbar onCreateClick={() => setFormOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                objectives={objectives}
                loading={loading}
                onConfidenceChange={handleConfidenceChange}
              />
            }
          />
          <Route
            path="/objectives"
            element={
              <ObjectiveList
                objectives={objectives}
                loading={loading}
                onConfidenceChange={handleConfidenceChange}
                onCreateClick={() => setFormOpen(true)}
              />
            }
          />
          <Route
            path="/objectives/:id"
            element={<ObjectiveDetail onObjectiveUpdate={loadObjectives} />}
          />
        </Routes>
      </main>

      <ObjectiveForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateObjective}
      />
    </div>
  );
};

export default App;
