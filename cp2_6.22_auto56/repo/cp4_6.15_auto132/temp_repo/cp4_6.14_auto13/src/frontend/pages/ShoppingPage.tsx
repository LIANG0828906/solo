import { useState, useMemo, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { Check, Trash2, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store';
import { generateShoppingList, type ShoppingItem } from '../utils/mealPlanner';

const ripple = keyframes`
  0% { transform: scale(0); opacity: 0.6; }
  100% { transform: scale(4); opacity: 0; }
`;

const Wrap = styled.div``;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 8px;
`;

const SubTitle = styled.p`
  color: #8b6a45;
  margin-bottom: 24px;
  font-size: 14px;
`;

const SummaryBar = styled.div`
  background: #ffffff;
  padding: 14px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
  color: #5c3a1e;
  transition: all 200ms ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
`;

const CategoryGroup = styled.div`
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 200ms ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CategoryHeader = styled.div<{ $open: boolean }>`
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: #fffaf0;
  transition: background 150ms;
  &:hover {
    background: #fff3dc;
  }
  h3 {
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .arrow {
    transition: transform 300ms ease;
    transform: ${(p) => (p.$open ? 'rotate(90deg)' : 'rotate(0deg)')};
  }
`;

const ItemsList = styled.div<{ $open: boolean }>`
  max-height: ${(p) => (p.$open ? '2000px' : '0')};
  overflow: hidden;
  transition: max-height 400ms ease;
`;

const ItemRow = styled.div<{ $checked: boolean }>`
  position: relative;
  overflow: hidden;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-top: 1px solid #f3e9d2;
  cursor: pointer;
  text-decoration: ${(p) => (p.$checked ? 'line-through' : 'none')};
  opacity: ${(p) => (p.$checked ? 0.55 : 1)};
  transition: all 200ms ease;
  &:hover {
    background: #fffdf5;
  }
`;

const Ripple = styled.span`
  position: absolute;
  border-radius: 50%;
  background: rgba(244, 164, 96, 0.45);
  pointer-events: none;
  animation: ${ripple} 600ms ease-out forwards;
  width: 30px;
  height: 30px;
`;

const CheckBox = styled.div<{ $checked: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  border: 2px solid ${(p) => (p.$checked ? '#f4a460' : '#e0d5c5')};
  background: ${(p) => (p.$checked ? '#f4a460' : '#ffffff')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff8e7;
  transition: all 200ms ease;
`;

const ItemName = styled.div`
  flex: 1;
  font-weight: 500;
  color: #3a2e1f;
  font-size: 15px;
`;

const ItemAmount = styled.div`
  color: #8b6a45;
  font-size: 14px;
  background: #fff3dc;
  padding: 4px 10px;
  border-radius: 8px;
`;

const DelBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e57373;
  background: transparent;
  transition: all 150ms ease;
  &:hover {
    background: #ffe2e2;
  }
`;

const EmptyState = styled.div`
  background: #ffffff;
  border-radius: 14px;
  padding: 60px 24px;
  text-align: center;
  color: #8b6a45;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  h3 {
    margin: 14px 0 6px;
  }
`;

const CategoryIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #fff3dc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f4a460;
`;

const Badge = styled.span`
  background: #f4a460;
  color: #fff8e7;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
`;

export default function ShoppingPage() {
  const { mealPlan } = useAppStore();
  const shopping = useMemo(() => generateShoppingList(mealPlan), [mealPlan]);
  const categories = Object.keys(shopping);

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(categories));
  const [ripples, setRipples] = useState<{ id: string; rowKey: string; x: number; y: number }[]>([]);

  const visibleCategories = categories.filter((cat) =>
    shopping[cat].some((it) => !deleted.has(`${cat}::${it.name}`))
  );

  const remaining = visibleCategories.reduce(
    (n, c) =>
      n + shopping[c].filter((it) => !deleted.has(`${c}::${it.name}`) && !checked.has(`${c}::${it.name}`)).length,
    0
  );
  const total = visibleCategories.reduce(
    (n, c) => n + shopping[c].filter((it) => !deleted.has(`${c}::${it.name}`)).length,
    0
  );

  const toggleCat = (c: string) => {
    setOpenCats((prev) => {
      const n = new Set(prev);
      n.has(c) ? n.delete(c) : n.add(c);
      return n;
    });
  };

  const handleCheck = (e: React.MouseEvent, cat: string, item: ShoppingItem) => {
    const key = `${cat}::${item.name}`;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random()}`;
    setRipples((r) => [
      ...r,
      { id, rowKey: key, x: e.clientX - rect.left - 15, y: e.clientY - rect.top - 15 },
    ]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 600);

    setChecked((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const handleDelete = (cat: string, item: ShoppingItem) => {
    const key = `${cat}::${item.name}`;
    setDeleted((prev) => new Set(prev).add(key));
  };

  if (categories.length === 0 || visibleCategories.length === 0) {
    return (
      <Wrap>
        <Title>采购清单</Title>
        <SubTitle>根据本周菜谱自动生成，按类别分组，同名食材自动合并。</SubTitle>
        <EmptyState>
          <Package size={48} color="#c0a984" />
          <h3>暂无采购清单</h3>
          <p>请先前往「周计划」页面生成本周菜谱。</p>
        </EmptyState>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Title>采购清单</Title>
      <SubTitle>点击项勾选已购买，删除不需要的食材。</SubTitle>

      <SummaryBar>
        <span>
          <Package size={16} style={{ verticalAlign: 'sub', marginRight: 6 }} />
          共 <b>{total}</b> 项待采购
        </span>
        <span>
          已完成 <Badge>{total - remaining}</Badge> · 剩余 {remaining}
        </span>
      </SummaryBar>

      {visibleCategories.map((cat) => {
        const items = shopping[cat].filter((it) => !deleted.has(`${cat}::${it.name}`));
        if (items.length === 0) return null;
        const open = openCats.has(cat);
        const done = items.filter((it) => checked.has(`${cat}::${it.name}`)).length;
        return (
          <CategoryGroup key={cat}>
            <CategoryHeader $open={open} onClick={() => toggleCat(cat)}>
              <h3>
                <CategoryIcon>
                  <Package size={16} />
                </CategoryIcon>
                {cat}
                <span style={{ fontSize: 13, color: '#8b6a45', fontWeight: 400 }}>
                  {done}/{items.length}
                </span>
              </h3>
              <ChevronRight size={18} className="arrow" />
            </CategoryHeader>
            <ItemsList $open={open}>
              {items.map((item) => {
                const key = `${cat}::${item.name}`;
                const isChecked = checked.has(key);
                return (
                  <ItemRow
                    key={item.name}
                    $checked={isChecked}
                    onClick={(e) => handleCheck(e, cat, item)}
                  >
                    {ripples
                      .filter((r) => r.rowKey === key)
                      .map((r) => (
                        <Ripple key={r.id} style={{ left: r.x, top: r.y }} />
                      ))}
                    <CheckBox $checked={isChecked}>
                      {isChecked && <Check size={14} />}
                    </CheckBox>
                    <ItemName>{item.name}</ItemName>
                    <ItemAmount>{item.amount}</ItemAmount>
                    <DelBtn
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cat, item);
                      }}
                    >
                      <Trash2 size={16} />
                    </DelBtn>
                  </ItemRow>
                );
              })}
            </ItemsList>
          </CategoryGroup>
        );
      })}
    </Wrap>
  );
}
