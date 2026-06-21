import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Mail, MapPin, Building } from 'lucide-react';
import { getClients, createClient, updateClient, deleteClient } from '@/api/clientApi';
import type { Client } from '../../shared/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (e) {
      console.error('加载客户失败:', e);
    }
  };

  const handleAdd = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', address: '' });
    setShowForm(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      address: client.address,
    });
    setShowForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('确定要删除这个客户吗？相关任务的客户信息将被清空。')) return;
    
    try {
      await deleteClient(clientId);
      setClients(clients.filter(c => c.id !== clientId));
    } catch (e) {
      console.error('删除客户失败:', e);
      alert('删除客户失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('请输入客户名称');
      return;
    }

    setSubmitting(true);
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, formData);
        setClients(clients.map(c => c.id === updated.id ? updated : c));
      } else {
        const newClient = await createClient(formData);
        setClients([newClient, ...clients]);
      }
      setShowForm(false);
    } catch (e) {
      console.error('保存客户失败:', e);
      alert('保存客户失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">客户管理</h1>
          <p className="text-gray-500 mt-1">管理你的客户信息</p>
        </div>
        <button
          onClick={handleAdd}
          style={{ backgroundColor: '#6366F1' }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium
                   transition-all hover:opacity-90 active:scale-[0.95]"
        >
          <Plus className="w-4 h-4" />
          添加客户
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
          <Building className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无客户</h3>
          <p className="text-gray-400 mb-6">添加你的第一个客户开始记录工时</p>
          <button
            onClick={handleAdd}
            style={{ backgroundColor: '#6366F1' }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium
                     transition-all hover:opacity-90 active:scale-[0.95]"
          >
            <Plus className="w-4 h-4" />
            添加客户
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client, index) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)]
                       hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500
                              flex items-center justify-center text-white font-bold text-lg">
                  {client.name.charAt(0)}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(client)}
                    className="w-8 h-8 rounded-full flex items-center justify-center
                             text-gray-400 hover:text-primary-600 hover:bg-primary-50
                             transition-all duration-200 active:scale-[0.95]"
                    title="编辑"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center
                             text-gray-400 hover:text-red-500 hover:bg-red-50
                             transition-all duration-200 active:scale-[0.95]"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-800 text-lg mb-3">{client.name}</h3>
              
              <div className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{client.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingClient ? '编辑客户' : '添加客户'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  客户名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入客户名称"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                           focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱地址"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                           focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地址
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入地址"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                           focus:border-primary-500 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 
                           text-gray-600 font-medium transition-all
                           hover:bg-gray-50 active:scale-[0.95]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: '#6366F1' }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium
                           transition-all hover:opacity-90 active:scale-[0.95]
                           disabled:opacity-50"
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
