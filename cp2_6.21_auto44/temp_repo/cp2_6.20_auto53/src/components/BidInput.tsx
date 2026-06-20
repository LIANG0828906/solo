import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuctionStore } from '@/stores/auctionStore';

interface BidInputProps {
  itemId: string;
  currentPrice: number;
}

type BidStatus = 'idle' | 'error' | 'success';

export default function BidInput({ itemId, currentPrice }: BidInputProps) {
  const placeBid = useAuctionStore((s) => s.placeBid);
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<BidStatus>('idle');
  const [message, setMessage] = useState<string>('');

  const minBid = currentPrice + 1;

  const handleAmountChange = (v: string) => {
    if (v === '' || /^\d+$/.test(v)) {
      setAmount(v);
      if (status !== 'idle') {
        setStatus('idle');
        setMessage('');
      }
    }
  };

  const handleSubmit = () => {
    const num = Number(amount);
    if (!amount || isNaN(num)) {
      setStatus('error');
      setMessage('请输入有效的出价金额');
      return;
    }
    if (num <= currentPrice) {
      setStatus('error');
      setMessage(
        `出价必须高于当前价 ¥${currentPrice.toLocaleString('zh-CN')}`,
      );
      return;
    }

    const result = placeBid(itemId, num);
    if (result.ok) {
      setStatus('success');
      setMessage('出价成功！您当前处于领先位置');
      setAmount('');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    } else {
      setStatus('error');
      setMessage(result.message ?? '出价失败，请重试');
    }
  };

  const handleQuickMin = () => {
    setAmount(String(minBid));
    if (status !== 'idle') {
      setStatus('idle');
      setMessage('');
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none"
            style={{ color: '#888' }}
          >
            ¥
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder={`最低 ${minBid.toLocaleString('zh-CN')}`}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            className="gold-input pl-8 pr-20 py-3"
            style={{
              borderColor:
                status === 'error'
                  ? 'rgba(239, 68, 68, 0.5)'
                  : status === 'success'
                  ? 'rgba(34, 197, 94, 0.5)'
                  : undefined,
            }}
          />
          <button
            type="button"
            onClick={handleQuickMin}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
            style={{
              background: 'rgba(201, 168, 76, 0.12)',
              color: '#d4b65c',
              border: '1px solid rgba(201, 168, 76, 0.3)',
            }}
          >
            最低价
          </button>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap"
          style={{
            background:
              'linear-gradient(135deg, #e8d48a 0%, #c9a84c 50%, #a58b34 100%)',
            color: '#1a2332',
            boxShadow: '0 6px 20px rgba(201, 168, 76, 0.3)',
          }}
        >
          <Gavel size={16} />
          出价竞拍
        </motion.button>
      </div>

      <AnimatePresence>
        {status !== 'idle' && message && (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mt-3 flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl"
              style={{
                background:
                  status === 'success'
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                border:
                  status === 'success'
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)',
                color: status === 'success' ? '#4ade80' : '#f87171',
              }}
            >
              {status === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
