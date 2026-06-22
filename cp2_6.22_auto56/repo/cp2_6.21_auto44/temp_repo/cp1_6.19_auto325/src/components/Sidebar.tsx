import { useState, useEffect, useRef } from 'react';
import { useStore, type ExchangeRequest, type ItemCategory } from '@/store';
import {
  ChevronDown,
  ChevronUp,
  Send,
  Package,
  Inbox,
  History,
  LogOut,
  Check,
  X,
  UserPlus,
  LogIn,
  MapPin,
  MessageSquare,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: '已接受', className: 'bg-blue-100 text-blue-800' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-800' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-800' },
  expired: { label: '已超时', className: 'bg-gray-100 text-gray-800' },
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

interface LoginModalProps {
  onClose: () => void;
}

function LoginModal({ onClose }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const users = useStore((s) => s.users);
  const loginUser = useStore((s) => s.loginUser);
  const registerUser = useStore((s) => s.registerUser);

  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [locationArea, setLocationArea] = useState('A区-东区');

  const handleRegister = () => {
    if (!nickname.trim()) return;
    const avatar = avatarUrl.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname)}`;
    registerUser({ nickname: nickname.trim(), avatarUrl: avatar, locationArea });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <h2 className="text-xl font-bold">
            {mode === 'login' ? '欢迎回来' : '加入交换社区'}
          </h2>
          <p className="text-sm opacity-90 mt-1">
            {mode === 'login' ? '选择账号登录开始交换' : '注册后即可发布物品和发起交换'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {mode === 'login' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">选择一个演示账号登录：</p>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      loginUser(user.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-secondary/30 transition-all btn-bounce"
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.nickname}
                      className="w-12 h-12 rounded-full bg-gray-200"
                    />
                    <div className="text-left flex-1">
                      <div className="font-medium text-gray-800">{user.nickname}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={12} />
                        {user.locationArea}
                      </div>
                    </div>
                    <LogIn size={18} className="text-primary" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMode('register')}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary/40 rounded-xl text-primary hover:bg-primary/10 transition-all btn-bounce"
              >
                <UserPlus size={18} />
                <span>没有账号？立即注册</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称 *</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="给自己取个好听的名字"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">头像URL（可选）</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="留空则自动生成"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所在区域</label>
                <select
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option>A区-东区</option>
                  <option>B区-西区</option>
                  <option>C区-南区</option>
                  <option>D区-北区</option>
                  <option>中心区</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setMode('login')}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all btn-bounce"
                >
                  返回登录
                </button>
                <button
                  onClick={handleRegister}
                  disabled={!nickname.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-bounce"
                >
                  注册并登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CollapsibleProps {
  title: string;
  icon: React.ReactNode;
  badge?: number | string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Collapsible({ title, icon, badge, children, defaultOpen = true }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 px-1 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-primary">{icon}</span>
        <span className="font-medium text-gray-800 flex-1">{title}</span>
        {badge !== undefined && (
          <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        )}
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="pb-3 space-y-2 animate-fade-in">{children}</div>}
    </div>
  );
}

export default function Sidebar() {
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const items = useStore((s) => s.items);
  const logoutUser = useStore((s) => s.logoutUser);
  const getMyRequests = useStore((s) => s.getMyRequests);
  const getCompletedExchanges = useStore((s) => s.getCompletedExchanges);
  const acceptRequest = useStore((s) => s.acceptRequest);
  const rejectRequest = useStore((s) => s.rejectRequest);
  const confirmExchange = useStore((s) => s.confirmExchange);
  const markRequestRead = useStore((s) => s.markRequestRead);
  const getConversation = useStore((s) => s.getConversation);
  const sendMessage = useStore((s) => s.sendMessage);
  const markMessagesAsRead = useStore((s) => s.markMessagesAsRead);

  const [showLogin, setShowLogin] = useState(false);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [, setPollTick] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sent, received } = getMyRequests();
  const completed = getCompletedExchanges();

  const pendingReceived = received.filter((r) => r.status === 'pending');
  const pendingSent = sent.filter((r) => r.status === 'pending' || r.status === 'accepted');

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => setPollTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatUserId, messageInput]);

  const getItem = (id: string) => items.find((i) => i.id === id);
  const getUser = (id: string) => users.find((u) => u.id === id);

  const handleChatOpen = (userId: string) => {
    setActiveChatUserId(userId);
    if (currentUser) {
      markMessagesAsRead(userId, currentUser.id);
    }
  };

  const handleSendMessage = () => {
    if (!currentUser || !activeChatUserId || !messageInput.trim()) return;
    sendMessage({
      fromUserId: currentUser.id,
      toUserId: activeChatUserId,
      content: messageInput.trim().slice(0, 100),
    });
    setMessageInput('');
  };

  const handleAccept = (req: ExchangeRequest) => {
    acceptRequest(req.id);
    markRequestRead(req.id);
  };

  const handleConfirm = (req: ExchangeRequest) => {
    if (!currentUser) return;
    confirmExchange(req.id, currentUser.id);
  };

  const getChatPartners = () => {
    if (!currentUser) return [];
    const partnerIds = new Set<string>();
    sent.forEach((r) => partnerIds.add(r.toUserId));
    received.forEach((r) => partnerIds.add(r.fromUserId));
    return Array.from(partnerIds)
      .map((id) => getUser(id))
      .filter(Boolean) as ReturnType<typeof getUser>[];
  };

  const chatPartners = getChatPartners();

  return (
    <>
      <aside className="w-[280px] shrink-0 h-screen sticky top-0 bg-white/80 backdrop-blur-md border-l border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.nickname}
                className="w-14 h-14 rounded-full bg-gray-100 ring-4 ring-secondary/50"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">{currentUser.nickname}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                  <MapPin size={12} />
                  {currentUser.locationArea}
                </div>
              </div>
              <button
                onClick={logoutUser}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all btn-bounce"
                title="退出登录"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium shadow-lg shadow-primary/25 btn-bounce"
            >
              <LogIn size={18} />
              <span>登录 / 注册</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-4">
          {currentUser ? (
            <>
              <Collapsible
                title="我发起的请求"
                icon={<Package size={16} />}
                badge={pendingSent.length > 0 ? pendingSent.length : undefined}
                defaultOpen={true}
              >
                {sent.length === 0 ? (
                  <p className="text-sm text-gray-400 px-2 py-2">暂无请求</p>
                ) : (
                  sent.slice(0, 5).map((req) => {
                    const targetItem = getItem(req.targetItemId);
                    return (
                      <div
                        key={req.id}
                        className="animate-fade-in p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={targetItem?.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {targetItem?.title || '未知物品'}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_MAP[req.status]?.className}`}>
                                {STATUS_MAP[req.status]?.label}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {formatTime(req.createdAt)}
                              </span>
                            </div>
                          </div>
                          {(req.status === 'accepted') && (
                            <>
                              {!req.fromConfirmed ? (
                                <button
                                  onClick={() => handleConfirm(req)}
                                  className="px-2 py-1 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 btn-bounce"
                                >
                                  <Check size={14} />
                                </button>
                              ) : (
                                <span className="text-xs text-green-600 flex items-center gap-0.5">
                                  <Check size={12} /> 已确认
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </Collapsible>

              <Collapsible
                title="我收到的请求"
                icon={<Inbox size={16} />}
                badge={pendingReceived.length > 0 ? pendingReceived.length : undefined}
                defaultOpen={true}
              >
                {received.length === 0 ? (
                  <p className="text-sm text-gray-400 px-2 py-2">暂无请求</p>
                ) : (
                  received.slice(0, 5).map((req) => {
                    const proposedItem = getItem(req.proposedItemId);
                    const fromUser = getUser(req.fromUserId);
                    return (
                      <div
                        key={req.id}
                        className="animate-fade-in p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors relative"
                      >
                        {req.isNew && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse-red" />
                        )}
                        <div className="flex items-center gap-2">
                          <img
                            src={fromUser?.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full bg-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {fromUser?.nickname || '未知用户'}
                            </div>
                            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                              换：{proposedItem?.title || '未知'}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_MAP[req.status]?.className}`}>
                                {STATUS_MAP[req.status]?.label}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {formatTime(req.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {req.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleAccept(req)}
                              className="flex-1 py-1.5 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center justify-center gap-1 btn-bounce"
                            >
                              <Check size={12} /> 接受
                            </button>
                            <button
                              onClick={() => rejectRequest(req.id)}
                              className="flex-1 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-1 btn-bounce"
                            >
                              <X size={12} /> 拒绝
                            </button>
                          </div>
                        )}
                        {req.status === 'accepted' && !req.toConfirmed && (
                          <button
                            onClick={() => handleConfirm(req)}
                            className="w-full mt-2 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary-dark flex items-center justify-center gap-1 btn-bounce"
                          >
                            <Check size={12} /> 确认完成交换
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </Collapsible>

              <Collapsible
                title="已完成交换"
                icon={<History size={16} />}
                defaultOpen={false}
              >
                {completed.length === 0 ? (
                  <p className="text-sm text-gray-400 px-2 py-2">暂无完成记录</p>
                ) : (
                  completed.map((req) => {
                    const targetItem = getItem(req.targetItemId);
                    return (
                      <div
                        key={req.id}
                        className="animate-fade-in p-2.5 rounded-lg bg-green-50/50"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={targetItem?.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {targetItem?.title || '未知'}
                            </div>
                            <div className="text-[10px] text-green-600">
                              {req.completedAt ? formatTime(req.completedAt) : ''}
                            </div>
                          </div>
                          <Check size={14} className="text-green-500" />
                        </div>
                      </div>
                    );
                  })
                )}
              </Collapsible>

              <Collapsible
                title="消息"
                icon={<MessageSquare size={16} />}
                defaultOpen={true}
              >
                {activeChatUserId ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveChatUserId(null)}
                      className="text-xs text-primary hover:underline px-1 py-1"
                    >
                      ← 返回对话列表
                    </button>
                    <div className="h-40 overflow-y-auto scrollbar-thin space-y-2 p-2 bg-gray-50 rounded-lg">
                      {getConversation(currentUser.id, activeChatUserId).map((msg) => (
                        <div
                          key={msg.id}
                          className={`max-w-[85%] animate-fade-in ${
                            msg.fromUserId === currentUser.id ? 'ml-auto' : 'mr-auto'
                          }`}
                        >
                          <div
                            className={`px-3 py-1.5 rounded-2xl text-xs ${
                              msg.fromUserId === currentUser.id
                                ? 'bg-primary text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value.slice(0, 100))}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="发送消息 (100字)"
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-primary outline-none"
                        maxLength={100}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 btn-bounce"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                    <div className="text-[10px] text-gray-400 text-right">
                      {messageInput.length}/100
                    </div>
                  </div>
                ) : chatPartners.length === 0 ? (
                  <p className="text-sm text-gray-400 px-2 py-2">暂无对话</p>
                ) : (
                  chatPartners.map((partner) => {
                    if (!partner) return null;
                    const unread = getConversation(partner.id, currentUser.id).filter(
                      (m) => m.toUserId === currentUser.id && !m.isRead
                    ).length;
                    return (
                      <button
                        key={partner.id}
                        onClick={() => handleChatOpen(partner.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors text-left animate-fade-in"
                      >
                        <div className="relative">
                          <img
                            src={partner.avatarUrl}
                            alt=""
                            className="w-9 h-9 rounded-full bg-gray-200"
                          />
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center animate-pulse-red">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {partner.nickname}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </Collapsible>
            </>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <LogIn size={32} className="text-primary" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">登录后解锁全部功能</p>
                <p className="text-sm text-gray-400 mt-1">查看请求、发起交换、发送消息</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">旧物交换 · 让闲置流动起来</p>
        </div>
      </aside>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

export type { ItemCategory };
