import React, { useRef, useState, useEffect, useCallback } from 'react';
import useVaultStore from '@/store/VaultStore';
import type { Category } from '@/modules/storage/DataStore';

type CategoryFilter = 'all' | Category;

const CATEGORIES: { label: string; value: CategoryFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '社交', value: 'social' },
  { label: '金融', value: 'finance' },
  { label: '工作', value: 'work' },
  { label: '其他', value: 'other' },
];

const CategoryTabs: React.FC = () => {
  const category = useVaultStore((s) => s.category);
  const setCategory = useVaultStore((s) => s.setCategory);
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const measureTab = useCallback(
    (el: HTMLButtonElement | null, value: CategoryFilter) => {
      if (el && value === category) {
        setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
      }
    },
    [category]
  );

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const activeBtn = list.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (activeBtn) {
      setIndicator({ left: activeBtn.offsetLeft, width: activeBtn.offsetWidth });
    }

    const observer = new ResizeObserver(() => {
      const btn = list.querySelector<HTMLButtonElement>('[data-active="true"]');
      if (btn) {
        setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
      }
    });

    observer.observe(list);
    return () => observer.disconnect();
  }, [category]);

  return (
    <div className="sticky top-[56px] z-20 bg-[#0f172a]/95 backdrop-blur-md px-[2%] py-2">
      <div ref={listRef} className="flex gap-2 overflow-x-auto scrollbar-hide relative">
        {CATEGORIES.map(({ label, value }) => {
          const isActive = category === value;
          return (
            <button
              key={value}
              ref={(el) => measureTab(el, value)}
              data-active={isActive}
              onClick={() => setCategory(value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'text-white bg-gradient-to-r from-[#38bdf8] to-[#818cf8]'
                  : 'text-gray-400 hover:text-white bg-[rgba(255,255,255,0.05)]'
              }`}
            >
              {label}
            </button>
          );
        })}
        <span
          className="absolute bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#818cf8] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>
    </div>
  );
};

export default CategoryTabs;
