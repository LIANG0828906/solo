import { useState } from 'react';
import { useAppStore, STATUS_LABELS, STATUS_COLORS, Order } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

const SHAPE_OPTIONS = ['茶壶', '茶碗', '茶杯', '花瓶', '花器', '香插', '笔洗', '其他'];
const BODY_TYPE_OPTIONS = ['紫砂泥', '高岭土', '陶土', '青瓷泥', '瓷土', '粗陶'];

export default function FrontPage() {
  const addOrder = useAppStore((s) => s.addOrder);
  const orders = useAppStore((s) => s.orders);

  const [shape, setShape] = useState(SHAPE_OPTIONS[0]);
  const [diameter, setDiameter] = useState('');
  const [height, setHeight] = useState('');
  const [baseDiameter, setBaseDiameter] = useState('');
  const [bodyType, setBodyType] = useState(BODY_TYPE_OPTIONS[0]);
  const [note, setNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [searchResult, setSearchResult] = useState<Order | null>(null);
  const [searchError, setSearchError] = useState('');

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !diameter || !height || !baseDiameter) return;

    const newOrder = addOrder({
      customerName,
      phone,
      shape,
      diameter: Number(diameter),
      height: Number(height),
      baseDiameter: Number(baseDiameter),
      bodyType,
      note,
    });

    setSubmittedOrder(newOrder);
    setCustomerName('');
    setPhone('');
    setDiameter('');
    setHeight('');
    setBaseDiameter('');
    setNote('');
    setShape(SHAPE_OPTIONS[0]);
    setBodyType(BODY_TYPE_OPTIONS[0]);
  };

  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const found = orders.find((o) => o.orderNo === searchOrderNo.trim());
    if (found) {
      setSearchResult(found);
    } else {
      setSearchResult(null);
      setSearchError('未找到该订单，请核对订单号');
    }
  };

  const OrderTimeline = ({ order }: { order: Order }) => (
    <div className="relative pl-8 py-4">
      {order.statusHistory.map((item, idx) => {
        const isLast = idx === order.statusHistory.length - 1;
        const color = STATUS_COLORS[item.status];
        return (
          <div key={idx} className="relative pb-8 last:pb-0">
            {!isLast && (
              <div
                className="absolute left-[-17px] top-5 w-0.5 h-full"
                style={{ backgroundColor: color, opacity: 0.3 }}
              />
            )}
            <div
              className="absolute left-[-24px] top-1 w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: color, boxShadow: `0 0 0 2px ${color}40` }}
            />
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {STATUS_LABELS[item.status]}
              </span>
              <span className="text-sm text-earth-brown/60">
                {new Date(item.timestamp).toLocaleString('zh-CN')}
              </span>
            </div>
            {item.note && (
              <p className="text-sm text-earth-brown/70 mt-1">{item.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-rice-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-serif text-4xl md:text-5xl text-earth-brown mb-4">
            素器工坊
          </h1>
          <p className="text-earth-brown/70 text-lg">
            专注手工陶瓷，每件作品都是独一无二的时光印记
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-card p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-serif text-2xl text-earth-brown mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-clay-orange rounded-full" />
              定制订单提交
            </h2>

            {submittedOrder