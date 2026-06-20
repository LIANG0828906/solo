import React, { useState, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Plus, Trash2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { Guest, VipLevel } from '@/types';
import { AVATAR_COLORS, VIP_LABEL, PAGE_SIZE, DEBOUNCE_MS } from '@/types';
import { useAppStore } from '@/store';

const VIP_OPTIONS: VipLevel[] = ['normal', 'silver', 'gold'];

const GuestList: React.FC = () => {
  const guests = useAppStore((s) => s.guests);
  const addGuest = useAppStore((s) => s.addGuest);
  const deleteGuest = useAppStore((s) => s.deleteGuest);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [vipFilter, setVipFilter] = useState<VipLevel | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVip, setFormVip] = useState<VipLevel>('normal');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearch(val);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setDebouncedSearch(val), DEBOUNCE_MS);
    },
    [],
  );

  const companies = useMemo(
    () => Array.from(new Set(guests.map((g) => g.company))).sort(),
    [guests],
  );

  const filtered = useMemo(() => {
    let result = guests;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) || g.company.toLowerCase().includes(q),
      );
    }
    if (vipFilter !== 'all') {
      result = result.filter((g) => g.vipLevel === vipFilter);
    }
    if (companyFilter !== 'all') {
      result = result.filter((g) => g.company === companyFilter);
    }
    return result;
  }, [guests, debouncedSearch, vipFilter, companyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const handleAdd = useCallback(() => {
    if (!formName.trim()) return;
    addGuest({
      name: formName.trim(),
      company: formCompany.trim(),
      position: formPosition.trim(),
      phone: formPhone.trim(),
      vipLevel: formVip,
    });
    setFormName('');
    setFormCompany('');
    setFormPosition('');
    setFormPhone('');
    setFormVip('normal');
    setShowForm(false);
  }, [formName, formCompany, formPosition, formPhone, formVip, addGuest]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, guestId: string) => {
      e.dataTransfer.setData('guestId', guestId);
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteGuest(id);
    },
    [deleteGuest],
  );

  const resetFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setVipFilter('all');
    setCompanyFilter('all');
    setPage(1);
  }, []);

  return (
    <div
      style={{
        background: '#2C3E50',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, flex: 1 }}>Guest List</h3>
        <button
          onClick={() => setShowForm((p) => !p)}
          style={{
            background: '#3498DB',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
          }}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 8 }}>
        <Search
          size={14}
          style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}
        />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search name or company..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '7px 8px 7px 28px',
            borderRadius: 8,
            border: '1px solid #4a5568',
            background: '#34495E',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
            transition: 'outline 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '3px solid #3498DB';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <select
          value={vipFilter}
          onChange={(e) => {
            setVipFilter(e.target.value as VipLevel | 'all');
            setPage(1);
          }}
          style={{
            flex: 1,
            padding: '5px 6px',
            borderRadius: 8,
            border: '1px solid #4a5568',
            background: '#34495E',
            color: '#fff',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <option value="all">All VIP</option>
          {VIP_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {VIP_LABEL[v]}
            </option>
          ))}
        </select>

        <select
          value={companyFilter}
          onChange={(e) => {
            setCompanyFilter(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            padding: '5px 6px',
            borderRadius: 8,
            border: '1px solid #4a5568',
            background: '#34495E',
            color: '#fff',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <option value="all">All Company</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            key="add-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginBottom: 8 }}
          >
            <div
              style={{
                background: '#34495E',
                borderRadius: 8,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <input
                placeholder="Name *"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid #4a5568',
                  background: '#2C3E50',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <input
                placeholder="Company"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid #4a5568',
                  background: '#2C3E50',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <input
                placeholder="Position"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid #4a5568',
                  background: '#2C3E50',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <input
                placeholder="Phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid #4a5568',
                  background: '#2C3E50',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <select
                value={formVip}
                onChange={(e) => setFormVip(e.target.value as VipLevel)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid #4a5568',
                  background: '#2C3E50',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {VIP_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {VIP_LABEL[v]}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleAdd}
                  disabled={!formName.trim()}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: 8,
                    border: 'none',
                    background: formName.trim() ? '#27AE60' : '#4a5568',
                    color: '#fff',
                    cursor: formName.trim() ? 'pointer' : 'not-allowed',
                    fontSize: 13,
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#E74C3C',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, opacity: 0.5, fontSize: 13 }}>
            No guests found
            <div style={{ marginTop: 6 }}>
              <button
                onClick={resetFilters}
                style={{
                  background: 'transparent',
                  border: '1px solid #3498DB',
                  color: '#3498DB',
                  borderRadius: 8,
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {paged.map((guest, idx) => {
              const globalIdx = guests.indexOf(guest);
              const bgColor = AVATAR_COLORS[globalIdx % AVATAR_COLORS.length];
              return (
                <motion.div
                  key={guest.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.2 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, guest.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 6px',
                    borderRadius: 8,
                    marginBottom: 4,
                    background: '#34495E',
                    cursor: 'grab',
                    transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                      color: '#fff',
                    }}
                  >
                    {guest.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {guest.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.7,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {guest.company}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.5,
                      flexShrink: 0,
                      marginRight: 2,
                    }}
                  >
                    {guest.code}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(guest.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#E74C3C',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                    title="Delete guest"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 0 0',
            borderTop: '1px solid #4a5568',
            marginTop: 6,
          }}
        >
          <button
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              border: '1px solid #3498DB',
              borderRadius: 8,
              background: 'transparent',
              color: safePage <= 1 ? '#4a5568' : '#3498DB',
              cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 12 }}>
            {safePage} / {totalPages}
          </span>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              border: '1px solid #3498DB',
              borderRadius: 8,
              background: 'transparent',
              color: safePage >= totalPages ? '#4a5568' : '#3498DB',
              cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default GuestList;
