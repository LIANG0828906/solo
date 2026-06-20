import { useState } from 'react';
import { Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface StarRatingProps {
  rating: number;
  count: number;
  distribution: number[];
  onRate: (rating: number) => void;
}

export default function StarRating({ rating, count, distribution, onRate }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const distData = distribution.map((value, index) => ({
    stars: `${index + 1}`,
    count: value,
  }));

  return (
    <div className="bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border">
      <h3 className="font-serif text-lg text-warm-brown mb-4">评分</h3>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl font-serif text-warm-brown">{rating.toFixed(1)}</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onRate(star)}
              className="p-0.5 transition-transform duration-150 hover:scale-110"
            >
              <Star
                size={22}
                className={`transition-colors duration-150 ${
                  star <= (hovered || rating) ? 'fill-warm-gold text-warm-gold' : 'text-warm-border'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-sm text-warm-gray">{count}人评价</span>
      </div>
      {distData.length > 0 && (
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={distData} layout="vertical" margin={{ left: 20, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="stars" tick={{ fill: '#8D6E63', fontSize: 11 }} width={20} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
              {distData.map((_, i) => (
                <Cell key={i} fill={i === Math.round(rating) - 1 ? '#FF8A3D' : '#F0E0D0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
