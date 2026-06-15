import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Package, UserPlus, TrendingDown, Timer, AlertTriangle } from 'lucide-react';
import { useGroupStore } from '../store/useGroupStore';
import MemberForm from './MemberForm';
import DeliveryList from './DeliveryList';
import {
  splitFreight,
  buildFreightInput,
  formatCountdown,
  isGroupExpired,
} from '../utils/freightSplit';

function getRainbowGradient(index: number, total: number): string {
  const hue = (index / Math.max(total, 1)) * 300;
  const startHue = hue;
  const endHue = (hue + 30) % 360;
  return `linear-gradient(135deg, hsl(${startHue}, 70%, 92%) 0%, hsl(${endHue}, 70%, 80%) 100%)`;
}

interface Props {
  groupId: string;
}

export default function GroupDetail({ groupId }: Props) {
  const navigate = useNavigate();
  const getGroup = useGroupStore((s) => s.getGroup);
  const groups = useGroupStore((s) => s.groups);
  const group = getGroup(groupId) || groups.find((g) => g.id === groupId);

  const [showForm, setShowForm] = useState(false);
  const [newMemberId, setNewMemberId] = useState<string | null>(null);
  const [cd, setCd] = useState(formatCountdown(group?.deadline || ''));
  const [expired, setExpired] = useState(!!group && isGroupExpired(group.deadline));

  useEffect(() => {
    if (!group) return;
    const tick = () => {
      setCd(formatCountdown(group.deadline));
      setExpired(isGroupExpired(group.deadline));
    };
    tick();
    const id1 = window.setInterval(tick, cd.urgent ? 500 : 15_000);
    return () => window.clearInterval(id1);
  }, [group, cd.urgent, groupId]);

  const freightResult = useMemo(() => {
    if (!group || !expired) return null;
    return splitFreight(buildFreightInput(group.members), group.freight);
  }, [group, expired]);

  if (!group) {
    return (
      <div className="page-fade text-center py-20 text-cream-600">
        <p className="font-display text-xl">团购不存在</p>
        <button
          onClick={() => navigate('/')}
          className="btn-scale mt-4 px-5 py-2 rounded-xl bg-cream-200 hover:bg-cream-300 text-cream-800 inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> 返回列表
        </button>
      </div>
    );
  }

  const totalPurchase = group.members.reduce((s, m) => s + m.subtotal, 0);
  const full = group.members.length >= group.maxMembers;

  const handleSubmitted = (memberId?: string) => {
    if (memberId) {
      setNewMemberId(memberId);
      setTimeout(() => setNewMemberId(null), 600);
    }
  };

  return (
    <div className="page-fade space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => navigate('/')}
          className="btn-scale px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-cream-700 inline-flex items-center gap-2 no-print"
        >
          <ArrowLeft size={16} /> 返回团购列表
        </button>
        <div className="flex items-center gap-2">
          <span className="text-cream-600 text-sm flex items-center gap-1.5">
            <Timer size={14} />
            <span className={cd.urgent || cd.expired ? 'urgent-blink' : ''}>{cd.text}</span>
          </span>
          {expired && (
            <span className="px-2.5 py-1 rounded-full bg-cream-700 text-cream-50 text-xs">
              已截止
            </span>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl p-6 text-cream-800 shadow-sm"
        style={{ background: group.coverGradient }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="text-white drop-shadow-sm">
            <h1 className="font-display text-3xl sm:text-4xl leading-tight">{group.title}</h1>
            <p className="mt-2 text-white/90 text-sm">
              团长：@{group.creator} · 运费总支出 ￥{group.freight.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/85 backdrop-blur rounded-xl px-4 py-3 min-w-[180px]">
            <div className="flex items-center gap-1.5 text-cream-700 text-sm mb-1">
              <Users size={14} /> 参团进度
            </div>
            <div className="progress-bar-track mb-1.5">
              <div
                className="progress-bar-fill"
                style={{ width: Math.min(100, (group.members.length / group.maxMembers) * 100) + '%' }}
              />
            </div>
            <div className="text-right text-cream-800 font-display text-lg">
              {group.members.length} / {group.maxMembers}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 bg-cream-100 rounded-2xl p-5 border border-cream-200">
          <h2 className="font-display text-xl text-cream-800 flex items-center gap-2 mb-4">
            <Package size={18} /> 本次拼团商品
          </h2>
          <div className="space-y-3">
            {group.products.map((p) => (
              <div
                key={p.id}
                className="bg-cream-50 rounded-xl p-4 border border-cream-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-cream-800">{p.name}</div>
                  <div className="text-sm text-cream-500 mt-0.5">单价 ￥{p.unitPrice.toFixed(2)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.specifications.map((s) => (
                    <span
                      key={s.id}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        s.stock > 0
                          ? 'border-cream-300 bg-cream-100 text-cream-700'
                          : 'border-red-200 bg-red-50 text-red-500 line-through'
                      }`}
                    >
                      {s.label} · 剩 {s.stock}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="bg-cream-100 rounded-2xl p-5 border border-cream-200 h-fit">
          <h2 className="font-display text-xl text-cream-800 mb-3 flex items-center gap-2">
            <TrendingDown size={18} /> 实时数据
          </h2>
          <div className="space-y-2 text-cream-700 text-sm">
            <div className="flex justify-between py-1.5 border-b border-cream-200">
              <span className="text-cream-500">参团人数</span>
              <span className="font-medium">
                {group.members.length} / {group.maxMembers}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-cream-200">
              <span className="text-cream-500">商品总额</span>
              <span className="font-medium">￥{totalPurchase.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-cream-200">
              <span className="text-cream-500">总运费</span>
              <span className="font-medium">￥{group.freight.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-cream-500">总计</span>
              <span className="font-display text-lg text-cream-800">
                ￥{(totalPurchase + group.freight).toFixed(2)}
              </span>
            </div>
          </div>
          {!expired && (
            <button
              onClick={() => setShowForm(true)}
              disabled={full}
              className="btn-scale w-full mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cream-500 to-cream-700 text-cream-50 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              {full ? '本团已满' : '我要参团'}
            </button>
          )}
          {expired && (
            <div className="mt-5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>团购已截止，系统已根据购买金额比例完成运费分摊。</span>
            </div>
          )}
        </aside>
      </div>

      <section className="bg-cream-100 rounded-2xl p-5 border border-cream-200">
        <h2 className="font-display text-xl text-cream-800 mb-4 flex items-center gap-2">
          <Users size={18} /> 参团成员（{group.members.length}）
        </h2>
        {group.members.length === 0 ? (
          <div className="text-center py-12 text-cream-500">
            还没有人参团，来做第一个吧～
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.members.map((m, idx) => (
              <div
                key={m.id}
                className={`member-card rounded-xl p-4 border border-cream-200 ${
                  newMemberId === m.id ? 'slide-in-top' : ''
                }`}
                style={{
                  background: getRainbowGradient(idx, group.members.length),
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-cream-800 font-display text-sm">
                    {m.nickname.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-cream-900 truncate">{m.nickname}</div>
                    <div className="text-xs text-cream-700/80">{m.phone}</div>
                  </div>
                </div>
                <ul className="text-xs text-cream-800 space-y-0.5 mb-2">
                  {m.orderItems.map((oi) => (
                    <li key={oi.specId + oi.quantity} className="flex justify-between">
                      <span className="truncate pr-2">
                        {oi.specLabel} × {oi.quantity}
                      </span>
                      <span className="flex-shrink-0">
                        ￥{(oi.unitPrice * oi.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-cream-200/50 flex justify-between text-sm">
                  <span className="text-cream-700">小计</span>
                  <span className="font-medium text-cream-900">￥{m.subtotal.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {expired && freightResult && freightResult.length > 0 && (
        <section className="bg-cream-100 rounded-2xl p-5 border border-cream-200">
          <h2 className="font-display text-xl text-cream-800 mb-4 flex items-center gap-2">
            <TrendingDown size={18} /> 运费分摊明细
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cream-600 bg-cream-200/60">
                  <th className="text-left px-4 py-2.5 rounded-l-lg">成员昵称</th>
                  <th className="text-right px-4 py-2.5">购买总价</th>
                  <th className="text-right px-4 py-2.5">分摊比例</th>
                  <th className="text-right px-4 py-2.5 rounded-r-lg">应付运费</th>
                </tr>
              </thead>
              <tbody>
                {freightResult.map((r, i) => (
                  <tr
                    key={r.memberId}
                    className={`border-b border-cream-200 last:border-0 ${
                      i % 2 ? 'bg-cream-50/60' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-cream-800 font-medium">{r.nickname}</td>
                    <td className="px-4 py-2.5 text-right">￥{r.totalPurchase.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right">{(r.ratio * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right font-medium text-cream-800">
                      ￥{r.freightShare.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-cream-300/50 font-medium">
                  <td className="px-4 py-2.5 rounded-bl-lg">合计</td>
                  <td className="px-4 py-2.5 text-right">
                    ￥{freightResult.reduce((s, r) => s + r.totalPurchase, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right">100.0%</td>
                  <td className="px-4 py-2.5 text-right rounded-br-lg">
                    ￥{freightResult.reduce((s, r) => s + r.freightShare, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="bg-cream-100 rounded-2xl p-5 border border-cream-200">
        <DeliveryList title={group.title} members={group.members} freight={group.freight} />
      </section>

      {showForm && (
        <MemberForm
          group={group}
          onClose={() => setShowForm(false)}
          onSubmitted={() => {
            const updated = useGroupStore.getState().getGroup(group.id);
            if (updated?.members?.[0]) {
              handleSubmitted(updated.members[0].id);
            }
          }}
        />
      )}
    </div>
  );
}
