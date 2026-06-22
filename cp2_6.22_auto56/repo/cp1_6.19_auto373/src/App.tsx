import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookCard } from './BookCard';
import { TrendChart } from './TrendChart';
import { useBookStore, PrintSuggestion, TransferSuggestion } from './useBookStore';

type DialogType = 'print' | 'transfer' | null;

function App() {
  const { books, selectedBook, suggestion, logs, loading, fetchBooks, addBook, executeAction, fetchLogs } = useBookStore();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    stock: '',
    weeklySales: '',
    price: '',
  });
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [confirmQuantity, setConfirmQuantity] = useState(0);

  useEffect(() => {
    fetchBooks();
    fetchLogs();
  }, [fetchBooks, fetchLogs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBook({
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      stock: Number(formData.stock),
      weeklySales: Number(formData.weeklySales),
      price: Number(formData.price),
    });
    setFormData({ title: '', author: '', isbn: '', stock: '', weeklySales: '', price: '' });
  };

  const handleConfirm = () => {
    if (selectedBook && dialogType) {
      executeAction(
        selectedBook.id,
        dialogType,
        confirmQuantity,
        dialogType === 'print' ? '紧急加印' : '门店调拨'
      );
      setDialogType(null);
    }
  };

  const openDialog = (type: 'print' | 'transfer', suggestion: PrintSuggestion | TransferSuggestion) => {
    setConfirmQuantity(suggestion.recommendedQty);
    setDialogType(type);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#eceff1', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#1a237e',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 100,
        }}
      >
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>📚 图书库存智能调拨系统</h1>
      </nav>

      <div style={{ padding: '80px 32px 32px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px', marginBottom: '24px' }}>
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1a237e', fontWeight: 600 }}>
              录入新书
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="书名"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="作者"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="ISBN"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="当前库存量"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  min="0"
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="近7日销量"
                  value={formData.weeklySales}
                  onChange={(e) => setFormData({ ...formData, weeklySales: e.target.value })}
                  required
                  min="0"
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="单价"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...inputStyle,
                    backgroundColor: '#1a237e',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#283593';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#1a237e';
                  }}
                >
                  {loading ? '提交中...' : '添加图书'}
                </button>
              </div>
            </form>
          </div>

          <div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1a237e', fontWeight: 600 }}>
              图书列表
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
              }}
            >
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedBook && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{ marginBottom: '24px' }}
            >
              <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1a237e', fontWeight: 600 }}>
                调拨建议 - {selectedBook.title}
              </h2>
              {loading && !suggestion ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  正在计算建议...
                </div>
              ) : suggestion ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => openDialog('print', suggestion.print)}
                    style={{
                      backgroundColor: '#FF8A65',
                      borderRadius: '8px',
                      padding: '20px',
                      color: '#fff',
                      cursor: 'pointer',
                      minHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                        🔥 紧急加印
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.95, marginBottom: '8px' }}>
                        {suggestion.print.reason}
                      </div>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>
                        预测未来3日需求: {suggestion.print.predictedDemand} 本
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.85 }}>建议加印</div>
                        <div style={{ fontSize: '32px', fontWeight: 700 }}>
                          {suggestion.print.recommendedQty} 本
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', opacity: 0.85 }}>预估成本</div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>
                          ¥{suggestion.print.estimatedCost.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => openDialog('transfer', suggestion.transfer)}
                    style={{
                      backgroundColor: '#4FC3F7',
                      borderRadius: '8px',
                      padding: '20px',
                      color: '#fff',
                      cursor: 'pointer',
                      minHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                        🚚 门店调拨
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.95, marginBottom: '8px' }}>
                        {suggestion.transfer.reason}
                      </div>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>
                        {suggestion.transfer.stores.map((s) => (
                          <span key={s.id} style={{ marginRight: '12px' }}>
                            {s.name} ({s.stock}本, {s.distance.toFixed(1)}km)
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.85 }}>建议调拨</div>
                        <div style={{ fontSize: '32px', fontWeight: 700 }}>
                          {suggestion.transfer.recommendedQty} 本
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', opacity: 0.85 }}>预估成本</div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>
                          ¥{suggestion.transfer.estimatedCost.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {selectedBook && <TrendChart data={selectedBook.inventoryHistory} />}

          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '16px',
              maxHeight: '280px',
              overflowY: 'auto',
            }}
          >
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1a237e',
                position: 'sticky',
                top: 0,
                backgroundColor: '#fff',
                paddingBottom: '8px',
              }}
            >
              操作日志
            </h4>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                暂无操作记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {logs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: log.type === 'print' ? '#FFF3E0' : '#E1F5FE',
                      borderRadius: '6px',
                      borderLeft: `4px solid ${log.type === 'print' ? '#FF8A65' : '#4FC3F7'}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
                        {log.type === 'print' ? '📖 加印' : '🚚 调拨'} - {log.bookTitle}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {formatTime(log.timestamp)} · {log.details}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: log.type === 'print' ? '#E64A19' : '#0288D1',
                      }}
                    >
                      +{log.quantity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {dialogType && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 200,
              }}
              onClick={() => setDialogType(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '32px',
                minWidth: '400px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                zIndex: 300,
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#1a237e' }}>
                确认{dialogType === 'print' ? '加印' : '调拨'}
              </h3>
              {selectedBook && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                    图书: <strong>{selectedBook.title}</strong>
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#666' }}>数量:</span>
                    <input
                      type="number"
                      value={confirmQuantity}
                      onChange={(e) => setConfirmQuantity(Number(e.target.value))}
                      min="1"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    <span style={{ color: '#666' }}>本</span>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDialogType(null)}
                  style={{
                    padding: '10px 24px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!confirmQuantity || confirmQuantity < 1}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: dialogType === 'print' ? '#FF8A65' : '#4FC3F7',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  确认执行
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 3fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="min-width: 400px"] {
            min-width: 300px !important;
            width: 90vw;
          }
        }
        input:focus {
          border-color: #1a237e !important;
        }
      `}</style>
    </div>
  );
}

export default App;
