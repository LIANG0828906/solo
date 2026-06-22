import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Tag } from 'lucide-react';
import { useUserStore } from './userStore';
import { CATEGORIES } from './types';
import { cn } from './utils';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=sunny',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=bunny',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=kitty',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=puppy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=bear',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=fox',
];

const COMMUNITY_OPTIONS = [
  '阳光花园小区',
  '绿城桂语江南',
  '万科城市花园',
  '保利香槟国际',
  '龙湖春江郦城',
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerUser } = useUserStore();

  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [community, setCommunity] = useState('');
  const [addressRange, setAddressRange] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    if (!nickname.trim()) {
      alert('请填写昵称');
      return;
    }
    if (!community) {
      alert('请选择小区');
      return;
    }
    if (selectedTags.length === 0) {
      alert('请至少选择一个擅长类别');
      return;
    }

    registerUser({
      nickname: nickname.trim(),
      avatar: selectedAvatar,
      community,
      addressRange: addressRange.trim() || '小区内',
      skillTags: selectedTags,
    });

    alert('注册成功！欢迎来到旧物漂流记 🎉');
    navigate('/');
  };

  const canNext = () => {
    if (step === 1) return nickname.trim() && selectedAvatar;
    if (step === 2) return community;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-300 via-orange-200 to-amber-100">
      <div className="min-h-screen flex flex-col">
        <div className="pt-10 pb-6 px-6 text-center">
          <div className="text-5xl mb-3">🎁</div>
          <h1 className="text-3xl font-bold text-white drop-shadow-sm">
            旧物漂流记
          </h1>
          <p className="text-white/80 mt-1 text-sm">
            让闲置物品找到新的主人
          </p>
        </div>

        <div className="flex-1 px-4 pb-8">
          <div className="max-w-md mx-auto bg-white rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                    step >= s
                      ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {s}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
                  告诉我们你的名字
                </h2>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    选择头像
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={cn(
                          'aspect-square rounded-full overflow-hidden btn-bounce transition-all',
                          selectedAvatar === avatar
                            ? 'ring-4 ring-orange-400 ring-offset-2'
                            : 'ring-2 ring-transparent'
                        )}
                      >
                        <img src={avatar} alt="" className="w-full h-full bg-orange-50" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    你的昵称
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="给自己起个可爱的名字吧~"
                    className="w-full px-4 py-3 bg-orange-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    maxLength={12}
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canNext()}
                  className={cn(
                    'w-full py-3 rounded-2xl font-semibold transition-all',
                    canNext()
                      ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white btn-bounce'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  下一步 →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
                  你住在哪个小区？
                </h2>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-600 mb-2 block flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    所在小区
                  </label>
                  <div className="space-y-2">
                    {COMMUNITY_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCommunity(c)}
                        className={cn(
                          'w-full px-4 py-3 rounded-2xl text-left transition-all btn-bounce',
                          community === c
                            ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md'
                            : 'bg-orange-50 text-gray-700 hover:bg-orange-100'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    大致位置（选填）
                  </label>
                  <input
                    type="text"
                    value={addressRange}
                    onChange={(e) => setAddressRange(e.target.value)}
                    placeholder="比如：3号楼附近、小区东门"
                    className="w-full px-4 py-3 bg-orange-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    maxLength={20}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-semibold btn-bounce"
                  >
                    ← 上一步
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canNext()}
                    className={cn(
                      'flex-1 py-3 rounded-2xl font-semibold transition-all',
                      canNext()
                        ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white btn-bounce'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    下一步 →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
                  你擅长什么？
                </h2>
                <p className="text-sm text-gray-500 text-center mb-4">
                  选择你熟悉的物品类别，帮你匹配同好邻居~
                </p>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-600 mb-3 block flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    擅长类别（可多选）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleTagToggle(cat)}
                        className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm font-medium transition-all btn-bounce',
                          selectedTags.includes(cat)
                            ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md'
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-semibold btn-bounce"
                  >
                    ← 上一步
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={selectedTags.length === 0}
                    className={cn(
                      'flex-1 py-3 rounded-2xl font-semibold transition-all',
                      selectedTags.length > 0
                        ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white btn-bounce shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    开始探索 🎉
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
