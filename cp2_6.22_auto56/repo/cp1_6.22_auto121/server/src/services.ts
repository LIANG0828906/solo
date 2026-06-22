import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact?: string;
  createdAt: string;
  bookCount: number;
}

export type BookStatus = 'in_station' | 'drifting' | 'lost';

export interface Book {
  id: string;
  driftId: string;
  isbn: string;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  currentStationId: string | null;
  status: BookStatus;
  totalReadingMinutes: number;
  readCount: number;
  heatScore: number;
  createdAt: string;
}

export type RecordType = 'check_in' | 'check_out' | 'register' | 'lost';

export interface DriftRecord {
  id: string;
  bookId: string;
  stationId?: string;
  type: RecordType;
  timestamp: string;
  readingMinutes?: number;
  note?: string;
}

const stationsStore = new Map<string, Station>();
const booksStore = new Map<string, Book>();
const recordsStore = new Map<string, DriftRecord>();

export function getAllStations(): Station[] {
  return Array.from(stationsStore.values()).map((s) => ({
    ...s,
    bookCount: Array.from(booksStore.values()).filter(
      (b) => b.currentStationId === s.id && b.status === 'in_station'
    ).length,
  }));
}

export function getStationById(id: string): Station | undefined {
  const station = stationsStore.get(id);
  if (!station) return undefined;
  return {
    ...station,
    bookCount: Array.from(booksStore.values()).filter(
      (b) => b.currentStationId === id && b.status === 'in_station'
    ).length,
  };
}

export function createStation(data: Omit<Station, 'id' | 'createdAt' | 'bookCount'>): Station {
  if (!data.name || !data.address) {
    throw new Error('Station name and address are required');
  }
  const station: Station = {
    id: uuidv4(),
    name: data.name,
    address: data.address,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    contact: data.contact,
    createdAt: new Date().toISOString(),
    bookCount: 0,
  };
  stationsStore.set(station.id, station);
  return station;
}

