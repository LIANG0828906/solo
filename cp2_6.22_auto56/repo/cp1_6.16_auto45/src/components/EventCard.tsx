import { Link } from "react-router-dom";
import { Calendar, Ticket } from "lucide-react";
import type { EventItem } from "@/stores/eventStore";

interface EventCardProps {
  event: EventItem;
}

export default function EventCard({ event }: EventCardProps) {
  const prices = event.tiers.map((t) => t.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const totalRemaining = event.tiers.reduce((s, t) => s + t.remaining, 0);

  return (
    <Link
      to={`/event/${event.id}`}
      className="group block rounded-2xl glass overflow-hidden transition-all duration-300 hover:scale-[1.05] hover:-translate-y-2"
      style={{
        boxShadow: "0 0 0 rgba(0,0,0,0)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 20px 40px -8px rgba(107,33,168,0.4), 0 8px 16px -4px rgba(249,115,22,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={event.posterUrl}
          alt={event.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-bold text-white truncate">
            {event.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.date).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="gradient-text font-bold text-lg">
            ¥{minPrice} 起
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <Ticket className="w-4 h-4" />
            {totalRemaining} 张剩余
          </span>
        </div>

        <button className="w-full py-2 rounded-lg gradient-bg text-white font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          立即购票
        </button>
      </div>
    </Link>
  );
}
