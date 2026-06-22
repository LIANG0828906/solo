import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, User, FolderOpen, X } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import type { Project } from '@/types';

export default function ProjectList() {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const addProject = useProjectStore((s) => s.addProject);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    const project = addProject(name.trim(), clientName.trim(), deadline);
    setShowModal(false);
    setName('');
    setClientName('');
    setDeadline('');
    navigate(`/projects/${project.id}/workspace`);
  }, [name, clientName, deadline, addProject, navigate]);

  const handleCardClick = useCallback(
    (p: Project) => {
      navigate(`/projects/${p.id}/workspace`);
    },
    [navigate]
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">项目列表</h1>
          <p className="text-sm text-[#95A5A6] mt-1">
            管理你的插画项目，上传草图并收集客户反馈
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3498DB] text-white rounded-lg hover:bg-[#2980B9] transition-colors duration-200 text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          新建项目
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen size={48} className="text-[#BDC3C7] mb-4" />
          <p className="text-[#95A5A6] text-sm">还没有项目，点击上方按钮创建第一个项目</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((p) => (
            <motion.div
              key={p.id}
              layout
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleCardClick(p)}
              className="bg-white rounded-lg overflow-hidden cursor-pointer"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <div className="h-24 bg-gradient-to-br from-[#3498DB] to-[#2C3E50] flex items-center justify-center">
                <span className="text-3xl font-bold text-white/30">
                  {p.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[#2C3E50] text-sm truncate">
                  {p.name}
                </h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#95A5A6]">
                    <User size={12} />
                    <span>{p.clientName || '未指定客户'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#95A5A6]">
                    <Calendar size={12} />
                    <span>{p.deadline || '未设置截止日期'}</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#BDC3C7] mt-2">
                  更新于 {new Date(p.updatedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#2C3E50]">新建项目</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded hover:bg-[#ECF0F1] transition-colors duration-200 text-[#95A5A6]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C3E50] mb-1">
                    项目名称 <span className="text-[#E74C3C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="输入项目名称"
                    className="w-full px-3 py-2 border border-[#BDC3C7] rounded-lg text-sm focus:border-[#3498DB] focus:outline-none transition-colors duration-200"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C3E50] mb-1">
                    客户名称
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="输入客户名称"
                    className="w-full px-3 py-2 border border-[#BDC3C7] rounded-lg text-sm focus:border-[#3498DB] focus:outline-none transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C3E50] mb-1">
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-[#BDC3C7] rounded-lg text-sm focus:border-[#3498DB] focus:outline-none transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-[#95A5A6] rounded-lg hover:bg-[#ECF0F1] transition-colors duration-200"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="px-4 py-2 text-sm bg-[#3498DB] text-white rounded-lg hover:bg-[#2980B9] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建项目
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
