import { useState, useEffect } from 'react';
import { getReaders } from '../../api';
import { TableSkeleton } from '../../components/Skeleton';
import type { Reader } from '../../types';

export default function ReaderManagement() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReaders()
      .then(setReaders)
      .catch(() => setReaders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-secondary/30 shadow-sm">
      <div className="p-4 border-b border-secondary/30">
        <h2 className="text-lg font-bold text-accent">读者管理</h2>
      </div>

      {loading ? (
        <div className="p-4"><TableSkeleton rows={5} /></div>
      ) : readers.length === 0 ? (
        <div className="p-8 text-center text-gray-400">暂无读者</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600">姓名</th>
                <th className="text-left px-4 py-3 text-gray-600">邮箱</th>
                <th className="text-left px-4 py-3 text-gray-600">角色</th>
                <th className="text-left px-4 py-3 text-gray-600">注册日期</th>
              </tr>
            </thead>
            <tbody>
              {readers.map((reader) => (
                <tr key={reader.id} className="border-t border-secondary/20 hover:bg-secondary/10">
                  <td className="px-4 py-3 font-medium text-gray-800">{reader.name}</td>
                  <td className="px-4 py-3 text-gray-600">{reader.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        reader.role === 'admin'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {reader.role === 'admin' ? '管理员' : '读者'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(reader.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
