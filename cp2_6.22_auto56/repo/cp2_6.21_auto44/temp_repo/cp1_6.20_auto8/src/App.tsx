import { useState } from 'react';
import ProfileForm from '@/components/ProfileForm';
import ResumePreview from '@/components/ResumePreview';
import TrackingBoard from '@/components/TrackingBoard';
import { FileText, Send } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'resume' | 'tracking'>('resume');

  return (
    <div className="h-screen flex flex-col bg-navy-50">
      <header className="bg-white border-b border-navy-100 shrink-0">
        <div className="max-w-[1440px] mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-navy-600 flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <h1 className="text-sm font-bold text-navy-600 font-display tracking-wide">简历工坊</h1>
          </div>
          <div className="flex items-center bg-navy-50 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('resume')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'resume'
                  ? 'bg-white text-navy-600 shadow-sm'
                  : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              <FileText size={12} />
              简历编辑
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'tracking'
                  ? 'bg-white text-navy-600 shadow-sm'
                  : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              <Send size={12} />
              投递追踪
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'resume' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <aside className="w-full md:w-[30%] lg:w-[28%] bg-white border-b md:border-b-0 md:border-r border-navy-100 overflow-y-auto shrink-0">
            <ProfileForm />
          </aside>
          <main className="flex-1 overflow-hidden">
            <ResumePreview />
          </main>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <TrackingBoard />
        </div>
      )}
    </div>
  );
}
