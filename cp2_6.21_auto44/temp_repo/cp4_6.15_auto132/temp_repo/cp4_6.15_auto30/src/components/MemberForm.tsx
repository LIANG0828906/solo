import { useMemo, useState } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import type { GroupBuy, NewMemberInput } from '../types';
import { useGroupStore } from '../store/useGroupStore';
import { calculateSubtotal } from '../utils/freightSplit';

interface Props {
  group: GroupBuy;
  onClose: () => void;
  onSubmitted: () => void;
}

type CartItem = {
  productId: string;
  productName: string;
  specId: string;
  specLabel: string;
  unitPrice: number;
  quantity: number;
};

export default function MemberForm({ group, onClose, onSubmitted }: Props) {
  const addMember = useGroupStore((s) => s.addMember);
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState(group.products[0]?.id || '');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const currentProduct = useMemo(
    () => group.products.find((p) => p.id === selectedProduct),
    [group.products, selectedProduct],
  );

  const cartSubtotal = useMemo(() => calculateSubtotal(cart), [cart]);

  const addToCart = () => {
    setError('');
    if (!currentProduct) return setError('请选择商品');
    if (!selectedSpec) return setError('请选择规格');
    if (quantity <= 0) return setError('数量需大于0');
    const spec = currentProduct.specifications.find((s) => s.id === selectedSpec);
    if (!spec) return;
    if (spec.stock < quantity) return setError(`库存仅剩 ${spec.stock}`);

    setCart((prev) => {
      const existing = prev.find((c) => c.specId === selectedSpec);
      if (existing) {
        if (spec.stock < existing.quantity + quantity) {
          setError(`库存仅剩 ${spec.stock}，已添加 ${existing.quantity}`);
          return prev;
        }
        return prev.map((c) =>
          c.specId === selectedSpec ? { ...c, quantity: c.quantity + quantity } : c,
        );
      }
      return [
        {
          productId: currentProduct.id,
          productName: currentProduct.name,
          specId: selectedSpec,
          specLabel: spec.label,
          unitPrice: currentProduct.unitPrice,
          quantity,
        },
        ...prev,
      ];
    });
    setQuantity(1);
  };

  const updateCartQty = (specId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.specId !== specId) return c;
          const next = c.quantity + delta;
          if (next <= 0) return null;
          return { ...c, quantity: next };
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const removeCartItem = (specId: string) => {
    setCart((prev) => prev.filter((c) => c.specId !== specId));
  };

  const submit = () => {
    setError('');
    if (group.members.length >= group.maxMembers) {
      return setError(`参团人数已达上限（${group.maxMembers}人）`);
    }
    const payload: NewMemberInput = {
      nickname,
      phone,
      orderItems: cart.map((c) => ({
        productId: c.productId,
        productName: c.productName,
        specId: c.specId,
        specLabel: c.specLabel,
        unitPrice: c.unitPrice,
        quantity: c.quantity,
      })),
    };
    const res = addMember(group.id, payload);
    if (!res.ok) return setError(res.error || '提交失败');
    onSubmitted();
    onClose();
  };

  const full = group.members.length >= group.maxMembers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-900/40 backdrop-blur-sm p-4 no-print">
      <div className="modal-animate bg-cream-50 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-cream-50 border-b border-cream-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-cream-800">我要参团</h2>
          <button onClick={onClose} className="btn-scale p-2 hover:bg-cream-100 rounded-lg text-cream-600">
            <X size={22} />
          </button>
        </div>

        {full ? (
          <div className="p-8 text-center text-cream-600">
            <p className="font-display text-xl">本团已达到 {group.maxMembers} 人上限，下次早点来哦～</p>
          </div>
        ) : (
          <div className="p-6 space-y-5 text-cream-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">昵称 *</label>
                <div className="input-field-wrapper">
                  <input
                    className="input-field w-full"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="方便大家识别你～"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">联系电话 *</label>
                <div className="input-field-wrapper">
                  <input
                    className="input-field w-full"
                    value={phone}
                    maxLength={11}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="11位手机号"
                  />
                </div>
              </div>
            </div>

            <div className="border border-cream-200 rounded-xl p-4 bg-cream-100/60">
              <div className="font-display text-lg mb-3 flex items-center gap-2">
                <ShoppingCart size={18} /> 选购商品
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1">商品</label>
                  <select
                    className="input-field w-full bg-transparent"
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      setSelectedSpec('');
                    }}
                  >
                    {group.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ￥{p.unitPrice}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">规格</label>
                  <select
                    className="input-field w-full bg-transparent"
                    value={selectedSpec}
                    onChange={(e) => setSelectedSpec(e.target.value)}
                  >
                    <option value="">选择规格</option>
                    {currentProduct?.specifications.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} (剩 {s.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="input-field-wrapper flex-1">
                    <input
                      type="number"
                      min="1"
                      className="input-field w-full"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, +e.target.value))}
                    />
                  </div>
                  <button
                    onClick={addToCart}
                    className="btn-scale px-3 py-1.5 rounded-lg bg-cream-500 text-cream-50 text-sm"
                  >
                    添加
                  </button>
                </div>
              </div>

              {cart.length > 0 && (
                <div className="border-t border-cream-200 pt-3 mt-3 space-y-2">
                  {cart.map((c) => (
                    <div key={c.specId} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{c.productName}</span>
                        <span className="text-cream-500 ml-2">- {c.specLabel}</span>
                        <span className="text-cream-600 ml-2">￥{c.unitPrice}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(c.specId, -1)}
                          className="btn-scale w-6 h-6 rounded-full bg-cream-200 text-cream-700 leading-none"
                        >
                          −
                        </button>
                        <span className="w-6 text-center">{c.quantity}</span>
                        <button
                          onClick={() => updateCartQty(c.specId, 1)}
                          className="btn-scale w-6 h-6 rounded-full bg-cream-200 text-cream-700 leading-none"
                        >
                          +
                        </button>
                        <span className="w-16 text-right font-medium">
                          ￥{(c.unitPrice * c.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeCartItem(c.specId)}
                          className="btn-scale p-1 text-cream-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right pt-2 border-t border-cream-200 mt-2 font-medium">
                    商品小计：￥{cartSubtotal.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>
        )}

        {!full && (
          <div className="sticky bottom-0 bg-cream-50 border-t border-cream-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="btn-scale px-5 py-2 rounded-xl border border-cream-300 text-cream-700 hover:bg-cream-100"
            >
              取消
            </button>
            <button
              onClick={submit}
              disabled={!cart.length || !nickname || !phone}
              className="btn-scale px-6 py-2 rounded-xl bg-gradient-to-r from-cream-500 to-cream-700 text-cream-50 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交参团
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
