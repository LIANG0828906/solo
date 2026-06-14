import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, User } from 'lucide-react';
import type { Customer } from '../../shared/types';
import { customerApi } from '@/api';
import { useAppStore } from '@/store/useAppStore';
import { useDebounce } from '@/hooks/useDebounce';
import Modal from '@/components/Modal';
import CustomerForm from '@/components/CustomerForm';
import Highlight from '@/components/Highlight';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 150);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { addNotification } = useAppStore();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerApi.searchCustomers(debouncedSearch || undefined);
      setCustomers(data);
    } catch {
      addNotification('加载客户列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, addNotification]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAdd = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该客户吗？')) return;
    try {
      await customerApi.deleteCustomer(id);
      addNotification('客户删除成功', 'success');
      fetchCustomers();
    } catch {
      addNotification('删除客户失败', 'error');
    }
  };

  const handleSubmit = async (data: Omit<Customer, 'id' | 'createdAt'>) => {
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, data);
        addNotification('客户信息更新成功', 'success');
      } else {
        await customerApi.createCustomer(data);
        addNotification('客户创建成功', 'success');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch {
      addNotification(editingCustomer ? '更新客户失败' : '创建客户失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getRandomColor = (id: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">客户管理</h1>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          新增客户
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索客户姓名、公司、邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">加载中...</div>
      ) : customers.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          {debouncedSearch ? '没有找到匹配的客户' : '暂无客户数据，点击右上角新增客户'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div key={customer.id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full ${getRandomColor(
                    customer.id
                  )} flex items-center justify-center text-white font-semibold text-lg flex-shrink-0`}
                >
                  {customer.name ? getInitials(customer.name) : <User size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    <Highlight text={customer.name} search={debouncedSearch} />
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    <Highlight text={customer.company} search={debouncedSearch} />
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-center gap-2 text-gray-600 truncate">
                  <span className="text-gray-400 min-w-[48px]">邮箱:</span>
                  <Highlight text={customer.email} search={debouncedSearch} />
                </p>
                <p className="flex items-center gap-2 text-gray-600 truncate">
                  <span className="text-gray-400 min-w-[48px]">电话:</span>
                  <Highlight text={customer.phone} search={debouncedSearch} />
                </p>
                <p className="flex items-start gap-2 text-gray-600">
                  <span className="text-gray-400 min-w-[48px] flex-shrink-0">地址:</span>
                  <span className="line-clamp-2">
                    <Highlight text={customer.address} search={debouncedSearch} />
                  </span>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="编辑"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? '编辑客户' : '新增客户'}
      >
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  );
}
