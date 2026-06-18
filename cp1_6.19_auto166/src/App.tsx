import { useReducer, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BookCard from './components/BookCard';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import StatsPanel from './components/StatsPanel';
import { AppState, AppAction, Book, Reader, CityPoint, FilterType } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialCities: CityPoint[] = [
  { id: 'c1', name: '北京', x: 420, y: 120 },
  { id: 'c2', name: '上海', x: 500, y: 250 },
  { id: 'c3', name: '广州', x: 380, y: 350 },
  { id: 'c4', name: '深圳', x: 360, y: 365 },
  { id: 'c5', name: '成都', x: 220, y: 260 },
  { id: 'c6', name: '杭州', x: 490, y: 270 },
  { id: 'c7', name: '武汉', x: 400, y: 250 },
  { id: 'c8', name: '西安', x: 300, y: 200 },
  { id: 'c9', name: '南京', x: 470, y: 240 },
  { id: 'c10', name: '重庆', x: 260, y: 280 },
  { id: 'c11', name: '青岛', x: 470, y: 160 },
  { id: 'c12', name: '厦门', x: 440, y: 340 },
];

const initialReaders: Reader[] = [
  { id: 'r1', name: '小明', location: { x: 420, y: 120 }, cityName: '北京' },
  { id: 'r2', name: '小红', location: { x: 500, y: 250 }, cityName: '上海' },
  { id: 'r3', name: '阿强', location: { x: 380, y: 350 }, cityName: '广州' },
  { id: 'r4', name: '小雨', location: { x: 220, y: 260 }, cityName: '成都' },
  { id: 'r5', name: '老王', location: { x: 490, y: 270 }, cityName: '杭州' },
  { id: 'r6', name: '小李', location: { x: 300, y: 200 }, cityName: '西安' },
];

const initialBooks: Book[] = [
  {
    id: 'b1',
    title: '百年孤独',
    coverColor: '#8B4513',
    createdAt: '2024-01-15',
    startLocation: { x: 420, y: 120 },
    startCity: '北京',
    isDrifting: true,
    currentHolderId: 'r2',
    driftLogs: [
      {
        id: 'l1',
        readerId: 'r1',
        borrowDate: '2024-01-15',
        returnDate: '2024-02-01',
        note: '非常震撼的一本书，魔幻现实主义的巅峰之作！',
        location: { x: 420, y: 120 },
        cityName: '北京',
      },
      {
        id: 'l2',
        readerId: 'r2',
        borrowDate: '2024-02-05',
        returnDate: null,
        note: '',
        location: { x: 500, y: 250 },
        cityName: '上海',
      },
    ],
  },
  {
    id: 'b2',
    title: '小王子',
    coverColor: '#4682B4',
    createdAt: '2024-02-10',
    startLocation: { x: 380, y: 350 },
    startCity: '广州',
    isDrifting: false,
    currentHolderId: null,
    driftLogs: [
      {
        id: 'l3',
        readerId: 'r3',
        borrowDate: '2024-02-10',
        returnDate: '2024-02-25',
        note: '每个人心中都有一个小王子，治愈系必读。',
        location: { x: 380, y: 350 },
        cityName: '广州',
      },
    ],
  },
  {
    id: 'b3',
    title: '活着',
    coverColor: '#CD853F',
    createdAt: '2024-03-01',
    startLocation: { x: 220, y: 260 },
    startCity: '成都',
    isDrifting: true,
    currentHolderId: 'r5',
    driftLogs: [
      {
        id: 'l4',
        readerId: 'r4',
        borrowDate: '2024-03-01',
        returnDate: '2024-03-15',
        note: '余华的文字太有力量了，读完久久不能平静。',
        location: { x: 220, y: 260 },
        cityName: '成都',
      },
      {
        id: 'l5',
        readerId: 'r6',
        borrowDate: '2024-03-20',
        returnDate: '2024-04-05',
        note: '人是为活着本身而活着的，感动。',
        location: { x: 300, y: 200 },
        cityName: '西安',
      },
      {
        id: 'l6',
        readerId: 'r5',
        borrowDate: '2024-04-10',
        returnDate: null,
        note: '',
        location: { x: 490, y: 270 },
        cityName: '杭州',
      },
    ],
  },
  {
    id: 'b4',
    title: '三体',
    coverColor: '#2F4F4F',
    createdAt: '2024-03-20',
    startLocation: { x: 470, y: 240 },
    startCity: '南京',
    isDrifting: false,
    currentHolderId: null,
    driftLogs: [],
  },
  {
    id: 'b5',
    title: '围城',
    coverColor: '#A0522D',
    createdAt: '2024-04-05',
    startLocation: { x: 500, y: 250 },
    startCity: '上海',
    isDrifting: true,
    currentHolderId: 'r4',
    driftLogs: [
      {
        id: 'l7',
        readerId: 'r2',
        borrowDate: '2024-04-05',
        returnDate: '2024-04-20',
        note: '钱锺书的讽刺太妙了，句句经典。',
        location: { x: 500, y: 250 },
        cityName: '上海',
      },
      {
        id: 'l8',
        readerId: 'r4',
        borrowDate: '2024-04-25',
        returnDate: null,
        note: '',
        location: { x: 220, y: 260 },
        cityName: '成都',
      },
    ],
  },
];

const initialState: AppState = {
  books: initialBooks,
  readers: initialReaders,
  cities: initialCities,
  searchTerm: '',
  filter: 'all',
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_BOOK':
      return { ...state, books: [...state.books, action.payload] };

    case 'BORROW_BOOK': {
      const { bookId, readerId } = action.payload;
      const reader = state.readers.find(r => r.id === readerId);
      if (!reader) return state;

      const newLog = {
        id: generateId(),
        readerId,
        borrowDate: new Date().toISOString().split('T')[0],
        returnDate: null,
        note: '',
        location: { ...reader.location },
        cityName: reader.cityName,
      };

      return {
        ...state,
        books: state.books.map(book =>
          book.id === bookId
            ? {
                ...book,
                isDrifting: true,
                currentHolderId: readerId,
                driftLogs: [...book.driftLogs, newLog],
              }
            : book
        ),
      };
    }

    case 'RETURN_BOOK': {
      const { bookId, readerId, note } = action.payload;
      return {
        ...state,
        books: state.books.map(book => {
          if (book.id !== bookId) return book;
          return {
            ...book,
            isDrifting: false,
            currentHolderId: null,
            driftLogs: book.driftLogs.map(log =>
              log.readerId === readerId && log.returnDate === null
                ? {
                    ...log,
                    returnDate: new Date().toISOString().split('T')[0],
                    note,
                  }
                : log
            ),
          };
        }),
      };
    }

    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };

    case 'SET_FILTER':
      return { ...state, filter: action.payload };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { books, readers, cities, searchTerm, filter } = state;

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.driftLogs.some(log => {
          const reader = readers.find(r => r.id === log.readerId);
          return reader?.name.toLowerCase().includes(searchTerm.toLowerCase());
        });

      const matchesFilter =
        filter === 'all' ||
        (filter === 'drifting' && book.isDrifting) ||
        (filter === 'returned' && !book.isDrifting);

      return matchesSearch && matchesFilter;
    });
  }, [books, searchTerm, filter, readers]);

  const handleBorrow = (bookId: string) => {
    const availableReaders = readers.filter(
      r => !books.find(b => b.id === bookId)?.driftLogs.some(l => l.readerId === r.id && l.returnDate === null)
    );
    if (availableReaders.length === 0) return;
    
    const randomReader = availableReaders[Math.floor(Math.random() * availableReaders.length)];
    dispatch({ type: 'BORROW_BOOK', payload: { bookId, readerId: randomReader.id } });
  };

  const handleReturn = (bookId: string, note: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book || !book.currentHolderId) return;
    dispatch({ type: 'RETURN_BOOK', payload: { bookId, readerId: book.currentHolderId, note } });
  };

  const handleAddBook = () => {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const colors = ['#8B4513', '#4682B4', '#CD853F', '#2F4F4F', '#A0522D', '#556B2F', '#483D8B'];
    const titles = ['追风筝的人', '挪威的森林', '白夜行', '解忧杂货店', '人类简史', '未来简史', '1984'];
    
    const newBook: Book = {
      id: generateId(),
      title: titles[Math.floor(Math.random() * titles.length)] + Math.floor(Math.random() * 100),
      coverColor: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString().split('T')[0],
      startLocation: { ...randomCity },
      startCity: randomCity.name,
      isDrifting: false,
      currentHolderId: null,
      driftLogs: [],
    };
    dispatch({ type: 'ADD_BOOK', payload: newBook });
  };

  const handleSearchChange = (term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  };

  const handleFilterChange = (newFilter: FilterType) => {
    dispatch({ type: 'SET_FILTER', payload: newFilter });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0EB' }}>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          height: '60px',
          backgroundColor: '#3E2723',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>📚 独立书店 · 图书漂流</h1>
        <button
          onClick={handleAddBook}
          style={{
            backgroundColor: '#5D4037',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0px 2px 6px rgba(62,39,35,0.2)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4E342E';
            e.currentTarget.style.boxShadow = '0px 4px 10px rgba(62,39,35,0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5D4037';
            e.currentTarget.style.boxShadow = '0px 2px 6px rgba(62,39,35,0.2)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          + 创建漂流活动
        </button>
      </motion.header>

      <div
        style={{
          maxWidth: '1000px',
          margin: '20px auto',
          padding: '0 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBar
            searchTerm={searchTerm}
            filter={filter}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '360px',
              flexShrink: 0,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={searchTerm + filter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  maxHeight: 'calc(100vh - 200px)',
                  overflowY: 'auto',
                  paddingRight: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {filteredBooks.length === 0 ? (
                  <p style={{ color: '#8B7355', textAlign: 'center', padding: '40px 0' }}>
                    暂无匹配的图书
                  </p>
                ) : (
                  filteredBooks.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      readers={readers}
                      onBorrow={handleBorrow}
                      onReturn={handleReturn}
                    />
                  ))
                )}
              </motion.div>
            </AnimatePresence>

            <div style={{ marginTop: '20px' }}>
              <StatsPanel books={books} readers={readers} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <MapView books={books} cities={cities} readers={readers} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          div[style*="display: flex"][style*="gap: 20px"][style*="align-items: flex-start"] {
            flex-direction: column;
          }
          div[style*="width: 360px"] {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
