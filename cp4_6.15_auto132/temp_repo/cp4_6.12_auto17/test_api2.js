const initSqlJs = require('sql.js');

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
  db.run('INSERT INTO test (name) VALUES (?)', ['hello']);
  db.run('INSERT INTO test (name) VALUES (?)', ['world']);

  console.log('=== Testing db.exec for SELECT ===');
  const results = db.exec('SELECT * FROM test');
  console.log('db.exec result:', JSON.stringify(results, null, 2));

  console.log('\n=== Testing with params via db.exec ===');
  try {
    const results2 = db.exec('SELECT * FROM test WHERE id = ?', [1]);
    console.log('db.exec with params:', JSON.stringify(results2, null, 2));
  } catch (e) {
    console.log('db.exec with params error:', e.message);
  }

  console.log('\n=== Testing Statement step + getAsObject ===');
  const stmt = db.prepare('SELECT * FROM test');
  const allRows = [];
  while (stmt.step()) {
    allRows.push(stmt.getAsObject());
  }
  stmt.free();
  console.log('Using step() + getAsObject():', JSON.stringify(allRows, null, 2));

  console.log('\n=== Testing Statement step + getAsObject with params ===');
  const stmt2 = db.prepare('SELECT * FROM test WHERE id = ?');
  stmt2.bind([1]);
  if (stmt2.step()) {
    console.log('Bound + step + getAsObject:', stmt2.getAsObject());
  }
  stmt2.free();

  console.log('\n=== Testing getAsObject with params directly ===');
  const stmt3 = db.prepare('SELECT * FROM test WHERE id = ?');
  const row = stmt3.getAsObject([1]);
  console.log('getAsObject([params]):', row);
  stmt3.free();

  console.log('\n=== Testing last_insert_rowid properly ===');
  db.run('INSERT INTO test (name) VALUES (?)', ['third']);
  const stmt4 = db.prepare('SELECT last_insert_rowid()');
  if (stmt4.step()) {
    const lastIdArr = stmt4.get();
    console.log('last_insert_rowid() via step + get:', lastIdArr);
    console.log('last_insert_rowid() value:', lastIdArr[0]);
  }
  stmt4.free();

  console.log('\n=== Check Database methods ===');
  console.log('Database methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(db)).filter(m => !m.startsWith('_')));

})();
