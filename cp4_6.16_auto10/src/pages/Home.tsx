import { useState, useEffect } from 'react';
import { LayoutGrid, Clock, Settings, Play } from 'lucide-react';
import ChartLibrary from '@/components/ChartLibrary';
import TimelineCanvas from '@/components/TimelineCanvas';
import PropertyPanel from '@/components/PropertyPanel';
import PlayMode from '@/components/PlayMode';
import { useStoryStore } from '@/store/useStoryStore';

type TabType = 'library' | 'timeline' | 'properties';

export default function Home() {
  const { isPlayMode, setPlayMode, story } = useStoryStore();
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('storyId');
    if (storyId) {
      useStoryStore.getState().loadFromShareLink(storyId);
    }
  }, []);

  const tabs = [
    { id: 'library' as TabType, label: '图表库', icon: LayoutGrid },
    { id: 'timeline' as TabType, label: '时间线', icon: Clock },
    { id: 'properties' as TabType, label: '属性', icon: Settings },
  ];

  const renderDesktopLayout = () => (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-hidden">
        <ChartLibrary />
      </div>

      <div className="flex-1 overflow-hidden">
        <TimelineCanvas />
      </div>

      <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-hidden">
        <PropertyPanel />
      </div>
    </div>
  );

  const renderMobileLayout = () => (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'library' && <ChartLibrary />}
        {activeTab === 'timeline' && <TimelineCanvas />}
        {activeTab === 'properties' && <PropertyPanel />}
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                activeTab === id
                  ? 'text-[#1A237E]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{label}</span>
              {id === 'properties' && (
                <div
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    useStoryStore.getState().selectedSlideId ? 'bg-[#1A237E]' : 'bg-transparent'
                  }`}
                />
              )}
            </button>
          ))}
          <button
            onClick={() => story.slides.length > 0 && setPlayMode(true)}
            disabled={story.slides.length === 0}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${
              story.slides.length > 0
                ? 'text-[#FF6B35]'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <Play size={20} />
            <span className="text-xs mt-1">播放</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      {isPlayMode && <PlayMode />}
    </>
  );
}
