import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import PlantCard from '../components/PlantCard';
import { usePlantStore, statusLabels, type PlantStatus } from '../stores/plantStore';
import './Plants.css';

export default function Plants() {
  const plants = usePlantStore(s => s.plants);
  const fetchPlants = usePlantStore(s => s.fetchPlants);
  const addPlant = usePlantStore(s => s.addPlant);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    variety: '',
    plantDate: new Date().toISOString().split('T')[0],
    expectedBloomDate: '',
    expectedHarvestDate: '',
    status: 'seedling' as PlantStatus,
  });

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addPlant(form);
    if (result) {
      setShowModal(false);
      setForm({
        name: '',
        variety: '',
        plantDate: new Date().toISOString().split('T')[0],
        expectedBloomDate: '',
        expectedHarvestDate: '',
        status: 'seedling',
      });
    }
  };

  return (
    <div className="plants-container">
      <div className="plants-header">
        <h1 className="page-title">植物档案</h1>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>添加植物</span>
        </button>
      </div>

      {plants.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>🌱</div>
          <p>还没有植物档案</p>
          <button className="primary-btn" onClick={() => setShowModal(true)}>创建第一株植物</button>
        </div>
      ) : (
        <div className="plants-masonry">
          {plants.map(p => <PlantCard key={p.id} plant={p} />)}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加植物</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <label className="form-field">
                <span>名称 *</span>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：番茄"
                />
              </label>
              <label className="form-field">
                <span>品种</span>
                <input
                  type="text"
                  value={form.variety}
                  onChange={e => setForm({ ...form, variety: e.target.value })}
                  placeholder="例如：圣女果"
                />
              </label>
              <label className="form-field">
                <span>种植日期 *</span>
                <input
                  type="date"
                  required
                  value={form.plantDate}
                  onChange={e => setForm({ ...form, plantDate: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span>预计开花日期</span>
                <input
                  type="date"
                  value={form.expectedBloomDate}
                  onChange={e => setForm({ ...form, expectedBloomDate: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span>预计收获日期</span>
                <input
                  type="date"
                  value={form.expectedHarvestDate}
                  onChange={e => setForm({ ...form, expectedHarvestDate: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span>当前状态</span>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as PlantStatus })}
                >
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="primary-btn submit-btn">确认添加</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
