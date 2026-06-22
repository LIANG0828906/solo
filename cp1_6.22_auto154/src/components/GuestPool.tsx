import React, { useState } from 'react';
import type { Guest, Relation, GuestGroup, RelationType } from '../types';
import { GROUP_LABELS, RELATION_LABELS } from '../types';

interface GuestPoolProps {
  guests: Guest[];
  relations: Relation[];
  assignedGuestIds: Set<string>;
  onAddGuest: (name: string, group: GuestGroup) => void;
  onAddRelation: (guest1Id: string, guest2Id: string, type: RelationType) => void;
  onRemoveGuest: (id: string) => void;
  onRemoveRelation: (id: string) => void;
}

const GuestPool: React.FC<GuestPoolProps> = ({
  guests,
  relations,
  assignedGuestIds,
  onAddGuest,
  onAddRelation,
  onRemoveGuest,
  onRemoveRelation
}) => {
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<GuestGroup>('friend');
  const [showRelationForm, setShowRelationForm] = useState(false);
  const [relG1, setRelG1] = useState('');
  const [relG2, setRelG2] = useState('');
  const [relType, setRelType] = useState<RelationType>('family');

  const unassignedGuests = guests.filter(g => !assignedGuestIds.has(g.id));

  const handleAddGuest = () => {
    if (!newName.trim()) return;
    onAddGuest(newName.trim(), newGroup);
    setNewName('');
  };

  const handleAddRelation = () => {
    if (!relG1 || !relG2 || relG1 === relG2) return;
    onAddRelation(relG1, relG2, relType);
    setRelG1('');
    setRelG2('');
    setShowRelationForm(false);
  };

  const handleDragStart = (e: React.DragEvent, guest: Guest) => {
    e.dataTransfer.setData('guestId', guest.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const guestNameMap = new Map(guests.map(g => [g.id, g.name]));

  return (
    <div style={{
      width: 280,
      background: '#FDF2F8',
      height: 'calc(100vh - 56px - 60px)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #FCE7F3',
      overflow: 'hidden'
    }} className="guest-pool">
      <div style={{ padding: 16, borderBottom: '1px solid #FCE7F3' }}>
        <h3 style={{ color: '#DB2777', fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
          宾客池 ({unassignedGuests.length})
        </h3>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="姓名"
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #FBCFE8',
              borderRadius: 6,
              outline: 'none',
              fontSize: 13,
              background: 'white'
            }}
            onKeyDown={e => e.key === 'Enter' && handleAddGuest()}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={newGroup}
            onChange={e => setNewGroup(e.target.value as GuestGroup)}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #FBCFE8',
              borderRadius: 6,
              outline: 'none',
              fontSize: 13,
              background: 'white'
            }}
          >
            {Object.entries(GROUP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={handleAddGuest}
            style={{
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #DB2777, #8B5CF6)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            添加
          </button>
        </div>
        <button
          onClick={() => setShowRelationForm(!showRelationForm)}
          style={{
            marginTop: 10,
            width: '100%',
            padding: '6px',
            background: 'white',
            color: '#8B5CF6',
            border: '1px solid #C4B5FD',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          {showRelationForm ? '收起关系管理' : '+ 管理关系'}
        </button>
        {showRelationForm && (
          <div style={{ marginTop: 10, background: 'white', padding: 10, borderRadius: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <select
                value={relG1}
                onChange={e => setRelG1(e.target.value)}
                style={{ padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12 }}
              >
                <option value="">选择宾客1</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select
                value={relG2}
                onChange={e => setRelG2(e.target.value)}
                style={{ padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12 }}
              >
                <option value="">选择宾客2</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select
                value={relType}
                onChange={e => setRelType(e.target.value as RelationType)}
                style={{ padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12 }}
              >
                {Object.entries(RELATION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                onClick={handleAddRelation}
                style={{
                  padding: '5px',
                  background: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                添加关系
              </button>
            </div>
            {relations.length > 0 && (
              <div style={{ marginTop: 10, maxHeight: 120, overflowY: 'auto' }}>
                {relations.map(r => (
                  <div key={r.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 6px',
                    fontSize: 11,
                    borderBottom: '1px solid #F3F4F6'
                  }}>
                    <span>
                      {guestNameMap.get(r.guest1Id)} ↔ {guestNameMap.get(r.guest2Id)}
                      <span style={{
                        marginLeft: 6,
                        padding: '1px 5px',
                        background: r.type === 'enemy' ? '#FEE2E2' : r.type === 'couple' ? '#FCE7F3' : '#EDE9FE',
                        color: r.type === 'enemy' ? '#DC2626' : r.type === 'couple' ? '#DB2777' : '#7C3AED',
                        borderRadius: 4
                      }}>
                        {RELATION_LABELS[r.type]}
                      </span>
                    </span>
                    <button
                      onClick={() => onRemoveRelation(r.id)}
                      style={{
                        color: '#EF4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12
      }}>
        {unassignedGuests.length === 0 ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', fontSize: 13, paddingTop: 20 }}>
            所有宾客已分配
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unassignedGuests.map(guest => (
              <div
                key={guest.id}
                draggable
                onDragStart={e => handleDragStart(e, guest)}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  cursor: 'grab',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.15s',
                  userSelect: 'none'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1F2937' }}>{guest.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    {GROUP_LABELS[guest.group]}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveGuest(guest.id)}
                  style={{
                    color: '#EF4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: '0 4px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestPool;
