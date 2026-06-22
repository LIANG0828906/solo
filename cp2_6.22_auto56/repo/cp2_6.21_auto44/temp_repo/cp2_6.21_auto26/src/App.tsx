import { useState } from 'react';
import type { Entry, Mood } from './types';
import { useEntryStore } from './store';
import Timeline from './components/Timeline';
import Stats from './components/Stats';
import Modal from './components/Modal';
import EntryForm from './components/EntryForm';
import { Plus, Calendar, BarChart3 } from 'lucide-react';

type ViewType = 'timeline' | 'stats';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const addEntry = useEntryStore((state) => state.addEntry);
  const updateEntry = useEntryStore((state) => state.updateEntry);

  const openAddModal = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: Entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleFormSubmit = (data: { title: string; source: string; summary: string; mood: Mood }) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, data);
    } else {
      addEntry(data);
    }
    closeModal();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title-section">
            <h1 className="app-title">数字足迹日记本</h1>
            <p className="app-subtitle">记录每一天的数字生活</p>
          </div>

          <nav className="app-nav">
            <button
              type="button"
              className={`nav-tab ${currentView === 'timeline' ? 'active' : ''}`}
              onClick={() => setCurrentView('timeline')}
            >
              <Calendar size={18} />
              <span>时间轴</span>
            </button>
            <button
              type="button"
              className={`nav-tab ${currentView === 'stats' ? 'active' : ''}`}
              onClick={() => setCurrentView('stats')}
            >
              <BarChart3 size={18} />
              <span>统计</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'timeline' ? (
          <Timeline onEditEntry={openEditModal} />
        ) : (
          <Stats />
        )}
      </main>

      <button
        type="button"
        className="fab-btn"
        onClick={openAddModal}
        aria-label="添加条目"
      >
        <Plus size={24} />
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEntry ? '编辑条目' : '添加新条目'}
      >
        <EntryForm
          initialData={editingEntry || undefined}
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}
