import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { FiCoffee, FiUpload } from 'react-icons/fi';
import { IoBarChartSharp, IoDownload } from 'react-icons/io5';
import LogView from './components/LogView';
import StatsView from './components/StatsView';
import Toast from './components/Toast';
import { useLogStore } from './store/logStore';
import type { RoastLevel } from './types';

function App() {
  const [showStats, setShowStats] = useState(false);
  const init = useLogStore((s) => s.init);
  const records = useLogStore((s) => s.records);
  const importRecords = useLogStore((s) => s.importRecords);
  const showToast = useLogStore((s) => s.showToast);

  useEffect(() => {
    init();
  }, [init]);

  const handleExport = () => {
    if (records.length === 0) {
      showToast('暂无数据可导出', 'info');
      return;
    }
    const headers = [
      'date', 'bean', 'roast', 'grind', 'temp',
      'method', 'duration', 'coffeeWeight', 'waterWeight', 'rating'
    ];
    const rows = records.map((r) => [
      r.date, r.bean, r.roast, r.grind, r.temp,
      r.method, r.duration, r.coffeeWeight, r.waterWeight, r.rating
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caffeine-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('导出成功', 'success');
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast('文件大小不能超过2MB', 'error');
        return;
      }
      try {
        const text = await file.text();
        const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          showToast('CSV文件内容为空', 'error');
          return;
        }
        const headerLine = lines.shift()!;
        const headers = headerLine.split(',').map((h) => h.trim());
        const requiredFields = [
          'date', 'bean', 'roast', 'grind', 'temp',
          'method', 'duration', 'coffeeWeight', 'waterWeight', 'rating'
        ];
        const fieldIdx: Record<string, number> = {};
        requiredFields.forEach((f) => {
          fieldIdx[f] = headers.indexOf(f);
        });

        const parsed: Array<{
          date: string; bean: string; roast: RoastLevel; grind: number;
          temp: number; method: string; duration: string;
          coffeeWeight: number; waterWeight: number; rating: number;
        }> = [];

        lines.forEach((line) => {
          const parts = line.split(',');
          parsed.push({
            date: parts[fieldIdx['date']]?.trim() || '',
            bean: parts[fieldIdx['bean']]?.trim() || '',
            roast: (parts[fieldIdx['roast']]?.trim() as RoastLevel) || '中',
            grind: Number(parts[fieldIdx['grind']]?.trim()) || 0,
            temp: Number(parts[fieldIdx['temp']]?.trim()) || 0,
            method: parts[fieldIdx['method']]?.trim() || '',
            duration: parts[fieldIdx['duration']]?.trim() || '',
            coffeeWeight: Number(parts[fieldIdx['coffeeWeight']]?.trim()) || 0,
            waterWeight: Number(parts[fieldIdx['waterWeight']]?.trim()) || 0,
            rating: Number(parts[fieldIdx['rating']]?.trim()) || 0,
          });
        });

        const { skipped } = await importRecords(parsed);
        skipped.forEach((lineNum) => {
          showToast(`第${lineNum}行数据不完整，已跳过`, 'error');
        });
        const successCount = parsed.length - skipped.length;
        if (successCount > 0) {
          showToast(`成功导入${successCount}条记录`, 'success');
        }
      } catch (err) {
        showToast('导入失败，请检查CSV格式', 'error');
      }
    };
    input.click();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          maxWidth: 960,
          minWidth: 320,
          height: 56,
          backgroundColor: '#4A3525',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          '@media (max-width: 640px)': {
            justifyContent: 'center',
            gap: 12,
          },
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E8D6C3' }}>
          <FiCoffee size={22} />
          <span style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}>
            CaffeineLog
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleImportClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              backgroundColor: '#A67B5B',
              color: '#FAF5EF',
              borderRadius: 8,
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8B6343')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#A67B5B')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <FiUpload size={18} />
          </button>
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              backgroundColor: '#A67B5B',
              color: '#FAF5EF',
              borderRadius: 8,
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8B6343')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#A67B5B')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <IoDownload size={18} />
          </button>
          <button
            onClick={() => setShowStats(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              backgroundColor: '#A67B5B',
              color: '#FAF5EF',
              borderRadius: 8,
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8B6343')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#A67B5B')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <IoBarChartSharp size={18} />
          </button>
        </div>
      </nav>

      <main
        style={{
          width: '100%',
          maxWidth: 960,
          minWidth: 320,
          flex: 1,
          padding: '16px',
        }}
      >
        <Routes>
          <Route path="/" element={<LogView />} />
        </Routes>
      </main>

      <StatsView show={showStats} onClose={() => setShowStats(false)} />
      <Toast />
    </div>
  );
}

export default App;
