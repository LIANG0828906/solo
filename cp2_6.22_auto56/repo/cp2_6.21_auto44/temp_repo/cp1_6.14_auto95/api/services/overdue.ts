import nodemailer from 'nodemailer'
import cron from 'node-cron'
import { db, createNotification, getConfig } from '../db/index.js'

export async function checkOverdueLoans(): Promise<void> {
  await db.read()
  const config = db.data.config
  const now = new Date()

  for (const loan of db.data.loans) {
    if (loan.status !== 'borrowed') continue
    const dueDate = new Date(loan.dueDate)
    if (now > dueDate) {
      loan.status = 'overdue'
      const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      loan.lateFee = daysOverdue * config.lateFeePerDay

      await createNotification({
        readerId: loan.readerId,
        type: 'overdue',
        content: `您借阅的图书已逾期${daysOverdue}天，请尽快归还。逾期费用：${loan.lateFee.toFixed(2)}元`,
        isRead: false,
        sentAt: now.toISOString(),
      })

      const reader = db.data.readers.find((r) => r.id === loan.readerId)
      const book = db.data.books.find((b) => b.id === loan.bookId)
      if (reader && book) {
        await sendOverdueEmail(reader.email, reader.name, book.title, daysOverdue, loan.lateFee)
      }
    }
  }

  await db.write()
}

export async function sendOverdueEmail(
  email: string,
  name: string,
  bookTitle: string,
  daysOverdue: number,
  lateFee: number,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || 'eloise.schowalter@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'dummy-password',
    },
  })

  try {
    await transporter.sendMail({
      from: '"社区图书馆" <library@community.com>',
      to: email,
      subject: '图书逾期提醒',
      html: `
        <p>尊敬的${name}：</p>
        <p>您借阅的《${bookTitle}》已逾期${daysOverdue}天。</p>
        <p>当前逾期费用：${lateFee.toFixed(2)}元</p>
        <p>请尽快归还图书，谢谢！</p>
      `,
    })
  } catch {
    console.error(`发送逾期邮件失败：${email}`)
  }
}

export function startCronJobs(): void {
  cron.schedule('0 0 * * *', async () => {
    console.log('执行逾期检查定时任务...')
    await checkOverdueLoans()
    console.log('逾期检查完成')
  })
  console.log('定时任务已启动：每天凌晨0点检查逾期借阅')
}
