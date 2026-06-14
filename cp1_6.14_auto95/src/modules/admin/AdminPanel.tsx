import { useState } from 'react';
import {
  BookOpen, Users, FileText, BarChart3, Settings, Bell
} from 'lucide-react';
import BookManagement from './BookManagement';
import ReaderManagement from './ReaderManagement';
import LoanRecords from './LoanRecords';
import Reports from './Reports';
import OverdueConfig from './OverdueConfig';

const TABS = [
  { key: 'books', label: '藏书管理', icon: BookOpen },
  { key: 'readers', label: '读者管理', icon: Users },
  { key: 'loans', label: '借阅记录', icon: FileText },
  { key: 'reports', label: '统计报表', icon: BarChart3 },
  { key: 'config', label: '逾期规则', icon: Settings },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('books');

  return (
    <div className="page-enter pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-accent">管理员面板</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-48 shrink-0">
            <div className="admin-sidebar flex lg:flex-col gap-1 bg-white rounded-xl p-2 border border-secondary/30 shadow-sm">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`btn-press flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === key
                      ? 'bg-accent text-white'
                      : 'text-gray-600 hover:bg-secondary/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {activeTab === 'books' && <BookManagement />}
            {activeTab === 'readers' && <ReaderManagement />}
            {activeTab === 'loans' && <LoanRecords />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'config' && <OverdueConfig />}
          </div>
        </div>
      </div>
    </div>
  );
}