export function getAllBooks(
  page: number = 1,
  pageSize: number = 10,
  stationId?: string
): { books: Book[]; total: number; page: number; pageSize: number } {
  let books = Array.from(booksStore.values());
  if (stationId) {
    books = books.filter((b) => b.currentStationId === stationId);
  }
  books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = books.length;
  const start = (page - 1) * pageSize;
  return {
    books: books.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}

export function getBookById(id: string): Book | undefined {
  return booksStore.get(id);
}

function generateDriftId(): string {
  const prefix = 'BD';
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${ymd}${rand}`;
}

function calcHeatScore(book: Book): number {
  return book.readCount * 10 + Math.floor(book.totalReadingMinutes / 30) * 2;
}

export function createBook(
  data: Omit<Book, 'id' | 'driftId' | 'createdAt' | 'status' | 'totalReadingMinutes' | 'readCount' | 'heatScore'> & { status?: BookStatus }
): Book {
  if (!data.isbn || !data.title || !data.author) {
    throw new Error('ISBN, title and author are required');
  }
  const book: Book = {
    id: uuidv4(),
    driftId: generateDriftId(),
    isbn: data.isbn,
    title: data.title,
    author: data.author,
    coverUrl: data.coverUrl,
    description: data.description,
    currentStationId: data.currentStationId || null,
    status: data.status || 'in_station',
    totalReadingMinutes: 0,
    readCount: 0,
    heatScore: 0,
    createdAt: new Date().toISOString(),
  };
  book.heatScore = calcHeatScore(book);
  booksStore.set(book.id, book);

  addRecord({
    bookId: book.id,
    stationId: book.currentStationId || undefined,
    type: 'register',
    note: `图书登记入库`,
  });

  return book;
}

export function updateBookStatus(
  bookId: string,
  status: BookStatus,
  stationId?: string,
  readingMinutes?: number
): Book | undefined {
  const book = booksStore.get(bookId);
  if (!book) return undefined;

  book.status = status;

  if (status === 'drifting') {
    book.currentStationId = null;
    if (book.status === 'drifting') {
      addRecord({
        bookId: book.id,
        stationId: stationId || undefined,
        type: 'check_out',
        note: `图书被借出漂流`,
      });
    }
  } else if (status === 'in_station' && stationId) {
    const prevStation = book.currentStationId;
    book.currentStationId = stationId;
    book.readCount += 1;
    const minutes = readingMinutes || 0;
    book.totalReadingMinutes += minutes;
    book.heatScore = calcHeatScore(book);
    addRecord({
        bookId: book.id,
        stationId,
        type: 'check_in',
        readingMinutes: minutes,
        note: prevStation
          ? `漂流至新站点，阅读时长 ${minutes} 分钟`
          : `归还到站点，阅读时长 ${minutes} 分钟`,
      });
  } else if (status === 'lost') {
    book.currentStationId = null;
    addRecord({
      bookId: book.id,
      stationId: stationId || undefined,
      type: 'lost',
      note: `图书标记为丢失`,
    });
  }

  booksStore.set(book.id, book);
  return book;
}

function addRecord(data: Omit<DriftRecord, 'id' | 'timestamp'>): DriftRecord {
  const record: DriftRecord = {
    id: uuidv4(),
    ...data,
    timestamp: new Date().toISOString(),
  };
  recordsStore.set(record.id, record);
  return record;
}

export function getRecords(bookId?: string, stationId?: string): DriftRecord[] {
  let records = Array.from(recordsStore.values());
  if (bookId) {
    records = records.filter((r) => r.bookId === bookId);
  }
  if (stationId) {
    records = records.filter((r) => r.stationId === stationId);
  }
  return records.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function lookupISBN(isbn: string): Promise<{
  title: string;
  author: string;
  coverUrl: string;
  description?: string;
} | null> {
  try {
    const response = await axios.get(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    const key = `ISBN:${isbn}`;
    const data = response.data[key];
    if (data) {
      return {
        title: data.title || '未知书名',
        author: data.authors ? data.authors.map((a: any) => a.name).join(', ') : '未知作者',
        coverUrl: data.cover?.medium || data.cover?.large || data.cover?.small || '',
        description: data.notes || data.excerpts?.[0]?.text || '',
      };
    }
    return null;
  } catch (e) {
    console.warn('ISBN lookup failed:', e);
    return null;
  }
}

export function seedData() {
  const centerLat = 31.2304;
  const centerLng = 121.4737;

  const seedStations = [
    { name: '静安寺社区图书角', address: '上海市静安区南京西路1688号', latitude: 31.2236, longitude: 121.4455, contact: '021-62881234' },
    { name: '陆家嘴社区图书角', address: '上海市浦东新区陆家嘴环路1000号', latitude: 31.2397, longitude: 121.4998, contact: '021-58885678' },
    { name: '徐家汇社区图书角', address: '上海市徐汇区虹桥路1号', latitude: 31.1987, longitude: 121.4375, contact: '021-64889012' },
    { name: '人民广场社区图书角', address: '上海市黄浦区人民大道200号', latitude: 31.2335, longitude: 121.4750, contact: '021-63553456' },
    { name: '中山公园社区图书角', address: '上海市长宁区长宁路780号', latitude: 31.2205, longitude: 121.4190, contact: '021-62557890' },
    { name: '五角场社区图书角', address: '上海市杨浦区邯郸路600号', latitude: 31.2984, longitude: 121.5138, contact: '021-65112233' },
    { name: '南京路社区图书角', address: '上海市黄浦区南京东路300号', latitude: 31.2355, longitude: 121.4810, contact: '021-63221122' },
    { name: '外滩社区图书角', address: '上海市黄浦区中山东一路12号', latitude: 31.2397, longitude: 121.4904, contact: '021-63290888' },
    { name: '豫园社区图书角', address: '上海市黄浦区安仁街218号', latitude: 31.2272, longitude: 121.4925, contact: '021-63283210' },
    { name: '世博园区图书角', address: '上海市浦东新区博成路850号', latitude: 31.1880, longitude: 121.4900, contact: '021-20258888' },
    { name: '莘庄社区图书角', address: '上海市闵行区莘庄镇沪闵路6088号', latitude: 31.1118, longitude: 121.3818, contact: '021-64921234' },
    { name: '共富新村图书角', address: '上海市宝山区共富路200号', latitude: 31.3820, longitude: 121.3880, contact: '021-56195678' },
  ];

  const createdStations: Station[] = [];
  for (const s of seedStations) {
    createdStations.push(createStation(s));
  }

  const seedBooks = [
    { isbn: '9787020002207', title: '红楼梦', author: '曹雪芹', stationIdx: 0 },
    { isbn: '9787020008735', title: '西游记', author: '吴承恩', stationIdx: 0 },
    { isbn: '9787020008742', title: '水浒传', author: '施耐庵', stationIdx: 1 },
    { isbn: '9787020008759', title: '三国演义', author: '罗贯中', stationIdx: 1 },
    { isbn: '9787544270878', title: '活着', author: '余华', stationIdx: 2 },
    { isbn: '9787544270885', title: '平凡的世界', author: '路遥', stationIdx: 2 },
    { isbn: '9787544253994', title: '百年孤独', author: '加西亚·马尔克斯', stationIdx: 3 },
    { isbn: '9787532751143', title: '追风筝的人', author: '卡勒德·胡赛尼', stationIdx: 3 },
    { isbn: '9787020091027', title: '围城', author: '钱钟书', stationIdx: 4 },
    { isbn: '9787544280952', title: '解忧杂货店', author: '东野圭吾', stationIdx: 5 },
    { isbn: '9787020024759', title: '骆驼祥子', author: '老舍', stationIdx: 5 },
    { isbn: '9787544291170', title: '挪威的森林', author: '村上春树', stationIdx: 6 },
    { isbn: '9787020104291', title: '子夜', author: '茅盾', stationIdx: 7 },
    { isbn: '9787506393898', title: '三体', author: '刘慈欣', stationIdx: 8 },
    { isbn: '9787544292573', title: '白夜行', author: '东野圭吾', stationIdx: 9 },
  ];

  for (let i = 0; i < seedBooks.length; i++) {
    const sb = seedBooks[i];
    const station = createdStations[sb.stationIdx % createdStations.length];
    const book = createBook({
      isbn: sb.isbn,
      title: sb.title,
      author: sb.author,
      coverUrl: `https://picsum.photos/seed/book${i + 1}/200/300`,
      currentStationId: station.id,
      status: 'in_station',
    });

    if (i % 3 === 0) {
      const otherStation = createdStations[(sb.stationIdx + 2) % createdStations.length];
      updateBookStatus(book.id, 'drifting', station.id);
      updateBookStatus(book.id, 'in_station', otherStation.id, Math.floor(Math.random() * 500 + 60));
    }
  }

  console.log(`✅ Seeded: ${stationsStore.size} stations, ${booksStore.size} books, ${recordsStore.size} records`);
}
