import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Music,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  CreditCard,
} from "lucide-react";
import { useEventStore } from "@/stores/eventStore";
import { useCartStore } from "@/stores/cartStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import TimelineCanvas from "@/components/TimelineCanvas";
import Confetti from "@/components/Confetti";

const TIER_LABELS: Record<string, string> = {
  early: "早鸟",
  standard: "普通",
  vip: "VIP",
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentEvent, loading, fetchEventById } = useEventStore();
  const { addItem, items, getTotal, clearCart } = useCartStore();
  const { lastMessage } = useWebSocket();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (id) fetchEventById(id);
  }, [id, fetchEventById]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === "ticket_update" && data.eventId === id) {
          fetchEventById(id!);
        }
      } catch { /* ignore */ }
    }
  }, [lastMessage, id, fetchEventById]);

  if (loading || !currentEvent) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const event = currentEvent;
  const cartItems = items.filter((i) => i.eventId === event.id);

  const handleAddToCart = () => {
    if (!selectedTier) return;
    const tier = event.tiers.find((t) => t.name === selectedTier);
    if (!tier) return;
    addItem({
      eventId: event.id,
      eventName: event.name,
      tier: selectedTier,
      price: tier.price,
      quantity,
      posterUrl: event.posterUrl,
    });
  };

  const handleCheckout = async () => {
    setShowConfetti(true);
    setTimeout(() => {
      clearCart();
      navigate("/tickets");
    }, 3000);
  };

  return (
    <div className="animate-fade-in">
      <Confetti show={showConfetti} onDone={() => setShowConfetti(false)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="rounded-2xl overflow-hidden glass">
            <img
              src={event.posterUrl}
              alt={event.name}
              className="w-full aspect-[3/4] object-cover"
            />
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-5 h-5 text-brand-purple" />
              <span>{new Date(event.date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-5 h-5 text-brand-orange" />
              <span>{event.venue}</span>
            </div>
            {event.artistBio && (
              <p className="text-gray-400 leading-relaxed">{event.artistBio}</p>
            )}
          </div>

          {event.tracks.length > 0 && (
            <div className="glass rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Music className="w-5 h-5 text-brand-purple" />
                演出曲目
              </h2>
              <TimelineCanvas tracks={event.tracks} />
              <ul className="grid grid-cols-2 gap-2">
                {event.tracks.map((track, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-xs text-white font-bold shrink-0">
                      {i + 1}
                    </span>
                    {track}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">选择票档</h2>
            <div className="grid grid-cols-3 gap-3">
              {event.tiers.map((tier) => {
                const isSelected = selectedTier === tier.name;
                return (
                  <button
                    key={tier.name}
                    onClick={() => {
                      setSelectedTier(tier.name);
                      setQuantity(1);
                    }}
                    className={`relative p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "border-brand-purple bg-brand-purple/20 scale-105"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <p className="font-semibold text-sm">
                      {TIER_LABELS[tier.name] || tier.name}
                    </p>
                    <p className="text-lg font-bold gradient-text mt-1">
                      ¥{tier.price}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      剩余 {tier.remaining} 张
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedTier && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">数量</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!selectedTier}
              className="w-full py-3 rounded-xl gradient-bg text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              <ShoppingCart className="w-5 h-5" />
              加入购物车
            </button>
          </div>

          {cartItems.length > 0 && (
            <div className="glass rounded-2xl p-6 space-y-4 animate-slide-up">
              <h2 className="text-xl font-semibold">购物车</h2>
              {cartItems.map((item) => (
                <div
                  key={`${item.eventId}-${item.tier}`}
                  className="flex items-center justify-between py-2 border-b border-white/5"
                >
                  <div>
                    <p className="font-medium">{TIER_LABELS[item.tier] || item.tier}</p>
                    <p className="text-sm text-gray-400">× {item.quantity}</p>
                  </div>
                  <p className="font-semibold">¥{item.price * item.quantity}</p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-400">合计</span>
                <span className="text-xl font-bold gradient-text">¥{getTotal()}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-3 rounded-xl gradient-bg text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <CreditCard className="w-5 h-5" />
                结算支付
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
