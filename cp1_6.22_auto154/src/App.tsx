import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import type { Guest, Relation, Table, Conflict, GuestGroup, RelationType, AppStateSnapshot } from './types';
import GuestPool from './components/GuestPool';
import TableCanvas from './components/TableCanvas';
import { detectConflicts } from './utils/conflictDetector';
import { exportAsPDF, exportAsPNG } from './utils/exportScheme';

const MAX_HISTORY = 5;

const App: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [history, setHistory] = useState<AppStateSnapshot[]>([]);
  const [future, setFuture] = useState<AppStateSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mobilePoolOpen, setMobilePoolOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const snapshot = useCallback((): AppStateSnapshot => ({
    guests: JSON.parse(JSON.stringify(guests)),
    relations: JSON.parse(JSON.stringify(relations)),
    tables: JSON.parse(JSON.stringify(tables))
  }), [guests, relations, tables]);

  const commitState = useCallback((newGuests: Guest[], newRelations: Relation[], newTables: Table[]) => {
    setHistory(prev => [...prev.slice(-MAX_HISTORY + 1), { guests, relations, tables }]);
    setFuture([]);
    setGuests(newGuests);
    setRelations(newRelations);
    setTables(newTables);
  }, [guests, relations, tables]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, rRes, tRes] = await Promise.all([
        axios.get('/api/guests'),
        axios.get('/api/relations'),
        axios.get('/api/tables')
      ]);
      setGuests(gRes.data);
      setRelations(rRes.data);
      setTables(tRes.data);
      initialized.current = true;
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture(f => [snapshot(), ...f].slice(0, MAX_HISTORY));
    setHistory(h => h.slice(0, -1));
    setGuests(prev.guests);
    setRelations(prev.relations);
    setTables(prev.tables);
  }, [history, snapshot]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(h => [...h.slice(-MAX_HISTORY + 1), snapshot()]);
    setFuture(f => f.slice(1));
    setGuests(next.guests);
    setRelations(next.relations);
    setTables(next.tables);
  }, [future, snapshot]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [undo, redo]);

  const assignedGuestIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of tables) {
      for (const s of t.seats) {
        if (s) set.add(s);
      }
    }
    return set;
  }, [tables]);

  const conflicts: Conflict[] = useMemo(() => {
    return detectConflicts(guests, relations, tables);
  }, [guests, relations, tables]);

  const addGuest = async (name: string, group: GuestGroup) => {
    try {
      const res = await axios.post('/api/guests', { name, group });
      commitState([...guests, res.data], relations, tables);
    } catch (err) { console.error(err); }
  };

  const removeGuest = async (id: string) => {
    try {
      await axios.delete(`/api/guests/${id}`);
      const newGuests = guests.filter(g => g.id !== id);
      const newRelations = relations.filter(r => r.guest1Id !== id && r.guest2Id !== id);
      const newTables = tables.map(t => ({ ...t, seats: t.seats.map(s => s === id ? null : s) }));
      commitState(newGuests, newRelations, newTables);
    } catch (err) { console.error(err); }
  };

  const addRelation = async (g1: string, g2: string, type: RelationType) => {
    try {
      const res = await axios.post('/api/relations', { guest1Id: g1, guest2Id: g2, type });
      commitState(guests, [...relations, res.data], tables);
    } catch (err) { console.error(err); }
  };

  const removeRelation = async (id: string) => {
    try {
      await axios.delete(`/api/relations/${id}`);
      commitState(guests, relations.filter(r => r.id !== id), tables);
    } catch (err) { console.error(err); }
  };

  const seatGuest = (tableId: string, seatIndex: number, guestId: string) => {
    const newTables = tables.map(t => {
      if (t.id === tableId) {
        const newSeats = [...t.seats];
        if (newSeats[seatIndex]) return t;
        newSeats[seatIndex] = guestId;
        return { ...t, seats: newSeats };
      }
      const cleanSeats = t.seats.map(s => s === guestId ? null : s);
      return { ...t, seats: cleanSeats };
    });
    setHistory(h => [...h.slice(-MAX_HISTORY + 1), snapshot()]);
    setFuture([]);
    setTables(newTables);
    axios.put('/api/tables', newTables).catch(err => console.error(err));
  };

  const unseatGuest = (tableId: string, seatIndex: number) => {
    const newTables = tables.map(t => {
      if (t.id !== tableId) return t;
      const newSeats = [...t.seats];
      newSeats[seatIndex] = null;
      return { ...t, seats: newSeats };
    });
    setHistory(h => [...h.slice(-MAX_HISTORY + 1), snapshot()]);
    setFuture([]);
    setTables(newTables);
    axios.put('/api/tables', newTables).catch(err => console.error(err));
  };

  const moveGuest = (fromTableId: string, fromSeat: number, toTableId: string, toSeat: number) => {
    if (fromTableId === toTableId && fromSeat === toSeat) return;
    const newTables = tables.map(t => {
      if (t.id === fromTableId) {
        const newSeats = [...t.seats];
        const movingGuest = newSeats[fromSeat];
        newSeats[fromSeat] = null;
        if (t.id === toTableId) {
          if (!newSeats[toSeat]) newSeats[toSeat] = movingGuest;
          else newSeats[fromSeat] = movingGuest;
        }
        return { ...t, seats: newSeats };
      }
      if (t.id === toTableId) {
        const fromTable = tables.find(tt => tt.id === fromTableId);
        const movingGuest = fromTable?.seats[fromSeat];
        const newSeats = [...t.seats];
        if (!newSeats[toSeat] && movingGuest) {
          newSeats[toSeat] = movingGuest;
        }
        return { ...t, seats: newSeats };
      }
      return t;
    });
    setHistory(h => [...h.slice(-MAX_HISTORY + 1), snapshot()]);
    setFuture([]);
    setTables(newTables);
    axios.put('/api/tables', newTables).catch(err => console.error(err));
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportAsPDF(tables, guests);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPNG = async () => {
    setExporting(true);
    try {
      await exportAsPNG('table-canvas');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F9FAFB'
      }}>
        <div className="spin-anim" style={{
          width: 40, height: 40,
          border: '4px solid #E5E7EB',
          borderTopColor: '#6366F1',
          borderRadius: '50%'
        }} />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <nav style={{
        height: 56,
        background: 'linear-gradient(135deg, #DB2777, #8B5CF6)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 2px 10px rgba(219, 39, 119, 0.25)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="breathe-anim" style={{ fontSize: 22 }}>💒</div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>婚礼宾客座位安排系统</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 12px',
            background: conflicts.length > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.15)',
            borderRadius: 20,
            fontSize: 13
          }}>
            <span>⚠️</span>
            <span>冲突: {conflicts.length}</span>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              style={{
                padding: '7px 16px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                cursor: exporting ? 'wait' : 'pointer',
                fontSize: 13,
                marginRight: 8,
                display: exporting ? 'none' : 'inline-block'
              }}
            >
              导出PNG
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              style={{
                padding: '7px 16px',
                background: 'white',
                color: '#DB2777',
                border: 'none',
                borderRadius: 6,
                cursor: exporting ? 'wait' : 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {exporting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="spin-anim" style={{
                    width: 14, height: 14,
                    border: '2px solid #E0E7FF',
                    borderTopColor: '#6366F1',
                    borderRadius: '50%',
                    display: 'inline-block'
                  }} />
                  导出中...
                </span>
              ) : '导出方案 PDF'}
            </button>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {!isMobile && (
          <GuestPool
            guests={guests}
            relations={relations}
            assignedGuestIds={assignedGuestIds}
            onAddGuest={addGuest}
            onAddRelation={addRelation}
            onRemoveGuest={removeGuest}
            onRemoveRelation={removeRelation}
          />
        )}
        {isMobile && mobilePoolOpen && (
          <div style={{
            position: 'fixed', bottom: 60, left: 0, right: 0, top: 56,
            zIndex: 15, background: '#FDF2F8', overflow: 'auto'
          }}>
            <GuestPool
              guests={guests}
              relations={relations}
              assignedGuestIds={assignedGuestIds}
              onAddGuest={addGuest}
              onAddRelation={addRelation}
              onRemoveGuest={removeGuest}
              onRemoveRelation={removeRelation}
            />
          </div>
        )}

        <TableCanvas
          tables={tables}
          guests={guests}
          conflicts={conflicts}
          onSeatGuest={seatGuest}
          onUnseatGuest={unseatGuest}
          onMoveGuest={moveGuest}
        />
      </div>

      <div style={{
        height: 60,
        background: 'white',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={undo}
            disabled={history.length === 0}
            style={{
              padding: '6px 14px',
              background: history.length === 0 ? '#F3F4F6' : '#FDF2F8',
              color: history.length === 0 ? '#9CA3AF' : '#DB2777',
              border: `1px solid ${history.length === 0 ? '#E5E7EB' : '#FBCFE8'}`,
              borderRadius: 6,
              cursor: history.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: 13
            }}
          >
            ↶ 撤销 ({history.length})
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            style={{
              padding: '6px 14px',
              background: future.length === 0 ? '#F3F4F6' : '#F5F3FF',
              color: future.length === 0 ? '#9CA3AF' : '#8B5CF6',
              border: `1px solid ${future.length === 0 ? '#E5E7EB' : '#C4B5FD'}`,
              borderRadius: 6,
              cursor: future.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: 13
            }}
          >
            ↷ 重做 ({future.length})
          </button>
          <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 10 }}>
            Ctrl+Z / Ctrl+Y
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF', marginRight: 6 }}>操作历史:</span>
          {history.length === 0 ? (
            <span style={{ fontSize: 12, color: '#D1D5DB' }}>无</span>
          ) : (
            history.map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: i === history.length - 1 ? '#DB2777' : '#FBCFE8'
              }} />
            ))
          )}
        </div>

        {isMobile && (
          <button
            onClick={() => setMobilePoolOpen(!mobilePoolOpen)}
            style={{
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #DB2777, #8B5CF6)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            {mobilePoolOpen ? '收起宾客池' : '打开宾客池'}
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .guest-pool { width: 100% !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
