import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  badge?: string | number;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  icon,
  badge,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
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
    <div className="space-y-3">
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

export default Accordion;
