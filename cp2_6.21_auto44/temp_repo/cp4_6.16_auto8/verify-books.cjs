const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'books.json');
const data = fs.readFileSync(filePath, 'utf8');
const books = JSON.parse(data);

console.log(`总数量: ${books.length}`);
console.log('');

const categories = ['小说', '科技', '艺术', '生活'];
categories.forEach(cat => {
  const count = books.filter(b => b.category === cat).length;
  console.log(`${cat}: ${count} 本`);
});

console.log('');
console.log(`第一本: ${books[0].id} - ${books[0].title} (${books[0].category})`);
console.log(`第25本: ${books[24].id} - ${books[24].title} (${books[24].category})`);
console.log(`第26本: ${books[25].id} - ${books[25].title} (${books[25].category})`);
console.log(`第50本: ${books[49].id} - ${books[49].title} (${books[49].category})`);
console.log(`第51本: ${books[50].id} - ${books[50].title} (${books[50].category})`);
console.log(`第75本: ${books[74].id} - ${books[74].title} (${books[74].category})`);
console.log(`第76本: ${books[75].id} - ${books[75].title} (${books[75].category})`);
console.log(`第100本: ${books[99].id} - ${books[99].title} (${books[99].category})`);

console.log('');
const prices = books.map(b => b.price);
console.log(`价格范围: ${Math.min(...prices)} - ${Math.max(...prices)}`);

const stocks = books.map(b => b.stock);
console.log(`库存范围: ${Math.min(...stocks)} - ${Math.max(...stocks)}`);

const dates = books.map(b => b.publishDate).sort();
console.log(`出版日期范围: ${dates[0]} - ${dates[dates.length - 1]}`);

console.log('');
const titles = books.map(b => b.title);
const uniqueTitles = [...new Set(titles)];
console.log(`唯一书名: ${uniqueTitles.length} / ${titles.length}`);

console.log('');
console.log('书名列表:');
books.forEach((b, i) => {
  if (i % 10 === 0) console.log('');
  process.stdout.write(`${b.id}:${b.title}  `);
});
console.log('');
