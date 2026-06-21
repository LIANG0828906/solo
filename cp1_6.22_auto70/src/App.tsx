import { useState, useEffect, useCallback } from 'react';
import { Menu, MessageCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fetchSchedules } from '@/modules/schedule/scheduleService';
import MemberPanel from '@/components/MemberPanel';
import CalendarView from '@/components/CalendarView';
import RecommendationPanel from '@/components/RecommendationPanel';
import ChatWindow from '@/components/ChatWindow';

export default function App() {
  const setSchedules = useStore((s) => s.setSchedules);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const toggleChat = useStore((s) => s.toggleChat);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const chatOpen = useStore((s) => s.chatOpen);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchSchedules().then(setSchedules).catch(console.error);
  }, [setSchedules]);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'w-[280px]' : 'w-0'
        } overflow-hidden md:w-[280px]`}
      >
        <MemberPanel />
      </div>

      <button
        onClick={toggleSidebar}
        className="fixed left-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md transition-transform hover:scale-105 md:hidden"
      >
        <Menu size={18} className="text-gray-600" />
      </button>

      <main
        className={`flex flex-1 flex-col overflow-hidden transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex-1 overflow-hidden">
          <CalendarView />
        </div>
        <div
          className="border-t border-gray-100 px-4 py-3"
          style={{
            animation: 'fadeInUp 0.5s ease-out 0.5s both',
          }}
        >
          <RecommendationPanel />
        </div>
      </main>

      {chatOpen && <ChatWindow />}

      {!chatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <MessageCircle size={22} />
        </button>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
