const assert = require('assert');

(async function() {
  const base = 'http://localhost:3001';
  let allPassed = true;
  const pass = (name) => console.log(`✅ PASS: ${name}`);
  const fail = (name, err) => { console.log(`❌ FAIL: ${name}`, err || ''); allPassed = false; };

  console.log('========== 后端 API 完整测试 ==========\n');

  try {
    console.log('1. 测试 GET /api/port');
    let r = await fetch(base + '/api/port');
    assert.strictEqual(r.status, 200, '状态码应为200');
    const portData = await r.json();
    assert.ok(portData.port >= 3001 && portData.port < 3011, '端口应在范围内');
    pass('返回端口号 ' + portData.port);
  } catch (e) { fail('GET /api/port', e.message); }

  let initialStatus, initialHistoryCount;
  try {
    console.log('\n2. 测试 GET /api/contract');
    let r = await fetch(base + '/api/contract');
    assert.strictEqual(r.status, 200);
    const d = await r.json();
    initialStatus = d.approvalStatus;
    initialHistoryCount = d.history.length;
    assert.ok(['pending', 'reviewing', 'approved', 'rejected'].includes(d.approvalStatus), '状态合法');
    assert.ok(Array.isArray(d.history), 'history是数组');
    assert.ok(Array.isArray(d.comments), 'comments是数组');
    assert.strictEqual(typeof d.oldContent, 'string', 'oldContent是字符串');
    pass(`初始状态=${initialStatus}, 历史=${initialHistoryCount}条, 批注=${d.comments.length}条`);
  } catch (e) { fail('GET /api/contract', e.message); }

  try {
    console.log('\n3. 测试 POST /api/approve (审批通过)');
    let r = await fetch(base + '/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', user: '法务-王五' })
    });
    assert.strictEqual(r.status, 200, 'POST审批状态码');
    const res = await r.json();
    assert.strictEqual(res.status, 'approved');
    assert.ok(res.history.length >= 1, '历史记录至少1条');
    pass(`审批通过成功, status=${res.status}, history=${res.history.length}条`);
  } catch (e) { fail('POST /api/approve', e.message); }

  let firstCommentId;
  try {
    console.log('\n4. 测试 POST /api/comment (添加根批注)');
    let r = await fetch(base + '/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineIndex: 5, content: '第5行的新增条款很重要，请法务确认', author: '张三' })
    });
    assert.strictEqual(r.status, 201);
    const c = await r.json();
    assert.ok(c.id, '有id');
    assert.strictEqual(c.parentId, null, '根节点parentId为null');
    assert.ok(Array.isArray(c.replies), 'replies是数组');
    assert.strictEqual(c.author, '张三');
    firstCommentId = c.id;
    pass(`批注创建成功 id=${c.id.slice(0,8)}... parentId=${c.parentId}`);
  } catch (e) { fail('POST /api/comment (根)', e.message); }

  let replyId;
  try {
    console.log('\n5. 测试 POST /api/comment (嵌套回复 parentId)');
    let r = await fetch(base + '/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineIndex: -1, content: '同意张三的意见，已和法务确认', author: '李四', parentId: firstCommentId })
    });
    assert.strictEqual(r.status, 201);
    const reply = await r.json();
    assert.strictEqual(reply.parentId, firstCommentId, '回复的parentId正确');
    replyId = reply.id;
    pass(`嵌套回复成功 id=${reply.id.slice(0,8)}... parentId=${reply.parentId.slice(0,8)}...`);
  } catch (e) { fail('POST /api/comment (嵌套回复)', e.message); }

  try {
    console.log('\n6. 测试 POST /api/comment (多层嵌套 二级回复)');
    let r = await fetch(base + '/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineIndex: -1, content: '收到，马上联系客户确认', author: '王五', parentId: replyId })
    });
    assert.strictEqual(r.status, 201);
    const l2 = await r.json();
    assert.strictEqual(l2.parentId, replyId, '二级回复的parentId正确');
    pass(`二级嵌套回复成功 id=${l2.id.slice(0,8)}... parentId=${l2.parentId.slice(0,8)}...`);
  } catch (e) { fail('POST /api/comment (二级嵌套)', e.message); }

  try {
    console.log('\n7. 验证 Comment parentId 索引性能 + 数据完整性');
    let r = await fetch(base + '/api/contract');
    const final = await r.json();
    assert.strictEqual(final.approvalStatus, 'approved', '状态保持为通过');
    assert.ok(final.comments.length >= 1, '至少有1条顶层批注');
    const root = final.comments[final.comments.length - 1];
    assert.ok(root.replies.length >= 1, '根批注至少1条回复');
    const firstReply = root.replies[0];
    assert.ok(firstReply.replies.length >= 1, '一级回复至少1条二级回复');
    assert.strictEqual(final.comments.length, final.comments.filter(c => c.parentId === null).length, '所有顶层批注parentId都为null');
    pass(`数据结构: 顶层批注=${final.comments.length} 一级回复=${root.replies.length} 二级回复=${firstReply.replies.length}`);
  } catch (e) { fail('数据完整性验证', e.message); }

  try {
    console.log('\n8. 验证 历史记录倒序排列');
    let r = await fetch(base + '/api/contract');
    const final = await r.json();
    const timestamps = final.history.map(h => h.timestamp);
    let isDescending = true;
    for (let i = 0; i < timestamps.length - 1; i++) {
      if (timestamps[i] < timestamps[i+1]) { isDescending = false; break; }
    }
    assert.ok(final.history.length >= 3, '至少3条历史记录');
    assert.ok(isDescending, '时间戳严格递减');
    pass(`历史排序: ${final.history.length}条记录 ✔时间倒序`);
    final.history.slice(0,3).forEach((h,i) => console.log(`   [${i}] ${new Date(h.timestamp).toLocaleString()} ${h.description.slice(0,24)}`));
  } catch (e) { fail('历史记录排序', e.message); }

  try {
    console.log('\n9. 测试 POST /api/approve (驳回)');
    let r = await fetch(base + '/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', user: '法务-赵六' })
    });
    assert.strictEqual(r.status, 200);
    const res = await r.json();
    assert.strictEqual(res.status, 'rejected');
    pass(`驳回成功 status=${res.status}, 历史=${res.history.length}条`);
  } catch (e) { fail('POST /api/approve (驳回)', e.message); }

  console.log('\n========== ' + (allPassed ? '✅ 全部测试通过!' : '❌ 有测试失败') + ' ==========');
  process.exit(allPassed ? 0 : 1);
})();
