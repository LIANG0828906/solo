import http from 'node:http';

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  const base = 'http://localhost:3001';
  const results = [];

  console.log('='.repeat(60));
  console.log('📋 后端 API 测试报告');
  console.log('='.repeat(60));

  try {
    const health = await request(`${base}/api/health`);
    results.push(['健康检查', health.status === 200, health.body]);
    console.log(`✅ 健康检查: ${health.status === 200 ? '通过' : '失败'}`);
  } catch (e) {
    results.push(['健康检查', false, e.message]);
    console.log(`❌ 健康检查: ${e.message}`);
  }

  try {
    const list = await request(`${base}/api/inventory`);
    results.push(['商品列表', list.status === 200 && Array.isArray(list.body) && list.body.length >= 8, `共 ${list.body?.length || 0} 个商品`]);
    console.log(`✅ 商品列表: ${list.status === 200 ? '通过' : '失败'} (${list.body?.length || 0}个商品)`);
  } catch (e) {
    results.push(['商品列表', false, e.message]);
    console.log(`❌ 商品列表: ${e.message}`);
  }

  try {
    const list = await request(`${base}/api/inventory`);
    const firstId = list.body[0]?.id;
    const detail = await request(`${base}/api/inventory/${firstId}`);
    results.push(['商品详情', detail.status === 200 && detail.body?.id === firstId, detail.body?.model]);
    console.log(`✅ 商品详情: ${detail.status === 200 ? '通过' : '失败'}`);
  } catch (e) {
    results.push(['商品详情', false, e.message]);
    console.log(`❌ 商品详情: ${e.message}`);
  }

  try {
    const list = await request(`${base}/api/inventory`);
    const firstId = list.body[0]?.id;
    const expected = list.body[0]?.expectedPrice;
    const offers = await request(
      `${base}/api/inventory/${firstId}/offers`,
      { method: 'POST' },
      { buyerName: '测试买家', price: Math.round(expected * 0.8) }
    );
    results.push(['提交出价', offers.status === 201, `出价 ¥${offers.body?.price?.toLocaleString()}`]);
    console.log(`✅ 提交出价: ${offers.status === 201 ? '通过' : '失败'}`);
  } catch (e) {
    results.push(['提交出价', false, e.message]);
    console.log(`❌ 提交出价: ${e.message}`);
  }

  try {
    const list = await request(`${base}/api/inventory`);
    const firstId = list.body[0]?.id;
    const expected = list.body[0]?.expectedPrice;
    const offers = await request(
      `${base}/api/inventory/${firstId}/offers`,
      { method: 'POST' },
      { buyerName: '低价测试', price: Math.round(expected * 0.5) }
    );
    results.push(['低价出价拦截', offers.status === 400, offers.body?.error]);
    console.log(`✅ 低价出价拦截: ${offers.status === 400 ? '通过' : '失败'}`);
  } catch (e) {
    results.push(['低价出价拦截', false, e.message]);
    console.log(`❌ 低价出价拦截: ${e.message}`);
  }

  try {
    const list = await request(`${base}/api/inventory`);
    const firstId = list.body[0]?.id;
    const offers = await request(`${base}/api/inventory/${firstId}/offers`);
    results.push(['获取出价列表', offers.status === 200 && Array.isArray(offers.body), `共 ${offers.body?.length || 0} 条出价`]);
    console.log(`✅ 获取出价列表: ${offers.status === 200 ? '通过' : '失败'}`);
  } catch (e) {
    results.push(['获取出价列表', false, e.message]);
    console.log(`❌ 获取出价列表: ${e.message}`);
  }

  try {
    const list = await request(`${base}/api/inventory`);
    const firstId = list.body[0]?.id;
    const offerList = await request(`${base}/api/inventory/${firstId}/offers`);
    const pendingOffer = offerList.body.find((o) => o.status === 'pending');
    if (pendingOffer) {
      const accept = await request(
        `${base}/api/offers/${pendingOffer.id}/accept`,
        { method: 'POST' }
      );
      results.push(['接受出价', accept.status === 200 && accept.body?.status === 'accepted', accept.body?.status]);
      console.log(`✅ 接受出价: ${accept.status === 200 ? '通过' : '失败'}`);
    } else {
      results.push(['接受出价', false, '无待处理出价']);
      console.log(`⚠️  接受出价: 无待处理出价`);
    }
  } catch (e) {
    results.push(['接受出价', false, e.message]);
    console.log(`❌ 接受出价: ${e.message}`);
  }

  try {
    const list = await request(`${base}/api/inventory`);
    const firstId = list.body[0]?.id;
    const offerList = await request(`${base}/api/inventory/${firstId}/offers`);
    const pendingOffer = offerList.body.find((o) => o.status === 'pending');
    if (pendingOffer) {
      const reject = await request(
        `${base}/api/offers/${pendingOffer.id}/reject`,
        { method: 'POST' }
      );
      results.push(['拒绝出价', reject.status === 200 && reject.body?.status === 'rejected', reject.body?.status]);
      console.log(`✅ 拒绝出价: ${reject.status === 200 ? '通过' : '失败'}`);
    } else {
      results.push(['拒绝出价', false, '无待处理出价']);
      console.log(`⚠️  拒绝出价: 无待处理出价`);
    }
  } catch (e) {
    results.push(['拒绝出价', false, e.message]);
    console.log(`❌ 拒绝出价: ${e.message}`);
  }

  try {
    const val = await request(
      `${base}/api/valuation`,
      { method: 'POST' },
      { brand: '雅马哈', model: 'FG830', usageYears: 2, condition: 8 }
    );
    results.push([
      '估价(型号匹配)',
      val.status === 200 && typeof val.body?.suggestedPrice === 'number',
      `建议价 ¥${val.body?.suggestedPrice?.toLocaleString()} (基准价 ¥${val.body?.marketReference?.toLocaleString()})`,
    ]);
    console.log(`✅ 估价(型号匹配): ${val.status === 200 ? '通过' : '失败'} (建议价 ¥${val.body?.suggestedPrice?.toLocaleString()})`);
  } catch (e) {
    results.push(['估价(型号匹配)', false, e.message]);
    console.log(`❌ 估价(型号匹配): ${e.message}`);
  }

  try {
    const val = await request(
      `${base}/api/valuation`,
      { method: 'POST' },
      { brand: '未知品牌', model: 'XYZ', usageYears: 3, condition: 7 }
    );
    results.push([
      '估价(兜底逻辑)',
      val.status === 200 && val.body?.suggestedPrice > 0,
      `兜底价 ¥${val.body?.suggestedPrice?.toLocaleString()}`,
    ]);
    console.log(`✅ 估价(兜底逻辑): ${val.status === 200 ? '通过' : '失败'}`);
  } catch (e) {
    results.push(['估价(兜底逻辑)', false, e.message]);
    console.log(`❌ 估价(兜底逻辑): ${e.message}`);
  }

  try {
    const brands = await request(`${base}/api/valuation/brands`);
    results.push(['获取品牌列表', brands.status === 200 && Array.isArray(brands.body) && brands.body.length === 8, brands.body]);
    console.log(`✅ 获取品牌列表: ${brands.status === 200 ? '通过' : '失败'} (${brands.body?.length || 0}个品牌)`);
  } catch (e) {
    results.push(['获取品牌列表', false, e.message]);
    console.log(`❌ 获取品牌列表: ${e.message}`);
  }

  try {
    const filter = await request(`${base}/api/inventory?category=guitar`);
    results.push(['分类筛选', filter.status === 200 && filter.body.every((i) => i.category === 'guitar'), `共 ${filter.body?.length || 0} 个吉他`]);
    console.log(`✅ 分类筛选: ${filter.status === 200 ? '通过' : '失败'}`);
  } catch (e) {
    results.push(['分类筛选', false, e.message]);
    console.log(`❌ 分类筛选: ${e.message}`);
  }

  try {
    const filter = await request(`${base}/api/inventory?priceMin=5000&priceMax=20000`);
    results.push(['价格筛选', filter.status === 200 && filter.body.every((i) => i.expectedPrice >= 5000 && i.expectedPrice <= 20000), `共 ${filter.body?.length || 0} 个`]);
    console.log(`✅ 价格筛选: ${filter.status === 200 ? '通过' : '失败'}`);
  } catch (e) {
    results.push(['价格筛选', false, e.message]);
    console.log(`❌ 价格筛选: ${e.message}`);
  }

  console.log('='.repeat(60));
  const passCount = results.filter((r) => r[1]).length;
  const totalCount = results.length;
  console.log(`📊 测试结果: ${passCount}/${totalCount} 通过`);
  console.log('='.repeat(60));

  if (passCount === totalCount) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️  以下测试失败：');
    results
      .filter((r) => !r[1])
      .forEach((r) => {
        console.log(`   ❌ ${r[0]}: ${r[2]}`);
      });
  }
}

runTests().catch(console.error);
