import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowUpCircle, ArrowDownCircle, Share2, MessageCircle, MessageSquare, AtSign, X } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  createdAt: string;
}

interface WalletData {
  userId: string;
  balance: number;
  weeklyChanges: { date: string; change: number }[];
  transactions: Transaction[];
}

const PLATFORMS = [
  { name: '微信', Icon: MessageCircle, color: '#07C160' },
  { name: 'QQ', Icon: MessageSquare, color: '#12B7F5' },
  { name: '微博', Icon: AtSign, color: '#E6162D' },
];

function lerpColor(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    axios.get('/api/wallet/currentUser').then(res => {
      setWallet(res.data.data.wallet);
      setLoading(false);
    });
  }, []);

  const blue = [107, 183, 240];
  const orange = [249, 115, 22];
  const maxAbs = wallet ? Math.max(...wallet.weeklyChanges.map(d => Math.abs(d.change)), 1) : 1;

  return (
    <div className="min-h-screen bg-surface p-4 pb-24 font-body">
      <div
        className="rounded-card p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #6BB7F0 0%, #9ED1F7 100%)' }}
      >
        <p className="text-sm opacity-90">我的积分</p>
        <p className="font-display font-bold text-4xl mt-2">
          {loading ? '—' : wallet?.balance}
        </p>
      </div>

      <div className="mt-6 rounded-card bg-card p-4 shadow-sm">
        <h2 className="font-display font-semibold text-base mb-4">近7天积分变化</h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
          {loading ? [...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <div className="w-8 h-3 bg-gray-100 rounded animate-pulse" />
              <div className="w-full flex-1 flex items-end">
                <div className="w-full bg-gray-100 rounded-sm animate-pulse" style={{ height: `${40 + Math.random() * 60}%` }} />
              </div>
              <div className="w-6 h-2 bg-gray-100 rounded animate-pulse" />
            </div>
          )) : wallet?.weeklyChanges.map((d, i) => {
            const t = i / 6;
            const [r, g, b] = lerpColor(blue, orange, t);
            const pct = Math.abs(d.change) / maxAbs * 100;
            return (
              <div key={d.date} className="flex flex-col items-center flex-1 h-full">
                <p className="text-[11px] font-medium mb-1" style={{ color: `rgb(${r},${g},${b})` }}>
                  {d.change > 0 ? '+' : ''}{d.change}
                </p>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-sm animate-growUp"
                    style={{
                      background: `rgb(${r},${g},${b})`,
                      height: `${pct}%`,
                      minHeight: d.change !== 0 ? 4 : 0,
                      animationDelay: `${i * 0.1}s`,
                      transformOrigin: 'bottom',
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {d.date.slice(5)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-card bg-card p-4 shadow-sm">
        <h2 className="font-display font-semibold text-base mb-3">积分流水</h2>
        {loading ? [...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-2 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-3 w-10 bg-gray-100 rounded animate-pulse shrink-0" />
          </div>
        )) : wallet?.transactions.map((tx, idx) => (
          <div key={tx.id}>
            <div className="flex items-center gap-3 py-3">
              {tx.type === 'income' ? (
                <ArrowUpCircle className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <ArrowDownCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{tx.description}</p>
                <p className="text-xs text-gray-400">{tx.createdAt.slice(0, 10)}</p>
              </div>
              <p className={`text-sm font-semibold shrink-0 ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                {tx.type === 'income' ? '+' : '-'}{tx.amount}
              </p>
            </div>
            {idx < wallet.transactions.length - 1 && <div className="border-t border-gray-100" />}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowShare(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow-lg active:scale-95 transition-transform z-10"
      >
        <Share2 className="w-4 h-4" />
        分享赚积分
      </button>

      {showShare && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn"
          onClick={() => setShowShare(false)}
        >
          <div
            className="bg-white rounded-card p-6 w-72 relative animate-slideInUp"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowShare(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-center font-display font-semibold mb-6">分享赚积分</p>
            <div className="flex justify-center gap-6">
              {PLATFORMS.map(({ name, Icon, color }) => (
                <button
                  key={name}
                  onClick={() => { alert('分享成功，获得10积分！'); setShowShare(false); }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <span
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 group-hover:scale-[1.15]"
                    style={{ background: color }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 16px ${color}`; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="text-xs text-gray-500">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
