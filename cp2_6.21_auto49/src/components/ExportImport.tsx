import React from 'react';
import { Button, Space } from 'antd';
import { ExportOutlined, ImportOutlined } from '@ant-design/icons';
import { useLightStore } from '@/store/lightStore';

function formatDate(date: Date): string {
  const pad = (n: number, len: number = 2) => String(n).padStart(len, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export default function ExportImport() {
  const sun = useLightStore((s) => s.sun);
  const moon = useLightStore((s) => s.moon);
  const updateLight = useLightStore((s) => s.updateLight);

  const handleExport = () => {
    const config = {
      sun: { ...sun },
      moon: { ...moon },
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lighting_config_${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const config = JSON.parse(ev.target?.result as string);
          if (config.sun) {
            updateLight('sun', config.sun);
          }
          if (config.moon) {
            updateLight('moon', config.moon);
          }
        } catch {
          console.error('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="export-import">
      <Space style={{ width: '100%', justifyContent: 'center' }}>
        <Button
          type="primary"
          icon={<ExportOutlined />}
          onClick={handleExport}
          className="btn-export"
        >
          导出配置
        </Button>
        <Button
          type="primary"
          icon={<ImportOutlined />}
          onClick={handleImport}
          className="btn-import"
        >
          导入配置
        </Button>
      </Space>
    </div>
  );
}
