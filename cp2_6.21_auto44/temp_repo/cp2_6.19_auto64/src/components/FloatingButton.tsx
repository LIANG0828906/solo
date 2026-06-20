import { Plus, Edit3 } from 'lucide-react';

interface FloatingButtonProps {
  onClick: () => void;
  icon?: 'plus' | 'edit';
  label?: string;
}

export const FloatingButton = ({ onClick, icon = 'plus', label }: FloatingButtonProps) => {
  const Icon = icon === 'plus' ? Plus : Edit3;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark active:scale-95 transition-all duration-200 hover:shadow-xl"
    >
      <Icon className="w-6 h-6" />
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
};

interface MobileQuickButtonProps {
  onClick: () => void;
}

export const MobileQuickButton = ({ onClick }: MobileQuickButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark active:scale-95 transition-all duration-200"
    >
      <Edit3 className="w-5 h-5" />
      <span className="font-medium">快速记录</span>
    </button>
  );
};
