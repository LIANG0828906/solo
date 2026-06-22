const fs = require('fs');

function generateSamplePDF() {
  const pages = [
    {
      title: '第一章：课程介绍',
      content: [
        '欢迎来到本课程！',
        '',
        '本课程将带领您学习以下内容：',
        '  1. 基础知识回顾',
        '  2. 核心概念讲解',
        '  3. 实践案例分析',
        '  4. 综合项目练习',
        '',
        '请认真阅读每一页的内容，',
        '并在重要处添加标注和笔记。',
      ],
    },
    {
      title: '第二章：核心概念',
      content: [
        '核心概念是学习的基础。',
        '',
        '重点知识：',
        '  • 定义：描述事物本质特征',
        '  • 原理：事物运行的内在规律',
        '  • 方法：解决问题的步骤',
        '  • 应用：知识的实际使用',
        '',
        '【重要提示】',
        '请务必掌握这些基本概念，',
        '它们是后续学习的基石。',
      ],
    },
    {
      title: '第三章：实践应用',
      content: [
        '理论联系实际，学以致用。',
        '',
        '实践步骤：',
        '  1. 分析问题场景',
        '  2. 选择合适方法',
        '  3. 制定实施方案',
        '  4. 执行并验证结果',
        '',
        '【思考题】',
        '请思考：在你的工作中，',
        '如何应用本章所学知识？',
        '',
        '可以在右侧添加批注，',
        '与同学一起讨论！',
      ],
    },
    {
      title: '第四章：总结与展望',
      content: [
        '课程内容总结',
        '',
        '我们学习了：',
        '  - 基础概念',
        '  - 核心原理',
        '  - 实践方法',
        '  - 应用技巧',
        '',
        '继续学习建议：',
        '  • 多做练习题',
        '  • 参与项目实践',
        '  • 与他人交流讨论',
        '',
        '感谢学习本课程！',
      ],
    },
  ];

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;

  let pdfContent = '';
  const objects = [];
  let objectId = 1;

  objects.push({
    id: objectId++,
    content: `<< /Type /Catalog /Pages 2 0 R >>`,
  });

  const kids = [];
  for (let i = 0; i < pages.length; i++) {
    kids.push(`${4 + i * 2} 0 R`);
  }

  objects.push({
    id: objectId++,
    content: `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`,
  });

  objects.push({
    id: objectId++,
    content: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const contentStreamId = objectId++;

    let streamContent = 'BT\n';
    streamContent += `/F1 18 Tf\n`;
    streamContent += `${margin} ${pageHeight - margin} Td\n`;
    streamContent += `(${escapePDF(page.title)}) Tj\n`;
    streamContent += `0 -30 Td\n`;
    streamContent += `/F1 12 Tf\n`;

    for (const line of page.content) {
      streamContent += `0 -18 Td\n`;
      streamContent += `(${escapePDF(line)}) Tj\n`;
    }

    streamContent += 'ET';

    objects.push({
      id: contentStreamId,
      content: `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`,
      stream: true,
    });

    objects.push({
      id: 4 + i * 2,
      content: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentStreamId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`,
    });
    objectId++;
  }

  const offsets = [];
  let position = 0;

  pdfContent += '%PDF-1.4\n';
  position += pdfContent.length;

  for (const obj of objects) {
    offsets.push(position);
    pdfContent += `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
    position = pdfContent.length;
  }

  const xrefStart = position;
  pdfContent += `xref\n0 ${objects.length + 1}\n`;
  pdfContent += `0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdfContent += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  pdfContent += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdfContent += `startxref\n${xrefStart}\n%%EOF`;

  return pdfContent;
}

function escapePDF(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

const pdf = generateSamplePDF();
fs.writeFileSync('public/sample.pdf', pdf, 'binary');
console.log('sample.pdf 已生成到 public/ 目录');
