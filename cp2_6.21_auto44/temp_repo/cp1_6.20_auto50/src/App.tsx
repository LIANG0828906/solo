import React, { useState, useEffect, useCallback } from 'react';
import { Medicine, FilterType, SortType } from './types';
import { api } from './api';
import MedicineList from './components/MedicineList';
import AddMedicineForm from './components/AddMedicineForm';
import ConfirmDialog from './components/ConfirmDialog';
import StatsSummary from './components/StatsSummary';
import FilterSortBar from './components/FilterSortBar';
import './App.css';

const App: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('expiry');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Medicine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAll();
      setMedicines(data);
    } catch (error) {
      console.error('加载药品失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  const handleAddClick = () => {
    setEditingMedicine(null);
    setIsFormOpen(true);
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setIsFormOpen(true);
  };

  const handleDelete = (medicine: Medicine) => {
    setDeleteConfirm(medicine);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await api.delete(deleteConfirm.id);
      setMedicines(prev => prev.filter(m => m.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMedicine) {
      const updated = await api.update(editingMedicine.id, data);
      setMedicines(prev => prev.map(m => m.id === updated.id ? updated : m));
    } else {
      const newMedicine = await api.create(data);
      setMedicines(prev => [...prev, newMedicine]);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            <h1>家庭药品库存管理</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <aside className="stats-sidebar">
          <StatsSummary
            medicines={medicines}
            currentFilter={filter}
            onFilterChange={setFilter}
          />
        </aside>

        <section className="content-section">
          <FilterSortBar
            filter={filter}
            sortBy={sortBy}
            onFilterChange={setFilter}
            onSortChange={setSortBy}
            onAddClick={handleAddClick}
          />

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>加载中...</p>
            </div>
          ) : (
            <MedicineList
              medicines={medicines}
              filter={filter}
              sortBy={sortBy}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </section>
      </main>

      <AddMedicineForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editingMedicine={editingMedicine}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="确认删除"
        message={`确定删除"${deleteConfirm?.name}"吗？此操作不可恢复。`}
        confirmText={isDeleting ? '删除中...' : '删除'}
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        isDanger
      />
    </div>
  );
};

export default App;
