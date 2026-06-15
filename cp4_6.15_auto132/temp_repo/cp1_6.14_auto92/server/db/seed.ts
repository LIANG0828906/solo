import { db } from './index';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type { Customer, Receipt, ReceiptStatus, TransactionType, PaymentInfo } from '../../shared/types/index';

const customerData = [
  { name: '张伟', company: '北京星辰科技有限公司', email: 'zhangwei@startech.com', phone: '13801234567', address: '北京市海淀区中关村大街1号' },
  { name: '李娜', company: '上海韵动文化传媒有限公司', email: 'lina@yunmedia.com', phone: '13902345678', address: '上海市浦东新区陆家嘴金融中心88号' },
  { name: '王强', company: '广州恒信贸易有限公司', email: 'wangqiang@hengxin.com', phone: '13703456789', address: '广州市天河区珠江新城华夏路16号' },
  { name: '刘芳', company: '深圳创新电子科技有限公司', email: 'liufang@cxtech.com', phone: '13604567890', address: '深圳市南山区科技园南区科苑路101号' },
  { name: '陈明', company: '杭州智慧云信息技术有限公司', email: 'chenming@zhihuiyun.com', phone: '13505678901', address: '杭州市西湖区文三路478号' },
];

const statuses: ReceiptStatus[] = ['pending', 'paid', 'overdue', 'partial'];
const transactionTypes: TransactionType[] = ['service', 'product'];
const paymentMethods = ['现金', '银行转账', '微信支付', '支付宝', '支票'];

const serviceNotes = [
  '咨询服务费',
  '技术开发服务费',
  '维护服务费',
  '设计服务费',
  '培训服务费',
  '项目管理费',
  '数据分析服务费',
];

const productNotes = [
  '软件许可证',
  '硬件设备采购',
  '耗材采购',
  '配件订购',
  '设备租赁',
];

function generateReceiptNo(dateKey: string, counter: number): string {
  const sequence = counter.toString().padStart(4, '0');
  return `RCT-${dateKey}-${sequence}`;
}

function getNextCounter(dateKey: string): number {
  const current = db.data!.receiptCounter[dateKey] || 0;
  const next = current + 1;
  db.data!.receiptCounter[dateKey] = next;
  return next;
}

async function seed() {
  db.data!.customers = [];
  db.data!.receipts = [];
  db.data!.receiptCounter = {};

  const customers: Customer[] = customerData.map((c) => ({
    id: uuidv4(),
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    address: c.address,
    createdAt: dayjs().subtract(Math.floor(Math.random() * 90), 'day').toISOString(),
  }));

  db.data!.customers = customers;

  const receipts: Receipt[] = [];
  const today = dayjs('2026-06-14');

  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const receiptDate = today.subtract(daysAgo, 'day');
    const dateKey = receiptDate.format('YYYYMMDD');
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];

    const amount = Math.floor(Math.random() * 50000) + 1000;
    const taxRate = [0.06, 0.09, 0.13][Math.floor(Math.random() * 3)];
    const taxAmount = Math.round(amount * taxRate * 100) / 100;
    const totalAmount = Math.round((amount + taxAmount) * 100) / 100;

    const notes = transactionType === 'service' ? serviceNotes : productNotes;
    const note = notes[Math.floor(Math.random() * notes.length)];

    let paymentInfo: PaymentInfo | undefined;
    if (status === 'paid' || status === 'partial') {
      paymentInfo = {
        date: receiptDate.add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD'),
        method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        amount: status === 'paid' ? totalAmount : Math.round(totalAmount * 0.5 * 100) / 100,
      };
    }

    const counter = getNextCounter(dateKey);
    const receiptNo = generateReceiptNo(dateKey, counter);

    receipts.push({
      id: uuidv4(),
      receiptNo,
      customerId: customer.id,
      customerName: customer.name,
      transactionType,
      amount,
      taxRate,
      taxAmount,
      totalAmount,
      date: receiptDate.format('YYYY-MM-DD'),
      note,
      status,
      paymentInfo,
      createdAt: receiptDate.toISOString(),
    });
  }

  receipts.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  db.data!.receipts = receipts;

  await db.write();

  console.log(`Seed completed: ${customers.length} customers, ${receipts.length} receipts`);
}

seed().catch(console.error);
