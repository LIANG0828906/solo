import { useState } from 'react';
import BrewForm from './BrewForm';
import BrewList from './BrewList';
import { useLogStore } from '../store/logStore';
import type { BrewRecord } from '../types';

export default function LogView() {
  const records = useLogStore((s) => s.records);
  const addRecord = useLogStore((s) => s.addRecord);
  const deleteRecord = useLogStore((s) => s.deleteRecord);
  const editRecord = useLogStore((s) => s.editRecord);
  const showToast = useLogStore((s) => s.showToast);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<BrewRecord | null>(null);

  const handleSubmit = async (data: Omit<BrewRecord, 'id' | 'createdAt'>) => {
    if (editingRecord) {
      await editRecord(editingRecord.id, data);
      showToast('记录已更新', 'success');
      setEditingRecord(null);
    } else {
      await addRecord(data);
      showToast('保存成功', 'success');
    }
  };

  const handleEdit = (record: BrewRecord) => {
    setEditingRecord(record);
    setSelectedId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    showToast('已删除', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {!editingRecord && selectedId ? null : (
        <BrewForm
          initialData={editingRecord || undefined}
          isEditing={!!editingRecord}
          onSubmit={handleSubmit}
          onCancelEdit={editingRecord ? () => setEditingRecord(null) : undefined}
        />
      )}

      <BrewList
        records={records}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
