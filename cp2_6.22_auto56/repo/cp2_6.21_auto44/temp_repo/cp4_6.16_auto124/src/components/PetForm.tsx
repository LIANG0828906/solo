import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePetStore } from '@/stores/petStore';
import type { Pet } from '@/types';

interface PetFormProps {
  pet?: Pet;
  onClose?: () => void;
}

interface FormData {
  name: string;
  breed: string;
  gender: 'male' | 'female';
  birthday: string;
  weight: string;
  avatar: string;
}

interface FormErrors {
  name?: string;
  breed?: string;
  birthday?: string;
  weight?: string;
}

export default function PetForm({ pet, onClose }: PetFormProps) {
  const addPet = usePetStore((state) => state.addPet);
  const updatePet = usePetStore((state) => state.updatePet);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: pet?.name || '',
    breed: pet?.breed || '',
    gender: pet?.gender || 'male',
    birthday: pet?.birthday || '',
    weight: pet?.weight?.toString() || '',
    avatar: pet?.avatar || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const isEditMode = !!pet;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入宠物昵称';
    }

    if (!formData.breed.trim()) {
      newErrors.breed = '请输入品种';
    }

    if (!formData.birthday) {
      newErrors.birthday = '请选择出生日期';
    }

    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = '请输入有效的体重';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const petData = {
      name: formData.name.trim(),
      breed: formData.breed.trim(),
      gender: formData.gender,
      birthday: formData.birthday,
      weight: parseFloat(formData.weight),
      avatar: formData.avatar || undefined,
    };

    if (isEditMode && pet) {
      updatePet(pet.id, petData);
    } else {
      addPet(petData);
    }

    onClose?.();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        avatar: event.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-r from-amber-100 to-orange-100 p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-pet-textLight transition-colors hover:bg-white hover:text-pet-text"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <h2 className="text-xl font-bold text-pet-text">
            {isEditMode ? '编辑宠物档案' : '添加宠物档案'}
          </h2>
          <p className="mt-1 text-sm text-pet-textLight">
            {isEditMode ? '更新你爱宠的信息' : '为你的爱宠建立档案'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="flex justify-center">
            <div
              onClick={handleAvatarClick}
              className={cn(
                'group relative flex h-24 w-24 cursor-pointer items-center justify-center',
                'overflow-hidden rounded-full border-4 border-amber-200 bg-amber-50',
                'transition-all duration-300 hover:border-amber-400 hover:shadow-lg'
              )}
            >
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="头像预览"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl">🐾</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-xs font-medium text-white">点击上传</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          <p className="-mt-3 text-center text-xs text-pet-textLight">
            点击头像上传照片
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-pet-text">
              昵称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入宠物昵称"
              className={cn(
                'w-full rounded-xl border px-4 py-2.5 text-pet-text',
                'transition-colors focus:outline-none focus:ring-2',
                errors.name
                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                  : 'border-pet-border bg-white focus:border-amber-400 focus:ring-amber-100'
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-pet-text">
              品种 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => handleInputChange('breed', e.target.value)}
              placeholder="如：橘猫、金毛、布偶等"
              className={cn(
                'w-full rounded-xl border px-4 py-2.5 text-pet-text',
                'transition-colors focus:outline-none focus:ring-2',
                errors.breed
                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                  : 'border-pet-border bg-white focus:border-amber-400 focus:ring-amber-100'
              )}
            />
            {errors.breed && (
              <p className="mt-1 text-xs text-red-500">{errors.breed}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-pet-text">
              性别
            </label>
            <div className="flex gap-3">
              <label
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5',
                  'transition-all duration-200',
                  formData.gender === 'male'
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-pet-border bg-white text-pet-textLight hover:border-amber-300 hover:bg-amber-50'
                )}
              >
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={() => handleInputChange('gender', 'male')}
                  className="hidden"
                />
                <span className="text-lg">♂</span>
                <span className="text-sm font-medium">公</span>
              </label>
              <label
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5',
                  'transition-all duration-200',
                  formData.gender === 'female'
                    ? 'border-pink-400 bg-pink-50 text-pink-700'
                    : 'border-pet-border bg-white text-pet-textLight hover:border-amber-300 hover:bg-amber-50'
                )}
              >
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={() => handleInputChange('gender', 'female')}
                  className="hidden"
                />
                <span className="text-lg">♀</span>
                <span className="text-sm font-medium">母</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-pet-text">
              出生日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => handleInputChange('birthday', e.target.value)}
              className={cn(
                'w-full rounded-xl border px-4 py-2.5 text-pet-text',
                'transition-colors focus:outline-none focus:ring-2',
                errors.birthday
                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                  : 'border-pet-border bg-white focus:border-amber-400 focus:ring-amber-100'
              )}
            />
            {errors.birthday && (
              <p className="mt-1 text-xs text-red-500">{errors.birthday}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-pet-text">
              体重 (kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="请输入体重"
                className={cn(
                  'w-full rounded-xl border px-4 py-2.5 pr-12 text-pet-text',
                  'transition-colors focus:outline-none focus:ring-2',
                  errors.weight
                    ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                    : 'border-pet-border bg-white focus:border-amber-400 focus:ring-amber-100'
                )}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-pet-textLight">
                kg
              </span>
            </div>
            {errors.weight && (
              <p className="mt-1 text-xs text-red-500">{errors.weight}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-1 rounded-xl border border-pet-border bg-white px-4 py-3',
                'text-sm font-medium text-pet-textLight',
                'transition-all duration-200 hover:bg-gray-50 active:scale-95'
              )}
            >
              取消
            </button>
            <button
              type="submit"
              className={cn(
                'flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3',
                'text-sm font-medium text-white shadow-md',
                'transition-all duration-200 hover:from-amber-600 hover:to-orange-600',
                'hover:shadow-lg active:scale-95'
              )}
            >
              {isEditMode ? '保存修改' : '添加宠物'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
