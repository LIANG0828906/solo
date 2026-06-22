import { Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 right-0 left-[280px] z-50 flex items-center justify-end px-8 py-4 bg-gradient-to-b from-[#F8F9FA] to-transparent">
      <button
        onClick={() => navigate('/record')}
        className="flex items-center justify-center w-[50px] h-[50px] rounded-full bg-[#E63946] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(230,57,70,0.5)]"
        aria-label="新建日记"
      >
        <Plus size={24} strokeWidth={3} />
      </button>
      <button
        onClick={() => navigate('/profile')}
        className="ml-4 flex items-center justify-center w-[50px] h-[50px] rounded-full bg-[#2B2D42] text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(43,45,66,0.4)]"
        aria-label="个人档案"
      >
        <User size={22} />
      </button>
    </header>
  );
};
