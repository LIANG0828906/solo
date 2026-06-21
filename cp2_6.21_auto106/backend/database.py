import sqlite3
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'library.db')


class Database:
    def __init__(self):
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                tags TEXT NOT NULL,
                cover_url TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'available',
                rating REAL NOT NULL DEFAULT 0,
                description TEXT NOT NULL DEFAULT '',
                borrower TEXT,
                created_at TEXT NOT NULL
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS borrow_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id INTEGER NOT NULL,
                borrower_id INTEGER NOT NULL,
                borrow_date TEXT NOT NULL,
                return_date TEXT,
                FOREIGN KEY (book_id) REFERENCES books (id),
                FOREIGN KEY (borrower_id) REFERENCES users (id)
            )
        ''')

        cursor.execute('SELECT COUNT(*) FROM users')
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO users (username) VALUES ('currentUser')")
            cursor.execute("INSERT INTO users (username) VALUES ('张三')")
            cursor.execute("INSERT INTO users (username) VALUES ('李四')")
            cursor.execute("INSERT INTO users (username) VALUES ('王五')")

        cursor.execute('SELECT COUNT(*) FROM books')
        if cursor.fetchone()[0] == 0:
            self._seed_books(cursor)

        conn.commit()
        conn.close()

    def _seed_books(self, cursor):
        sample_books = [
            (
                '三体',
                '刘慈欣',
                '科幻,经典',
                'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=300&h=450&fit=crop',
                4.8,
                '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展。但在按下发射键的那一刻，历经劫难的叶文洁没有意识到，她彻底改变了人类的命运。'
            ),
            (
                '百年孤独',
                '加西亚·马尔克斯',
                '文学,经典',
                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450&fit=crop',
                4.7,
                '《百年孤独》是魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰。'
            ),
            (
                '人类简史',
                '尤瓦尔·赫拉利',
                '历史,科普',
                'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=450&fit=crop',
                4.6,
                '十万年前，地球上至少有六种不同的人，但今日，世界舞台为什么只剩下了我们自己？从只能啃食叶根和追捕野兽的猿人，到能登陆火星、创造人工智能的智人。'
            ),
            (
                '活着',
                '余华',
                '文学,经典',
                'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop',
                4.5,
                '地主少爷福贵嗜赌成性，终于赌光了家业一贫如洗，穷困之中的福贵因为母亲生病前去求医，没想到半路上被国民党部队抓了壮丁。'
            ),
            (
                '1984',
                '乔治·奥威尔',
                '科幻,经典',
                'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=450&fit=crop',
                4.4,
                '《1984》是一部杰出的政治寓言小说，也是一部幻想小说。作品刻画了人类在极权主义社会的生存状态，有若一个永不褪色的警示标签。'
            ),
            (
                '明朝那些事儿',
                '当年明月',
                '历史',
                'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=450&fit=crop',
                4.3,
                '《明朝那些事儿》主要讲述的是从1344年到1644年这三百年间关于明朝的一些事情，以史料为基础，以年代和具体人物为主线。'
            ),
            (
                '小王子',
                '圣埃克苏佩里',
                '文学,经典',
                'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=450&fit=crop',
                4.6,
                '小王子是一个超凡脱俗的仙童，他住在一颗只比他大一丁点儿的小行星上。陪伴他的是一朵他非常喜爱的小玫瑰花。'
            ),
            (
                '基地',
                '阿西莫夫',
                '科幻',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=450&fit=crop',
                4.5,
                '人类蜗居在银河系的一个小角落——太阳系，在围绕太阳旋转的第三颗行星上，生活了十多万年之久。'
            ),
            (
                '白鹿原',
                '陈忠实',
                '文学,历史',
                'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=450&fit=crop',
                4.4,
                '《白鹿原》是一部渭河平原五十年变迁的雄奇史诗，一轴中国农村班斓多彩、触目惊心的长幅画卷。'
            ),
            (
                '围城',
                '钱钟书',
                '文学,经典',
                'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=450&fit=crop',
                4.3,
                '《围城》是钱钟书所著的长篇小说。第一版于1947年由上海晨光出版公司出版。故事主要写抗战初期知识分子的群相。'
            ),
            (
                '解忧杂货店',
                '东野圭吾',
                '文学,悬疑',
                'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop',
                4.5,
                '现代人内心流失的东西，这家杂货店能帮你找回——僻静的街道旁有一家杂货店，只要写下烦恼投进卷帘门的投信口。'
            ),
            (
                '嫌疑人X的献身',
                '东野圭吾',
                '悬疑,经典',
                'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop',
                4.6,
                '百年一遇的数学天才石神，每天唯一的乐趣，便是去固定的便当店买午餐，只为看一眼在便当店做事的邻居靖子。'
            ),
            (
                '红楼梦',
                '曹雪芹',
                '文学,经典,历史',
                'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=300&h=450&fit=crop',
                4.8,
                '《红楼梦》是一部具有世界影响力的人情小说，举世公认的中国古典小说巅峰之作，中国封建社会的百科全书。'
            ),
            (
                '挪威的森林',
                '村上春树',
                '文学',
                'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300&h=450&fit=crop',
                4.2,
                '这是一部动人心弦的、平缓舒雅的、略带感伤的、百分之百的恋爱小说。'
            ),
            (
                '时间简史',
                '史蒂芬·霍金',
                '科普',
                'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=450&fit=crop',
                4.4,
                '《时间简史》是一部探索时间和空间奥秘的通俗读物，是科普著作中的经典之作。'
            ),
            (
                '追风筝的人',
                '卡勒德·胡赛尼',
                '文学',
                'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop',
                4.5,
                '12岁的阿富汗富家少爷阿米尔与仆人哈桑情同手足。然而，在一场风筝比赛后，发生了一件悲惨不堪的事。'
            ),
            (
                '月亮与六便士',
                '毛姆',
                '文学,经典',
                'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=300&h=450&fit=crop',
                4.3,
                '一个英国证券交易所的经纪人，本已有牢靠的职业和地位、美满的家庭，但却迷恋上绘画，像"被魔鬼附了体"。'
            ),
            (
                '局外人',
                '阿尔贝·加缪',
                '文学,经典',
                'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=450&fit=crop',
                4.4,
                '《局外人》是法国作家加缪的成名作，也是存在主义文学的代表作品。'
            ),
            (
                '了不起的盖茨比',
                '菲茨杰拉德',
                '文学,经典',
                'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=300&h=450&fit=crop',
                4.3,
                '盖茨比为了久久地抱着的一个梦而付出了很高的代价。他死后，尼克发觉是汤姆暗中挑拨威尔逊去杀死盖茨比。'
            ),
            (
                '老人与海',
                '海明威',
                '文学,经典',
                'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=450&fit=crop',
                4.2,
                '这是一场人与自然搏斗的惊心动魄的悲剧。老人每取得一点胜利都付出了惨重的代价。'
            ),
        ]

        now = datetime.now().isoformat()
        for i, (title, author, tags, cover_url, rating, description) in enumerate(sample_books):
            created_at = (datetime.now() - timedelta(days=i * 5)).isoformat()
            cursor.execute(
                '''INSERT INTO books (title, author, tags, cover_url, status, rating, description, created_at)
                   VALUES (?, ?, ?, ?, 'available', ?, ?, ?)''',
                (title, author, tags, cover_url, rating, description, created_at)
            )

            if i in [2, 5, 9]:
                book_id = cursor.lastrowid
                borrower = ['张三', '李四', '王五'][i // 3]
                borrow_date = (datetime.now() - timedelta(days=i)).isoformat()
                cursor.execute(
                    '''UPDATE books SET status = 'borrowed', borrower = ? WHERE id = ?''',
                    (borrower, book_id)
                )
                cursor.execute(
                    '''INSERT INTO borrow_records (book_id, borrower_id, borrow_date)
                       VALUES (?, ?, ?)''',
                    (book_id, (i % 3) + 2, borrow_date)
                )

    def get_books(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        conn = self.get_connection()
        cursor = conn.cursor()

        offset = (page - 1) * limit
        cursor.execute('SELECT COUNT(*) FROM books')
        total = cursor.fetchone()[0]

        cursor.execute(
            'SELECT * FROM books ORDER BY created_at DESC LIMIT ? OFFSET ?',
            (limit, offset)
        )
        rows = cursor.fetchall()
        conn.close()

        books = []
        for row in rows:
            book = dict(row)
            book['tags'] = book['tags'].split(',') if book['tags'] else []
            books.append(book)

        return {'books': books, 'total': total}

    def add_book(self, book_data: Dict[str, Any]) -> Dict[str, Any]:
        conn = self.get_connection()
        cursor = conn.cursor()

        tags_str = ','.join(book_data.get('tags', []))
        now = datetime.now().isoformat()

        cursor.execute(
            '''INSERT INTO books (title, author, tags, cover_url, status, rating, description, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                book_data['title'],
                book_data['author'],
                tags_str,
                book_data.get('cover_url', ''),
                book_data.get('status', 'available'),
                book_data.get('rating', 0),
                book_data.get('description', ''),
                now,
            )
        )

        book_id = cursor.lastrowid
        conn.commit()
        conn.close()

        result = {**book_data, 'id': book_id, 'created_at': now}
        return result

    def update_book_status(self, book_id: int, status: str, borrower: Optional[str] = None) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()

        if status == 'borrowed' and borrower:
            cursor.execute(
                "UPDATE books SET status = ?, borrower = ? WHERE id = ?",
                (status, borrower, book_id)
            )
            cursor.execute(
                '''INSERT INTO borrow_records (book_id, borrower_id, borrow_date)
                   SELECT ?, id, ? FROM users WHERE username = ? LIMIT 1''',
                (book_id, datetime.now().isoformat(), borrower)
            )
        elif status == 'available':
            cursor.execute(
                "UPDATE books SET status = ?, borrower = NULL WHERE id = ?",
                (status, book_id)
            )
            cursor.execute(
                '''UPDATE borrow_records SET return_date = ?
                   WHERE book_id = ? AND return_date IS NULL''',
                (datetime.now().isoformat(), book_id)
            )

        conn.commit()

        cursor.execute('SELECT * FROM books WHERE id = ?', (book_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            book = dict(row)
            book['tags'] = book['tags'].split(',') if book['tags'] else []
            return book
        return None

    def get_statistics(self) -> Dict[str, Any]:
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT tags FROM books')
        rows = cursor.fetchall()

        tags_count: Dict[str, int] = {}
        for row in rows:
            tags = row['tags'].split(',') if row['tags'] else []
            for tag in tags:
                tag = tag.strip()
                if tag:
                    tags_count[tag] = tags_count.get(tag, 0) + 1

        thirty_days_ago = (datetime.now() - timedelta(days=30)).date().isoformat()
        cursor.execute(
            '''SELECT DATE(borrow_date) as date, COUNT(*) as count
               FROM borrow_records
               WHERE borrow_date >= ?
               GROUP BY DATE(borrow_date)
               ORDER BY date''',
            (thirty_days_ago,)
        )
        trend_rows = cursor.fetchall()

        date_counts = {row['date']: row['count'] for row in trend_rows}
        borrow_trend = []
        for i in range(30):
            date = (datetime.now() - timedelta(days=29 - i)).date().isoformat()
            borrow_trend.append({
                'date': date,
                'count': date_counts.get(date, 0)
            })

        conn.close()

        return {
            'tags_count': tags_count,
            'borrow_trend': borrow_trend
        }

    def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None


db = Database()
