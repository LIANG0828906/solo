const http = require('http');

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3002, path }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    }).on('error', reject);
  });
}

function httpPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3002,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let rdata = '';
        res.on('data', (c) => (rdata += c));
        res.on('end', () => {
          resolve({ status: res.statusCode, body: rdata });
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('Test 1: GET /api/plants');
    const r1 = await httpGet('/api/plants');
    console.log('  Status:', r1.status);
    console.log('  Body length:', r1.body.length);
    console.log('  Body start:', r1.body.slice(0, 200));

    console.log('\nTest 2: POST /api/plants');
    const r2 = await httpPost('/api/plants', {
      name: 'test',
      species: '绿萝',
      plantDate: Date.now(),
      status: 'growing',
      careRules: {
        waterFrequency: 5,
        fertilizeFrequency: 21,
        lightRequirement: 'sun',
        temperatureMin: 10,
        temperatureMax: 30,
      },
    });
    console.log('  Status:', r2.status);
    console.log('  Body:', r2.body);
    let plantId = null;
    try {
      plantId = JSON.parse(r2.body).id;
      console.log('  Plant ID:', plantId);
    } catch (e) {
      console.log('  Parse error:', e.message);
    }

    console.log('\nTest 3: GET /api/plants again');
    const r3 = await httpGet('/api/plants');
    console.log('  Status:', r3.status, '| length:', r3.body.length);
    try {
      const arr = JSON.parse(r3.body);
      console.log('  Parsed array length:', arr.length);
    } catch (e) {
      console.log('  Parse ERR:', e.message, '| Start:', r3.body.slice(0, 300));
    }

    if (plantId) {
      console.log('\nTest 4: GET /api/plants/:id with id=' + plantId);
      const r4 = await httpGet(`/api/plants/${plantId}`);
      console.log('  Status:', r4.status);
      console.log('  Body:', r4.body.slice(0, 500));

      console.log('\nTest 5: GET /api/tasks/week');
      const r5 = await httpGet('/api/tasks/week');
      console.log('  Status:', r5.status, '| length:', r5.body.length);
      try {
        const t = JSON.parse(r5.body);
        console.log('  Tasks count:', t.length);
        if (t[0]) console.log('  Task[0]:', JSON.stringify(t[0]));
      } catch (e) {
        console.log('  Parse error:', e.message);
      }

      console.log('\nTest 6: GET /api/stats/completion-rates');
      const r6 = await httpGet('/api/stats/completion-rates');
      console.log('  Status:', r6.status, '| length:', r6.body.length);
      try {
        const s = JSON.parse(r6.body);
        console.log('  Stats days:', s.length);
      } catch (e) {
        console.log('  Parse error:', e.message);
      }

      console.log('\nTest 7: GET /api/export-pdf/:plantId');
      await new Promise((resolve, reject) => {
        http.get({ hostname: 'localhost', port: 3002, path: `/api/export-pdf/${plantId}` }, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const buf = Buffer.concat(chunks);
            console.log('  Status:', res.statusCode);
            console.log('  Content-Type:', res.headers['content-type']);
            console.log('  Body size bytes:', buf.length);
            console.log('  Is valid PDF:', buf.length > 1000 && String(res.headers['content-type']).includes('pdf'));
            console.log('  First 4 bytes (magic):', buf.slice(0, 4).toString());
            resolve();
          });
        }).on('error', reject);
      });

      console.log('\nTest 8: GET /api/plants/:id/report');
      await new Promise((resolve, reject) => {
        http.get({ hostname: 'localhost', port: 3002, path: `/api/plants/${plantId}/report` }, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const buf = Buffer.concat(chunks);
            console.log('  Status:', res.statusCode);
            console.log('  Body size bytes:', buf.length);
            console.log('  Is valid PDF:', buf.length > 1000 && String(res.headers['content-type']).includes('pdf'));
            resolve();
          });
        }).on('error', reject);
      });
    }

    console.log('\n✅ ALL TESTS DONE');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();
