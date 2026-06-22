import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { memberApi } from '@/utils/api';
import MemberAvatar from '@/components/MemberAvatar';

const AVATAR_OPTIONS = ['👨', '👩', '👧', '👦', '🧓', '👴', '🐱', '🐶'];

export default function LoginPage() {
  const navigate = useNavigate();
  const { members, setMembers, setCurrentMemberId } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(AVATAR_OPTIONS[0]);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const data = await memberApi.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMember = (memberId: string) => {
    setCurrentMemberId(memberId);
    navigate('/');
  };

  const handleCreateMember = async () => {
    if (!newName.trim()) return;

    try {
      const newMember = await memberApi.createMember({
        name: newName.trim(),
        avatar: newAvatar,
        isAdmin: members.length === 0,
      });
      setMembers([...members, newMember]);
      setShowCreate(false);
      setNewName('');
      setNewAvatar(AVATAR_OPTIONS[0]);
    } catch (error) {
      console.error('Failed to create member:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-cream to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-primary-500 shadow-xl shadow-primary-300 mb-6 animate-float">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">欢迎回家</h1>
          <p className="text-gray-600">选择你的身份，开始管理家庭家务</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-500" />
            选择家庭成员
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member.id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl',
                    'bg-white border-2 border-transparent',
                    'transition-all duration-200',
                    'hover:bg-primary-50 hover:border-primary-200',
                    'group'
                  )}
                >
                  <MemberAvatar
                    name={member.name}
                    avatar={member.avatar}
                    size="lg"
                  />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {member.name}
                      </span>
                      {member.isAdmin && (
                        <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span className="text-primary-500 font-medium">
                        {member.points}
                      </span>
                      积分
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className={cn(
              'w-full py-4 rounded-2xl font-semibold',
              'bg-white text-primary-600 border-2 border-primary-200',
              'transition-all duration-200',
              'hover:bg-primary-50 hover:border-primary-300',
              'shadow-lg shadow-primary-100'
            )}
          >
            + 添加新成员
          </button>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">添加新成员</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                昵称
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="请输入昵称"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择头像
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setNewAvatar(avatar)}
                    className={cn(
                      'p-3 rounded-xl text-2xl transition-all duration-200',
                      newAvatar === avatar
                        ? 'bg-primary-100 border-2 border-primary-400 scale-110'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    )}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateMember}
                disabled={!newName.trim()}
                className={cn(
                  'flex-1 py-3 rounded-xl font-semibold text-white',
                  'bg-gradient-to-r from-primary-500 to-primary-400',
                  'shadow-lg shadow-primary-200',
                  'transition-all duration-200',
                  'hover:shadow-xl hover:shadow-primary-300',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                创建
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
