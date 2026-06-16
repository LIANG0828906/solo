import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User as UserIcon, Package, ScrollText, Settings, ChevronRight, Check, X, MessageSquare } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RatingStars from '@/components/RatingStars';
import ItemCard from '../components/ItemCard';
import {
  getStatusColor,
  getStatusText,
  getOfferStatusText,
  getUserById,
  User,
  Offer,
} from '../models';
import { useTradeStore, Transaction } from '../store';
import { useAuthStore } from '../../auth/store';
import { useToast } from '@/components/Toast';
import { validateContact } from '@/utils/validators';

type TabKey = 'items' | 'transactions' | 'profile';

const TABS: { key: TabKey; label: string; icon: typeof Package }[] = [
  { key: 'items', label: '我的物品', icon: Package },
  { key: 'transactions', label: '交易记录', icon: ScrollText },
  { key: 'profile', label: '个人资料', icon: Settings },
];

export default function ProfilePage() {
  const { currentUser, updateContact, setCurrentUser } = useAuthStore();
  const {
    myItems,
    myTransactions,
    myReceivedOffers,
    loadMyItems,
    loadMyTransactions,
    loadMyReceivedOffers,
    acceptOffer,
    rejectOffer,
  } = useTradeStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('items');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editContact, setEditContact] = useState(false);
  const [contactVal, setContactVal] = useState(currentUser?.contact || '');
  const [contactErr, setContactErr] = useState('');
  const [offerBuyerMap, setOfferBuyerMap] = useState<Record<string, User>>({});
  const [txItemMap, setTxItemMap] = useState<Record<string, Offer | undefined>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadMyItems(currentUser.id);
    loadMyTransactions(currentUser.id);
    loadMyReceivedOffers(currentUser.id);
  }, [currentUser, loadMyItems, loadMyTransactions, loadMyReceivedOffers]);

  useEffect(() => {
    const buyerIds = Array.from(new Set(myReceivedOffers.map((o) => o.buyerId)));
    Promise.all(buyerIds.map((id) => getUserById(id))).then((users) => {
      const map: Record<string, User> = {};
      users.forEach((u, i) => {
        if (u) map[buyerIds[i]] = u;
      });
      setOfferBuyerMap(map);
    });
  }, [myReceivedOffers]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleSaveContact = async () => {
    const check = validateContact(contactVal);
    if (!check.valid) {
      setContactErr(check.message);
      return;
    }
    try {
      const user = await updateContact(contactVal.trim());
      setCurrentUser(user);
      setEditContact(false);
      showToast('联系方式已更新', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleAccept = async (offerId: string) => {
    try {
      await acceptOffer(offerId);
      showToast('已接受出价，双方信誉+1', 'success');
      loadMyItems(currentUser!.id);
      loadMyReceivedOffers(currentUser!.id);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleReject = async (offerId: string) => {
    try {
      await rejectOffer(offerId);
      showToast('已拒绝出价', 'info');
      loadMyItems(currentUser!.id);
      loadMyReceivedOffers(currentUser!.id);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const getOffersForItem = (itemId: string) =>
    myReceivedOffers.filter((o) => o.itemId === itemId);

  const tabIndex = TABS.findIndex((t) => t.key === activeTab);

  return (
    <div className="min-h-screen">
      <Navbar showSearch={false} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 fade-in">
        <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
            style={{ backgroundColor: '#FDF2E9' }}
          >
            {currentUser.avatar}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-secondary">{currentUser.name}</h1>
              <RatingStars rating={currentUser.rating} size="md" showValue />
            </div>
            <div className="text-sm text-secondary/60 mt-1 flex items-center gap-3 flex-wrap">
              <span>📅 加入于 {new Date(currentUser.joinDate).toLocaleDateString('zh-CN')}</span>
              <span>📦 发布 {currentUser.itemCount} 件物品</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:brightness-110"
            style={{ backgroundColor: '#E67E22' }}
          >
            <Package size={16} />
            发布物品
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="relative border-b border-secondary/5">
            <div className="flex">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      isActive ? 'text-primary' : 'text-secondary/50 hover:text-secondary/80'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0, 2)}</span>
                  </button>
                );
              })}
            </div>
            <div
              className="absolute bottom-0 h-0.5 transition-all duration-300 ease-out rounded-full"
              style={{
                backgroundColor: '#E67E22',
                width: `${100 / TABS.length}%`,
                transform: `translateX(${tabIndex * 100}%)`,
                left: 0,
              }}
            />
          </div>

          <div ref={containerRef} className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${tabIndex * 100}%)` }}
            >
              <div className="w-full shrink-0 p-5 sm:p-6 min-h-[400px]">
                <MyItemsTab
                  items={myItems}
                  getOffersForItem={getOffersForItem}
                  offerBuyerMap={offerBuyerMap}
                  expandedItemId={expandedItemId}
                  setExpandedItemId={setExpandedItemId}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onOpenItem={(id) => navigate(`/item/${id}`)}
                />
              </div>

              <div className="w-full shrink-0 p-5 sm:p-6 min-h-[400px]">
                <TransactionsTab transactions={myTransactions} currentUser={currentUser} />
              </div>

              <div className="w-full shrink-0 p-5 sm:p-6 min-h-[400px]">
                <ProfileTab
                  user={currentUser}
                  editContact={editContact}
                  setEditContact={setEditContact}
                  contactVal={contactVal}
                  setContactVal={setContactVal}
                  contactErr={contactErr}
                  setContactErr={setContactErr}
                  onSave={handleSaveContact}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getOfferStatusText(s: Offer['status']): string {
  return s === 'accepted' ? '已接受' : s === 'rejected' ? '已拒绝' : '待处理';
}

function MyItemsTab({
  items,
  getOffersForItem,
  offerBuyerMap,
  expandedItemId,
  setExpandedItemId,
  onAccept,
  onReject,
  onOpenItem,
}: {
  items: any[];
  getOffersForItem: (id: string) => Offer[];
  offerBuyerMap: Record<string, User>;
  expandedItemId: string | null;
  setExpandedItemId: (id: string | null) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onOpenItem: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <Package size={48} className="mx-auto text-secondary/20 mb-3" />
        <h3 className="font-medium text-secondary mb-1">您还没有发布任何物品</h3>
        <p className="text-sm text-secondary/50">点击右上角按钮发布您的第一件闲置物品吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const offers = getOffersForItem(item.id);
        const isExpanded = expandedItemId === item.id;
        return (
          <div
            key={item.id}
            className="bg-bg rounded-xl overflow-hidden transition-all"
          >
            <div
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-orange-50/60 transition-colors"
              onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
            >
              <div
                className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenItem(item.id);
                }}
              >
                {item.images[0] && (
                  <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm line-clamp-1">{item.title}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm font-bold" style={{ color: '#E67E22' }}>
                    ¥{item.price}
                  </span>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: getStatusColor(item.status) }}
                  >
                    {getStatusText(item.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-secondary">{offers.length}</div>
                  <div className="text-[11px] text-secondary/50">条出价</div>
                </div>
                <div className="sm:hidden flex items-center gap-1 bg-white rounded-full px-2 py-0.5">
                  <MessageSquare size={12} className="text-primary" />
                  <span className="text-xs font-medium">{offers.length}</span>
                </div>
                <ChevronRight
                  size={18}
                  className={`text-secondary/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </div>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 fade-in">
                {offers.length === 0 ? (
                  <div className="bg-white rounded-lg p-4 text-center text-sm text-secondary/50">
                    暂无出价记录
                  </div>
                ) : (
                  offers.map((offer) => {
                    const buyer = offerBuyerMap[offer.buyerId];
                    const isPending = offer.status === 'pending';
                    return (
                      <div
                        key={offer.id}
                        className="bg-white rounded-lg p-3 flex flex-col sm:flex-row sm:items-start gap-3"
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                            {buyer?.avatar || '👤'}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{buyer?.name || '匿名'}</div>
                            <div className="text-[10px] text-secondary/40">
                              {new Date(offer.createdAt).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-secondary/80 bg-bg rounded p-2.5">
                            {offer.message}
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          {isPending ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAccept(offer.id);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:brightness-110"
                                style={{ backgroundColor: '#2ECC71' }}
                              >
                                <Check size={12} />
                                接受
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReject(offer.id);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:brightness-110"
                                style={{ backgroundColor: '#95A5A6' }}
                              >
                                <X size={12} />
                                拒绝
                              </button>
                            </>
                          ) : (
                            <span
                              className="text-xs font-medium px-2.5 py-1.5 rounded-full self-center"
                              style={{
                                backgroundColor:
                                  offer.status === 'accepted' ? '#2ECC7120' : '#95A5A620',
                                color: offer.status === 'accepted' ? '#2ECC71' : '#95A5A6',
                              }}
                            >
                              {getOfferStatusText(offer.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TransactionsTab({
  transactions,
  currentUser,
}: {
  transactions: Transaction[];
  currentUser: User;
}) {
  if (transactions.length === 0) {
    return (
      <div className="py-16 text-center">
        <ScrollText size={48} className="mx-auto text-secondary/20 mb-3" />
        <h3 className="font-medium text-secondary mb-1">暂无交易记录</h3>
        <p className="text-sm text-secondary/50">完成交易后这里会显示历史记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const isBuyer = tx.role === 'buyer';
        const status =
          tx.offer?.status === 'accepted' || tx.item.status === 'swapped' ? 'completed' : tx.offer?.status || 'pending';
        return (
          <div
            key={tx.id}
            className="bg-bg rounded-xl p-4 flex items-start gap-3 hover:bg-orange-50/60 transition-colors cursor-pointer"
            onClick={() => window.location.href = `/item/${tx.item.id}`}
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white">
              {tx.item.images[0] && (
                <img src={tx.item.images[0]} alt="" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm line-clamp-1">{tx.item.title}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs" style={{ color: '#E67E22' }}>
                  ¥{tx.item.price}
                </span>
                <span className="text-[10px] text-secondary/40">
                  {new Date(tx.date).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xl">{tx.counterpart.avatar}</span>
                <span className="text-xs text-secondary/60">
                  {isBuyer ? '向卖家' : '与买家'} {tx.counterpart.name} 交易
                </span>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div
                className={`inline-block text-[10px] font-medium px-2 py-1 rounded-full ${
                  isBuyer ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                }`}
              >
                {isBuyer ? '我买入' : '我卖出'}
              </div>
              {status === 'completed' && (
                <div className="mt-1.5 text-[10px] font-medium text-green-600">✅ 已完成</div>
              )}
              {status === 'pending' && (
                <div className="mt-1.5 text-[10px] font-medium text-orange-500">⏳ 进行中</div>
              )}
              {status === 'rejected' && (
                <div className="mt-1.5 text-[10px] font-medium text-gray-500">❌ 已取消</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProfileTab({
  user,
  editContact,
  setEditContact,
  contactVal,
  setContactVal,
  contactErr,
  setContactErr,
  onSave,
}: {
  user: User;
  editContact: boolean;
  setEditContact: (b: boolean) => void;
  contactVal: string;
  setContactVal: (s: string) => void;
  contactErr: string;
  setContactErr: (s: string) => void;
  onSave: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const { updatePassword, setCurrentUser } = useAuthStore();
  const { showToast } = useToast();

  const handleChangePw = async () => {
    if (oldPw !== user.password) {
      setPwErr('原密码不正确');
      return;
    }
    if (newPw.length < 6) {
      setPwErr('新密码至少6位');
      return;
    }
    try {
      const u = await updatePassword(newPw);
      setCurrentUser(u);
      showToast('密码修改成功', 'success');
      setShowPw(false);
      setOldPw('');
      setNewPw('');
      setPwErr('');
    } catch (e: any) {
      setPwErr(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-bg rounded-xl p-5">
        <h3 className="font-semibold text-secondary mb-4 flex items-center gap-2">
          <UserIcon size={16} className="text-primary" />
          基本信息
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: '#FFF' }}
            >
              {user.avatar}
            </div>
            <div>
              <div className="font-medium text-secondary">{user.name}</div>
              <div className="mt-1">
                <RatingStars rating={user.rating} size="sm" showValue />
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-secondary/50 mb-1.5">用户名</div>
            <div className="bg-white rounded-lg px-3.5 py-2.5 text-sm">{user.name}</div>
          </div>

          <div>
            <div className="text-xs text-secondary/50 mb-1.5">联系方式</div>
            {editContact ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={contactVal}
                  onChange={(e) => {
                    setContactVal(e.target.value);
                    if (contactErr) setContactErr('');
                  }}
                  placeholder="手机号或邮箱"
                  className={`w-full bg-white rounded-lg px-3.5 py-2.5 text-sm border ${
                    contactErr ? 'border-red-300' : 'border-secondary/10'
                  }`}
                />
                {contactErr && <p className="text-xs text-red-500">{contactErr}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={onSave}
                    className="flex-1 py-2 rounded-lg text-white text-sm font-medium hover:brightness-110"
                    style={{ backgroundColor: '#E67E22' }}
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditContact(false);
                      setContactVal(user.contact);
                      setContactErr('');
                    }}
                    className="flex-1 py-2 rounded-lg bg-white border border-secondary/10 text-sm text-secondary/70 hover:bg-bg"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-lg px-3.5 py-2.5 text-sm flex-1">
                  {user.contact || <span className="text-secondary/40">未设置</span>}
                </div>
                <button
                  onClick={() => setEditContact(true)}
                  className="px-3.5 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                >
                  编辑
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-secondary/50 mb-1.5">注册时间</div>
            <div className="bg-white rounded-lg px-3.5 py-2.5 text-sm">
              {new Date(user.joinDate).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-bg rounded-xl p-5">
        <h3 className="font-semibold text-secondary mb-4 flex items-center gap-2">
          <Settings size={16} className="text-primary" />
          账号设置
        </h3>

        {!showPw ? (
          <button
            onClick={() => setShowPw(true)}
            className="w-full py-3 rounded-lg bg-white text-sm font-medium text-secondary hover:bg-orange-50 transition-colors"
          >
            修改密码
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-secondary/50 mb-1.5">原密码</div>
              <input
                type="password"
                value={oldPw}
                onChange={(e) => {
                  setOldPw(e.target.value);
                  if (pwErr) setPwErr('');
                }}
                className="w-full bg-white rounded-lg px-3.5 py-2.5 text-sm border border-secondary/10"
                placeholder="pass123"
              />
            </div>
            <div>
              <div className="text-xs text-secondary/50 mb-1.5">新密码（至少6位）</div>
              <input
                type="password"
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value);
                  if (pwErr) setPwErr('');
                }}
                className="w-full bg-white rounded-lg px-3.5 py-2.5 text-sm border border-secondary/10"
              />
            </div>
            {pwErr && <p className="text-xs text-red-500">{pwErr}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleChangePw}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:brightness-110"
                style={{ backgroundColor: '#E67E22' }}
              >
                确认修改
              </button>
              <button
                onClick={() => {
                  setShowPw(false);
                  setOldPw('');
                  setNewPw('');
                  setPwErr('');
                }}
                className="flex-1 py-2.5 rounded-lg bg-white border border-secondary/10 text-sm text-secondary/70 hover:bg-bg"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-bg rounded-xl p-5">
        <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
          🏆 <span>信誉说明</span>
        </h3>
        <p className="text-sm text-secondary/70 leading-relaxed">
          每次成功完成交易后，买卖双方都会自动获得 <b className="text-primary">+1 信誉分</b>。
          信誉分以星级形式展示（1-5星），是衡量交易信用的重要指标。
          发布物品数量多、交易成功率高的用户将获得更高的信誉等级。
        </p>
      </div>
    </div>
  );
}
