import { useEffect } from 'react';
import { X, Clock, Star } from 'lucide-react';
import type { Recipe } from '@/types';
import MiniStarRating from './MiniStarRating';

interface QuickPreviewModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onRate?: (recipeId: string, rating: number) => void;
  onOpenDetail?: (recipeId: string) => void;
}

export default function QuickPreviewModal({ recipe, isOpen, onClose, onRate, onOpenDetail }: QuickPreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const handleLock = () => {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    handleLock();
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!recipe) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
      style={{ backdropFilter: isOpen ? 'blur(12px)' : 'blur(0px)', backgroundColor: isOpen ? 'rgba(93, 64, 55, 0.45)' : 'transparent' }}
    >
      <div
        className={`bg-warm-card rounded-3xl shadow-2xl border border-warm-border overflow-hidden w-full max-w-lg transition-all duration-300 ease-out ${
          isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-4 opacity-0'
        }`}
      >
        <div className="relative h-52 overflow-hidden">
          <img src={recipe.thumbnail} alt={recipe.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all duration-200 active:scale-95 backdrop-blur-sm"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-serif text-2xl text-white mb-1">{recipe.title}</h3>
            <div className="flex items-center gap-3 text-white/90 text-sm">
              <span className="flex items-center gap-1">
                <Clock size={14} /> {recipe.prepTime + recipe.cookTime}分钟
              </span>
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-warm-gold text-warm-gold" />
                {recipe.avgRating.toFixed(1)} ({recipe.ratingCount})
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-warm-brown-light text-sm line-clamp-2">{recipe.description}</p>

          <div>
            <h4 className="font-serif text-warm-brown text-base mb-2">主要原料</h4>
            <div className="grid grid-cols-3 gap-2">
              {recipe.ingredients.slice(0, 3).map((ing) => (
                <div key={ing.id} className="bg-cream rounded-xl px-3 py-2 text-center">
                  <div className="text-warm-brown text-sm font-medium">{ing.name}</div>
                  <div className="text-warm-brown-light text-xs">{ing.amount}{ing.unit}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-serif text-warm-brown text-base mb-2">制作步骤</h4>
            <div className="space-y-2">
              {recipe.steps.slice(0, 2).map((step, idx) => (
                <div key={step.id} className="flex gap-3 items-start">
                  <div className="step-circle shrink-0">{idx + 1}</div>
                  <div className="flex-1 pt-1.5">
                    <div className="text-warm-brown text-sm font-medium">{step.title}</div>
                    <div className="text-warm-brown-light text-xs line-clamp-1">{step.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-warm-border">
            <div className="flex items-center gap-2">
              <MiniStarRating
                rating={recipe.avgRating}
                size={18}
                onRate={(rating) => onRate?.(recipe.id, rating)}
              />
              <span className="text-xs text-warm-gray">{recipe.avgRating.toFixed(1)}</span>
            </div>
            <button
              onClick={() => onOpenDetail?.(recipe.id)}
              className="btn-ripple active:scale-95 transition-transform duration-150 px-5 py-2 rounded-xl bg-gradient-to-r from-warm-orange to-warm-orange-deep text-white text-sm font-medium shadow-md hover:shadow-lg"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
