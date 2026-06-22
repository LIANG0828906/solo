import axios from 'axios';

const API_BASE = '/api/books';

export interface BookInfo {
  title: string;
  author: string;
  isbn: string;
  cover: string;
}

const mockBooks: BookInfo[] = [
  {
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    isbn: '978-7-5442-4528-0',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20One%20Hundred%20Years%20of%20Solitude%20magical%20realism&image_size=square_hd',
  },
  {
    title: '红楼梦',
    author: '曹雪芹',
    isbn: '978-7-0200-0220-5',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20Dream%20of%20the%20Red%20Chamber%20Chinese%20classical&image_size=square_hd',
  },
  {
    title: '1984',
    author: '乔治·奥威尔',
    isbn: '978-0-14-028329-7',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%201984%20dystopian%20novel&image_size=square_hd',
  },
  {
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    isbn: '978-7-5086-5388-3',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20Sapiens%20history%20modern%20design&image_size=square_hd',
  },
  {
    title: '三体',
    author: '刘慈欣',
    isbn: '978-7-5366-9293-0',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20Three-Body%20Problem%20sci-fi&image_size=square_hd',
  },
  {
    title: '追风筝的人',
    author: '卡勒德·胡赛尼',
    isbn: '978-7-208-06164-4',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20Kite%20Runner%20warm%20literary&image_size=square_hd',
  },
  {
    title: '小王子',
    author: '圣·埃克苏佩里',
    isbn: '978-7-020-04202-9',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20Little%20Prince%20watercolor&image_size=square_hd',
  },
  {
    title: '活着',
    author: '余华',
    isbn: '978-7-5063-5817-6',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20To%20Live%20Yu%20Hua%20Chinese&image_size=square_hd',
  },
];

export async function searchBooks(query: string): Promise<BookInfo[]> {
  try {
    const res = await axios.get(`${API_BASE}/search`, { params: { q: query, limit: 8 } });
    return res.data;
  } catch {
    const lowerQuery = query.toLowerCase();
    return mockBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(lowerQuery) ||
        b.author.toLowerCase().includes(lowerQuery)
    );
  }
}

export async function getBookDetail(isbn: string): Promise<BookInfo | null> {
  try {
    const res = await axios.get(`${API_BASE}/${isbn}`);
    return res.data;
  } catch {
    return mockBooks.find((b) => b.isbn === isbn) || null;
  }
}
