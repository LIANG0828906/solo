import { useState, useMemo, useEffect } from 'react';
import { useStore, type Item } from '@/store';
import {
  X,
  User,
  MapPin,
  Star,
  Tag,
  Clock,
  ArrowLeftRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface DetailProps {
  itemId: string;
  mounted: boolean;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: '待交换', className: 'bg-green-100 text-green-700' },
  reserved: { label: '已预约', className: 'bg-yellow-100 text-yellow-700' },
  exchanged: { label: '已交换', className: 'bg-gray-100 text-gray-500' },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return '刚刚发布';
  if (hours < 24) return `${hours}小时前发布`;
  return `${days}天前发布`;
}

export default function Detail({ itemId, mounted, onClose }: DetailProps) {
  const getItem = useStore((s) => s.getItem);
  const getUserById = useStore((s) => s.getUserById);
  const currentUser = useStore((s) => s.currentUser);
  const getMyItems = useStore((s) => s.getMyItems);
  const createRequest = useStore((s) => s.createRequest);
  const sendMessage = useStore((s) => s.sendMessage);

  const item = useMemo(() => getItem(itemId), [itemId, getItem]);
  const owner = useMemo(() => (item ? getUserById(item.ownerId) : undefined), [item, getUserById]);
  const myItems = useMemo(() => getMyItems(), [getMyItems]);
  const availableItems = useMemo(
    () => myItems.filter((i) => i.status === 'pending' && i.id !== itemId),
    [myItems, itemId]
  );

  const [selectedProposedId, setSelectedProposedId] = useState<string>('');
  const [messageToOwner, setMessageToOwner] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!item) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl p-8 text-center animate-scale-in">
          <AlertCircle size={48} className="mx-auto text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">物品不存在</h3>
          <p className="text-gray-500 mb-4">该物品可能已被删除或不存在</p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-primary text-white btn-bounce"
          >
            返回广场
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === item.ownerId;
  const statusStyle = STATUS_STYLES[item.status];

  const handleSubmitRequest = () => {
    if (!currentUser || !selectedProposedId) {
      setErrorMsg('请先选择你要交换的物品');
      return;
    }
    if (isOwner) {
      setErrorMsg('不能对自己的物品发起交换');
      return;
    }
    if (item.status !== 'pending') {
      setErrorMsg('该物品当前不可交换');
      return;
    }

    setSubmitState('loading');
    setErrorMsg('');

    const result = createRequest({
      fromUserId: currentUser.id,
      toUserId: item.ownerId,
      proposedItemId: selectedProposedId,
      targetItemId: item.id,
    });

    if (messageToOwner.trim() && result) {
      sendMessage({
        fromUserId: currentUser.id,
        toUserId: item.ownerId,
        content: messageToOwner.trim().slice(0, 100),
      });
    }

    setTimeout(() => {
      if (result) {
        setSubmitState('success');
        setTimeout(() => onClose(), 1500);
      } else {
        setSubmitState('idle');
        setErrorMsg('发起失败，该物品可能已被预约');
      }
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-200 ${
          mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-2/5 max-h-[360px] min-h-[220px] bg-gradient-to-br from-primary/10 to-secondary/20">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary shadow-lg transition-all btn-bounce"
          >
            <X size={20} />
          </button>

          <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyle.className}`}>
                  {statusStyle.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium bg-category text-green-700">
                  <Tag size={12} />
                  {item.category}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg line-clamp-2">
                {item.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-360px)] min-h-[400px]">
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 mb-6">
              <img
                src={owner?.avatarUrl}
                alt=""
                className="w-14 h-14 rounded-full bg-gray-200 ring-4 ring-white shadow"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  {owner?.nickname || '匿名用户'}
                  {isOwner && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white">
                      我发布的
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} />
                    {owner?.locationArea || '未知区域'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} />
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary" />
                  物品描述
                </h4>
                <p className="text-gray-600 leading-relaxed pl-3">
                  {item.description || '暂无描述'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary" />
                  新旧程度评估
                </h4>
                <div className="pl-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          fill={i < Math.round(item.conditionLevel / 2) ? 'currentColor' : 'none'}
                          className={i < Math.round(item.conditionLevel / 2) ? '' : 'text-gray-200'}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-gray-800">
                      {item.conditionLevel}
                      <span className="text-sm text-gray-400 font-normal">/10</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                      style={{ width: `${item.conditionLevel * 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    {item.conditionLevel >= 9
                      ? '几乎全新，使用痕迹极微'
                      : item.conditionLevel >= 7
                      ? '成色较好，正常使用痕迹'
                      : item.conditionLevel >= 5
                      ? '一般成色，功能完好'
                      : '有一定磨损，但仍可使用'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50/50 flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto scrollbar-thin">
              {submitState === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">交换请求已发送！</h3>
                  <p className="text-gray-500 text-sm">
                    等待对方查看并回复，您可以在右侧待办面板查看进度
                  </p>
                </div>
              ) : isOwner ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User size={40} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">这是您发布的物品</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    在右侧面板可以查看收到的交换请求
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white btn-bounce font-medium"
                  >
                    我知道了
                  </button>
                </div>
              ) : !currentUser ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <AlertCircle size={40} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">登录后发起交换</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    请先登录账号，选择您的闲置物品发起交换请求
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white btn-bounce font-medium"
                  >
                    前往登录
                  </button>
                </div>
              ) : item.status !== 'pending' ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                    <AlertCircle size={40} className="text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">物品暂不可交换</h3>
                  <p className="text-gray-500 text-sm">
                    当前状态：{STATUS_STYLES[item.status]?.label}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ArrowLeftRight size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">发起交换请求</h3>
                      <p className="text-xs text-gray-500">选择你的物品作为交换提案</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      选择您要交换出的物品 *
                    </label>
                    {availableItems.length === 0 ? (
                      <div className="p-4 rounded-xl bg-white border-2 border-dashed border-gray-200 text-center">
                        <p className="text-sm text-gray-500 mb-2">您还没有可交换的闲置物品</p>
                        <button
                          onClick={onClose}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          去发布一件 →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                        {availableItems.map((i: Item) => (
                          <label
                            key={i.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                              selectedProposedId === i.id
                                ? 'border-primary bg-primary/5'
                                : 'border-white bg-white hover:border-gray-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="proposed"
                              checked={selectedProposedId === i.id}
                              onChange={() => setSelectedProposedId(i.id)}
                              className="w-4 h-4 accent-primary"
                            />
                            <img
                              src={i.imageUrl}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {i.title}
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                <Star size={11} className="text-amber-500" fill="currentColor" />
                                {i.conditionLevel}成新 · {i.category}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      给对方留言（可选，100字以内）
                    </label>
                    <textarea
                      value={messageToOwner}
                      onChange={(e) => setMessageToOwner(e.target.value.slice(0, 100))}
                      placeholder="例如：很喜欢您的这件物品，我的物品保存也很好，期待交换！"
                      rows={3}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    />
                    <div className="text-right text-[10px] text-gray-400 mt-1">
                      {messageToOwner.length}/100
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      {errorMsg}
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isOwner && currentUser && item.status === 'pending' && submitState !== 'success' && (
              <div className="p-6 pt-0">
                <button
                  onClick={handleSubmitRequest}
                  disabled={!selectedProposedId || submitState === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-bounce"
                >
                  {submitState === 'loading' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      提交交换请求
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
