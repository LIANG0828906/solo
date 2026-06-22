import React from 'react';
import { Settings, Salad, Ban } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { dietTypeOptions, allergenOptions } from '@/data/presetIngredients';
import type { DietType } from '@/types';

export const PreferencePanel: React.FC = () => {
  const { preferences, setDietType, toggleAllergen } = useAppStore();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-bold text-gray-800">偏好设置</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Salad className="w-4 h-4 text-gray-500" />
          <p className="text-sm text-gray-600 font-medium">饮食类型</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dietTypeOptions.map(option => {
            const isSelected = preferences.dietType === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setDietType(option.id as DietType)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? '#4CAF50' : '#F5F5F5',
                  color: isSelected ? '#FFFFFF' : '#333333',
                }}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Ban className="w-4 h-4 text-gray-500" />
          <p className="text-sm text-gray-600 font-medium">过敏原过滤</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {allergenOptions.map(option => {
            const isSelected = preferences.allergens.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleAllergen(option.id)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                style={{
                  backgroundColor: isSelected ? '#4CAF50' : '#F5F5F5',
                  color: isSelected ? '#FFFFFF' : '#333333',
                }}
              >
                <span>{option.icon}</span>
                <span>{option.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
