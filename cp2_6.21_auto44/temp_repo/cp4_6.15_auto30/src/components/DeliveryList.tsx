import { useMemo } from 'react';
import { Printer, Copy, Check, User, Phone, Package } from 'lucide-react';
import { useState } from 'react';
import type { Member } from '../types';
import { splitFreight, buildFreightInput } from '../utils/freightSplit';

interface Props {
  title: string;
  members: Member[];
  freight: number;
}

function buildDeliveryText(title: string, members: Member[], freight: number): string {
  const split = splitFreight(buildFreightInput(members), freight);
  const lines: string[] = [`【${title}】配送清单`, '─'.repeat(32)];
  members.forEach((m) => {
    const s = split.find((x) => x.memberId === m.id);
    const total = s ? m.subtotal + s.freightShare : m.subtotal;
    lines.push(`\n📦 ${m.nickname}  ${m.phone}`);
    m.orderItems.forEach((oi) => {
      lines.push(`   · ${oi.productName} - ${oi.specLabel}  x${oi.quantity}  ￥${(oi.unitPrice * oi.quantity).toFixed(2)}`);
    });
    lines.push(`   商品：￥${m.subtotal.toFixed(2)}  运费：￥${s ? s.freightShare.toFixed(2) : '0.00'}  合计：￥${total.toFixed(2)}`);
  });
  lines.push('\n' + '─'.repeat(32));
  const totalPurchase = members.reduce((s, m) => s + m.subtotal, 0);
  lines.push(`总商品额：￥${totalPurchase.toFixed(2)}  总运费：￥${freight.toFixed(2)}  总计：￥${(totalPurchase + freight).toFixed(2)}`);
  return lines.join('\n');
}

export default function DeliveryList({ title, members, freight }: Props) {
  const split = useMemo(() => splitFreight(buildFreightInput(members), freight), [members, freight]);
  const [copied, setCopied] = useState(false);
  const [printCardId, setPrintCardId] = useState<string | null>(null);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(buildDeliveryText(title, members, freight));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const printAll = () => window.print();

  const printOne = (memberId: string) => {
    setPrintCardId(memberId);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintCardId(null), 300);
    }, 50);
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-10 text-cream-500">
        暂无参团成员，配送清单将在有人参团后显示
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <h3 className="font-display text-xl text-cream-800">配送清单</h3>
        <div className="flex gap-2">
          <button
            onClick={copyAll}
            className="btn-scale px-4 py-2 rounded-xl bg-cream-200 hover:bg-cream-300 text-cream-800 text-sm flex items-center gap-1.5"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制为文本'}
          </button>
          <button
            onClick={printAll}
            className="btn-scale px-4 py-2 rounded-xl bg-gradient-to-r from-cream-500 to-cream-700 text-cream-50 text-sm flex items-center gap-1.5 shadow"
          >
            <Printer size={16} /> 打印全部
          </button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {members.map((m) => {
          const s = split.find((x) => x.memberId === m.id);
          const total = s ? m.subtotal + s.freightShare : m.subtotal;
          const hidden = printCardId !== null && printCardId !== m.id;
          return (
            <div
              key={m.id}
              className={`delivery-card bg-cream-100 rounded-xl p-5 border border-cream-200 ${hidden ? 'hidden' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cream-400 to-cream-600 flex items-center justify-center text-cream-50 text-sm font-display">
                    {m.nickname.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-display text-lg text-cream-800 leading-tight">{m.nickname}</div>
                    <div className="text-xs text-cream-500 flex items-center gap-1 mt-0.5">
                      <Phone size={11} /> {m.phone}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => printOne(m.id)}
                  className="no-print btn-scale p-1.5 rounded-lg hover:bg-cream-200 text-cream-600"
                  title="单独打印此卡片"
                >
                  <Printer size={16} />
                </button>
              </div>
              <ul className="text-sm space-y-1.5 border-t border-cream-200 pt-3 mb-3">
                {m.orderItems.map((oi) => (
                  <li key={oi.specId + oi.quantity} className="flex justify-between text-cream-700">
                    <span className="flex items-center gap-1.5">
                      <Package size={12} className="text-cream-500" />
                      {oi.productName} · {oi.specLabel}
                      <span className="text-cream-500">× {oi.quantity}</span>
                    </span>
                    <span className="font-medium">￥{(oi.unitPrice * oi.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 pt-3 border-t border-cream-200 text-sm">
                <div className="flex justify-between text-cream-600">
                  <span>商品小计</span>
                  <span>￥{m.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cream-600">
                  <span>运费 ({s ? (s.ratio * 100).toFixed(1) : 0}%)</span>
                  <span>￥{s ? s.freightShare.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between pt-1 text-cream-800 font-display text-lg">
                  <span>应付合计</span>
                  <span>￥{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="no-print">
        <User size={0} className="hidden" />
      </div>
    </div>
  );
}
