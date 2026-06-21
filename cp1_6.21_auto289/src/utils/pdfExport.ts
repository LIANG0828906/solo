import type { Task, Client, Settings } from '../../shared/types';
import { formatDuration, formatDate } from './timeUtils';

export interface InvoiceData {
  client: Client;
  tasks: Task[];
  settings: Settings;
  startDate: string;
  endDate: string;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const { client, tasks, settings, startDate, endDate } = data;
  
  const totalSeconds = tasks.reduce((sum, task) => sum + task.duration, 0);
  const totalHours = totalSeconds / 3600;
  const totalAmount = totalHours * settings.hourlyRate;
  
  const invoiceNumber = 'INV-' + Date.now();
  const invoiceDate = new Date().toLocaleDateString('zh-CN');

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>发票 - ${client.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #1E293B;
      padding: 40px;
      background: #fff;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1E1B4B;
      margin-bottom: 8px;
    }
    .invoice-title p {
      color: #64748B;
      font-size: 14px;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #E2E8F0;
    }
    .info-block h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #94A3B8;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .info-block p {
      font-size: 14px;
      color: #334155;
      line-height: 1.6;
    }
    .client-info {
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      text-align: left;
      padding: 12px 16px;
      background: #F1F5F9;
      color: #475569;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:last-child {
      text-align: right;
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #E2E8F0;
      color: #334155;
    }
    td:last-child {
      text-align: right;
      font-weight: 500;
    }
    tr:hover td {
      background: #F8FAFC;
    }
    .task-name {
      font-weight: 500;
      color: #1E293B;
    }
    .task-date {
      font-size: 12px;
      color: #94A3B8;
      margin-top: 4px;
    }
    .totals {
      margin-left: auto;
      width: 280px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      color: #64748B;
    }
    .total-row.final {
      border-top: 2px solid #E2E8F0;
      margin-top: 10px;
      padding-top: 15px;
    }
    .total-row.final .label {
      font-weight: 600;
      color: #1E293B;
      font-size: 16px;
    }
    .total-row.final .amount {
      font-weight: 700;
      color: #6366F1;
      font-size: 20px;
    }
    .invoice-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E2E8F0;
      text-align: center;
      color: #94A3B8;
      font-size: 12px;
    }
    .amount {
      font-variant-numeric: tabular-nums;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="logo">
        ${settings.logoData 
          ? `<img src="${settings.logoData}" alt="Logo">` 
          : `<span>${settings.userName.charAt(0)}</span>`
        }
      </div>
      <div class="invoice-title">
        <h1>发票</h1>
        <p>发票编号: ${invoiceNumber}</p>
        <p>开具日期: ${invoiceDate}</p>
      </div>
    </div>

    <div class="invoice-info">
      <div class="info-block">
        <h3>服务提供方</h3>
        <p><strong>${settings.userName}</strong></p>
        <p>服务费率: ¥${settings.hourlyRate.toFixed(2)}/小时</p>
      </div>
      <div class="info-block client-info">
        <h3>客户信息</h3>
        <p><strong>${client.name}</strong></p>
        ${client.email ? `<p>${client.email}</p>` : ''}
        ${client.address ? `<p>${client.address}</p>` : ''}
      </div>
    </div>

    <div class="info-block" style="margin-bottom: 16px;">
      <h3>服务周期</h3>
      <p>${formatDate(startDate)} - ${formatDate(endDate)}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>任务描述</th>
          <th>日期</th>
          <th>时长</th>
          <th>金额</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map(task => {
          const hours = task.duration / 3600;
          const amount = hours * settings.hourlyRate;
          return `
            <tr>
              <td>
                <div class="task-name">${task.name}</div>
              </td>
              <td>${formatDate(task.startTime)}</td>
              <td>${formatDuration(task.duration)}</td>
              <td class="amount">¥${amount.toFixed(2)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>总工时</span>
        <span class="amount">${formatDuration(totalSeconds)}</span>
      </div>
      <div class="total-row">
        <span>小时费率</span>
        <span class="amount">¥${settings.hourlyRate.toFixed(2)}</span>
      </div>
      <div class="total-row final">
        <span class="label">合计金额</span>
        <span class="amount">¥${totalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="invoice-footer">
      <p>感谢您的合作！如有任何疑问，请随时联系。</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function exportToPdf(data: InvoiceData): void {
  const html = generateInvoiceHtml(data);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('请允许弹出窗口以生成发票');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}
