import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const worksPath = path.join(__dirname, 'data', 'works.json');
let worksData = JSON.parse(fs.readFileSync(worksPath, 'utf-8'));

function getWorks() {
  return worksData.works;
}

function getWorkById(id) {
  return worksData.works.find(w => w.id === id);
}

function calculatePrice(work, options) {
  const woodGrade = work.woodGrades.find(g => g.id === options.woodGradeId) || work.woodGrades[0];
  const carving = work.carvingComplexity.find(c => c.id === options.carvingComplexityId) || work.carvingComplexity[0];
  const selectedAccessories = work.accessories.filter(a => options.accessoryIds.includes(a.id));
  const baseWithWood = work.basePrice * woodGrade.priceMultiplier;
  const accessoryTotal = selectedAccessories.reduce((sum, a) => sum + a.price, 0);
  const urgentFee = options.urgent ? work.basePrice * 0.3 : 0;
  const total = baseWithWood + carving.priceAddition + accessoryTotal + urgentFee;
  return {
    basePrice: work.basePrice,
    woodGradeName: woodGrade.name,
    woodGradePrice: baseWithWood,
    woodGradeMultiplier: woodGrade.priceMultiplier,
    carvingName: carving.name,
    carvingPrice: carving.priceAddition,
    accessories: selectedAccessories.map(a => ({ name: a.name, price: a.price })),
    accessoryTotal,
    urgentFee,
    urgentRate: 0.3,
    total: Math.round(total * 100) / 100
  };
}

function generateBarcodeNumber() {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 90 + 10).toString();
  return timestamp + random;
}

async function generateBarcodePNG(code) {
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: code,
      scale: 2,
      height: 20,
      includetext: true,
      textxalign: 'center',
      backgroundcolor: 'FFFFFF',
      barcolor: '333333',
    });
    return png;
  } catch (err) {
    console.error('Barcode generation failed:', err);
    return null;
  }
}

app.get('/api/works', (req, res) => {
  res.json(getWorks());
});

app.get('/api/works/:id', (req, res) => {
  const work = getWorkById(req.params.id);
  if (!work) {
    return res.status(404).json({ error: '作品未找到' });
  }
  res.json(work);
});

