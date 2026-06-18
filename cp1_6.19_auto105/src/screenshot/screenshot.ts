import { useStore } from '@/store/useStore';

export function captureScreenshot(): string | null {
  const canvas = document.querySelector('canvas');
  if (!canvas) return null;

  try {
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Failed to capture screenshot:', e);
    return null;
  }
}

export async function exportReport(): Promise<void> {
  const state = useStore.getState();
  const { artifactInfo, mode, isCutaway } = state;

  const canvas = document.querySelector('canvas');
  if (!canvas) {
    alert('无法获取3D场景画面');
    return;
  }

  const screenshotData = canvas.toDataURL('image/png');

  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    alert('请允许弹出窗口以生成报告');
    return;
  }

  const damageList = artifactInfo.damages
    .map(
      (d) => `
      <div style="margin-bottom: 8px; padding: 8px; background: #fef3c7; border-radius: 6px;">
        <strong style="color: #92400e;">${d.type}</strong>
        <span style="float: right; color: #d97706; font-size: 0.8em;">${d.size}</span>
        <p style="margin: 4px 0 0 0; font-size: 0.85em; color: #78350f;">${d.description}</p>
      </div>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>文物修复报告 - ${artifactInfo.dynasty} ${artifactInfo.name}</title>
      <style>
        body {
          font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
          margin: 0;
          padding: 40px;
          background: #f5f5f0;
          color: #333;
        }
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          border-radius: 8px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0A3A75;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #0A3A75;
          margin: 0;
          font-size: 24px;
        }
        .header .subtitle {
          color: #666;
          margin-top: 8px;
          font-size: 14px;
        }
        .screenshot-section {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: #1A1A1A;
          border-radius: 8px;
        }
        .screenshot-section img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .info-item {
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .info-item .value {
          font-size: 18px;
          font-weight: bold;
          color: #0A3A75;
        }
        .info-item .label {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        .section {
          margin: 30px 0;
        }
        .section h2 {
          color: #0A3A75;
          font-size: 18px;
          border-left: 4px solid #0A3A75;
          padding-left: 12px;
          margin: 0 0 15px 0;
        }
        .repair-section {
          background: #ecfdf5;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #10b981;
        }
        .repair-section h3 {
          color: #065f46;
          margin: 0 0 10px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        .mode-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .mode-damaged {
          background: #fef3c7;
          color: #92400e;
        }
        .mode-repaired {
          background: #d1fae5;
          color: #065f46;
        }
        .print-btn {
          display: block;
          width: 200px;
          margin: 20px auto;
          padding: 12px 24px;
          background: #0A3A75;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
        .print-btn:hover {
          background: #1A5BB5;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .report-container {
            box-shadow: none;
            padding: 20px;
          }
          .print-btn {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <h1>文物修复报告</h1>
          <div class="subtitle">
            ${artifactInfo.dynasty} ${artifactInfo.name} · ${artifactInfo.year}
          </div>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <span class="mode-badge ${mode === 'damaged' ? 'mode-damaged' : 'mode-repaired'}">
            当前状态：${mode === 'damaged' ? '破损状态' : '修复后'}
            ${isCutaway ? ' · 剖视图' : ''}
          </span>
        </div>

        <div class="screenshot-section">
          <img src="${screenshotData}" alt="文物3D视图" />
        </div>

        <div class="section">
          <h2>基本信息</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="value">${artifactInfo.dimensions.height}</div>
              <div class="label">通高</div>
            </div>
            <div class="info-item">
              <div class="value">${artifactInfo.dimensions.diameter}</div>
              <div class="label">口径</div>
            </div>
            <div class="info-item">
              <div class="value">${artifactInfo.dimensions.footDiameter}</div>
              <div class="label">足径</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>破损状况</h2>
          ${damageList}
        </div>

        <div class="section">
          <h2>修复方案</h2>
          <div class="repair-section">
            <h3>修复材料</h3>
            <p style="margin: 0 0 10px 0; color: #065f46;">
              ${artifactInfo.repair.material}
            </p>
            <h3 style="margin-top: 15px;">修复原则</h3>
            <p style="margin: 0; color: #047857; font-size: 0.9em;">
              ${artifactInfo.repair.description}
            </p>
          </div>
        </div>

        <button class="print-btn" onclick="window.print()">打印 / 导出PDF</button>

        <div class="footer">
          古董瓷器修复3D对比可视化工具 · 生成于 ${new Date().toLocaleDateString('zh-CN')}
        </div>
      </div>
    </body>
    </html>
  `;

  reportWindow.document.open();
  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
}
