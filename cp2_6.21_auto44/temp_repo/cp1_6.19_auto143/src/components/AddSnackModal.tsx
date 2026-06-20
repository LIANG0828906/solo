import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Cookie, Candy, Coffee, Apple } from 'lucide-react';
import { SnackCategory, useSnackStore } from '../store/snackStore.tsx';

interface FormData {
  name: string;
  category: SnackCategory;
  purchaseDate: string;
  expiryDate: string;
  notes: string;
}

const initialFormData: FormData = {
  name: '',
  category: SnackCategory.CHIPS,
  purchaseDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: '',
};

interface FormErrors {
  name?: string;
  expiryDate?: string;
}

const AddSnackModal: React.FC = () => {
  const { state, dispatch } = useSnackStore();
  const { isModalOpen } = state;

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [isModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const closeModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODAL', payload: false });
  }, [dispatch]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入零食名称';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = '请选择保质期截止日';
    } else if (new Date(formData.expiryDate) < new Date(formData.purchaseDate)) {
      newErrors.expiryDate = '保质期不能早于购买日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    dispatch({
      type: 'ADD_SNACK',
      payload: {
        name: formData.name.trim(),
        category: formData.category,
        purchaseDate: formData.purchaseDate,
        expiryDate: formData.expiryDate,
        notes: formData.notes.trim(),
      },
    });

    setIsSubmitting(false);
    closeModal();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const categoryOptions = [
    { value: SnackCategory.CHIPS, label: '薯片类', icon: <Cookie size={16} />, color: '#FF7675' },
    {
      value: SnackCategory.CHOCOLATE,
      label: '巧克力类',
      icon: <Candy size={16} />,
      color: '#74B9FF',
    },
    { value: SnackCategory.DRINK, label: '饮料类', icon: <Coffee size={16} />, color: '#55E6C1' },
    { value: SnackCategory.NUTS, label: '坚果类', icon: <Apple size={16} />, color: '#FDCB6E' },
  ];

  const shimmerStyle = {
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1s ease-in-out infinite',
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[520px] bg-white rounded-[20px] overflow-hidden"
              style={{
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                willChange: 'transform, opacity',
              }}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#4A2F1A]">添加新零食</h2>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4A2F1A]">
                    零食名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="例如：乐事原味薯片"
                    className={`w-full px-4 py-3 rounded-lg border-2 text-sm text-[#4A2F1A] placeholder-gray-400 focus:outline-none transition-all ${
                      errors.name
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4A2F1A]">
                    类别 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          handleInputChange({
                            target: { name: 'category', value: option.value },
                          } as React.ChangeEvent<HTMLSelectElement>)
                        }
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.category === option.value
                            ? 'border-current bg-opacity-10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{
                          color: formData.category === option.value ? option.color : '#4A2F1A',
                          backgroundColor:
                            formData.category === option.value
                              ? `${option.color}15`
                              : 'transparent',
                        }}
                      >
                        {option.icon}
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4A2F1A]">购买日期</label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-sm text-[#4A2F1A] focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4A2F1A]">
                      保质期截止日 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 text-sm text-[#4A2F1A] focus:outline-none transition-all ${
                        errors.expiryDate
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-200 focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20'
                      }`}
                    />
                    {errors.expiryDate && (
                      <p className="text-xs text-red-500">{errors.expiryDate}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4A2F1A]">备注</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="添加一些备注信息（可选）"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-sm text-[#4A2F1A] placeholder-gray-400 resize-none focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 transition-all"
                  />
                </div>

                <div className="pt-4 flex justify-center">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ y: isSubmitting ? 0 : -2, boxShadow: '0 6px 20px rgba(108, 92, 231, 0.4)' }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                    animate={isSubmitting ? { style: shimmerStyle } : {}}
                    className="relative w-[200px] h-[48px] rounded-[8px] text-white font-bold text-base overflow-hidden disabled:opacity-70"
                    style={{
                      background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>添加中...</>
                      ) : (
                        <>
                          <Plus size={18} />
                          添加零食
                        </>
                      )}
                    </span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddSnackModal;
