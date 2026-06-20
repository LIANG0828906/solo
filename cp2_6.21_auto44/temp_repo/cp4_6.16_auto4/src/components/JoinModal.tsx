import { useState } from 'react';
import { User } from 'lucide-react';

interface JoinModalProps {
  onJoin: (nickname: string) => void;
}

export default function JoinModal({ onJoin }: JoinModalProps) {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed) {
      onJoin(trimmed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-navy px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">QuickDoc</h1>
              <p className="text-navy-200 text-sm">在线协作编辑器</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <label className="block text-sm font-medium text-navy mb-2">
            输入你的昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例如：小明"
            className="w-full px-4 py-3 border border-navy-100 rounded-lg text-navy placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-emerald transition-all"
            autoFocus
            maxLength={20}
          />
          <button
            type="submit"
            disabled={!nickname.trim()}
            className="mt-4 w-full py-3 bg-emerald text-white font-medium rounded-lg hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            加入协作
          </button>
        </form>
      </div>
    </div>
  );
}