app.post('/api/quote', async (req, res) => {
  const { workId, woodGradeId, carvingComplexityId, accessoryIds, urgent } = req.body;
  const work = getWorkById(workId);
  if (!work) {
    return res.status(404).json({ error: '作品未找到' });
  }

  const pricing = calculatePrice(work, {
    woodGradeId,
    carvingComplexityId,
    accessoryIds: accessoryIds || [],
    urgent: urgent || false
  });

  const quoteId = uuidv4();
  const barcodeCode = generateBarcodeNumber();
  const barcodePNG = await generateBarcodePNG(barcodeCode);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 50, right: 50 }
  });

  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quote-${quoteId.substring(0, 8)}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  });

  const pageWidth = 595.28;
  const contentWidth = pageWidth - 100;
  const oakColor = '#D2A679';
  const walnutColor = '#8B5E3C';

  doc.rect(0, 0, pageWidth, 120).fill(oakColor);
  doc.fontSize(28).font('Helvetica-Bold').fillColor('#FFFFFF')
    .text('匠 心 工 坊', 50, 40, { width: contentWidth, align: 'center' });
  doc.fontSize(12).font('Helvetica').fillColor('#FFFFFF')
    .text('CRAFTSMAN STUDIO — 作品报价单', 50, 80, { width: contentWidth, align: 'center' });

  let yPos = 150;

  doc.fontSize(20).font('Helvetica-Bold').fillColor(walnutColor)
    .text(work.name, 50, yPos);
  yPos += 35;

  doc.fontSize(10).font('Helvetica').fillColor('#666666')
    .text(`报价编号：${quoteId.substring(0, 8).toUpperCase()}`, 50, yPos)
    .text(`生成日期：${new Date().toLocaleDateString('zh-CN')}`, 50, yPos + 16);
  yPos += 50;

  doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).strokeColor(oakColor).lineWidth(1).stroke();
  yPos += 20;

  doc.fontSize(14).font('Helvetica-Bold').fillColor(walnutColor)
    .text('报价明细', 50, yPos);
  yPos += 30;

  const items = [
    { label: '作品基价', value: `¥${pricing.basePrice.toFixed(2)}`, note: '' },
    { label: `木料等级：${pricing.woodGradeName}`, value: `¥${pricing.woodGradePrice.toFixed(2)}`, note: `×${pricing.woodGradeMultiplier} 乘数` },
    { label: `雕刻复杂度：${pricing.carvingName}`, value: `¥${pricing.carvingPrice.toFixed(2)}`, note: pricing.carvingPrice > 0 ? '固定加价' : '包含' },
  ];

  pricing.accessories.forEach(a => {
    items.push({ label: `配件：${a.name}`, value: `¥${a.price.toFixed(2)}`, note: '固定加价' });
  });

  if (pricing.urgentFee > 0) {
    items.push({ label: '加急制作', value: `¥${pricing.urgentFee.toFixed(2)}`, note: '基价 × 30%' });
  }

  items.forEach(item => {
    doc.fontSize(11).font('Helvetica').fillColor('#333333')
      .text(item.label, 70, yPos, { width: contentWidth - 180 })
      .text(item.value, 70, yPos, { width: contentWidth - 180, align: 'right' });
    if (item.note) {
      doc.fontSize(9).fillColor('#999999')
        .text(item.note, 70, yPos + 14, { width: contentWidth - 180, align: 'right' });
    }
    yPos += item.note ? 38 : 24;
  });

  yPos += 10;
  doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).strokeColor(oakColor).lineWidth(2).stroke();
  yPos += 20;

  doc.fontSize(18).font('Helvetica-Bold').fillColor(walnutColor)
    .text('合计总价', 70, yPos, { width: contentWidth - 120 })
    .text(`¥${pricing.total.toFixed(2)}`, 70, yPos, { width: contentWidth - 120, align: 'right' });
  yPos += 50;

  doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
  yPos += 20;

  doc.fontSize(11).font('Helvetica').fillColor('#666666')
    .text('材料说明：', 50, yPos);
  yPos += 18;
  doc.fontSize(10).font('Helvetica').fillColor('#888888')
    .text(work.description, 70, yPos, { width: contentWidth - 40, lineGap: 4 });
  yPos += doc.heightOfString(work.description, { width: contentWidth - 40, lineGap: 4 }) + 20;

  if (work.dimensions && work.dimensions.length > 0) {
    doc.fontSize(11).font('Helvetica').fillColor('#666666')
      .text('尺寸规格：', 50, yPos);
    yPos += 18;
    work.dimensions.forEach(dim => {
      doc.fontSize(10).font('Helvetica').fillColor('#888888')
        .text(`${dim.label}：${dim.value}`, 70, yPos);
      yPos += 16;
    });
    yPos += 10;
  }

  yPos += 20;
  doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
  yPos += 20;

  doc.fontSize(11).font('Helvetica').fillColor('#666666')
    .text('条形码（CODE128标准）：', 50, yPos);
  yPos += 10;

  if (barcodePNG) {
    doc.image(barcodePNG, 50, yPos, { width: 220 });
    yPos += 60;
  } else {
    doc.rect(50, yPos, 220, 50).fill('#FFFFFF').stroke('#DDDDDD');
    doc.fontSize(10).font('Courier').fillColor('#333333')
      .text(barcodeCode, 50, yPos + 20, { width: 220, align: 'center' });
    yPos += 60;
  }

  doc.fontSize(8).font('Courier').fillColor('#999999')
    .text(barcodeCode, 50, yPos, { width: 220, align: 'center' });
  yPos += 20;

  doc.fontSize(9).font('Helvetica').fillColor('#BBBBBB')
    .text('本报价单有效期为30天，30天后请重新询价', 50, yPos, { width: contentWidth, align: 'center' });
  yPos += 16;
  doc.fontSize(8).fillColor('#CCCCCC')
    .text('匠心工坊 © 2026 | 保留所有权利', 50, yPos, { width: contentWidth, align: 'center' });

  doc.end();
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'API not found' });
});

app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

export default app;
