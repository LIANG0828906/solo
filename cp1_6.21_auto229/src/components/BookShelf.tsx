import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Book, BookList, BorrowRecord, ActiveView, ReadingStats } from '../types';
import { useApp } from '../context/AppContext';

interface BookShelfProps {
  mode: 'shelf' | 'lists';
}

const statusLabels: Record<Book['status'], string> = {
  reading: '在读',
  read: '已读',
  want: '想读',
  '': '未设置',
};

const statusColors: Record<Book['status'], string> = {
  reading: '#6366F1',
  read: '#10B981',
  want: '#F59E0B',
  '': '#475569',
};

const styles = {
  card: {
    background: '#1E293B',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer' as const,
  },
  cardHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
  },
  button: {
    borderRadius: 8,
    color: '#E2E8F0',
    background: '#6366F1',
    border: 'none',
    padding: '8px 16px',
    cursor: 'pointer' as const,
    transition: 'background 0.2s, transform 0.1s',
    fontSize: 14,
  },
  accentButton: {
    borderRadius: 8,
    color: '#E2E8F0',
    background: '#F59E0B',
    border: 'none',
    padding: '8px 16px',
    cursor: 'pointer' as const,
    transition: 'background 0.2s, transform 0.1s',
    fontSize: 14,
  },
  input: {
    background: '#334155',
    borderRadius: 8,
    padding: 10,
    border: '1px solid transparent',
    color: '#E2E8F0',
    fontSize: 14,
    outline: 'none',
    transition: 'border 0.2s',
  },
  badge: (status: Book['status']) => ({
    background: statusColors[status],
    color: '#E2E8F0',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    display: 'inline-block' as const,
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in',
  },
};

