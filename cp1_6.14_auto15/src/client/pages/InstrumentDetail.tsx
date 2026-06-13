import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, User } from 'lucide-react';
import { getInstrument } from '@/api/client';
import type { Instrument, SessionUser } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { useStore } from '@/store/useStore';
import ImageCarousel from '@/components/ImageCarousel';
import RentalForm from '@/components/RentalForm';
import { formatDate } from '@/lib/utils';

export default function InstrumentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useStore();
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [owner, setOwner] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getInstrument(id);
        setInstrument(response.instrument);
        setOwner(response.owner);
      } catch (err) {
        console.error('获取乐器详情失败', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-forest-500 animate-spin" />
          <span className="ml-2 text-wood-600">加载中...</span>
        </div>
      </div>
    );
  }

  if (!instrument) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <p className="text-lg text-wood-600">乐器不存在或已被删除</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <ImageCarousel images={instrument.images} />
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl font-serif font-bold text-wood-800">
                {instrument.name}
              </h1>
              <span className="shrink-0 px-3 py-1.5 text-sm bg-wood-100 text-wood-700 rounded-lg font-medium">
                {CATEGORY_LABELS[instrument.category]}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-wood-600">
              <span>品牌：{instrument.brand}</span>
              <span>购买年份：{instrument.purchaseYear}年</span>
            </div>
          </div>

          {owner && (
            <div className="flex items-center gap-3 p-4 bg-wood-50 rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-wood-200 text-wood-700 font-medium">
                {owner.avatar ? (
                  <img
                    src={owner.avatar}
                    alt={owner.nickname}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="font-medium text-wood-800">{owner.nickname}</p>
                <p className="text-sm text-wood-500">发布者</p>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-wood-800 mb-2">描述</h2>
            <p className="text-wood-600 whitespace-pre-wrap leading-relaxed">
              {instrument.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl shadow-sm border border-wood-100">
              <p className="text-sm text-wood-500 mb-1">日租金</p>
              <p className="text-2xl font-bold text-wood-800">
                ¥{instrument.dailyRate}
                <span className="text-sm font-normal text-wood-500">/天</span>
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-wood-100">
              <p className="text-sm text-wood-500 mb-1">押金</p>
              <p className="text-2xl font-bold text-wood-800">¥{instrument.deposit}</p>
            </div>
          </div>

          <p className="text-sm text-wood-400">
            发布于 {formatDate(instrument.createdAt)}
          </p>
        </div>
      </div>

      <RentalForm instrument={instrument} isLoggedIn={!!user} />
    </div>
  );
}
