import { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useStore, type Member } from '@/store/useStore';

const MEMBERSHIP_TYPES: Member['membershipType'][] = ['月卡', '季卡', '年卡'];

function StatusBadge({ status }: { status: Member['status'] }) {
  switch (status) {
    case '有效':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3.5 h-3.5" />
          有效
        </span>
      );
    case '即将到期':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
          即将到期
        </span>
      );
    case '已过期':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3.5 h-3.5" />
          已过期
        </span>
      );
  }
}

function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, type: Member['membershipType']) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Member['membershipType']>('月卡');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!/^[\u4e00-\u9fa5]{2,10}$/.test(name)) {
      setError('姓名需为2-10个中文字符');
      return;
    }
    onAdd(name, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white p-6"
        style={{
          width: '400px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">添加会员</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="请输入2-10个中文字符"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会籍类型</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as Member['membershipType'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MEMBERSHIP_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary text-sm">
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
}

function RenewModal({ member, onClose, onRenew }: { member: Member; onClose: () => void; onRenew: (id: string, type: Member['membershipType']) => void }) {
  const [type, setType] = useState<Member['membershipType']>('月卡');

  const handleRenew = () => {
    onRenew(member.id, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white p-6"
        style={{
          width: '400px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">续费 - {member.name}</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">选择新会籍类型</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as Member['membershipType'])}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MEMBERSHIP_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">续费将从今天开始计算</p>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            取消
          </button>
          <button onClick={handleRenew} className="btn-primary text-sm">
            确认续费
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MemberPanel() {
  const members = useStore(s => s.members);
  const fetchMembers = useStore(s => s.fetchMembers);
  const addMember = useStore(s => s.addMember);
  const renewMember = useStore(s => s.renewMember);
  const [showAdd, setShowAdd] = useState(false);
  const [renewTarget, setRenewTarget] = useState<Member | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAdd = async (name: string, type: Member['membershipType']) => {
    await addMember(name, type);
  };

  const handleRenew = async (id: string, type: Member['membershipType']) => {
    await renewMember(id, type);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">会员列表</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMembers()}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" />
            添加会员
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs border-b border-gray-100">
              <th className="px-6 py-3 font-medium">姓名</th>
              <th className="px-6 py-3 font-medium">会籍类型</th>
              <th className="px-6 py-3 font-medium">到期日</th>
              <th className="px-6 py-3 font-medium">状态</th>
              <th className="px-6 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr
                key={member.id}
                style={{ height: '48px' }}
                className={`border-b border-gray-50 transition-colors hover:bg-slate-200 ${
                  idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                }`}
              >
                <td className="px-6 py-3 font-medium text-gray-800">{member.name}</td>
                <td className="px-6 py-3 text-gray-600">{member.membershipType}</td>
                <td className="px-6 py-3 text-gray-600">{member.expiryDate}</td>
                <td className="px-6 py-3"><StatusBadge status={member.status} /></td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => setRenewTarget(member)}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    续费
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {members.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">暂无会员数据</div>
      )}
      {showAdd && (
        <AddMemberModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}
      {renewTarget && (
        <RenewModal member={renewTarget} onClose={() => setRenewTarget(null)} onRenew={handleRenew} />
      )}
    </div>
  );
}
