import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { Ingredient, Category } from '@/types';
import { getDaysRemaining, isExpiringSoon, getExpiryTip } from '@/engine/expiryTracker';

interface ExpiryBannerProps {
  ingredients: Ingredient[];
}

export default function ExpiryBanner({ ingredients }: ExpiryBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const expiringIngredients = ingredients.filter((ingredient) =>
    isExpiringSoon(getDaysRemaining(ingredient.expiryDate))
  );

  if (expiringIngredients.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden shadow-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-expiry-warn/90 to-expiry-danger/90 text-white"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">
            ⚠️ {expiringIngredients.length}种食材即将过期
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {expanded && (
        <div className="animate-fade-in bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
          {expiringIngredients.map((ingredient) => {
            const days = getDaysRemaining(ingredient.expiryDate);
            return (
              <div key={ingredient.id} className="px-4 py-3 flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-expiry-warn mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ingredient.name}
                    <span className="ml-2 text-xs text-expiry-danger font-semibold">
                      {days < 0 ? '已过期' : `剩余${days}天`}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {getExpiryTip(ingredient.name, ingredient.category as Category)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
