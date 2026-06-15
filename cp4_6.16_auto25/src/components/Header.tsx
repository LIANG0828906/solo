import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import UserProfile from './UserProfile';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user } = useUserStore();
  const [showProfile, setShowProfile] = useState(false);

  const firstLetter = user?.name.charAt(0).toUpperCase() || '?';

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-oak-200/50',
          'bg-white/70 backdrop-blur-md',
          'shadow-sm'
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-oak-600 text-white shadow-md">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-oak-800">BookDrift</h1>
              <p className="text-xs text-oak-500">让书籍自由漂流</p>
            </div>
          </div>

          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 rounded-full transition-all duration-200 hover:bg-oak-100/80"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
              style={{ backgroundColor: user?.avatarColor || '#8B5E3C' }}
            >
              {firstLetter}
            </div>
          </button>
        </div>
      </header>

      {showProfile && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowProfile(false)}
          />
          <div className="fixed left-1/2 top-20 z-50 w-full max-w-md -translate-x-1/2 px-4">
            <div className="animate-fade-in-up">
              <UserProfile onClose={() => setShowProfile(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
