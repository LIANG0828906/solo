import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEMPLATES, TemplateId, TemplateStyle } from '@/types';

interface TemplateSelectorProps {
  selected: TemplateId;
  onSelect: (id: TemplateId) => void;
}

function getTemplatePreviewGradient(template: TemplateStyle): string {
  const { headerBg, background, accent } = template.colors;
  return `linear-gradient(135deg, ${headerBg} 0%, ${background} 50%, ${accent} 100%)`;
}

export default function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {TEMPLATES.map((template) => {
        const isSelected = selected === template.id;
        const isSerious = template.id === 'serious';
        const isEntertainment = template.id === 'entertainment';
        const isVintage = template.id === 'vintage';

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={cn(
              'group relative flex flex-col items-center gap-3 p-4 rounded-xl',
              'bg-white/70 border-2 transition-all duration-300',
              'hover:-translate-y-1 active:scale-[0.97]',
              isSelected
                ? 'border-vintage-red shadow-gold-glow bg-cream/90'
                : 'border-vintage-red/20 hover:border-vintage-red/50 hover:shadow-paper-shadow-lg'
            )}
          >
            {isSerious && (
              <div
                className={cn(
                  'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden'
                )}
              >
                <div
                  className="absolute inset-0 animate-shimmer"
                  style={{
                    borderRadius: 'inherit',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    border: '2px solid transparent',
                    borderImage:
                      'linear-gradient(90deg, #FFD700, #FFA500, #FFD700, #B8860B, #FFD700) 1',
                    animation: 'shimmer 2s linear infinite',
                    backgroundSize: '200% 100%',
                  }}
                />
              </div>
            )}

            {isEntertainment && (
              <>
                <span
                  className="absolute bottom-2 left-3 w-3 h-3 rounded-full bg-pink-400/80 opacity-0 group-hover:opacity-100 group-hover:animate-bubbleFloat transition-opacity duration-300 pointer-events-none"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-400/70 opacity-0 group-hover:opacity-100 group-hover:animate-bubbleFloat transition-opacity duration-300 pointer-events-none"
                  style={{ animationDelay: '300ms' }}
                />
                <span
                  className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-fuchsia-400/80 opacity-0 group-hover:opacity-100 group-hover:animate-bubbleFloat transition-opacity duration-300 pointer-events-none"
                  style={{ animationDelay: '600ms' }}
                />
                <span
                  className="absolute bottom-0 left-6 w-2 h-2 rounded-full bg-yellow-400/70 opacity-0 group-hover:opacity-100 group-hover:animate-bubbleFloat transition-opacity duration-300 pointer-events-none"
                  style={{ animationDelay: '200ms' }}
                />
                <span
                  className="absolute bottom-4 right-6 w-3.5 h-3.5 rounded-full bg-violet-400/70 opacity-0 group-hover:opacity-100 group-hover:animate-bubbleFloat transition-opacity duration-300 pointer-events-none"
                  style={{ animationDelay: '500ms' }}
                />
              </>
            )}

            {isVintage && (
              <div
                className={cn(
                  'absolute top-0 right-0 w-0 h-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10'
                )}
              >
                <div
                  className="absolute top-0 right-0 animate-pageCurl"
                  style={{
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 24px 24px 0',
                    borderColor: `transparent ${template.colors.accent} transparent transparent`,
                    filter: 'drop-shadow(-2px 2px 4px rgba(0,0,0,0.25))',
                  }}
                />
                <div
                  className="absolute top-0 right-0"
                  style={{
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 24px 24px 0',
                    borderColor: 'transparent rgba(139,69,19,0.15) transparent transparent',
                  }}
                />
              </div>
            )}

            <div
              className={cn(
                'relative w-full h-16 rounded-lg overflow-hidden border border-vintage-red/20 shadow-inner',
                'transition-shadow duration-300',
                isSelected && 'ring-2 ring-gold/60'
              )}
              style={{
                background: getTemplatePreviewGradient(template),
              }}
            >
              <div
                className="absolute top-2 left-2 right-2 h-1.5 rounded-full opacity-80"
                style={{ backgroundColor: template.colors.headerText }}
              />
              <div
                className="absolute top-5 left-2 right-4 h-1 rounded-full opacity-60"
                style={{ backgroundColor: template.colors.body }}
              />
              <div
                className="absolute top-7 left-2 right-3 h-1 rounded-full opacity-60"
                style={{ backgroundColor: template.colors.body }}
              />
              <div
                className="absolute top-9 left-2 right-6 h-1 rounded-full opacity-50"
                style={{ backgroundColor: template.colors.body }}
              />
            </div>

            <span
              className={cn(
                'font-sans text-sm font-medium transition-colors duration-300',
                isSelected ? 'text-vintage-red' : 'text-ink/80 group-hover:text-ink'
              )}
            >
              {template.name}
            </span>

            {isSelected && (
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold text-ink flex items-center justify-center shadow-gold-glow animate-pulseGold">
                <Check className="w-4 h-4" strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
