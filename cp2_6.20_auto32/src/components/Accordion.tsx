import { useState, useEffect, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  badge?: string | number;
  forceMobile?: boolean;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  icon,
  badge,
  forceMobile = false,
}: AccordionItemProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const shouldCollapse = forceMobile || isMobile;

  useEffect(() => {
    if (!shouldCollapse) {
      setIsOpen(true);
    }
  }, [shouldCollapse]);

  if (!shouldCollapse) {
    return <div>{children}</div>;
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors min-h-[44px]"
      >
        {icon && <span className="text-gray-500">{icon}</span>}
        <span className="text-sm font-medium text-gray-800 flex-1 text-left">
          {title}
        </span>
        {badge !== undefined && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
            {badge}
          </span>
        )}
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform duration-300',
            isOpen ? 'rotate-180' : ''
          )}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 pb-4 pt-0">{children}</div>
      </div>
    </div>
  );
}

interface AccordionProps {
  items: {
    id: string;
    title: string;
    content: ReactNode;
    icon?: ReactNode;
    badge?: string | number;
    defaultOpen?: boolean;
  }[];
}

export function Accordion({ items }: AccordionProps) {
  return (
    <div className="space-y-3 md:hidden">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          title={item.title}
          icon={item.icon}
          badge={item.badge}
          defaultOpen={item.defaultOpen}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

export { useMediaQuery };
export default Accordion;
