import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { Plus, ChevronDown, ChevronUp, Trash2, Send } from 'lucide-react';
import type { ApplicationStatus, ApplicationRecord } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

const ALL_STATUSES: ApplicationStatus[] = ['applied', 'viewed', 'interviewed', 'rejected'];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white shrink-0"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ApplicationItem({
  record,
  onStatusChange,
  onNotesChange,
  onRemove,
}: {
  record: ApplicationRecord;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-navy-100 shadow-card card-transition overflow-hidden animate-fade-in">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[record.status] }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-navy-600 truncate">{record.positionName}</h4>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-xs text-navy-400 mt-0.5">{record.companyName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-navy-300">{record.date}</span>
          {expanded ? (
            <ChevronUp size={14} className="text-navy-300" />
          ) : (
            <ChevronDown size={14} className="text-navy-300" />
          )}
        </div>
      </div>

      <div className={`expandable ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="px-4 pb-3 pt-0">
          <div className="border-t border-navy-100 pt-3 space-y-2">
            <div>
              <label className="text-[10px] font-medium text-navy-400 block mb-1">状态</label>
              <div className="flex flex-wrap gap-1">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(record.id, s);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      record.status === s ? 'text-white shadow-sm' : 'text-navy-400 bg-navy-50 hover:bg-navy-100'
                    }`}
                    style={record.status === s ? { backgroundColor: STATUS_COLORS[s] } : undefined}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-navy-400 block mb-1">备注</label>
              <textarea
                className="w-full px-2 py-1.5 rounded border border-navy-100 text-xs text-navy-600 input-focus resize-none min-h-[48px]"
                value={record.notes}
                onChange={(e) => onNotesChange(record.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="添加备注..."
                rows={2}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(record.id);
                }}
                className="flex items-center gap-1 text-[10px] text-navy-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={10} />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackingBoard() {
  const applications = useStore((s) => s.applications);
  const addApplication = useStore((s) => s.addApplication);
  const updateApplicationStatus = useStore((s) => s.updateApplicationStatus);
  const updateApplicationNotes = useStore((s) => s.updateApplicationNotes);
  const removeApplication = useStore((s) => s.removeApplication);

  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [positionName, setPositionName] = useState('');

  const handleAdd = useCallback(() => {
    if (!companyName.trim() || !positionName.trim()) return;
    addApplication(companyName.trim(), positionName.trim());
    setCompanyName('');
    setPositionName('');
    setShowForm(false);
  }, [companyName, positionName, addApplication]);

  const filtered = filterStatus === 'all'
    ? applications
    : applications.filter((a) => a.status === filterStatus);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100 bg-white/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              filterStatus === 'all' ? 'bg-navy-600 text-white shadow-sm' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'
            }`}
          >
            全部
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterStatus === s ? 'text-white shadow-sm' : 'bg-navy-50 text-navy-400 hover:bg-navy-100'
              }`}
              style={filterStatus === s ? { backgroundColor: STATUS_COLORS[s] } : undefined}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-600 text-white text-xs font-medium hover:bg-navy-700 transition-colors shadow-sm"
        >
          <Send size={12} />
          投递
        </button>
      </div>

      <div className={`expandable ${showForm ? 'expanded' : 'collapsed'}`}>
        <div className="px-4 pt-3">
          <div className="bg-white rounded-lg border border-navy-200 p-3 shadow-card animate-fade-in">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                className="w-full px-3 py-2 rounded-lg border border-navy-100 text-sm text-navy-600 input-focus placeholder:text-navy-300"
                placeholder="公司名称"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <input
                className="w-full px-3 py-2 rounded-lg border border-navy-100 text-sm text-navy-600 input-focus placeholder:text-navy-300"
                placeholder="岗位名称"
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAdd}
                disabled={!companyName.trim() || !positionName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-500 text-white text-xs font-medium hover:bg-navy-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={12} />
                确认投递
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-navy-300">
            <Send size={32} className="mb-2 opacity-30" />
            <p className="text-sm">暂无投递记录</p>
            <p className="text-xs mt-1">点击上方"投递"按钮添加</p>
          </div>
        ) : (
          filtered.map((record) => (
            <ApplicationItem
              key={record.id}
              record={record}
              onStatusChange={updateApplicationStatus}
              onNotesChange={updateApplicationNotes}
              onRemove={removeApplication}
            />
          ))
        )}
      </div>
    </div>
  );
}
