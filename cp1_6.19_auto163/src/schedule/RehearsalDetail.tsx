import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Music2,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { RehearsalForm } from './RehearsalForm';
import { formatDuration, formatRange, stringToDate, WEEKDAY_NAMES } from './utils';
import { PieceCard } from '../repertoire/PieceCard';
import { MemberBubble } from '../repertoire/MemberBubble';
import { PART_COLORS } from '../data/seed';

export const RehearsalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const rehearsal = useStore((s) => s.rehearsals.find((r) => r.id === id));
  const members = useStore((s) => s.members);
  const pieces = useStore((s) => s.pieces);
  const deleteRehearsal = useStore((s) => s.deleteRehearsal);
  const removeParticipant = useStore((s) => s.removeParticipant);
  const setSelectedRehearsal = useStore((s) => s.setSelectedRehearsal);
  const recompute = useStore((s) => s.refreshRecommendations);

  const [showEdit, setShowEdit] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  useEffect(() => {
    if (id) {
      setSelectedRehearsal(id);
      recompute(id);
    }
    return () => setSelectedRehearsal(null);
  }, [id, setSelectedRehearsal, recompute]);

  if (!rehearsal) {
    return (
      <div className="py-16 text-center">
        <div className="text-white/50 mb-4">未找到该排练记录</div>
        <Link to="/">
          <Button variant="secondary" icon={<ArrowLeft size={14} />}>
            返回日历
          </Button>
        </Link>
      </div>
    );
  }

  const dateObj = stringToDate(rehearsal.date);
  const weekday = WEEKDAY_NAMES[dateObj.getDay()];
  const rehearsalPieces = pieces.filter((p) => rehearsal.pieceIds.includes(p.id));
  const participants = members.filter((m) => rehearsal.participantIds.includes(m.id));

  const partStats: Record<string, number> = {};
  for (const p of participants) {
    partStats[p.primaryPart] = (partStats[p.primaryPart] ?? 0) + 1;
  }

  const handleDelete = () => {
    if (confirm('确定要删除这场排练吗？此操作无法撤销。')) {
      deleteRehearsal(rehearsal.id);
      navigate('/');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-28"
    >
      <div className="flex items-center gap-3">
        <Link to="/">
          <button
            className="p-2 -ml-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="返回"
          >
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h1
              className="text-white font-semibold truncate"
              style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24 }}
            >
              {rehearsal.title}
            </h1>
            {rehearsal.conflicts.length > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ backgroundColor: 'rgba(229,57,53,0.15)', color: '#FF8A80' }}
              >
                <AlertTriangle size={11} />
                时间冲突
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/55">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} style={{ color: '#FFD54F' }} />
              {rehearsal.date} {weekday}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} style={{ color: '#FFD54F' }} />
              {formatRange(rehearsal.startTime, rehearsal.durationMinutes)} ·{' '}
              {formatDuration(rehearsal.durationMinutes)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<Pencil size={14} />}
            onClick={() => setShowEdit(true)}
          >
            编辑
          </Button>
          <Button variant="danger" icon={<Trash2 size={14} />} onClick={handleDelete}>
            删除
          </Button>
        </div>
      </div>

      {rehearsal.conflicts.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'rgba(229,57,53,0.08)',
            border: '1px solid rgba(229,57,53,0.25)',
          }}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} style={{ color: '#E53935', flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: '#FF8A80' }}>
                存在 {rehearsal.conflicts.length} 条人员时间冲突
              </div>
              <div className="text-xs mt-1 text-white/55">
                以下成员在同一时段被分配到其他排练：
                {Array.from(new Set(rehearsal.conflicts.map((c) => c.memberId)))
                  .map((mid) => members.find((m) => m.id === mid)?.name)
                  .filter(Boolean)
                  .join('、')}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              backgroundColor: 'rgba(38,50,56,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-white font-semibold flex items-center gap-2"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                <Users size={16} style={{ color: '#FFD54F' }} />
                参与人员 ({participants.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                icon={<UserPlus size={13} />}
                onClick={() => setShowMemberPicker(true)}
              >
                添加
              </Button>
            </div>

            {participants.length === 0 ? (
              <div className="text-xs text-white/35 py-4 text-center">
                暂无人员，点击上方或下方推荐气泡添加
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((m) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl group"
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        backgroundColor: `${PART_COLORS[m.primaryPart]}25`,
                        color: PART_COLORS[m.primaryPart],
                      }}
                    >
                      {m.name.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {m.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/50">
                        <span style={{ color: PART_COLORS[m.primaryPart] }}>
                          {m.primaryPart}
                        </span>
                        <span>·</span>
                        <span>Lv.{m.skillLevel}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeParticipant(rehearsal.id, m.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-white/40 hover:text-[#E53935] hover:bg-[#E53935]/10 transition-all"
                      aria-label="移除"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            <div
              className="pt-3 border-t border-white/5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-[11px] text-white/40 mb-2.5">声部分布</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(partStats).length === 0 ? (
                  <span className="text-[11px] text-white/25">暂无</span>
                ) : (
                  Object.entries(partStats).map(([part, count]) => (
                    <span
                      key={part}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{
                        backgroundColor: `${PART_COLORS[part as keyof typeof PART_COLORS]}18`,
                        color: PART_COLORS[part as keyof typeof PART_COLORS],
                        border: `1px solid ${PART_COLORS[part as keyof typeof PART_COLORS]}30`,
                      }}
                    >
                      {part} · {count}人
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              backgroundColor: 'rgba(38,50,56,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3
              className="text-white font-semibold flex items-center gap-2"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              <Music2 size={16} style={{ color: '#FFD54F' }} />
              排练曲目 ({rehearsalPieces.length})
            </h3>

            {rehearsalPieces.length === 0 ? (
              <div className="text-xs text-white/35 py-10 text-center">
                本次排练还没有安排曲目。请点击「编辑」添加曲目。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rehearsalPieces.map((p) => (
                  <PieceCard key={p.id} piece={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MemberBubble rehearsalId={rehearsal.id} />

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="编辑排练"
        maxWidth={620}
      >
        <RehearsalForm
          initial={rehearsal}
          onSubmit={() => setShowEdit(false)}
        />
      </Modal>

      <Modal
        open={showMemberPicker}
        onClose={() => setShowMemberPicker(false)}
        title="选择参与人员"
        maxWidth={500}
      >
        <MemberPickerInline rehearsalId={rehearsal.id} onClose={() => setShowMemberPicker(false)} />
      </Modal>
    </motion.div>
  );
};

const MemberPickerInline = ({
  rehearsalId,
  onClose,
}: {
  rehearsalId: string;
  onClose: () => void;
}) => {
  const members = useStore((s) => s.members);
  const rehearsal = useStore((s) => s.rehearsals.find((r) => r.id === rehearsalId)!);
  const addParticipant = useStore((s) => s.addParticipant);

  const notJoined = members.filter((m) => !rehearsal.participantIds.includes(m.id));

  return (
    <div className="space-y-4">
      <div className="max-h-80 overflow-y-auto space-y-2">
        {notJoined.length === 0 ? (
          <div className="text-center text-xs text-white/35 py-10">
            所有成员都已加入本场排练
          </div>
        ) : (
          notJoined.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: `${PART_COLORS[m.primaryPart]}25`,
                    color: PART_COLORS[m.primaryPart],
                  }}
                >
                  {m.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm truncate">{m.name}</div>
                  <div className="text-[11px] text-white/50">
                    {m.primaryPart} · Lv.{m.skillLevel}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addParticipant(rehearsalId, m.id)}
              >
                添加
              </Button>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          完成
        </Button>
      </div>
    </div>
  );
};