function StarRating({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  return (
    <span style={{ cursor: 'pointer', fontSize: 18 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={(e) => { e.stopPropagation(); onRate(n); }}
          style={{ color: n <= rating ? '#F59E0B' : '#475569', cursor: 'pointer', fontSize: 18 }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function BorrowTimeline({ records }: { records: BorrowRecord[] }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 24, marginTop: 12 }}>
      <div style={{
        position: 'absolute',
        left: 7,
        top: 0,
        bottom: 0,
        width: 2,
        background: '#475569',
      }} />
      {records.map(r => (
        <div key={r.id} style={{ position: 'relative', marginBottom: 16 }}>
          <div style={{
            position: 'absolute',
            left: -21,
            top: 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#6366F1',
          }} />
          <div style={{ color: '#E2E8F0', fontSize: 13 }}>
            <div>{r.borrowDate} — {r.borrowerName}</div>
            <div style={{ color: r.returned ? '#10B981' : '#F59E0B', fontSize: 12 }}>
              {r.returned ? `已归还 (${r.actualReturnDate})` : `借出中，预计 ${r.expectedReturnDate} 归还`}
            </div>
          </div>
        </div>
      ))}
      {records.length === 0 && (
        <div style={{ color: '#94A3B8', fontSize: 13 }}>暂无借阅记录</div>
      )}
    </div>
  );
}

function BarChart({ data }: { data: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maxVal = Math.max(...data, 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barWidth = 40;
    const gap = 12;
    const chartHeight = 200;
    const labelHeight = 24;
    const padding = 16;
    const totalBars = data.length;
    const totalWidth = totalBars * barWidth + (totalBars - 1) * gap + padding * 2;
    const totalHeight = chartHeight + labelHeight + padding * 2;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(0, 0, totalWidth, totalHeight, 8);
    ctx.fill();

    const now = new Date();
    data.forEach((val, i) => {
      const barHeight = (val / maxVal) * chartHeight;
      const x = padding + i * (barWidth + gap);
      const y = padding + chartHeight - barHeight;

      ctx.fillStyle = '#6366F1';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 4);
      ctx.fill();

      const monthIndex = (now.getMonth() - 11 + i + 12) % 12;
      const monthLabel = `${monthIndex + 1}月`;
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(monthLabel, x + barWidth / 2, padding + chartHeight + 16);
    });
  }, [data]);

  return <canvas ref={canvasRef} style={{ borderRadius: 8 }} />;
}

export default function BookShelf({ mode }: BookShelfProps) {
  const {
    books, lists, borrows,
    updateBook, deleteBook,
    createList, deleteList, addBookToList, removeBookFromList, reorderListBooks,
    createBorrow, returnBorrow,
  } = useApp();

  const [searchText, setSearchText] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<'addedAt' | 'title'>('addedAt');
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [borrowFormBookId, setBorrowFormBookId] = useState<string | null>(null);
  const [borrowName, setBorrowName] = useState('');
  const [borrowDate, setBorrowDate] = useState('');
  const [borrowReturnDate, setBorrowReturnDate] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [showCreateList, setShowCreateList] = useState(false);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [addBookToListId, setAddBookToListId] = useState<string | null>(null);
  const [selectedAddBookId, setSelectedAddBookId] = useState('');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    books.forEach(b => b.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [books]);

  const filteredBooks = useMemo(() => {
    let result = books.filter(b => {
      const matchSearch = b.title.toLowerCase().includes(searchText.toLowerCase()) ||
        b.author.toLowerCase().includes(searchText.toLowerCase());
      const matchTag = !tagFilter || b.tags.includes(tagFilter);
      return matchSearch && matchTag;
    });
    result = [...result].sort((a, b) => {
      if (sortBy === 'addedAt') return b.addedAt.localeCompare(a.addedAt);
      return a.title.localeCompare(b.title);
    });
    return result;
  }, [books, searchText, tagFilter, sortBy]);

  const activeBorrows = useMemo(() => borrows.filter(b => !b.returned), [borrows]);

  const readingStats: ReadingStats = useMemo(() => {
    const readBooks = books.filter(b => b.status === 'read');
    const totalRead = readBooks.length;
    const now = new Date();
    const daysInMonth = now.getDate();
    const booksThisMonth = readBooks.filter(b => {
      const d = new Date(b.addedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const monthlyAvg = daysInMonth > 0 ? parseFloat((booksThisMonth / daysInMonth).toFixed(2)) : 0;

    const tagCount: Record<string, number> = {};
    readBooks.forEach(b => b.tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const favoriteTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '无';

    const monthlyTrend: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = readBooks.filter(b => {
        const bd = new Date(b.addedAt);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      }).length;
      monthlyTrend.push(count);
    }

    return { totalRead, monthlyAvg, favoriteTag, monthlyTrend };
  }, [books]);

  const handleCreateBorrow = async (bookId: string) => {
    if (!borrowName || !borrowDate || !borrowReturnDate) return;
    await createBorrow({
      bookId,
      borrowerName: borrowName,
      borrowDate: borrowDate,
      expectedReturnDate: borrowReturnDate,
    });
    setBorrowFormBookId(null);
    setBorrowName('');
    setBorrowDate('');
    setBorrowReturnDate('');
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    await createList(newListName.trim(), newListDesc.trim());
    setNewListName('');
    setNewListDesc('');
    setShowCreateList(false);
  };

  const handleMoveBookInList = async (listId: string, bookIds: string[], index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= bookIds.length) return;
    const newOrder = [...bookIds];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    await reorderListBooks(listId, newOrder);
  };

  if (mode === 'shelf') {
    return (
      <div style={styles.fadeIn}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          input:focus, select:focus { border: 1px solid #6366F1 !important; }
          button:hover { filter: brightness(1.15); }
          button:active { transform: scale(0.95); }
        `}</style>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            placeholder="搜索书名/作者..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ ...styles.input, flex: 1, minWidth: 180 }}
          />
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            style={{ ...styles.input, minWidth: 120 }}
          >
            <option value="">全部标签</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={() => setSortBy(s => s === 'addedAt' ? 'title' : 'addedAt')}
            style={styles.button}
          >
            排序: {sortBy === 'addedAt' ? '添加时间' : '书名'}
          </button>
        </div>

        <div style={styles.grid}>
          {filteredBooks.map(book => {
            const isExpanded = expandedBookId === book.id;
            const bookBorrows = borrows.filter(b => b.bookId === book.id);
            const isBorrowFormOpen = borrowFormBookId === book.id;

            return (
              <div
                key={book.id}
                style={{
                  ...styles.card,
                  ...(isExpanded ? {} : {}),
                }}
                onMouseEnter={e => { if (!isExpanded) (e.currentTarget.style.transform = 'translateY(-3px)'); }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <img
                    src={book.coverUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20minimalist&image_size=square_hd'}
                    alt={book.title}
                    style={{ width: 64, height: 88, borderRadius: 6, objectFit: 'cover' as const }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {book.title}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 6 }}>{book.author}</div>
                    <span style={styles.badge(book.status)}>{statusLabels[book.status]}</span>
                    <div style={{ marginTop: 6 }}>
                      <StarRating rating={book.rating} onRate={n => updateBook(book.id, { rating: n })} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select
                    value={book.status}
                    onChange={e => { e.stopPropagation(); updateBook(book.id, { status: e.target.value as Book['status'] }); }}
                    onClick={e => e.stopPropagation()}
                    style={{ ...styles.input, padding: '4px 8px', fontSize: 12 }}
                  >
                    <option value="reading">在读</option>
                    <option value="read">已读</option>
                    <option value="want">想读</option>
                  </select>
                  <input
                    placeholder="标签(逗号分隔)"
                    value={book.tags.join(',')}
                    onChange={e => {
                      e.stopPropagation();
                      updateBook(book.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) });
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{ ...styles.input, padding: '4px 8px', fontSize: 12, flex: 1, minWidth: 80 }}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); deleteBook(book.id); }}
                    style={{ ...styles.accentButton, padding: '4px 10px', fontSize: 12 }}
                  >
                    删除
                  </button>
                </div>

                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setBorrowFormBookId(isBorrowFormOpen ? null : book.id); }}
                    style={{ ...styles.accentButton, padding: '4px 10px', fontSize: 12 }}
                  >
                    {isBorrowFormOpen ? '取消借出' : '借出'}
                  </button>
                </div>

                {isBorrowFormOpen && (
                  <div
                    style={{ marginTop: 10, display: 'flex', flexDirection: 'column' as const, gap: 8, ...styles.fadeIn }}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      placeholder="借阅人姓名"
                      value={borrowName}
                      onChange={e => setBorrowName(e.target.value)}
                      style={styles.input}
                    />
                    <input
                      type="date"
                      value={borrowDate}
                      onChange={e => setBorrowDate(e.target.value)}
                      style={styles.input}
                    />
                    <input
                      type="date"
                      value={borrowReturnDate}
                      onChange={e => setBorrowReturnDate(e.target.value)}
                      style={styles.input}
                    />
                    <button onClick={() => handleCreateBorrow(book.id)} style={styles.button}>
                      确认借出
                    </button>
                  </div>
                )}

                {isExpanded && (
                  <div style={{ marginTop: 12, ...styles.fadeIn }} onClick={e => e.stopPropagation()}>
                    <div style={{ color: '#E2E8F0', fontSize: 14, marginBottom: 8, fontWeight: 600 }}>借阅记录</div>
                    <BorrowTimeline records={bookBorrows} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {activeBorrows.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ color: '#E2E8F0', fontSize: 18, marginBottom: 12 }}>借出中的书</h3>
            <div style={styles.grid}>
              {activeBorrows.map(borrow => {
                const book = books.find(b => b.id === borrow.bookId);
                return (
                  <div key={borrow.id} style={styles.card}>
                    <div style={{ color: '#E2E8F0', fontWeight: 600 }}>{book?.title || '未知'}</div>
                    <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
                      借阅人: {borrow.borrowerName}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 13 }}>
                      借出日期: {borrow.borrowDate} | 预计归还: {borrow.expectedReturnDate}
                    </div>
                    <button
                      onClick={() => returnBorrow(borrow.id)}
                      style={{ ...styles.button, marginTop: 8, padding: '4px 10px', fontSize: 12 }}
                    >
                      归还
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, padding: 20, background: '#1E293B', borderRadius: 12 }}>
          <h3 style={{ color: '#E2E8F0', fontSize: 18, marginBottom: 16 }}>阅读统计</h3>
          <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#94A3B8', fontSize: 13 }}>已读书籍</div>
              <div style={{ color: '#E2E8F0', fontSize: 24, fontWeight: 700 }}>{readingStats.totalRead}</div>
            </div>
            <div>
              <div style={{ color: '#94A3B8', fontSize: 13 }}>本月日均</div>
              <div style={{ color: '#E2E8F0', fontSize: 24, fontWeight: 700 }}>{readingStats.monthlyAvg}</div>
            </div>
            <div>
              <div style={{ color: '#94A3B8', fontSize: 13 }}>最爱标签</div>
              <div style={{ color: '#E2E8F0', fontSize: 24, fontWeight: 700 }}>{readingStats.favoriteTag}</div>
            </div>
          </div>
          <BarChart data={readingStats.monthlyTrend} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.fadeIn}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input:focus, select:focus { border: 1px solid #6366F1 !important; }
        button:hover { filter: brightness(1.15); }
        button:active { transform: scale(0.95); }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setShowCreateList(!showCreateList)} style={styles.button}>
          创建新书单
        </button>
      </div>

      {showCreateList && (
        <div style={{ ...styles.card, marginBottom: 20, ...styles.fadeIn }}>
          <input
            placeholder="书单名称"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            style={{ ...styles.input, width: '100%', marginBottom: 8, boxSizing: 'border-box' as const }}
          />
          <input
            placeholder="书单描述"
            value={newListDesc}
            onChange={e => setNewListDesc(e.target.value)}
            style={{ ...styles.input, width: '100%', marginBottom: 8, boxSizing: 'border-box' as const }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreateList} style={styles.button}>确认创建</button>
            <button onClick={() => setShowCreateList(false)} style={{ ...styles.button, background: '#475569' }}>取消</button>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {lists.map(list => {
          const isExpanded = expandedListId === list.id;
          const listBooks = list.bookIds
            .map(id => books.find(b => b.id === id))
            .filter((b): b is Book => !!b);

          return (
            <div
              key={list.id}
              style={styles.card}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <div onClick={() => setExpandedListId(isExpanded ? null : list.id)} style={{ cursor: 'pointer' }}>
                <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{list.name}</div>
                <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 4 }}>{list.description}</div>
                <div style={{ color: '#64748B', fontSize: 12 }}>
                  {list.bookIds.length} 本书 · 创建于 {list.createdAt}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 12, ...styles.fadeIn }} onClick={e => e.stopPropagation()}>
                  <div style={{ borderTop: '1px solid #334155', paddingTop: 12 }}>
                    {listBooks.map((book, index) => (
                      <div
                        key={book.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 0',
                          borderBottom: '1px solid #1E293B',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#E2E8F0', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {book.title}
                          </div>
                          <div style={{ color: '#94A3B8', fontSize: 12 }}>{book.author}</div>
                        </div>
                        <button
                          onClick={() => handleMoveBookInList(list.id, list.bookIds, index, -1)}
                          style={{ ...styles.button, padding: '2px 8px', fontSize: 12 }}
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveBookInList(list.id, list.bookIds, index, 1)}
                          style={{ ...styles.button, padding: '2px 8px', fontSize: 12 }}
                          disabled={index === list.bookIds.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeBookFromList(list.id, book.id)}
                          style={{ ...styles.accentButton, padding: '2px 8px', fontSize: 12 }}
                        >
                          移除
                        </button>
                      </div>
                    ))}

                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                      {addBookToListId === list.id ? (
                        <>
                          <select
                            value={selectedAddBookId}
                            onChange={e => setSelectedAddBookId(e.target.value)}
                            style={{ ...styles.input, flex: 1 }}
                          >
                            <option value="">选择书籍</option>
                            {books.filter(b => !list.bookIds.includes(b.id)).map(b => (
                              <option key={b.id} value={b.id}>{b.title} - {b.author}</option>
                            ))}
                          </select>
                          <button
                            onClick={async () => {
                              if (selectedAddBookId) {
                                await addBookToList(list.id, selectedAddBookId);
                                setSelectedAddBookId('');
                                setAddBookToListId(null);
                              }
                            }}
                            style={styles.button}
                          >
                            确认
                          </button>
                          <button
                            onClick={() => { setAddBookToListId(null); setSelectedAddBookId(''); }}
                            style={{ ...styles.button, background: '#475569' }}
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setAddBookToListId(list.id)}
                          style={styles.button}
                        >
                          添加书籍
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => { deleteList(list.id); setExpandedListId(null); }}
                        style={{ ...styles.accentButton, padding: '4px 10px', fontSize: 12 }}
                      >
                        删除书单
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
