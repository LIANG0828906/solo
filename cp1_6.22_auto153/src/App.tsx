import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import GuestPool from './components/GuestPool';
import SeatPlan from './components/SeatPlan';
import { Guest, Table, Conflict, validateSeating, RELATIONSHIP_COLORS, RELATIONSHIP_LABELS } from './rules/seatRules';

const App: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [tableStatus, setTableStatus] = useState<Record<string, 'valid' | 'conflict' | 'empty'>>({});
  const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [validationMode, setValidationMode] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guestPoolOpen, setGuestPoolOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [guestsRes, tablesRes] = await Promise.all([
        axios.get('/api/guests'),
        axios.get('/api/tables'),
      ]);
      setGuests(guestsRes.data);
      setTables(tablesRes.data);
      
      const validation = validateSeating(tablesRes.data, guestsRes.data);
      setConflicts(validation.conflicts);
      setTableStatus(validation.tableStatus);
    } catch (error) {
      console.error('加载数据失败:', error);
      loadMockData();
    }
  };

  const loadMockData = () => {
    const mockGuests: Guest[] = [
      { id: uuidv4(), name: '张新娘', relationships: [] },
      { id: uuidv4(), name: '李新郎', relationships: [] },
      { id: uuidv4(), name: '王爸爸', relationships: [] },
      { id: uuidv4(), name: '赵妈妈', relationships: [] },
      { id: uuidv4(), name: '张小明', relationships: [] },
      { id: uuidv4(), name: '李小红', relationships: [] },
      { id: uuidv4(), name: '陈经理', relationships: [] },
      { id: uuidv4(), name: '刘同事', relationships: [] },
      { id: uuidv4(), name: '周朋友', relationships: [] },
      { id: uuidv4(), name: '吴朋友', relationships: [] },
    ];

    mockGuests[0].relationships = [
      { guestId: mockGuests[1].id, type: 'couple' },
      { guestId: mockGuests[2].id, type: 'family' },
      { guestId: mockGuests[3].id, type: 'family' },
      { guestId: mockGuests[4].id, type: 'family' },
    ];

    mockGuests[1].relationships = [
      { guestId: mockGuests[0].id, type: 'couple' },
      { guestId: mockGuests[5].id, type: 'family' },
      { guestId: mockGuests[6].id, type: 'colleague' },
    ];

    mockGuests[2].relationships = [
      { guestId: mockGuests[0].id, type: 'family' },
      { guestId: mockGuests[3].id, type: 'couple' },
      { guestId: mockGuests[4].id, type: 'family' },
    ];

    mockGuests[3].relationships = [
      { guestId: mockGuests[0].id, type: 'family' },
      { guestId: mockGuests[2].id, type: 'couple' },
      { guestId: mockGuests[4].id, type: 'family' },
    ];

    mockGuests[4].relationships = [
      { guestId: mockGuests[0].id, type: 'family' },
      { guestId: mockGuests[2].id, type: 'family' },
      { guestId: mockGuests[3].id, type: 'family' },
      { guestId: mockGuests[9].id, type: 'enemy' },
    ];

    mockGuests[5].relationships = [
      { guestId: mockGuests[1].id, type: 'family' },
      { guestId: mockGuests[8].id, type: 'friend' },
    ];

    mockGuests[6].relationships = [
      { guestId: mockGuests[1].id, type: 'colleague' },
      { guestId: mockGuests[7].id, type: 'colleague' },
    ];

    mockGuests[7].relationships = [
      { guestId: mockGuests[6].id, type: 'colleague' },
    ];

    mockGuests[8].relationships = [
      { guestId: mockGuests[5].id, type: 'friend' },
      { guestId: mockGuests[9].id, type: 'friend' },
    ];

    mockGuests[9].relationships = [
      { guestId: mockGuests[8].id, type: 'friend' },
      { guestId: mockGuests[4].id, type: 'enemy' },
    ];

    const mockTables: Table[] = [];
    for (let i = 1; i <= 6; i++) {
      mockTables.push({
        id: uuidv4(),
        tableNumber: i,
        seats: Array(8).fill(null),
      });
    }

    setGuests(mockGuests);
    setTables(mockTables);
  };

  const assignedGuestIds = useMemo(() => {
    const ids = new Set<string>();
    tables.forEach(table => {
      table.seats.forEach(guestId => {
        if (guestId) ids.add(guestId);
      });
    });
    return ids;
  }, [tables]);

  const handleDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData('guestId', guestId);
    setDraggedGuestId(guestId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropGuest = async (tableId: string, seatIndex: number, guestId: string) => {
    setDraggedGuestId(null);
    
    try {
      const res = await axios.post('/api/assign', {
        guestId,
        tableId,
        seatIndex,
      });
      setTables(res.data.tables);
      setConflicts(res.data.conflicts);
      setTableStatus(res.data.tableStatus);
    } catch (error) {
      console.error('分配座位失败:', error);
      const newTables = tables.map(t => {
        const newSeats = t.seats.map(s => (s === guestId ? null : s));
        if (t.id === tableId) {
          newSeats[seatIndex] = guestId;
        }
        return { ...t, seats: newSeats };
      });
      setTables(newTables);
      const validation = validateSeating(newTables, guests);
      setConflicts(validation.conflicts);
      setTableStatus(validation.tableStatus);
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    try {
      const res = await axios.post('/api/unassign', { guestId });
      setTables(res.data.tables);
      setConflicts(res.data.conflicts);
      setTableStatus(res.data.tableStatus);
    } catch (error) {
      console.error('移除宾客失败:', error);
      const newTables = tables.map(t => ({
        ...t,
        seats: t.seats.map(s => (s === guestId ? null : s)),
      }));
      setTables(newTables);
      const validation = validateSeating(newTables, guests);
      setConflicts(validation.conflicts);
      setTableStatus(validation.tableStatus);
    }
  };

  const handleGeneratePlan = () => {
    setValidationMode(true);
    setShowPlanModal(true);
  };

  const handleAddGuest = async () => {
    if (!newGuestName.trim()) return;
    
    try {
      const res = await axios.post('/api/guests', { name: newGuestName.trim() });
      setGuests([...guests, res.data]);
    } catch (error) {
      console.error('添加宾客失败:', error);
      const newGuest: Guest = {
        id: uuidv4(),
        name: newGuestName.trim(),
        relationships: [],
      };
      setGuests([...guests, newGuest]);
    }
    
    setNewGuestName('');
    setShowAddModal(false);
  };

  const exportToPNG = async () => {
    if (!modalRef.current) return;
    
    try {
      const canvas = await html2canvas(modalRef.current, {
        scale: 2,
        backgroundColor: '#FFF5EE',
      });
      const link = document.createElement('a');
      link.download = '婚礼座位方案.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('导出PNG失败:', error);
    }
  };

  const exportToPDF = async () => {
    if (!modalRef.current) return;
    
    try {
      const canvas = await html2canvas(modalRef.current, {
        scale: 2,
        backgroundColor: '#FFF5EE',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('婚礼座位方案.pdf');
    } catch (error) {
      console.error('导出PDF失败:', error);
    }
  };

  const getGuestById = (id: string): Guest | undefined => {
    return guests.find(g => g.id === id);
  };

  const getPrimaryRelationship = (guest: Guest) => {
    const typeOrder: Array<'couple' | 'family' | 'friend' | 'colleague' | 'enemy'> = ['couple', 'family', 'friend', 'colleague', 'enemy'];
    for (const type of typeOrder) {
      if (guest.relationships.some(r => r.type === type)) {
        return type;
      }
    }
    return 'friend' as const;
  };

  const renderPlanModal = () => {
    if (!showPlanModal) return null;

    return (
      <div style={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
        <div 
          style={styles.modalContent}
          onClick={e => e.stopPropagation()}
          ref={modalRef}
        >
          <div style={styles.modalBanner}>
            <h2 style={styles.modalTitle}>🎀 婚礼座位方案 🎀</h2>
            <p style={styles.modalSubtitle}>
              共 {tables.length} 桌 · {guests.length} 位宾客 · {conflicts.length} 个冲突
            </p>
          </div>
          
          <div style={styles.modalBody}>
            <div style={styles.tablesGrid}>
              {tables.map(table => {
                const status = tableStatus[table.id];
                const hasConflict = status === 'conflict';
                const isValid = status === 'valid';
                
                return (
                  <div
                    key={table.id}
                    style={{
                      ...styles.tableCard,
                      borderColor: hasConflict ? '#EF4444' : isValid ? '#10B981' : '#F7DC6F',
                      backgroundColor: hasConflict ? '#FEF2F2' : isValid ? '#F0FDF4' : '#FFFEF7',
                    }}
                  >
                    <div style={styles.tableCardHeader}>
                      <span style={styles.tableCardTitle}>第 {table.tableNumber} 桌</span>
                      {hasConflict && <span style={{ ...styles.statusBadge, backgroundColor: '#EF4444' }}>冲突</span>}
                      {isValid && <span style={{ ...styles.statusBadge, backgroundColor: '#10B981' }}>正常</span>}
                    </div>
                    <div style={styles.seatsList}>
                      {table.seats.map((guestId, idx) => {
                        const guest = guestId ? getGuestById(guestId) : null;
                        const primaryRel = guest ? getPrimaryRelationship(guest) : null;
                        const color = primaryRel ? RELATIONSHIP_COLORS[primaryRel] : '#9CA3AF';
                        
                        return (
                          <div key={idx} style={styles.seatItem}>
                            <div 
                              style={{
                                ...styles.seatDot,
                                backgroundColor: guest ? color : 'transparent',
                                borderColor: color,
                              }}
                            />
                            <span style={{
                              ...styles.seatName,
                              color: guest ? '#333' : '#CCC',
                            }}>
                              {guest ? guest.name : '空座'}
                            </span>
                            {guest && primaryRel && (
                              <span style={{
                                ...styles.seatRelTag,
                                backgroundColor: color + '20',
                                color: color,
                              }}>
                                {RELATIONSHIP_LABELS[primaryRel]}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={styles.modalFooter}>
            <button style={styles.secondaryButton} onClick={exportToPNG}>
              📷 导出为PNG
            </button>
            <button style={styles.primaryButton} onClick={exportToPDF}>
              📄 导出为PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddModal = () => {
    if (!showAddModal) return null;

    return (
      <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
        <div 
          style={{ ...styles.modalContent, maxWidth: '400px' }}
          onClick={e => e.stopPropagation()}
        >
          <h3 style={styles.addModalTitle}>添加宾客</h3>
          <input
            type="text"
            value={newGuestName}
            onChange={e => setNewGuestName(e.target.value)}
            placeholder="请输入宾客姓名"
            style={styles.input}
            onKeyDown={e => e.key === 'Enter' && handleAddGuest()}
            autoFocus
          />
          <div style={styles.modalFooter}>
            <button 
              style={styles.secondaryButton} 
              onClick={() => {
                setShowAddModal(false);
                setNewGuestName('');
              }}
            >
              取消
            </button>
            <button style={styles.primaryButton} onClick={handleAddGuest}>
              添加
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNav = () => (
    <div style={styles.navbar}>
      <div style={styles.navLeft}>
        <span style={styles.weddingIcon}>💒</span>
        <span style={styles.appName}>婚礼座位安排</span>
      </div>
      <div style={styles.navRight}>
        {!isMobile && (
          <>
            <button style={styles.navButtonSecondary} onClick={() => setShowAddModal(true)}>
              ➕ 添加宾客
            </button>
            <button style={styles.navButtonPrimary} onClick={handleGeneratePlan}>
              ✨ 生成方案
            </button>
          </>
        )}
        {isMobile && (
          <button 
            style={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        )}
      </div>
      {isMobile && mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          <button 
            style={{ ...styles.mobileMenuItem, borderBottom: '1px solid #F7DC6F30' }}
            onClick={() => {
              setShowAddModal(true);
              setMobileMenuOpen(false);
            }}
          >
            ➕ 添加宾客
          </button>
          <button 
            style={styles.mobileMenuItem}
            onClick={() => {
              handleGeneratePlan();
              setMobileMenuOpen(false);
            }}
          >
            ✨ 生成方案
          </button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div style={styles.app}>
        {renderNav()}
        <div style={styles.mobileContent}>
          <div style={styles.mobilePanel}>
            <button 
              style={styles.mobilePanelHeader}
              onClick={() => setGuestPoolOpen(!guestPoolOpen)}
            >
              <span>宾客池 ({guests.filter(g => !Array.from(assignedGuestIds).includes(g.id)).length})</span>
              <span>{guestPoolOpen ? '▲' : '▼'}</span>
            </button>
            {guestPoolOpen && (
              <div style={styles.mobilePanelBody}>
                <GuestPool
                  guests={guests}
                  assignedGuestIds={assignedGuestIds}
                  onDragStart={handleDragStart}
                />
              </div>
            )}
          </div>
          <div style={styles.mobileTablesArea}>
            <SeatPlan
              tables={tables}
              guests={guests}
              conflicts={conflicts}
              tableStatus={tableStatus}
              draggedGuestId={draggedGuestId}
              onDropGuest={handleDropGuest}
              onRemoveGuest={handleRemoveGuest}
              validationMode={validationMode}
            />
          </div>
        </div>
        {renderAddModal()}
        {renderPlanModal()}
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {renderNav()}
      <div style={styles.mainContent}>
        <GuestPool
          guests={guests}
          assignedGuestIds={assignedGuestIds}
          onDragStart={handleDragStart}
        />
        <SeatPlan
          tables={tables}
          guests={guests}
          conflicts={conflicts}
          tableStatus={tableStatus}
          draggedGuestId={draggedGuestId}
          onDropGuest={handleDropGuest}
          onRemoveGuest={handleRemoveGuest}
          validationMode={validationMode}
        />
      </div>
      {renderAddModal()}
      {renderPlanModal()}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFF5EE',
  },
  navbar: {
    background: 'linear-gradient(135deg, #FB7185 0%, #FDBA74 100%)',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(232, 168, 124, 0.2)',
    position: 'relative',
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  weddingIcon: {
    fontSize: '28px',
    animation: 'breathe 3s ease-in-out infinite',
    display: 'inline-block',
  },
  appName: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navButtonPrimary: {
    padding: '10px 20px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: 'white',
    color: '#FB7185',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  navButtonSecondary: {
    padding: '10px 20px',
    borderRadius: '20px',
    border: '1px solid white',
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  mobileMenuButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
  },
  mobileMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 50,
    animation: 'fade-in 0.3s ease-out',
  },
  mobileMenuItem: {
    width: '100%',
    padding: '16px 24px',
    border: 'none',
    backgroundColor: 'white',
    textAlign: 'left',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#333',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  mobileContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mobilePanel: {
    backgroundColor: '#FDF2F8',
    borderBottom: '1px solid #E8A87C30',
  },
  mobilePanelHeader: {
    width: '100%',
    padding: '14px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
    cursor: 'pointer',
  },
  mobilePanelBody: {
    maxHeight: '200px',
    overflowY: 'auto',
  },
  mobileTablesArea: {
    flex: 1,
    overflow: 'hidden',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fade-in 0.3s ease-out',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '900px',
    width: '90%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'bounce-in 0.35s ease-out',
  },
  modalBanner: {
    background: 'linear-gradient(135deg, #FB7185 0%, #FDBA74 100%)',
    padding: '24px 32px',
    textAlign: 'center',
    color: 'white',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  modalSubtitle: {
    fontSize: '14px',
    opacity: 0.9,
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  },
  tablesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
  },
  tableCard: {
    border: '2px solid',
    borderRadius: '12px',
    padding: '16px',
    transition: 'all 0.3s ease-out',
  },
  tableCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px dashed #E8A87C40',
  },
  tableCardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    color: 'white',
    fontWeight: 500,
  },
  seatsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  seatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 8px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  seatDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '2px solid',
    flexShrink: 0,
  },
  seatName: {
    flex: 1,
    fontSize: '14px',
  },
  seatRelTag: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '8px',
    flexShrink: 0,
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #E8A87C30',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  primaryButton: {
    padding: '10px 24px',
    borderRadius: '20px',
    border: 'none',
    background: 'linear-gradient(135deg, #FB7185 0%, #FDBA74 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  secondaryButton: {
    padding: '10px 24px',
    borderRadius: '20px',
    border: '1px solid #E8A87C',
    backgroundColor: 'white',
    color: '#E8A87C',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  addModalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '20px',
    padding: '24px 24px 0',
  },
  input: {
    width: 'calc(100% - 48px)',
    margin: '0 24px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #E8A87C50',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
};

export default App;
