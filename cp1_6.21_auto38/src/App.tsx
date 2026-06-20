import { useEffect, useCallback, useMemo } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
import { Download, AlertTriangle, CheckCircle, Clock, FileCode } from 'lucide-react';
import TechDebtForm from '@/components/TechDebtForm';
import TechDebtCard from '@/components/TechDebtCard';
import Dashboard from '@/components/Dashboard';
import { useTechDebtStore } from '@/store/useTechDebtStore';
import { TechDebtItem, ItemStatus } from '@/types';
import { calculateHealthScore } from '@/utils/healthScore';

const statusColumns: { id: ItemStatus; title: string; icon: typeof AlertTriangle }[] = [
  { id: 'todo', title: '待处理', icon: AlertTriangle },
  { id: 'in-progress', title: '进行中', icon: Clock },
  { id: 'completed', title: '已完成', icon: CheckCircle },
];

const statusColors: Record<ItemStatus, string> = {
  'todo': '#E53935',
  'in-progress': '#FB8C00',
  'completed': '#4CAF50',
};

export default function App() {
  const {
    items,
    selectedFile,
    showExportModal,
    fetchItems,
    addItem,
    updateItemStatus,
    deleteItem,
    reorderItems,
    setSelectedFile,
    setShowExportModal,
  } = useTechDebtStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const healthScore = useMemo(() => calculateHealthScore(items), [items]);

  const filteredItems = useMemo(() => {
    if (!selectedFile) return items;
    return items.filter((item) =>
      item.codeReferences.some((ref) => ref.filePath === selectedFile)
    );
  }, [items, selectedFile]);

  const getItemsByStatus = useCallback(
    (status: ItemStatus) =>
      filteredItems
        .filter((item) => item.status === status)
        .sort((a, b) => b.createdAt - a.createdAt),
    [filteredItems]
  );

  const handleDragEnd = useCallback(
    (newOrder: TechDebtItem[], status: ItemStatus) => {
      const reorderedWithStatus = newOrder.map((item) => ({
        ...item,
        status,
      }));
      reorderItems(status, reorderedWithStatus);

      reorderedWithStatus.forEach((item, index) => {
        const original = items.find((i) => i.id === item.id);
        if (original && original.status !== status) {
          updateItemStatus(item.id, status);
        }
      });
    },
    [items, reorderItems, updateItemStatus]
  );

  const handleExport = useCallback(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `tech-debt-export-${dateStr}.json`;
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: 'application/json',
    });
    saveAs(blob, fileName);
    setShowExportModal(true);
    setTimeout(() => setShowExportModal(false), 2000);
  }, [items, setShowExportModal]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1E1E1E' }}>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 border-b"
        style={{ height: '56px', backgroundColor: '#2D2D2D', borderColor: '#3D3D3D' }}
      >
        <div className="flex items-center gap-3">
          <FileCode size={24} style={{ color: '#7C4DFF' }} />
          <h1 className="text-lg font-bold" style={{ color: '#E0E0E0' }}>
            技术债务管理系统
          </h1>
          <div
            className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 rounded-full"
            style={{ backgroundColor: '#1E1E1E' }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: healthScore.score >= 70 ? '#4CAF50' : healthScore.score >= 40 ? '#FB8C00' : '#E53935' }}
            />
            <span className="text-sm" style={{ color: '#9E9E9E' }}>
              健康度: <span className="font-semibold" style={{ color: '#E0E0E0' }}>{healthScore.score}</span>
            </span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
          style={{ width: '140px', backgroundColor: '#1976D2', justifyContent: 'center' }}
        >
          <Download size={18} />
          导出数据
        </motion.button>
      </nav>

      <div className="pt-14 flex flex-col md:flex-row min-h-screen">
        <aside
          className="w-full md:w-[30%] p-6 border-b md:border-b-0 md:border-r overflow-y-auto"
          style={{
            backgroundColor: '#252525',
            borderColor: '#3D3D3D',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#E0E0E0' }}>
              新建技术债务
            </h2>
            <TechDebtForm onSubmit={addItem} />

            <div className="mt-8 pt-6 border-t" style={{ borderColor: '#3D3D3D' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#9E9E9E' }}>
                统计概览
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {statusColumns.map((col) => {
                  const count = items.filter((i) => i.status === col.id).length;
                  const Icon = col.icon;
                  return (
                    <div
                      key={col.id}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: '#1E1E1E' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} style={{ color: statusColors[col.id] }} />
                        <span className="text-xs" style={{ color: '#9E9E9E' }}>
                          {col.title}
                        </span>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: '#E0E0E0' }}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#1E1E1E' }}>
                <div className="text-xs mb-1" style={{ color: '#9E9E9E' }}>
                  总预估工时
                </div>
                <div className="text-2xl font-bold" style={{ color: '#7C4DFF' }}>
                  {items.reduce((sum, i) => sum + i.estimatedHours, 0)}h
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="w-full md:w-[70%] p-6 overflow-y-auto" style={{ minHeight: '600px' }}>
          <Dashboard
            items={items}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 mb-4 flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: '#2D2D2D' }}
            >
              <div className="flex items-center gap-2">
                <FileCode size={18} style={{ color: '#7C4DFF' }} />
                <span style={{ color: '#E0E0E0' }}>
                  正在筛选: <code className="font-mono text-sm" style={{ color: '#7C4DFF' }}>{selectedFile}</code>
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedFile(null)}
                className="text-sm px-3 py-1 rounded-lg"
                style={{ backgroundColor: '#1E1E1E', color: '#9E9E9E' }}
              >
                清除筛选
              </motion.button>
            </motion.div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {statusColumns.map((column) => {
              const columnItems = getItemsByStatus(column.id);
              const Icon = column.icon;
              return (
                <div
                  key={column.id}
                  className="rounded-xl p-4"
                  style={{ backgroundColor: '#252525', minHeight: '400px' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1 h-6 rounded-full"
                        style={{ backgroundColor: statusColors[column.id] }}
                      />
                      <Icon size={18} style={{ color: statusColors[column.id] }} />
                      <h3 className="font-semibold" style={{ color: '#E0E0E0' }}>
                        {column.title}
                      </h3>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: statusColors[column.id] + '20',
                        color: statusColors[column.id],
                      }}
                    >
                      {columnItems.length}
                    </span>
                  </div>

                  <Reorder.Group
                    axis="y"
                    values={columnItems}
                    onReorder={(newOrder) => handleDragEnd(newOrder, column.id)}
                    className="space-y-3 min-h-[300px]"
                    style={{ listStyle: 'none', margin: 0, padding: 0 }}
                  >
                    <AnimatePresence mode="popLayout">
                      {columnItems.map((item) => (
                        <TechDebtCard
                          key={item.id}
                          item={item}
                          onDelete={deleteItem}
                          onStatusChange={updateItemStatus}
                        />
                      ))}
                    </AnimatePresence>
                  </Reorder.Group>

                  {columnItems.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed"
                      style={{ borderColor: '#3D3D3D' }}
                    >
                      <div className="text-4xl mb-2 opacity-30">📋</div>
                      <p className="text-sm" style={{ color: '#6E6E6E' }}>
                        拖拽卡片到此处
                      </p>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="p-6 text-center"
              style={{
                width: '300px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#4CAF50' }}
              >
                <CheckCircle size={32} className="text-white" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#E0E0E0' }}>
                导出成功
              </h3>
              <p className="text-sm" style={{ color: '#9E9E9E' }}>
                数据已保存为 JSON 文件
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
