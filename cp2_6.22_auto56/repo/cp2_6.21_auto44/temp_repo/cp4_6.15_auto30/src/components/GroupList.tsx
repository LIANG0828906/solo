import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useGroupStore } from '../store/useGroupStore';
import GroupCard from './GroupCard';
import CreateGroupModal from './CreateGroupModal';
import { useNavigate } from 'react-router-dom';

export default function GroupList() {
  const groups = useGroupStore((s) => s.groups);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="page-fade">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-cream-800">正在拼团</h2>
          <p className="mt-1 text-cream-500 text-sm">共 {groups.length} 场团购，手作人们快来一起拼单吧～</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-scale self-start sm:self-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cream-500 to-cream-700 text-cream-50 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <Plus size={18} /> 开团
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 text-cream-500">
          <p className="text-xl">还没有团购，点上方"开团"发起第一场吧</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} onClick={() => navigate('/group/' + g.id)} />
          ))}
        </div>
      )}

      {showModal && <CreateGroupModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
