import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package } from 'lucide-react';
import { ItemCard } from '@/components/ItemCard';
import { SearchFilter } from '@/components/SearchFilter';
import { Modal, ConfirmModal } from '@/components/Modal';
import { useSwapStore } from '@/store/swapStore';
import { Item, PRESET_TAGS, Member } from '@/types';
import { generateAvatar, cn } from '@/utils/helpers';

const ItemList: React.FC = () => {
  const filterItems = useSwapStore(state => state.filterItems);
  const addItem = useSwapStore(state => state.addItem);
  const updateItem = useSwapStore(state => state.updateItem);
  const deleteItem = useSwapStore(state => state.deleteItem);
  const members = useSwapStore(state => state.members);
  const isLoading = useSwapStore(state => state.isLoading);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    currentHolder: '',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredItems = filterItems();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tags: [],
      currentHolder: '',
      status: 'active',
    });
    setSelectedItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      tags: [...item.tags],
      currentHolder: item.currentHolder,
      status: item.status,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.currentHolder.trim()) return;

    const holder = members.find(m => m.name === formData.currentHolder);
    const holderAvatar = holder?.avatar || generateAvatar(formData.currentHolder);

    if (isAddModalOpen) {
      await addItem({
        ...formData,
        holderAvatar,
      });
    } else if (isEditModalOpen && selectedItem) {
      await updateItem(selectedItem.id, {
        ...formData,
        holderAvatar,
      });
    }

    resetForm();
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      await deleteItem(selectedItem.id);
    }
    resetForm();
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">物品名称 *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="请输入物品名称"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/50 focus:border-[#E8A87C]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">物品描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="请输入物品描述"
          rows={3}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/50 focus:border-[#E8A87C] resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-all',
                formData.tags.includes(tag)
                  ? 'bg-[#E8A87C] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">持有人 *</label>
        <select
          value={formData.currentHolder}
          onChange={(e) => setFormData(prev => ({ ...prev, currentHolder: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/50 focus:border-[#E8A87C]"
        >
          <option value="">请选择持有人</option>
          {members.map((member) => (
            <option key={member.name} value={member.name}>{member.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/50 focus:border-[#E8A87C]"
        >
          <option value="active">流转中</option>
          <option value="inactive">已停用</option>
        </select>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm();
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          取消
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!formData.name.trim() || !formData.currentHolder.trim()}
          className={cn(
            'px-4 py-2 rounded-lg text-white transition-colors',
            formData.name.trim() && formData.currentHolder.trim()
              ? 'bg-[#E8A87C] hover:bg-[#d6966a]'
              : 'bg-gray-300 cursor-not-allowed'
          )}
        >
          {isAddModalOpen ? '添加' : '保存'}
        </motion.button>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-1">物品列表</h1>
          <p className="text-gray-600">共 {filteredItems.length} 件物品</p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8A87C] text-white rounded-xl hover:bg-[#d6966a] transition-colors"
        >
          <Plus size={18} />
          <span>添加物品</span>
        </motion.button>
      </div>

      <SearchFilter />

      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无符合条件的物品</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          resetForm();
          setIsAddModalOpen(false);
        }}
        title="添加物品"
      >
        {renderForm()}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          resetForm();
          setIsEditModalOpen(false);
        }}
        title="编辑物品"
      >
        {renderForm()}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          resetForm();
          setIsDeleteConfirmOpen(false);
        }}
        onConfirm={handleDelete}
        title="确认删除"
        message={`确定要删除物品"${selectedItem?.name}"吗？此操作将同时删除所有相关的交换记录，且无法恢复。`}
        confirmText="删除"
        confirmColor="danger"
      />
    </div>
  );
};

export default ItemList;
