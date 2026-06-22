import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Play, Eye, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchPrescriptions } from '../services/api';
import { formatDosageDisplay, calculateTotalGrams } from '../utils/conversion';
import type { Prescription } from '../types';

const HistoryPanel: React.FC = () => {
  const {
    showHistory,
    setShowHistory,
    prescriptions,
    setPrescriptions,
    setSelectedPrescription,
    selectedPrescription,
    setIsPlaybackMode,
  } = useStore();

  useEffect(() => {
    if (showHistory && prescriptions.length === 0) {
      const loadPrescriptions = async () => {
        try {
          const data = await fetchPrescriptions();
          setPrescriptions(data);
        } catch (err) {
          console.error('加载处方历史失败', err);
        }
      };
      loadPrescriptions();
    }
  }, [showHistory, prescriptions.length, setPrescriptions]);

  const handleView = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
  };

  const handlePlayback = (prescription: Prescription) => {
    if (!prescription.playbackData || prescription.playbackData.length === 0) {
      alert('该处方没有回放数据');
      return;
    }
    setSelectedPrescription(prescription);
    setIsPlaybackMode(true);
    setShowHistory(false);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="fixed top-4 right-4 btn-ancient px-4 py-2 rounded-lg flex items-center gap-2 z-40"
      >
        <Clock size={18} />
        <span className="brush-font">历史处方</span>
      </button>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="paper-texture rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b-2 border-dashed border-[#d4a574]">
                <h3 className="brush-font text-2xl text-[#5d3a1a]">历史处方</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-[#8b5a2b] hover:text-[#b22222] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] scrollbar-thin">
                {prescriptions.length === 0 ? (
                  <div className="text-center py-12 text-[#8b5a2b] opacity-60">
                    <p className="brush-font text-xl">暂无处方记录</p>
                    <p className="text-sm mt-2">完成一次完整的煎熬过程后将自动保存</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <motion.div
                        key={prescription.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white bg-opacity-30 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs text-[#8b5a2b]">
                              {formatDate(prescription.createdAt)}
                            </span>
                            <div className="brush-font text-lg text-[#5d3a1a]">
                              {prescription.items.length} 味药 · 总计 {calculateTotalGrams(prescription.items).toFixed(2)}g
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleView(prescription)}
                              className="p-2 bg-[#6b4e3a] text-white rounded hover:bg-[#5d3a1a] transition-colors"
                              title="查看详情"
                            >
                              <Eye size={16} />
                            </button>
                            {prescription.playbackData && prescription.playbackData.length > 0 && (
                              <button
                                onClick={() => handlePlayback(prescription)}
                                className="p-2 btn-ancient rounded transition-colors"
                                title="回放煎熬过程 (1.5倍速)"
                              >
                                <Play size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {prescription.items.map((item, idx) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                item.hasConflict ? 'bg-red-100 text-[#cc0000]' : 'bg-[#f5deb3] text-[#5d3a1a]'
                              }`}
                            >
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: item.medicine.color }}
                              />
                              <span>{item.medicine.name}</span>
                              <span className="text-[#8b5a2b]">
                                {formatDosageDisplay(
                                  item.dosage.liang,
                                  item.dosage.qian,
                                  item.dosage.fen,
                                  item.dosage.li
                                )}
                              </span>
                              {item.hasConflict && (
                                <span className="text-[#cc0000]">×</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 text-xs text-[#8b5a2b]">
                          加水量：{prescription.decoctionParams.initialWater}ml
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPrescription && showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
            onClick={() => setSelectedPrescription(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="paper-texture rounded-lg w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="brush-font text-2xl text-[#5d3a1a]">处方详情</h3>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="text-[#8b5a2b] hover:text-[#b22222] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="text-sm text-[#8b5a2b] mb-4">
                {formatDate(selectedPrescription.createdAt)}
              </div>

              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
                {selectedPrescription.items.map((item, index) => {
                  const roles = ['君', '臣', '佐', '使'];
                  const role = roles[Math.min(index, roles.length - 1)];
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        item.hasConflict ? 'bg-red-100 bg-opacity-30' : 'bg-white bg-opacity-30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#b22222]">[{role}]</span>
                        <div
                          className="w-5 h-5 rounded"
                          style={{ backgroundColor: item.medicine.color }}
                        />
                        <span className="brush-font text-lg text-[#5d3a1a]">
                          {item.medicine.name}
                        </span>
                        {item.hasConflict && (
                          <span className="text-[#cc0000] text-xl">×</span>
                        )}
                      </div>
                      <span className="text-sm text-[#6b4e3a]">
                        {formatDosageDisplay(
                          item.dosage.liang,
                          item.dosage.qian,
                          item.dosage.fen,
                          item.dosage.li
                        )} = {item.dosage.grams.toFixed(2)}g
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t-2 border-dashed border-[#d4a574] pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#8b5a2b]">加水量</span>
                  <span className="text-[#5d3a1a]">{selectedPrescription.decoctionParams.initialWater}ml</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[#8b5a2b]">总计</span>
                  <span className="brush-font text-xl text-[#b22222]">
                    {calculateTotalGrams(selectedPrescription.items).toFixed(2)} 克
                  </span>
                </div>
              </div>

              {selectedPrescription.playbackData && selectedPrescription.playbackData.length > 0 && (
                <button
                  className="w-full btn-ancient py-3 rounded-lg mt-4 flex items-center justify-center gap-2"
                  onClick={() => handlePlayback(selectedPrescription)}
                >
                  <Play size={20} />
                  回放煎熬过程 (1.5倍速)
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HistoryPanel;
