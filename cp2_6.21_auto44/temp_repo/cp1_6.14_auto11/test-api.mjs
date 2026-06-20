import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('\n=== 1. Test POST /api/plants ===');
  const plantData = JSON.stringify({
    name: '测试绿萝',
    species: '绿萝',
    plantDate: Date.now(),
    status: 'growing',
    careRules: {
      waterFrequency: 5,
      fertilizeFrequency: 21,
      lightRequirement: '散射光',
      temperatureMin: 12,
      temperatureMax: 32,
    },
  });
  const r1 = await makeRequest(
    {
      hostname: 'localhost',
      port: 3002,
      path: '/api/plants',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(plantData) },
    },
    plantData
  );
  console.log('Status:', r1.status);
  console.log('Response:', JSON.stringify(r1.data, null, 2).slice(0, 400));

  if (r1.status !== 201 || !r1.data?.id) {
    console.log('FAILED to create plant! Aborting further tests.');
    return;
  }
  const plantId = r1.data.id;
  console.log('Created plantId:', plantId);

  console.log('\n=== 2. Test GET /api/plants/:id ===');
  const r2 = await makeRequest({ hostname: 'localhost', port: 3001, path: `/api/plants/${plantId}`, method: 'GET' });
  console.log('Status:', r2.status, '| Name:', r2.data?.name);

  console.log('\n=== 3. Test GET /api/plants ===');
  const r3 = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/plants', method: 'GET' });
  console.log('Status:', r3.status, '| Count:', r3.data?.length);

  console.log('\n=== 4. Test GET /api/rules/defaults ===');
  const r4 = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/rules/defaults?species=绿萝&status=growing', method: 'GET' });
  console.log('Status:', r4.status, '| Rules:', JSON.stringify(r4.data));

  console.log('\n=== 5. Test GET /api/tasks/week ===');
  const r5 = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/tasks/week', method: 'GET' });
  console.log('Status:', r5.status, '| Tasks:', r5.data?.length);
  if (r5.data?.length > 0) {
    console.log('First task:', JSON.stringify(r5.data[0]));
  }

  console.log('\n=== 6. Test task complete ===');
  if (r5.data?.length > 0) {
    const taskId = r5.data[0].id;
    const r6 = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/tasks/${taskId}/complete`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, '{}');
    console.log('Status:', r6.status, '| Response:', JSON.stringify(r6.data));
  } else {
    console.log('No tasks to complete, skipped.');
  }

  console.log('\n=== 7. Test GET /api/stats/completion-rates ===');
  const r7 = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/stats/completion-rates', method: 'GET' });
  console.log('Status:', r7.status, '| Days returned:', r7.data?.length);

  console.log('\n=== 8. Test GET /api/export-pdf/:plantId ===');
  const r8 = await new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port: 3001, path: `/api/export-pdf/${plantId}`, method: 'GET' },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({ status: res.statusCode, size: buf.length, type: res.headers['content-type'], disposition: res.headers['content-disposition'] });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
  console.log('Status:', r8.status);
  console.log('Content-Type:', r8.type);
  console.log('Size (bytes):', r8.size);
  console.log('Content-Disposition:', r8.disposition);
  console.log('PDF is VALID:', r8.status === 200 && r8.size > 1000 && r8.type === 'application/pdf');

  console.log('\n=== 9. Test GET /api/plants/:id/report (backup route) ===');
  const r9 = await new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port: 3001, path: `/api/plants/${plantId}/report`, method: 'GET' },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({ status: res.statusCode, size: buf.length, type: res.headers['content-type'] });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
  console.log('Status:', r9.status);
  console.log('Size (bytes):', r9.size);
  console.log('PDF is VALID:', r9.status === 200 && r9.size > 1000 && r9.type === 'application/pdf');

  console.log('\n=== 10. Test DELETE /api/plants/:id ===');
  const r10 = await makeRequest({ hostname: 'localhost', port: 3001, path: `/api/plants/${plantId}`, method: 'DELETE' });
  console.log('Status:', r10.status, '| Response:', JSON.stringify(r10.data));

  console.log('\n✅ All tests completed!');
}

setTimeout(test, 1500);
