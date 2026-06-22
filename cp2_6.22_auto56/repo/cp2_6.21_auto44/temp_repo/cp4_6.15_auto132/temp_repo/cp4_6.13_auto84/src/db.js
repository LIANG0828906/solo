import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'bookclub.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      cover_image TEXT DEFAULT '',
      start_date DATE,
      end_date DATE,
      creator_id TEXT NOT NULL,
      has_crowdfunding INTEGER DEFAULT 0,
      crowdfunding_goal REAL DEFAULT 0,
      crowdfunding_raised REAL DEFAULT 0,
      crowdfunding_deadline DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS club_members (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(club_id, user_id),
      FOREIGN KEY (club_id) REFERENCES clubs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT NOT NULL,
      helpful_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      bookstore_url TEXT DEFAULT '',
      vote_count INTEGER DEFAULT 0,
      keywords TEXT DEFAULT '',
      FOREIGN KEY (club_id) REFERENCES clubs(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_id, target_type),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS crowdfunding_supports (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const users = [
    { id: uuidv4(), username: 'alice', nickname: '爱丽丝', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' },
    { id: uuidv4(), username: 'bob', nickname: '鲍勃', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob' },
    { id: uuidv4(), username: 'carol', nickname: '卡萝', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol' },
    { id: uuidv4(), username: 'david', nickname: '大卫', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david' },
    { id: uuidv4(), username: 'emma', nickname: '艾玛', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma' },
    { id: uuidv4(), username: 'frank', nickname: '弗兰克', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank' },
    { id: uuidv4(), username: 'grace', nickname: '格蕾丝', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace' },
    { id: uuidv4(), username: 'henry', nickname: '亨利', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry' },
    { id: uuidv4(), username: 'ivy', nickname: '艾薇', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivy' },
    { id: uuidv4(), username: 'jack', nickname: '杰克', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jack' }
  ];

  const insertUser = db.prepare('INSERT INTO users (id, username, password_hash, nickname, avatar) VALUES (?, ?, ?, ?, ?)');
  const passwordHash = bcrypt.hashSync('password123', 10);
  users.forEach(u => insertUser.run(u.id, u.username, passwordHash, u.nickname, u.avatar));

  const clubs = [
    {
      id: uuidv4(),
      name: '深夜书店·科幻读书会',
      description: '每月共读一本科幻经典，探索未来世界的无限可能。从阿西莫夫到刘慈欣，在银河与时间的长河中寻找人类的位置。',
      coverImage: 'https://picsum.photos/seed/scifi1/600/400',
      startDate: '2026-01-15',
      endDate: '2026-12-31',
      creatorId: users[0].id,
      hasCrowdfunding: 1,
      crowdfundingGoal: 5000,
      crowdfundingRaised: 2350,
      crowdfundingDeadline: '2026-07-01'
    },
    {
      id: uuidv4(),
      name: '推理迷局·侦探小说坊',
      description: '真相只有一个！一起畅读东西方侦探推理小说，挑战脑细胞极限。本格派、社会派、新本格，应有尽有。',
      coverImage: 'https://picsum.photos/seed/mystery2/600/400',
      startDate: '2026-02-01',
      endDate: '2026-08-01',
      creatorId: users[1].id,
      hasCrowdfunding: 0,
      crowdfundingGoal: 0,
      crowdfundingRaised: 0,
      crowdfundingDeadline: null
    },
    {
      id: uuidv4(),
      name: '时光情书·经典文学',
      description: '慢下来，读经典。一起重读那些经过时间洗礼的文学巨著，感受文字的力量与人性的光辉。',
      coverImage: 'https://picsum.photos/seed/classic3/600/400',
      startDate: '2026-03-01',
      endDate: '2026-12-31',
      creatorId: users[2].id,
      hasCrowdfunding: 1,
      crowdfundingGoal: 3000,
      crowdfundingRaised: 1200,
      crowdfundingDeadline: '2026-09-15'
    },
    {
      id: uuidv4(),
      name: '东方幻想·武侠仙侠',
      description: '侠之大者，为国为民。从金庸古龙到玄幻修仙，在刀光剑影与仙风道骨间体验东方浪漫。',
      coverImage: 'https://picsum.photos/seed/wuxia4/600/400',
      startDate: '2026-04-01',
      endDate: '2026-10-01',
      creatorId: users[3].id,
      hasCrowdfunding: 0,
      crowdfundingGoal: 0,
      crowdfundingRaised: 0,
      crowdfundingDeadline: null
    },
    {
      id: uuidv4(),
      name: '诗与远方·旅行文学',
      description: '身体和灵魂，总有一个在路上。读万卷书也行万里路，在文字中游历名山大川、异域风情。',
      coverImage: 'https://picsum.photos/seed/travel5/600/400',
      startDate: '2026-05-01',
      endDate: '2026-12-31',
      creatorId: users[4].id,
      hasCrowdfunding: 1,
      crowdfundingGoal: 8000,
      crowdfundingRaised: 5600,
      crowdfundingDeadline: '2026-11-30'
    },
    {
      id: uuidv4(),
      name: '午夜书话·恐怖悬疑',
      description: '月黑风高夜，读书正当时。挑战心理恐惧的极限，探索人性阴暗面的深度。胆小者慎入！',
      coverImage: 'https://picsum.photos/seed/horror6/600/400',
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      creatorId: users[5].id,
      hasCrowdfunding: 0,
      crowdfundingGoal: 0,
      crowdfundingRaised: 0,
      crowdfundingDeadline: null
    }
  ];

  const insertClub = db.prepare(`INSERT INTO clubs 
    (id, name, description, cover_image, start_date, end_date, creator_id, 
     has_crowdfunding, crowdfunding_goal, crowdfunding_raised, crowdfunding_deadline) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  clubs.forEach(c => insertClub.run(
    c.id, c.name, c.description, c.coverImage, c.startDate, c.endDate, c.creatorId,
    c.hasCrowdfunding, c.crowdfundingGoal, c.crowdfundingRaised, c.crowdfundingDeadline
  ));

  const insertMember = db.prepare('INSERT INTO club_members (id, club_id, user_id) VALUES (?, ?, ?)');
  clubs.forEach(club => {
    const memberCount = 3 + Math.floor(Math.random() * 5);
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    for (let i = 0; i < memberCount && i < shuffled.length; i++) {
      insertMember.run(uuidv4(), club.id, shuffled[i].id);
    }
  });

  const insertReview = db.prepare(`INSERT INTO reviews 
    (id, club_id, user_id, rating, content) VALUES (?, ?, ?, ?, ?)`);
  
  const reviewContents = [
    '这本书的想象力太惊人了，作者构建的世界观完整而有深度，读到最后一章时我完全被震撼了。',
    '情节紧凑，悬念迭起，一口气读完的感觉太爽了。虽然中间有些地方猜到了，但结局依然出人意料。',
    '文字优美，像诗一样的语言。虽然故事节奏不快，但每一页都值得细细品味。',
    '人物塑造非常成功，每个角色都有血有肉。特别是主角的成长弧光，写得真实可信。',
    '立意深刻，读完让人沉思良久。关于自由与命运的探讨，在今天依然有现实意义。',
    '翻译质量很高，文字流畅自然，完全感觉不到是翻译作品。',
    '作为系列的第二部，水准依然在线。世界观进一步展开，期待后续作品。',
    '前面铺垫有点长，但耐心读下去后渐入佳境。后半部分高潮迭起，非常精彩。'
  ];

  clubs.forEach(club => {
    const reviewCount = 2 + Math.floor(Math.random() * 4);
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    for (let i = 0; i < reviewCount && i < shuffledUsers.length; i++) {
      const content = reviewContents[Math.floor(Math.random() * reviewContents.length)];
      const rating = 3 + Math.floor(Math.random() * 3);
      insertReview.run(uuidv4(), club.id, shuffledUsers[i].id, rating, content);
    }
  });

  const insertRec = db.prepare(`INSERT INTO recommendations 
    (id, club_id, title, author, cover_image, bookstore_url, vote_count, keywords) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const recData = [
    { club: 0, title: '三体', author: '刘慈欣', cover: 'https://picsum.photos/seed/threebody/200/280', url: 'https://book.douban.com/subject/2567698/', votes: 42, keywords: '科幻,硬科幻' },
    { club: 0, title: '基地', author: '阿西莫夫', cover: 'https://picsum.photos/seed/foundation/200/280', url: 'https://book.douban.com/subject/1105565/', votes: 35, keywords: '科幻,基地系列' },
    { club: 0, title: '沙丘', author: '弗兰克·赫伯特', cover: 'https://picsum.photos/seed/dune/200/280', url: 'https://book.douban.com/subject/30232333/', votes: 28, keywords: '科幻,史诗' },
    { club: 0, title: '神经漫游者', author: '威廉·吉布森', cover: 'https://picsum.photos/seed/neuromancer/200/280', url: 'https://book.douban.com/subject/27115222/', votes: 18, keywords: '科幻,赛博朋克' },
    { club: 1, title: '白夜行', author: '东野圭吾', cover: 'https://picsum.photos/seed/whiteknight/200/280', url: 'https://book.douban.com/subject/3259440/', votes: 56, keywords: '推理,社会派' },
    { club: 1, title: '无人生还', author: '阿加莎·克里斯蒂', cover: 'https://picsum.photos/seed/tenlittle/200/280', url: 'https://book.douban.com/subject/24873871/', votes: 47, keywords: '推理,暴风雪山庄' },
    { club: 1, title: '嫌疑人X的献身', author: '东野圭吾', cover: 'https://picsum.photos/seed/suspectx/200/280', url: 'https://book.douban.com/subject/3211779/', votes: 38, keywords: '推理,本格' },
    { club: 2, title: '百年孤独', author: '马尔克斯', cover: 'https://picsum.photos/seed/solitude/200/280', url: 'https://book.douban.com/subject/36082528/', votes: 62, keywords: '经典,魔幻现实' },
    { club: 2, title: '追风筝的人', author: '卡勒德·胡赛尼', cover: 'https://picsum.photos/seed/kite/200/280', url: 'https://book.douban.com/subject/1770782/', votes: 45, keywords: '经典,成长' },
    { club: 2, title: '小王子', author: '圣埃克苏佩里', cover: 'https://picsum.photos/seed/prince/200/280', url: 'https://book.douban.com/subject/1084336/', votes: 52, keywords: '经典,童话' },
    { club: 3, title: '射雕英雄传', author: '金庸', cover: 'https://picsum.photos/seed/shediao/200/280', url: 'https://book.douban.com/subject/36231299/', votes: 71, keywords: '武侠,经典' },
    { club: 3, title: '天龙八部', author: '金庸', cover: 'https://picsum.photos/seed/tianlong/200/280', url: 'https://book.douban.com/subject/36231301/', votes: 58, keywords: '武侠,经典' },
    { club: 4, title: '瓦尔登湖', author: '梭罗', cover: 'https://picsum.photos/seed/walden/200/280', url: 'https://book.douban.com/subject/36128990/', votes: 33, keywords: '旅行,自然' },
    { club: 4, title: '文化苦旅', author: '余秋雨', cover: 'https://picsum.photos/seed/culku/200/280', url: 'https://book.douban.com/subject/25822975/', votes: 24, keywords: '旅行,散文' },
    { club: 5, title: '闪灵', author: '斯蒂芬·金', cover: 'https://picsum.photos/seed/shining/200/280', url: 'https://book.douban.com/subject/25856769/', votes: 39, keywords: '恐怖,心理' },
    { club: 5, title: '沉默的羔羊', author: '托马斯·哈里斯', cover: 'https://picsum.photos/seed/silence/200/280', url: 'https://book.douban.com/subject/27072398/', votes: 31, keywords: '悬疑,惊悚' }
  ];

  recData.forEach(r => {
    insertRec.run(uuidv4(), clubs[r.club].id, r.title, r.author, r.cover, r.url, r.votes, r.keywords);
  });

  const insertSupport = db.prepare(`INSERT INTO crowdfunding_supports 
    (id, club_id, user_id, amount) VALUES (?, ?, ?, ?)`);

  const crowdfundingClubs = clubs.filter(c => c.has_crowdfunding);
  crowdfundingClubs.forEach(club => {
    const supportCount = 3 + Math.floor(Math.random() * 4);
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    for (let i = 0; i < supportCount && i < shuffledUsers.length; i++) {
      const amount = [50, 100, 200, 300, 500][Math.floor(Math.random() * 5)];
      insertSupport.run(uuidv4(), club.id, shuffledUsers[i].id, amount);
    }
  });
}

function createUser(username, password, nickname) {
  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const stmt = db.prepare('INSERT INTO users (id, username, password_hash, nickname, avatar) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, username, passwordHash, nickname, avatar);
  return getUserById(id);
}

function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function getUserById(id) {
  return db.prepare('SELECT id, username, nickname, avatar, created_at as createdAt FROM users WHERE id = ?').get(id);
}

function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.password_hash);
}

function getClubs() {
  const rows = db.prepare(`
    SELECT c.*, u.nickname as creator_nickname, u.avatar as creator_avatar,
      (SELECT COUNT(*) FROM reviews r WHERE r.club_id = c.id) as review_count,
      (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id) as member_count
    FROM clubs c
    JOIN users u ON c.creator_id = u.id
    ORDER BY c.created_at DESC
  `).all();
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    coverImage: row.cover_image,
    startDate: row.start_date,
    endDate: row.end_date,
    creatorId: row.creator_id,
    creatorNickname: row.creator_nickname,
    creatorAvatar: row.creator_avatar,
    reviewCount: row.review_count,
    memberCount: row.member_count,
    hasCrowdfunding: !!row.has_crowdfunding,
    crowdfundingGoal: row.crowdfunding_goal,
    crowdfundingRaised: row.crowdfunding_raised,
    crowdfundingDeadline: row.crowdfunding_deadline,
    createdAt: row.created_at
  }));
}

function getClubById(id) {
  const row = db.prepare(`
    SELECT c.*, u.nickname as creator_nickname, u.avatar as creator_avatar,
      (SELECT COUNT(*) FROM reviews r WHERE r.club_id = c.id) as review_count,
      (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id) as member_count
    FROM clubs c
    JOIN users u ON c.creator_id = u.id
    WHERE c.id = ?
  `).get(id);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coverImage: row.cover_image,
    startDate: row.start_date,
    endDate: row.end_date,
    creatorId: row.creator_id,
    creatorNickname: row.creator_nickname,
    creatorAvatar: row.creator_avatar,
    reviewCount: row.review_count,
    memberCount: row.member_count,
    hasCrowdfunding: !!row.has_crowdfunding,
    crowdfundingGoal: row.crowdfunding_goal,
    crowdfundingRaised: row.crowdfunding_raised,
    crowdfundingDeadline: row.crowdfunding_deadline,
    createdAt: row.created_at
  };
}

function createClub(data) {
  const id = uuidv4();
  const stmt = db.prepare(`INSERT INTO clubs 
    (id, name, description, cover_image, start_date, end_date, creator_id, 
     has_crowdfunding, crowdfunding_goal, crowdfunding_raised, crowdfunding_deadline) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`);
  
  stmt.run(
    id, 
    data.name, 
    data.description, 
    data.coverImage || '', 
    data.startDate || null, 
    data.endDate || null,
    data.creatorId,
    data.hasCrowdfunding ? 1 : 0,
    data.crowdfundingGoal || 0,
    data.crowdfundingDeadline || null
  );

  const memberStmt = db.prepare('INSERT INTO club_members (id, club_id, user_id) VALUES (?, ?, ?)');
  memberStmt.run(uuidv4(), id, data.creatorId);

  return getClubById(id);
}

function getClubMembers(clubId, limit = 8) {
  const rows = db.prepare(`
    SELECT u.id, u.nickname, u.avatar
    FROM club_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.club_id = ?
    ORDER BY cm.joined_at ASC
    LIMIT ?
  `).all(clubId, limit);

  return rows.map(r => ({
    id: r.id,
    nickname: r.nickname,
    avatar: r.avatar
  }));
}

function getClubMemberCount(clubId) {
  return db.prepare('SELECT COUNT(*) as count FROM club_members WHERE club_id = ?').get(clubId).count;
}

function getReviews(clubId) {
  const rows = db.prepare(`
    SELECT r.*, u.nickname as user_nickname, u.avatar as user_avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.club_id = ?
    ORDER BY r.created_at DESC
  `).all(clubId);

  return rows.map(row => ({
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    userNickname: row.user_nickname,
    userAvatar: row.user_avatar,
    rating: row.rating,
    content: row.content,
    helpfulCount: row.helpful_count,
    createdAt: row.created_at
  }));
}

function createReview(clubId, userId, rating, content) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO reviews (id, club_id, user_id, rating, content) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, clubId, userId, rating, content);

  const isMember = db.prepare('SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ?').get(clubId, userId);
  if (!isMember) {
    const memberStmt = db.prepare('INSERT INTO club_members (id, club_id, user_id) VALUES (?, ?, ?)');
    memberStmt.run(uuidv4(), clubId, userId);
  }

  const row = db.prepare(`
    SELECT r.*, u.nickname as user_nickname, u.avatar as user_avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(id);

  return {
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    userNickname: row.user_nickname,
    userAvatar: row.user_avatar,
    rating: row.rating,
    content: row.content,
    helpfulCount: row.helpful_count,
    createdAt: row.created_at
  };
}

function voteHelpful(reviewId, userId) {
  const existing = db.prepare(`
    SELECT 1 FROM votes WHERE user_id = ? AND target_id = ? AND target_type = 'review'
  `).get(userId, reviewId);

  if (existing) {
    return { success: false, message: '已经投过票了' };
  }

  db.prepare('INSERT INTO votes (id, user_id, target_id, target_type) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), userId, reviewId, 'review');

  db.prepare('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?').run(reviewId);

  const review = db.prepare('SELECT helpful_count FROM reviews WHERE id = ?').get(reviewId);
  return { success: true, helpfulCount: review.helpful_count };
}

function getRecommendations(clubId, limit = 3) {
  const rows = db.prepare(`
    SELECT * FROM recommendations 
    WHERE club_id = ? 
    ORDER BY vote_count DESC 
    LIMIT ?
  `).all(clubId, limit);

  return rows.map(row => ({
    id: row.id,
    clubId: row.club_id,
    title: row.title,
    author: row.author,
    coverImage: row.cover_image,
    bookstoreUrl: row.bookstore_url,
    voteCount: row.vote_count,
    keywords: row.keywords ? row.keywords.split(',') : []
  }));
}

function voteRecommendation(recId, userId) {
  const existing = db.prepare(`
    SELECT 1 FROM votes WHERE user_id = ? AND target_id = ? AND target_type = 'recommendation'
  `).get(userId, recId);

  if (existing) {
    return { success: false, message: '已经推荐过了' };
  }

  db.prepare('INSERT INTO votes (id, user_id, target_id, target_type) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), userId, recId, 'recommendation');

  db.prepare('UPDATE recommendations SET vote_count = vote_count + 1 WHERE id = ?').run(recId);

  const rec = db.prepare('SELECT vote_count FROM recommendations WHERE id = ?').get(recId);
  return { success: true, voteCount: rec.vote_count };
}

function getUserVotes(userId, targetType) {
  const rows = db.prepare(`
    SELECT target_id FROM votes WHERE user_id = ? AND target_type = ?
  `).all(userId, targetType);
  return rows.map(r => r.target_id);
}

function getCrowdfundingSupports(clubId) {
  const rows = db.prepare(`
    SELECT cs.*, u.nickname as user_nickname, u.avatar as user_avatar
    FROM crowdfunding_supports cs
    JOIN users u ON cs.user_id = u.id
    WHERE cs.club_id = ?
    ORDER BY cs.amount DESC, cs.created_at ASC
  `).all(clubId);

  return rows.map(row => ({
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    userNickname: row.user_nickname,
    userAvatar: row.user_avatar,
    amount: row.amount,
    createdAt: row.created_at
  }));
}

function supportCrowdfunding(clubId, userId, amount) {
  if (amount < 10 || amount > 500 || !Number.isInteger(amount)) {
    return { success: false, message: '金额必须是10-500之间的整数' };
  }

  const id = uuidv4();
  db.prepare('INSERT INTO crowdfunding_supports (id, club_id, user_id, amount) VALUES (?, ?, ?, ?)')
    .run(id, clubId, userId, amount);

  db.prepare('UPDATE clubs SET crowdfunding_raised = crowdfunding_raised + ? WHERE id = ?')
    .run(amount, clubId);

  const isMember = db.prepare('SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ?').get(clubId, userId);
  if (!isMember) {
    const memberStmt = db.prepare('INSERT INTO club_members (id, club_id, user_id) VALUES (?, ?, ?)');
    memberStmt.run(uuidv4(), clubId, userId);
  }

  const club = getClubById(clubId);
  const supports = getCrowdfundingSupports(clubId);

  return {
    success: true,
    crowdfundingRaised: club.crowdfundingRaised,
    supports
  };
}

function getMyClubs(userId) {
  const rows = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM reviews r WHERE r.club_id = c.id) as review_count,
      (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id) as member_count
    FROM clubs c
    JOIN club_members cm ON c.id = cm.club_id
    WHERE cm.user_id = ?
    ORDER BY cm.joined_at DESC
  `).all(userId);

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    coverImage: row.cover_image,
    startDate: row.start_date,
    endDate: row.end_date,
    creatorId: row.creator_id,
    reviewCount: row.review_count,
    memberCount: row.member_count,
    hasCrowdfunding: !!row.has_crowdfunding,
    crowdfundingGoal: row.crowdfunding_goal,
    crowdfundingRaised: row.crowdfunding_raised,
    createdAt: row.created_at
  }));
}

function getMyReviews(userId) {
  const rows = db.prepare(`
    SELECT r.*, c.name as club_name, c.cover_image as club_cover
    FROM reviews r
    JOIN clubs c ON r.club_id = c.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(userId);

  return rows.map(row => ({
    id: row.id,
    clubId: row.club_id,
    clubName: row.club_name,
    clubCover: row.club_cover,
    rating: row.rating,
    content: row.content,
    helpfulCount: row.helpful_count,
    createdAt: row.created_at
  }));
}

export {
  initDb,
  createUser,
  getUserByUsername,
  getUserById,
  verifyPassword,
  getClubs,
  getClubById,
  createClub,
  getClubMembers,
  getClubMemberCount,
  getReviews,
  createReview,
  voteHelpful,
  getRecommendations,
  voteRecommendation,
  getUserVotes,
  getCrowdfundingSupports,
  supportCrowdfunding,
  getMyClubs,
  getMyReviews
};
