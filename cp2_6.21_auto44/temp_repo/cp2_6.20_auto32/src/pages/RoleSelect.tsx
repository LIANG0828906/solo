import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, BookOpen } from 'lucide-react';

export function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFE5D9] to-[#E3F2FD] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full animate-fade-in">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF7043] text-white mb-4 shadow-lg">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            智能作文批改系统
          </h1>
          <p className="text-gray-600">
            高效、精准、即时的写作反馈助手
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/student')}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">学生端</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              提交作文，获得即时的语法检查、结构分析和综合评分，追踪写作进步轨迹。
            </p>
            <div className="mt-4 text-[#FF7043] text-sm font-medium flex items-center gap-1">
              进入学生端
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/teacher')}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">教师端</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              查看班级提交情况，分析评分分布和错误类型，掌握学生整体写作水平。
            </p>
            <div className="mt-4 text-[#FF7043] text-sm font-medium flex items-center gap-1">
              进入教师端
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-12">
          © 2024 智能作文批改系统 · 让写作更有温度
        </p>
      </div>
    </div>
  );
}

export default RoleSelect;
