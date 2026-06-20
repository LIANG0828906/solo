import { useState, useMemo } from 'react';
import useStore from '@/store/useStore';
import ParticleCheck from './ParticleCheck';
import { Filter, Plus, Pencil, ExternalLink, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Material } from '@/store/useStore';

interface FormState {
  name: string;
  category: string;
  quantity: string;
  unitPrice: string;
  link: string;
}

const initialForm: FormState = {
  name: '',
  category: '',
  quantity: '1',
  unitPrice: '0',
  link: '',
};

export default function MaterialTable() {
  const {
    materials,
    updateMaterial,
    selectedRoomId,
    rooms,
    fetchRooms,
  } = useStore();

  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<FormState>(initialForm);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(materials.map((m) => m.category)));
    return ['全部', ...unique];
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const categoryMatch = categoryFilter === '全部' || m.category === categoryFilter;
      const statusMatch =
        statusFilter === '全部' ||
        (statusFilter === '已购买' && m.purchased) ||
        (statusFilter === '未购买' && !m.purchased);
      return categoryMatch && statusMatch;
    });
  }, [materials, categoryFilter, statusFilter]);

  const totals = useMemo(() => {
    const totalCount = filteredMaterials.length;
    const purchasedCount = filteredMaterials.filter((m) => m.purchased).length;
    const totalAmount = filteredMaterials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);
    const purchasedAmount = filteredMaterials
      .filter((m) => m.purchased)
      .reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);
    return { totalCount, purchasedCount, totalAmount, purchasedAmount };
  }, [filteredMaterials]);

  const currentRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  const budgetExceeded = useMemo(() => {
    if (!currentRoom || currentRoom.totalBudget <= 0) return false;
    return totals.purchasedAmount > currentRoom.totalBudget;
  }, [totals.purchasedAmount, currentRoom]);

  const handleTogglePurchased = async (row: Material) => {
    if (!selectedRoomId) return;
    await updateMaterial(selectedRoomId, row.id, { purchased: !row.purchased });
    await fetchRooms();
  };

  const openAddModal = () => {
    setEditingMaterial(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (row: Material) => {
    setEditingMaterial(row);
    setFormData({
      name: row.name,
      category: row.category,
      quantity: String(row.quantity),
      unitPrice: String(row.unitPrice),
      link: row.link,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMaterial(null);
  };

  const handleSave = async () => {
    if (!selectedRoomId || !editingMaterial) return;
    await updateMaterial(selectedRoomId, editingMaterial.id, {
      name: formData.name,
      category: formData.category,
      quantity: Number(formData.quantity),
      unitPrice: Number(formData.unitPrice),
      link: formData.link,
    });
    closeModal();
  };

  return (
    <div className="w-full">
      <div
        className="bg-white rounded-xl card-shadow p-6"
        style={{ borderRadius: '12px' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Filter size={18} style={{ color: '#8B6914' }} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg px-3 py-1.5 bg-white outline-none transition-all duration-300 ease focus:ring-2 focus:ring-opacity-30"
              style={{
                border: '1.5px solid #D4B896',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#5A4524',
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === '全部' ? '按类别筛选：全部' : cat}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg px-3 py-1.5 bg-white outline-none transition-all duration-300 ease focus:ring-2 focus:ring-opacity-30"
              style={{
                border: '1.5px solid #D4B896',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#5A4524',
              }}
            >
              <option value="全部">按购买状态：全部</option>
              <option value="已购买">已购买</option>
              <option value="未购买">未购买</option>
            </select>
          </div>
          <button
            onClick={openAddModal}
            className="btn-wood flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm"
            style={{ borderRadius: '8px' }}
          >
            <Plus size={16} />
            新增物料
          </button>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full"
            style={{ borderCollapse: 'separate', borderSpacing: 0 }}
          >
            <thead>
              <tr>
                <th
                  className="text-left px-4 py-3 font-semibold text-sm"
                  style={{
                    backgroundColor: '#F5EDE0',
                    borderTopLeftRadius: '8px',
                    color: '#5A4524',
                    width: '60px',
                  }}
                >
                  勾选
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-sm"
                  style={{ backgroundColor: '#F5EDE0', color: '#5A4524' }}
                >
                  物料名称
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-sm"
                  style={{ backgroundColor: '#F5EDE0', color: '#5A4524' }}
                >
                  类别
                </th>
                <th
                  className="text-right px-4 py-3 font-semibold text-sm"
                  style={{ backgroundColor: '#F5EDE0', color: '#5A4524' }}
                >
                  数量
                </th>
                <th
                  className="text-right px-4 py-3 font-semibold text-sm"
                  style={{ backgroundColor: '#F5EDE0', color: '#5A4524' }}
                >
                  单价
                </th>
                <th
                  className="text-right px-4 py-3 font-semibold text-sm"
                  style={{ backgroundColor: '#F5EDE0', color: '#5A4524' }}
                >
                  小计
                </th>
                <th
                  className="text-center px-4 py-3 font-semibold text-sm"
                  style={{ backgroundColor: '#F5EDE0', color: '#5A4524', width: '80px' }}
                >
                  链接
                </th>
                <th
                  className="text-center px-4 py-3 font-semibold text-sm"
                  style={{
                    backgroundColor: '#F5EDE0',
                    borderTopRightRadius: '8px',
                    color: '#5A4524',
                    width: '80px',
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Package size={48} style={{ color: '#D4B896' }} />
                      <span className="text-sm" style={{ color: '#8B7355' }}>
                        暂无物料记录
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((row, idx) => {
                  const subtotal = row.quantity * row.unitPrice;
                  return (
                    <tr
                      key={row.id}
                      className="transition-all duration-300 ease cursor-default"
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAF6F0',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F5EDE0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          idx % 2 === 0 ? '#FFFFFF' : '#FAF6F0';
                      }}
                    >
                      <td className="px-4 py-3">
                        <div
                          className="inline-flex cursor-pointer"
                          onClick={() => handleTogglePurchased(row)}
                        >
                          <ParticleCheck checked={row.purchased} size={22} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: row.purchased ? '#7CB342' : '#3D2F1F' }}>
                        <span
                          className={cn(row.purchased && 'decoration-[#7CB342]/50')}
                          style={{
                            textDecoration: row.purchased ? 'line-through' : 'none',
                            textDecorationThickness: '1px',
                          }}
                        >
                          {row.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: row.purchased ? '#7CB342' : '#5A4524' }}>
                        <span
                          className="inline-block px-2 py-1 text-xs rounded-md"
                          style={{ backgroundColor: '#F5EDE0', color: '#8B6914' }}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-right"
                        style={{ color: row.purchased ? '#7CB342' : '#3D2F1F' }}
                      >
                        {row.quantity}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-right"
                        style={{ color: row.purchased ? '#7CB342' : '#3D2F1F' }}
                      >
                        ¥{row.unitPrice.toFixed(2)}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-right font-semibold"
                        style={{ color: row.purchased ? '#7CB342' : '#8B6914' }}
                      >
                        ¥{subtotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.link ? (
                          <a
                            href={row.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ease hover:bg-[#F5EDE0]"
                            style={{ color: '#8B6914' }}
                          >
                            <ExternalLink size={16} />
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: '#D4B896' }}>
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openEditModal(row)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ease hover:bg-[#F5EDE0]"
                          style={{ color: '#8B6914' }}
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: '#F5EDE0' }}
        >
          <div className="flex items-center gap-6 flex-wrap text-sm">
            <span style={{ color: '#5A4524' }}>
              已购项数：
              <span className="font-semibold" style={{ color: '#7CB342' }}>
                {totals.purchasedCount}
              </span>
              <span style={{ color: '#8B7355' }}> / {totals.totalCount}</span>
            </span>
            <span style={{ color: '#5A4524' }}>
              已花费金额：
              <span
                className="font-semibold"
                style={{ color: budgetExceeded ? '#FF8C00' : '#7CB342' }}
              >
                ¥{totals.purchasedAmount.toFixed(2)}
              </span>
            </span>
            <span style={{ color: '#5A4524' }}>
              总金额：
              <span className="font-semibold" style={{ color: '#8B6914' }}>
                ¥{totals.totalAmount.toFixed(2)}
              </span>
            </span>
            {currentRoom && (
              <span style={{ color: '#5A4524' }}>
                预算：
                <span className="font-semibold" style={{ color: '#8B6914' }}>
                  ¥{currentRoom.totalBudget.toFixed(2)}
                </span>
              </span>
            )}
          </div>
          {budgetExceeded && (
            <div
              className="px-3 py-1.5 rounded-lg text-sm font-medium animate-fadeIn"
              style={{ backgroundColor: 'rgba(255, 140, 0, 0.1)', color: '#FF8C00' }}
            >
              ⚠ 已超出预算
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl card-shadow w-full max-w-md p-6 animate-springIn"
            style={{ borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-5" style={{ color: '#5A4524' }}>
              {editingMaterial ? '编辑物料' : '新增物料'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#5A4524' }}>
                  名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg outline-none transition-all duration-300 ease"
                  style={{
                    border: '1.5px solid #D4B896',
                    borderRadius: '8px',
                    color: '#3D2F1F',
                  }}
                  placeholder="请输入物料名称"
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#5A4524' }}>
                  类别
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg outline-none transition-all duration-300 ease"
                  style={{
                    border: '1.5px solid #D4B896',
                    borderRadius: '8px',
                    color: '#3D2F1F',
                  }}
                  placeholder="例如：瓷砖、灯具"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: '#5A4524' }}>
                    数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg outline-none transition-all duration-300 ease"
                    style={{
                      border: '1.5px solid #D4B896',
                      borderRadius: '8px',
                      color: '#3D2F1F',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: '#5A4524' }}>
                    单价
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg outline-none transition-all duration-300 ease"
                    style={{
                      border: '1.5px solid #D4B896',
                      borderRadius: '8px',
                      color: '#3D2F1F',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#5A4524' }}>
                  链接
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg outline-none transition-all duration-300 ease"
                  style={{
                    border: '1.5px solid #D4B896',
                    borderRadius: '8px',
                    color: '#3D2F1F',
                  }}
                  placeholder="商品链接（可选）"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="btn-outline px-5 py-2 rounded-lg text-sm font-medium"
                style={{ borderRadius: '8px' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="btn-wood px-5 py-2 rounded-lg text-sm font-medium"
                style={{ borderRadius: '8px' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
