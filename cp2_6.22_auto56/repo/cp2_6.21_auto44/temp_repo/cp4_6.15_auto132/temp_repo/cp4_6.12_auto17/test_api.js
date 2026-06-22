const initSqlJs = require('sql.js');

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
  db.run('INSERT INTO test (name) VALUES (?)', ['hello']);

  console.log('=== db.prepare API ===');
  const stmt = db.prepare('SELECT * FROM test WHERE id = ?');
  console.log('Statement methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(stmt)).filter(m => !m.startsWith('_')));

  console.log('\n=== Testing get methods ===');
  const stmt2 = db.prepare('SELECT * FROM test WHERE id = ?');
  try {
    const result1 = stmt2.getAsObject([1]);
    console.log('getAsObject works:', result1);
  } catch (e) {
    console.log('getAsObject error:', e.message);
  }

  const stmt3 = db.prepare('SELECT * FROM test WHERE id = ?');
  try {
    const result2 = stmt3.get([1]);
    console.log('get works:', result2);
  } catch (e) {
    console.log('get error:', e.message);
  }

  const stmt4 = db.prepare('SELECT * FROM test');
  try {
    const result3 = stmt4.getAsObject();
    console.log('getAsObject no params:', result3);
  } catch (e) {
    console.log('getAsObject no params error:', e.message);
  }

  const stmt5 = db.prepare('SELECT * FROM test');
  try {
    const result4 = stmt5.get();
    console.log('get no params:', result4);
  } catch (e) {
    console.log('get no params error:', e.message);
  }

  console.log('\n=== Testing all methods ===');
  const stmt6 = db.prepare('SELECT * FROM test');
  try {
    const result5 = stmt6.allAsObject();
    console.log('allAsObject works:', result5);
  } catch (e) {
    console.log('allAsObject error:', e.message);
  }

  const stmt7 = db.prepare('SELECT * FROM test');
  try {
    const result6 = stmt7.all();
    console.log('all works:', result6);
  } catch (e) {
    console.log('all error:', e.message);
  }

  console.log('\n=== last_insert_rowid ===');
  db.run('INSERT INTO test (name) VALUES (?)', ['world']);
  const stmt8 = db.prepare('SELECT last_insert_rowid() as id');
  const lastId = stmt8.get();
  console.log('last_insert_rowid get:', lastId);
  const lastId2 = stmt8.getAsObject ? stmt8.getAsObject() : 'N/A';
  console.log('last_insert_rowid getAsObject:', lastId2);

})();
