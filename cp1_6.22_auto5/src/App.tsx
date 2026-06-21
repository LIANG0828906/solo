import { useState, useEffect, useCallback } from 'react';
import QuizBuilder from './QuizBuilder';
import QuizPlayer from './QuizPlayer';
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react';

type ViewMode = 'home' | 'builder' | 'player';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [examId, setExamId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('quiz/')) {
      const id = hash.replace('quiz/', '');
      setExamId(id);
      setViewMode('player');
    } else if (hash === 'builder') {
      setViewMode('builder');
    }
  }, []);

  const handleNavigate = useCallback((mode: ViewMode, id?: string) => {
    setViewMode(mode);
    if (mode === 'player' && id) {
      setExamId(id);
      window.location.hash = `quiz/${id}`;
    } else if (mode === 'builder') {
      window.location.hash = 'builder';
    } else {
      window.location.hash = '';
      setExamId(null);
    }
  }, []);

  if (viewMode === 'builder') {
    return <QuizBuilder onBack={() => handleNavigate('home')} onExamCreated={(id) => handleNavigate('player', id)} />;
  }

  if (viewMode === 'player' && examId) {
    return <QuizPlayer examId={examId} onBack={() => handleNavigate('home')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">拖拽互动测验平台</h1>
              <p className="text-xs text-gray-500">让学习更有趣味</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            欢迎使用<span className="text-blue-500">互动测验</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            教师可以快速创建拖拽式互动测验，学生通过直观的拖拽操作完成答题，
            实时获得评分反馈，让学习更有参与感。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div
            onClick={() => handleNavigate('builder')}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200 animate-slide-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">我是教师</h3>
            <p className="text-gray-600 mb-6">
              创建拖拽式互动测验，配置题目、选项和正确答案映射，
              生成测验链接分享给学生。
            </p>
            <div className="flex items-center text-blue-500 font-medium">
              开始创建
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => {
              const id = prompt('请输入测验ID：');
              if (id) {
                handleNavigate('player', id);
              }
            }}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200 animate-slide-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">我是学生</h3>
            <p className="text-gray-600 mb-6">
              输入测验ID或通过链接进入测验，拖拽选项到正确位置，
              提交后即时获得评分反馈。
            </p>
            <div className="flex items-center text-green-500 font-medium">
              开始答题
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { title: '拖拽交互', desc: '直观的拖拽操作，半透明跟随阴影，流畅的动画反馈' },
            { title: '即时评分', desc: '提交后立即显示得分，正确错误一目了然，支持查看正确答案' },
            { title: '响应式设计', desc: '完美适配桌面和移动设备，移动端支持点击选择模式' },
          ].map((item, index) => (
            <div
              key={item.title}
              className="bg-white rounded-xl p-6 shadow-md animate-slide-in-up"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h4>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
