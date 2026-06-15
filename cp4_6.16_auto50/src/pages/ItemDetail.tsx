import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { SwapTimeline } from '@/components/SwapTimeline';
import { Modal } from '@/components/Modal';
import { useSwapStore } from '@/store/swapStore';
import { Item, SwapEvent, Member } from '@/types';
import { cn } from '@/utils/helpers';

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getItemChain = useSwapStore(state => state.getItemChain);
  const recordSwap = useSwapStore(state => state.recordSwap);
  const members = useSwapStore(state => state.members);
  const items = useSwapStore(state => state.items);

  const [item, setItem] = useState<Item | null>(null);
  const [events, setEvents] = useState<SwapEvent[]>([]);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    toHolder: '',
    swapDate: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    if (id) {
      const loadChain = async () => {
        const chain = await getItemChain(id);
        if (chain) {
          setItem(chain.item);
          setEvents(chain.events);
        }
      };
      loadChain();
    }
  }, [id, items]);

  const handleRecordSwap = async () => {
    if (!id || !item || !formData.toHolder.trim()) return;

    const toMember = members.find(m => m.name === formData.toHolder);
    const toAvatar = toMember?.avatar || '';

    await recordSwap({
      itemId: id,
      fromHolder: item.currentHolder,
      fromAvatar: item.holderAvatar,
      toHolder: formData.toHolder,
      toAvatar,
      swapDate: new Date(formData.swapDate),
      note: formData.note,
    });

    setFormData({
      toHolder: '',
      swapDate: new Date().toISOString().split('T')[0],
      note: '',
    });
    setIsSwapModalOpen(false);

    if (id) {
      const chain = await getItemChain(id);
      if (chain) {
        setItem(chain.item);
        setEvents(chain.events);
      }
    }
  };

  const availableMembers = item
    ? members.filter(m => m.name !== item.currentHolder)
    : members;

  return (
    <div>
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -4 }}
        onClick={() => navigate('/items')}
        className="flex items-center gap-2 text-gray-600 hover:text-[#E8A87C] mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        <span>返回物品列表</span>
      </motion.button>

      {item && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-gray-800">物品流转详情</h1>
            <p className="text-gray-600 mt-1">追踪每件物品的流转故事</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSwapModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#41B3A3] text-white rounded-xl hover:bg-[#36998a] transition-colors"
          >
            <Plus size={18} />
            <span>记录交换</span>
          </motion.button>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <SwapTimeline itemId={id || ''} item={item} events={events} />
      </div>

      <Modal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        title="记录交换事件"
      >
        <div className="space-y-4">
          {item && (
            <div className="p-4 bg-[#FFF1D0] rounded-xl">
              <p className="text-sm text-gray-600 mb-1">当前持有人</p>
              <p className="font-semibold text-gray-800">{item.currentHolder}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新持有人 *</label>
            <select
              value={formData.toHolder}
              onChange={(e) => setFormData(prev => ({ ...prev, toHolder: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/50 focus:border-[#E8A87C]"
            >
              <option value="">请选择新持有人</option>
              {availableMembers.map((member) => (
                <option key={member.name} value={member.name}>{member.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">交换日期 *</label>
            <input
              type="date"
              value={formData.swapDate}
              onChange={(e) => setFormData(prev => ({ ...prev, swapDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/50 focus:border-[#E8A87C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">交换附言</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="记录这次交换的故事..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/50 focus:border-[#E8A87C] resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSwapModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              取消
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRecordSwap}
              disabled={!formData.toHolder.trim()}
              className={cn(
                'px-4 py-2 rounded-lg text-white transition-colors',
                formData.toHolder.trim()
                  ? 'bg-[#41B3A3] hover:bg-[#36998a]'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              记录交换
            </motion.button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ItemDetail;
