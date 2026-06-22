import jsPDF from 'jspdf';
import type { Receipt, Customer, Statement } from '../../shared/types';
import { formatCurrency, formatDate, formatReceiptStatus } from './format';

const getTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

export const exportReceiptToPDF = (receipt: Receipt, customer?: Customer): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: ${receipt.receiptNo}`, 20, yPos);
  yPos += 8;
  doc.text(`Date: ${formatDate(receipt.date)}`, 20, yPos);
  yPos += 8;
  doc.text(`Status: ${formatReceiptStatus(receipt.status)}`, 20, yPos);
  yPos += 12;

  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customer ? customer.name : receipt.customerName}`, 20, yPos);
  yPos += 7;
  if (customer) {
    doc.text(`Company: ${customer.company}`, 20, yPos);
    yPos += 7;
    doc.text(`Email: ${customer.email}`, 20, yPos);
    yPos += 7;
    doc.text(`Phone: ${customer.phone}`, 20, yPos);
    yPos += 7;
    doc.text(`Address: ${customer.address}`, 20, yPos);
    yPos += 12;
  } else {
    yPos += 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Details', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Type: ${receipt.transactionType === 'service' ? 'Service' : 'Product'}`, 20, yPos);
  yPos += 7;
  doc.text(`Amount: ${formatCurrency(receipt.amount)}`, 20, yPos);
  yPos += 7;
  doc.text(`Tax Rate: ${(receipt.taxRate * 100).toFixed(0)}%`, 20, yPos);
  yPos += 7;
  doc.text(`Tax Amount: ${formatCurrency(receipt.taxAmount)}`, 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Total: ${formatCurrency(receipt.totalAmount)}`, 20, yPos);
  yPos += 12;

  if (receipt.paymentInfo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Payment Information', 20, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    if (receipt.paymentInfo.date) {
      doc.text(`Payment Date: ${formatDate(receipt.paymentInfo.date)}`, 20, yPos);
      yPos += 7;
    }
    if (receipt.paymentInfo.method) {
      doc.text(`Payment Method: ${receipt.paymentInfo.method}`, 20, yPos);
      yPos += 7;
    }
    if (receipt.paymentInfo.amount) {
      doc.text(`Paid Amount: ${formatCurrency(receipt.paymentInfo.amount)}`, 20, yPos);
      yPos += 7;
    }
    yPos += 5;
  }

  if (receipt.note) {
    doc.setFont('helvetica', 'bold');
    doc.text('Note:', 20, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(receipt.note, pageWidth - 40);
    doc.text(noteLines, 20, yPos);
  }

  const fileName = `receipt_${receipt.receiptNo}_${getTimestamp()}.pdf`;
  doc.save(fileName);
};

export const exportStatementToPDF = (statement: Statement): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT STATEMENT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${statement.customerName}`, 20, yPos);
  yPos += 8;
  doc.text(`Period: ${formatDate(statement.startDate)} to ${formatDate(statement.endDate)}`, 20, yPos);
  yPos += 12;

  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Opening Balance: ${formatCurrency(statement.summary.openingBalance)}`, 20, yPos);
  yPos += 7;
  doc.text(`Total Debit: ${formatCurrency(statement.summary.totalDebit)}`, 20, yPos);
  yPos += 7;
  doc.text(`Total Credit: ${formatCurrency(statement.summary.totalCredit)}`, 20, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Closing Balance: ${formatCurrency(statement.summary.closingBalance)}`, 20, yPos);
  yPos += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 20, yPos);
  yPos += 10;

  const colX = [20, 50, 110, 145, 180];
  const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];

  doc.setFont('helvetica', 'bold');
  headers.forEach((header, index) => {
    doc.text(header, colX[index], yPos);
  });
  yPos += 8;

  doc.line(20, yPos - 3, pageWidth - 10, yPos - 3);
  yPos += 3;

  doc.setFont('helvetica', 'normal');
  statement.items.forEach((item) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(formatDate(item.date), colX[0], yPos);
    const descLines = doc.splitTextToSize(item.description, 55);
    doc.text(descLines, colX[1], yPos);
    doc.text(item.debit > 0 ? formatCurrency(item.debit) : '-', colX[2], yPos);
    doc.text(item.credit > 0 ? formatCurrency(item.credit) : '-', colX[3], yPos);
    doc.text(formatCurrency(item.balance), colX[4], yPos);
    yPos += 7 * descLines.length;
  });

  const fileName = `statement_${statement.customerId}_${getTimestamp()}.pdf`;
  doc.save(fileName);
};
