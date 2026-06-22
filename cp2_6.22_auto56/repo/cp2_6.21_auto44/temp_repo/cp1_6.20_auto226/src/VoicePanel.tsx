import { useState } from "react";
import { Music, MessageCircle, Plus, User, ChevronRight, ChevronDown } from "lucide-react";
import type { Voice, Measure, Comment } from "./types";

interface VoicePanelProps {
  voices: Voice[];
  measures: Measure[];
  selectedVoiceId: string;
  comments: Comment[];
  onSelectVoice: (id: string) => void;
  onAddVoiceToMeasure: (measureId: string, voiceId: string) => void;
  onRemoveVoiceFromMeasure: (measureId: string, voiceId: string) => void;
  onAddComment: (comment: Comment) => void;
  onReplyToComment: (comment: Comment) => void;
  onMarkCommentRead: (id: string) => void;
}

export default function VoicePanel(props: VoicePanelProps) {
  const {
    voices,
    measures,
    selectedVoiceId,
    comments,
    onSelectVoice,
    onAddVoiceToMeasure,
    onRemoveVoiceFromMeasure,
    onAddComment,
    onReplyToComment,
    onMarkCommentRead,
  } = props;

  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [newAuthor, setNewAuthor] = useState("成员");
  const [newCommentText, setNewCommentText] = useState("");

  const voiceComments = comments.filter((c) => c.voiceId === selectedVoiceId);
  const topLevelComments = voiceComments.filter((c) => c.parentId === null);

  const getReplies = (parentId: string) =>
    voiceComments.filter((c) => c.parentId === parentId);

  const getUnreadCount = (voiceId: string) =>
    comments.filter((c) => c.voiceId === voiceId && !c.read).length;

  const toggleThread = (commentId: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
        onMarkCommentRead(commentId);
      }
      return next;
    });
  };

  const handleReply = (parentId: string) => {
    const text = replyInputs[parentId]?.trim();
    if (!text) return;
    const parent = comments.find((c) => c.id === parentId);
    onReplyToComment({
      id: crypto.randomUUID(),
      scoreId: "demo-score-1",
      voiceId: selectedVoiceId,
      noteId: parent?.noteId ?? "",
      parentId,
      text,
      author: newAuthor,
      x: 0,
      y: 0,
      read: false,
      createdAt: new Date().toISOString(),
    });
    setReplyInputs((prev) => ({ ...prev, [parentId]: "" }));
  };

  const handleAddComment = () => {
    const text = newCommentText.trim();
    if (!text) return;
    onAddComment({
      id: crypto.randomUUID(),
      scoreId: "demo-score-1",
      voiceId: selectedVoiceId,
      noteId: "",
      parentId: null,
      text,
      author: newAuthor,
      x: 0,
      y: 0,
      read: false,
      createdAt: new Date().toISOString(),
    });
    setNewCommentText("");
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div style={{ background: "#252525", color: "#e0e0e0", height: "100%", overflowY: "auto", padding: "12px" }}>
      <div className="panel-section" style={{ borderBottom: "1px solid #333", paddingBottom: "12px", marginBottom: "12px" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e0e0e0", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Music size={16} />
          声部管理
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {voices.map((voice) => {
            const isSelected = voice.id === selectedVoiceId;
            const unread = getUnreadCount(voice.id);
            return (
              <div
                key={voice.id}
                onClick={() => onSelectVoice(voice.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: isSelected ? "#2d2d2d" : "transparent",
                  borderLeft: isSelected ? `3px solid ${voice.color}` : "3px solid transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#2a2a2a";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: voice.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: "#e0e0e0" }}>{voice.name}</span>
                {unread > 0 && (
                  <span className="unread-badge" style={{ background: "#e53935", color: "#fff", fontSize: "0.7rem", borderRadius: "10px", padding: "1px 6px", fontWeight: 600 }}>
                    {unread}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel-section" style={{ borderBottom: "1px solid #333", paddingBottom: "12px", marginBottom: "12px" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e0e0e0", marginBottom: "8px" }}>
          小节声部分配
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {measures.map((measure) => (
            <div key={measure.id}>
              <div style={{ fontSize: "0.75rem", color: "#9e9e9e", marginBottom: "4px" }}>小节 {measure.number}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {voices.map((voice) => {
                  const assigned = measure.voiceIds.includes(voice.id);
                  return (
                    <button
                      key={voice.id}
                      onClick={() =>
                        assigned
                          ? onRemoveVoiceFromMeasure(measure.id, voice.id)
                          : onAddVoiceToMeasure(measure.id, voice.id)
                      }
                      style={{
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        border: `1px solid ${assigned ? voice.color : "#444"}`,
                        background: assigned ? voice.color + "33" : "transparent",
                        color: assigned ? voice.color : "#9e9e9e",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {voice.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section" style={{ borderBottom: "1px solid #333", paddingBottom: "12px", marginBottom: "12px" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e0e0e0", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <MessageCircle size={16} />
          注释讨论
        </div>
        {topLevelComments.length === 0 && (
          <div style={{ fontSize: "0.75rem", color: "#9e9e9e" }}>暂无注释</div>
        )}
        {topLevelComments.map((comment) => {
          const replies = getReplies(comment.id);
          const isExpanded = expandedThreads.has(comment.id);
          return (
            <div key={comment.id} style={{ marginBottom: "8px" }}>
              <div
                onClick={() => toggleThread(comment.id)}
                style={{ cursor: "pointer", padding: "4px 0" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{comment.author}</span>
                  <span style={{ fontSize: "0.7rem", color: "#9e9e9e" }}>{formatTime(comment.createdAt)}</span>
                  {!comment.read && (
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#42a5f5", flexShrink: 0 }} />
                  )}
                  {replies.length > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#9e9e9e", marginLeft: "auto" }}>{replies.length} 条回复</span>
                  )}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#e0e0e0", marginLeft: "18px", marginTop: "2px" }}>
                  {comment.text}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginLeft: "18px", borderLeft: "2px solid #444", paddingLeft: "8px", marginTop: "4px" }}>
                  {replies.map((reply) => (
                    <div key={reply.id} style={{ marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.75rem", color: "#e0e0e0" }}>{reply.author}</span>
                      <span style={{ fontSize: "0.7rem", color: "#9e9e9e", marginLeft: "4px" }}>{formatTime(reply.createdAt)}</span>
                      <div style={{ fontSize: "0.75rem", color: "#ccc" }}>{reply.text}</div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                    <input
                      value={replyInputs[comment.id] ?? ""}
                      onChange={(e) => setReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                      placeholder="回复..."
                      style={{
                        flex: 1,
                        background: "#2d2d2d",
                        border: "1px solid #444",
                        color: "#e0e0e0",
                        borderRadius: "4px",
                        padding: "3px 6px",
                        fontSize: "0.75rem",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => handleReply(comment.id)}
                      style={{
                        background: "#3a3a5c",
                        color: "#e0e0e0",
                        border: "none",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#4a4a6c")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#3a3a5c")}
                    >
                      回复
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="panel-section" style={{ paddingBottom: "12px" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e0e0e0", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} />
          添加注释
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <User size={14} style={{ color: "#9e9e9e", flexShrink: 0 }} />
            <input
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              style={{
                flex: 1,
                background: "#2d2d2d",
                border: "1px solid #444",
                color: "#e0e0e0",
                borderRadius: "4px",
                padding: "5px 8px",
                fontSize: "0.8rem",
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="输入注释内容..."
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              style={{
                flex: 1,
                background: "#2d2d2d",
                border: "1px solid #444",
                color: "#e0e0e0",
                borderRadius: "4px",
                padding: "5px 8px",
                fontSize: "0.8rem",
                outline: "none",
              }}
            />
            <button
              onClick={handleAddComment}
              style={{
                background: "#3a3a5c",
                color: "#e0e0e0",
                border: "none",
                borderRadius: "4px",
                padding: "5px 12px",
                fontSize: "0.8rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#4a4a6c")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#3a3a5c")}
            >
              添加注释
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
