import React, { useCallback } from 'react';
import { useMockStore } from '../store/mockStore';
import { tryParseJSON, formatValueForDisplay } from '../../utils';

export const MockDataEditor: React.FC = React.memo(() => {
  const { data, addData, updateData, deleteData } = useMockStore();

  const handleKeyChange = useCallback(
    (id: string, _oldKey: string, value: string) => {
      const item = data.find((d) => d.id === id);
      if (item) {
        updateData(id, value, item.value);
      }
    },
    [data, updateData]
  );

  const handleValueChange = useCallback(
    (id: string, key: string, valueStr: string) => {
      const parsedValue = tryParseJSON(valueStr);
      updateData(id, key, parsedValue);
    },
    [updateData]
  );

  const handleAddRow = useCallback(() => {
    addData(`key${data.length + 1}`, '');
  }, [data.length, addData]);

  const handleDeleteRow = useCallback(
    (id: string) => {
      deleteData(id);
    },
    [deleteData]
  );

  return (
    <div className="custom-scrollbar" style={{ height: '100%', overflowY: 'auto' }}>
      <table className="mock-table">
        <thead>
          <tr>
            <th style={{ width: '35%' }}>Key</th>
            <th style={{ width: '55%' }}>Value</th>
            <th style={{ width: '10%' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="text"
                  className="mock-input"
                  value={item.key}
                  onChange={(e) => handleKeyChange(item.id, item.key, e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="mock-input"
                  value={formatValueForDisplay(item.value)}
                  onChange={(e) => handleValueChange(item.id, item.key, e.target.value)}
                  placeholder="支持JSON字符串"
                />
              </td>
              <td>
                <button
                  className="mock-delete-btn"
                  onClick={() => handleDeleteRow(item.id)}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="mock-add-btn" onClick={handleAddRow}>
        + 添加一行
      </button>
    </div>
  );
});

MockDataEditor.displayName = 'MockDataEditor';
