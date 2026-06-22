import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Dish, Group, Member, MergedDish, CheckoutResult, DiscountRule } from './types';
import OrderPanel from './components/OrderPanel';
import GroupPanel from './components/GroupPanel';
import CheckoutPanel from './components/CheckoutPanel';
import './index.css';

interface AppState {
  dishes: Dish[];
  group: Group | null;
  currentMemberId: string | null;
  merged: MergedDish[];
  checkout: CheckoutResult | null;
  discountRule: DiscountRule;
}

const AppCtx = createContext<{
  state: AppState;
  selectDish: (dishId: string, next: boolean) => void;
  createGroup: (name: string) => Promise<void>;
  joinMember: (name: string) => Promise<void>;
  setCurrentMember: (id: string) => void;
  refreshMerged: () => Promise<void>;
  doCheckout: () => Promise<void>;
} | null>(null);

export const useApp = () => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('AppCtx not found');
  return ctx;
};

function App() {
  const [state, setState] = useState<AppState>({
    dishes: [],
    group: null,
    currentMemberId: null,
    merged: [],
    checkout: null,
    discountRule: { threshold: 200, discount: 20 },
  });

  const fetchDishes = useCallback(async () => {
    const res = await fetch('/api/dishes');
    const data: Dish[] = await res.json();
    setState((s) => ({ ...s, dishes: data }));
  }, []);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const createGroup = useCallback(async (name: string) => {
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorName: name }),
    });
    const data = await res.json();
    setState((s) => ({
      ...s,
      group: data.group,
      currentMemberId: data.currentMember.id,
      merged: [],
      checkout: null,
    }));
  }, []);

  const joinMember = useCallback(async (name: string) => {
    if (!state.group) return;
    const res = await fetch(`/api/groups/${state.group.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '加入失败' }));
      alert(err.error);
      return;
    }
    const member: Member = await res.json();
    setState((s) =>
      s.group
        ? {
            ...s,
            group: { ...s.group, members: [...s.group.members, member] },
            currentMemberId: member.id,
          }
        : s,
    );
  }, [state.group]);

  const setCurrentMember = useCallback((id: string) => {
    setState((s) => ({ ...s, currentMemberId: id, checkout: null }));
  }, []);

  const selectDish = useCallback(
    async (dishId: string, next: boolean) => {
      if (!state.group || !state.currentMemberId) return;
      const member = state.group.members.find((m) => m.id === state.currentMemberId);
      if (!member) return;
      const set = new Set(member.selectedDishIds);
      if (next) set.add(dishId);
      else set.delete(dishId);
      const selectedDishIds = Array.from(set);
      const res = await fetch(`/api/groups/${state.group.id}/members/${state.currentMemberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedDishIds }),
      });
      if (!res.ok) return;
      const updated: Member = await res.json();
      setState((s) => {
        if (!s.group) return s;
        const members = s.group.members.map((m) => (m.id === updated.id ? updated : m));
        return { ...s, group: { ...s.group, members }, checkout: null };
      });
    },
    [state.group, state.currentMemberId],
  );

  const refreshMerged = useCallback(async () => {
    if (!state.group) return;
    const res = await fetch(`/api/groups/${state.group.id}/merge`, { method: 'POST' });
    if (!res.ok) return;
    const data: MergedDish[] = await res.json();
    setState((s) => ({ ...s, merged: data }));
  }, [state.group]);

  const doCheckout = useCallback(async () => {
    if (!state.group) return;
    const res = await fetch(`/api/groups/${state.group.id}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule: state.discountRule }),
    });
    if (!res.ok) return;
    const data: CheckoutResult = await res.json();
    setState((s) => ({ ...s, checkout: data }));
  }, [state.group, state.discountRule]);

  useEffect(() => {
    if (state.group) {
      refreshMerged();
      const t = setInterval(refreshMerged, 1500);
      return () => clearInterval(t);
    }
  }, [state.group, refreshMerged]);

  const ctxValue = {
    state,
    selectDish,
    createGroup,
    joinMember,
    setCurrentMember,
    refreshMerged,
    doCheckout,
  };

  return (
    <AppCtx.Provider value={ctxValue}>
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <span className="brand-emoji">🍱</span>
            <div>
              <h1 className="brand-title">聚味轩</h1>
              <p className="brand-sub">多人拼单 · 众口不再难调</p>
            </div>
          </div>
        </header>

        <main className="app-main">
          <section className="col col-order">
            <OrderPanel />
          </section>
          <section className="col col-group">
            <GroupPanel />
            <CheckoutPanel />
          </section>
        </main>
      </div>
    </AppCtx.Provider>
  );
}

export default App;
