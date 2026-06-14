import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  RefreshCw,
  Heart,
  Trash2,
  EyeOff,
  Check,
  Star,
  User,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { api, type Book, type ExchangeRequest, type UserProfile, type UserStats } from '../api';

type TabType = 'listings' | 'exchanges' | 'favorites';

interface BookWithState extends Book {
  _deleting?: boolean;
  _completed?: boolean;
}

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('listings');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [listings, setListings] = useState<BookWithState[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResult, listingsResult, exchangesResult, favoritesResult] = await Promise.all([
          api.getUserProfile(),
          api.getUserBooks(),
          api.getUserExchanges(),
          api.getFavoriteBooks(),
        ]);
        setProfile(profileResult.profile);
        setStats(profileResult.stats);
        setListings(listingsResult.books.length > 0 ? listingsResult.books : demoListings());
        setExchanges(exchangesResult.exchanges.length > 0 ? exchangesResult.exchanges : demoExchanges());
        setFavorites(favoritesResult.books);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        setProfile(demoProfile());
        setStats({ totalListings: 3, successfulExchanges: 12, rating: 4.8 });
        setListings(demoListings());
        setExchanges(demoExchanges());
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const demoProfile = (): UserProfile => ({
    id: 'user-001',
    name: '小林同学',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaolin',
    bio: '计算机科学与技术大三学生，热爱编程和阅读，希望通过课本交换认识更多朋友~',
    contact: '微信：xiaolin_2024',
    totalListings: 3,
    successfulExchanges: 12,
    rating: 4.8,
    favorites: [],
  });

  const demoListings = (): BookWithState[] => [
    {
      id: 'my-book-1',
      title: '深入理解计算机系统',
      author: 'Randal E. Bryant',
      courseCode: 'CS302',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=computer%20systems%20textbook%20csapp%20cover%20warm&image_size=portrait_4_3',
      images: [],
      condition: '九成新',
      originalPrice: 139,
      expectedPrice: 70,
      sellerId: 'user-001',
      sellerName: '小林同学',
      sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaolin',
      sellerBio: '',
      contactInfo: '',
      status: 'active',
      createdAt: '2026-06-01T10:00:00.000Z',
    },
    {
      id: 'my-book-2',
      title: '离散数学及其应用',
      author: 'Kenneth H. Rosen',
      courseCode: 'MATH201',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=discrete%20mathematics%20textbook%20cover%20logic%20graphs&image_size=portrait_4_3',
      images: [],
      condition: '八成新',
      originalPrice: 99,
      wantExchange: ['算法导论'],
      sellerId: 'user-001',
      sellerName: '小林同学',
      sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaolin',
      sellerBio: '',
      contactInfo: '',
      status: 'active',
      createdAt: '2026-05-20T14:00:00.000Z',
    },
    {
      id: 'my-book-3',
      title: '计算机组成原理',
      author: '唐朔飞',
      courseCode: 'CS203',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=computer%20organization%20textbook%20chinese%20cpu%20architecture&image_size=portrait_4_3',
      images: [],
      condition: '八成新',
      originalPrice: 56,
      expectedPrice: 25,
      sellerId: 'user-001',
      sellerName: '小林同学',
      sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaolin',
      sellerBio: '',
      contactInfo: '',
      status: 'exchanged',
      createdAt: '2026-04-15T09:00:00.000Z',
    },
  ];

  const demoExchanges = (): ExchangeRequest[] => [
    {
      id: 'ex-demo-1',
      bookId: 'book-001',
      type: 'buy',
      offerPrice: 35,
      message: '同学你好，我想要买这本数据结构，方便在图书馆面交吗？',
      contactInfo: '微信：cs_student_2024',
      status: 'completed',
      createdAt: '2026-06-05T10:30:00.000Z',
    },
    {
      id: 'ex-demo-2',
      bookId: 'book-002',
      type: 'exchange',
      offerBookTitle: '高等数学（第七版）上册',
      offerBookAuthor: '同济大学数学系',
      message: '我正好有高数上册想交换，课本品相很好~',
      contactInfo: '微信：math_exchange',
      status: 'pending',
      createdAt: '2026-06-10T15:20:00.000Z',
    },
  ];

  const handleDelete = async (bookId: string) => {
    setListings((prev) => prev.map((b) => (b.id === bookId ? { ...b, _deleting: true } : b)));
    try {
      await api.deleteBook(bookId);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      setListings((prev) => prev.filter((b) => b.id !== bookId));
    }, 400);
  };

  const handleOffline = async (bookId: string) => {
    setListings((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, status: b.status === 'offline' ? 'active' : 'offline' } : b))
    );
    try {
      const book = listings.find((b) => b.id === bookId);
      if (book) {
        await api.updateBook(bookId, { status: book.status === 'offline' ? 'active' : 'offline' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkComplete = async (bookId: string) => {
    setListings((prev) => prev.map((b) => (b.id === bookId ? { ...b, _completed: true, status: 'exchanged' } : b)));
  };

  const handleToggleFavorite = async (bookId: string) => {
    try {
      const result = await api.toggleFavorite(bookId);
      if (!result.added) {
        setFavorites((prev) => prev.filter((b) => b.id !== bookId));
      }
    } catch (e) {
      setFavorites((prev) => prev.filter((b) => b.id !== bookId));
    }
  };

  const tabs = [
    { key: 'listings' as TabType, label: '发布历史', icon: BookOpen, count: listings.length },
    { key: 'exchanges' as TabType, label: '交换记录', icon: RefreshCw, count: exchanges.length },
    { key: 'favorites' as TabType, label: '收藏列表', icon: Heart, count: favorites.length },
  ];

  if (loading || !profile || !stats) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-creamDark rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-28 bg-creamDark rounded-2xl" />
            <div className="h-28 bg-creamDark rounded-2xl" />
            <div className="h-28 bg-creamDark rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="bg-gradient-to-r from-warmOrange/20 via-wood/15 to-warmOrange/10 rounded-3xl p-6 sm:p-8 mb-6 fade-in-up relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-warmOrange/20 rounded-full blur-3xl" />
        <div className="absolute right-20 -bottom-16 w-32 h-32 bg-wood/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-20 h-20 rounded-full bg-white shadow-soft ring-4 ring-white"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-serif font-bold text-2xl text-[#3D2B1F]">{profile.name}</h1>
              <div className="flex items-center gap-0.5 px-2 py-0.5 bg-white/70 rounded-full">
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700">{stats.rating}</span>
              </div>
            </div>
            <p className="text-[#3D2B1F]/70 mb-2">{profile.bio}</p>
            <p className="text-sm text-woodDark flex items-center gap-1.5">
              <User size={14} />
              {profile.contact}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 fade-in-up" style={{ animationDelay: '0.1s' }}>
        <StatCard
          icon={BookOpen}
          label="总发布数"
          value={stats.totalListings || listings.length}
          gradient="from-warmOrange to-warmOrangeDark"
        />
        <StatCard
          icon={RefreshCw}
          label="成功交换"
          value={stats.successfulExchanges}
          gradient="from-sage to-green-600"
        />
        <StatCard
          icon={Star}
          label="好评率"
          value={(stats.rating * 20).toFixed(0)}
          gradient="from-wood to-woodDark"
          suffix="%"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6 fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex border-b border-wood/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                btn-press flex-1 flex items-center justify-center gap-2 py-4 text-sm sm:text-base font-medium transition-all
                ${activeTab === tab.key
                  ? 'text-warmOrange border-b-2 border-warmOrange bg-warmOrange/5'
                  : 'text-[#3D2B1F]/60 hover:text-[#3D2B1F] hover:bg-creamDark/30'
                }
              `}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${activeTab === tab.key ? 'bg-warmOrange/20 text-warmOrangeDark' : 'bg-creamDark text-woodDark'}
                `}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'listings' && (
            <div className="space-y-4">
              {listings.length === 0 ? (
                <div className="text-center py-12 text-woodDark">
                  <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                  <p>还没有发布过课本，去首页发布第一本吧！</p>
                </div>
              ) : (
                listings.map((book, idx) => (
                  <div
                    key={book.id}
                    className={`
                      flex flex-col sm:flex-row gap-4 p-4 bg-cream/50 rounded-2xl border border-wood/10 transition-all
                      ${book._completed ? 'opacity-60 completed-badge' : ''}
                    `}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className={`w-full sm:w-24 h-32 sm:h-auto sm:aspect-[3/4] object-cover rounded-xl ${book._deleting ? 'shrink-fade' : ''}`}
                    />
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="inline-block px-2 py-0.5 bg-warmOrange/10 text-warmOrangeDark rounded-full text-xs font-semibold mb-1.5">
                            {book.courseCode}
                          </span>
                          <h3 className="font-serif font-semibold text-lg text-[#3D2B1F] leading-tight">
                            {book.title}
                          </h3>
                          <p className="text-sm text-woodDark mb-2">{book.author}</p>
                        </div>
                        <span
                          className={`
                            px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap
                            ${book.status === 'active' ? 'bg-sage/15 text-sage' : ''}
                            ${book.status === 'offline' ? 'bg-gray-200 text-gray-600' : ''}
                            ${book.status === 'exchanged' || book.status === 'sold' ? 'bg-sage/30 text-sage' : ''}
                          `}
                        >
                          {book.status === 'active' && '上架中'}
                          {book.status === 'offline' && '已下架'}
                          {book.status === 'exchanged' && '已交换'}
                          {book.status === 'sold' && '已售出'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm mb-3">
                        <span className="text-wood line-through">¥{book.originalPrice}</span>
                        {book.expectedPrice && (
                          <span className="text-warmOrange font-bold">¥{book.expectedPrice}</span>
                        )}
                        {book.wantExchange && <span className="text-sage font-medium">可交换</span>}
                        <span className="text-woodDark">· {book.condition}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {book.status === 'active' && (
                          <button
                            onClick={() => handleMarkComplete(book.id)}
                            className="btn-press flex items-center gap-1.5 px-3.5 py-2 bg-sage text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            <Check size={15} />
                            标记已完成
                          </button>
                        )}
                        <button
                          onClick={() => handleOffline(book.id)}
                          className="btn-press flex items-center gap-1.5 px-3.5 py-2 bg-wood/15 text-woodDark rounded-xl text-sm font-medium hover:bg-wood/25 transition-colors"
                        >
                          <EyeOff size={15} />
                          {book.status === 'offline' ? '重新上架' : '下架'}
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="btn-press flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={15} />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'exchanges' && (
            <div className="space-y-4">
              {exchanges.length === 0 ? (
                <div className="text-center py-12 text-woodDark">
                  <RefreshCw size={48} className="mx-auto mb-3 opacity-30" />
                  <p>还没有交换记录，去首页找找感兴趣的课本吧</p>
                </div>
              ) : (
                exchanges.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="p-4 bg-cream/50 rounded-2xl border border-wood/10"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {ex.type === 'exchange' ? (
                            <span className="px-2.5 py-1 bg-sage/15 text-sage rounded-full text-xs font-semibold flex items-center gap-1">
                              <RefreshCw size={12} />
                              交换请求
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-warmOrange/15 text-warmOrangeDark rounded-full text-xs font-semibold">
                              购买请求 ¥{ex.offerPrice}
                            </span>
                          )}
                          <span
                            className={`
                              px-2.5 py-1 rounded-full text-xs font-medium
                              ${ex.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                              ${ex.status === 'completed' ? 'bg-sage/20 text-sage' : ''}
                              ${ex.status === 'accepted' ? 'bg-blue-100 text-blue-700' : ''}
                              ${ex.status === 'rejected' ? 'bg-red-100 text-red-600' : ''}
                            `}
                          >
                            {ex.status === 'pending' && '等待回复'}
                            {ex.status === 'completed' && '已完成'}
                            {ex.status === 'accepted' && '已接受'}
                            {ex.status === 'rejected' && '已拒绝'}
                          </span>
                        </div>
                        {ex.type === 'exchange' && ex.offerBookTitle && (
                          <p className="font-medium text-[#3D2B1F]">
                            想用《{ex.offerBookTitle}》交换
                            {ex.offerBookAuthor && <span className="text-woodDark font-normal">（{ex.offerBookAuthor}）</span>}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-woodDark whitespace-nowrap">
                        {new Date(ex.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-[#3D2B1F]/80 text-sm mb-2 bg-white/60 rounded-lg p-3">
                      {ex.message}
                    </p>
                    <p className="text-xs text-woodDark">联系方式：{ex.contactInfo}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-woodDark">
                  <Heart size={48} className="mx-auto mb-3 opacity-30" />
                  <p>还没有收藏的课本，去首页逛逛吧</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {favorites.map((book) => (
                    <div
                      key={book.id}
                      className="bg-cream/50 rounded-xl overflow-hidden border border-wood/10"
                    >
                      <img src={book.coverImage} alt={book.title} className="w-full aspect-[4/3] object-cover" />
                      <div className="p-3">
                        <h4 className="font-serif font-semibold text-sm text-[#3D2B1F] line-clamp-1 mb-1">
                          {book.title}
                        </h4>
                        <p className="text-xs text-woodDark mb-2">{book.author}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-warmOrange font-bold text-sm">
                            {book.expectedPrice ? `¥${book.expectedPrice}` : '可交换'}
                          </span>
                          <button
                            onClick={() => handleToggleFavorite(book.id)}
                            className="btn-press p-1.5 text-warmOrange hover:bg-warmOrange/10 rounded-lg transition-colors"
                          >
                            <Heart size={16} className="fill-current" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
