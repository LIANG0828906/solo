// 测试管理员功能
const BASE_URL = 'http://localhost:3001/api';

const ADMIN_TOKEN = 'admin-token';

async function testAdminAPI() {
  console.log('=== 测试管理员API ===\n');

  try {
    // 1. 测试获取待审核书籍
    console.log('1. 获取待审核书籍...');
    const pendingBooks = await fetch(`${BASE_URL}/books?status=pending`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    }).then(res => res.json());
    console.log('   待审核书籍数量:', pendingBooks.data?.length || 0);
    pendingBooks.data?.forEach(book => {
      console.log(`   - ${book.title} (ID: ${book.id})`);
    });
    console.log();

    // 2. 测试审核通过第一本书
    if (pendingBooks.data?.length > 0) {
      const firstBook = pendingBooks.data[0];
      console.log(`2. 测试审核通过书籍: ${firstBook.title}...`);
      const approveResult = await fetch(`${BASE_URL}/books/${firstBook.id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      }).then(res => res.json());
      console.log('   审核结果:', approveResult.success ? '成功' : '失败');
      console.log('   书籍状态:', approveResult.data?.status);
      console.log();

      // 3. 测试拒绝书籍（需要先创建一本测试用的待审核书籍
      console.log('3. 创建测试书籍...');
      const newBook = await fetch(`${BASE_URL}/books`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: '测试拒绝测试',
          author: '测试作者',
          publishYear: 2024,
          description: '这是一本用于测试拒绝功能的书籍',
          coverUrl: 'https://picsum.photos/seed/testbook/300/400',
          category: 'novel',
          transactionType: 'sale',
          price: 99
        })
      }).then(res => res.json());

      if (newBook.success) {
        console.log('   创建成功，书籍ID:', newBook.data.id);
        console.log();

        console.log('4. 测试拒绝书籍...');
        const rejectResult = await fetch(`${BASE_URL}/books/${newBook.data.id}/review`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'rejected',
            rejectReason: '书籍内容不符合规范，请重新提交'
          })
        }).then(res => res.json());
        console.log('   拒绝结果:', rejectResult.success ? '成功' : '失败');
        console.log('   书籍状态:', rejectResult.data?.status);
        console.log('   拒绝原因:', rejectResult.data?.rejectReason);
        console.log();
      }
    }

    // 5. 测试获取交易记录
    console.log('5. 获取交易记录...');
    const transactions = await fetch(`${BASE_URL}/transactions?sortBy=date&sortOrder=desc`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    }).then(res => res.json());
    console.log('   交易记录数量:', transactions.data?.length || 0);
    console.log();

    // 6. 测试按状态筛选交易记录
    console.log('6. 测试状态筛选 - 待确认交易...');
    const pendingTransactions = await fetch(`${BASE_URL}/transactions?status=pending&sortBy=date&sortOrder=desc`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    }).then(res => res.json());
    console.log('   待确认交易数量:', pendingTransactions.data?.length || 0);
    console.log();

    // 7. 测试非管理员访问
    console.log('7. 测试非管理员访问审核接口...');
    const userToken = 'user-token';
    const nonAdminResult = await fetch(`${BASE_URL}/books/test-id/review`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'approved' })
    }).then(res => res.json());
    console.log('   非管理员访问结果:', nonAdminResult.success ? '意外成功' : '正确拒绝');
    console.log('   错误信息:', nonAdminResult.error);
    console.log();

    console.log('=== 测试完成 ===');

  } catch (error) {
    console.error('测试出错:', error.message);
  }
}

testAdminAPI();
