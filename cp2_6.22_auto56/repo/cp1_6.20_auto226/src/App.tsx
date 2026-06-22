import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import { appReducer, initialState } from './reducer';
import Editor from './Editor';
import VoicePanel from './VoicePanel';
import StatsPanel from './StatsPanel';
import { Note, Comment } from './types';
import { Play, Square, Save, Music, BarChart3, ListMusic, ChevronDown, ChevronUp, Menu } from 'lucide-react';

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [mobileVoiceOpen, setMobileVoiceOpen] = React.useState(false);
  const [mobileStatsOpen, setMobileStatsOpen] = React.useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/scores')
      .then(r => r.json())
      .then(scores => {
        if (scores.length > 0) {
          dispatch({ type: 'LOAD_SCORE', payload: scores[0] });
        }
      })
      .catch(() => {});

    fetch('/api/comments?scoreId=demo-score-1')
      .then(r => r.json())
      .then(comments => {
        dispatch({ type: 'LOAD_COMMENTS', payload: comments });
      })
      .catch(() => {});
  }, []);

  const autoSave = useCallback((score: typeof state.score) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (score.id) {
        fetch(`/api/scores/${score.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(score),
        }).catch(() => {});
      }
    }, 1000);
  }, []);

  const handleAddNote = useCallback((note: Note) => {
    dispatch({ type: 'ADD_NOTE', payload: note });
  }, []);

  const handleDeleteNote = useCallback((measureId: string, noteId: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: { measureId, noteId } });
  }, []);

  const handleMoveNote = useCallback((measureId: string, noteId: string, pitch: number, startBeat: number) => {
    dispatch({ type: 'MOVE_NOTE', payload: { measureId, noteId, pitch, startBeat } });
  }, []);

  const handleAddVoiceToMeasure = useCallback((measureId: string, voiceId: string) => {
    dispatch({ type: 'ADD_VOICE_TO_MEASURE', payload: { measureId, voiceId } });
  }, []);

  const handleRemoveVoiceFromMeasure = useCallback((measureId: string, voiceId: string) => {
    dispatch({ type: 'REMOVE_VOICE_FROM_MEASURE', payload: { measureId, voiceId } });
  }, []);

  const handleAddComment = useCallback((comment: Comment) => {
    dispatch({ type: 'ADD_COMMENT', payload: comment });
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    }).catch(() => {});
  }, []);

  const handleReplyToComment = useCallback((comment: Comment) => {
    dispatch({ type: 'REPLY_TO_COMMENT', payload: comment });
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    }).catch(() => {});
  }, []);

  const handleMarkCommentRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_COMMENT_READ', payload: id });
    fetch(`/api/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    }).catch(() => {});
  }, []);

  const handleMoveCommentBubble = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: 'MOVE_COMMENT_BUBBLE', payload: { id, x, y } });
  }, []);

  const handleStopPlayback = useCallback(() => {
    dispatch({ type: 'STOP_PLAYBACK' });
  }, []);

  const handleUpdatePlayback = useCallback((beat: number) => {
    dispatch({ type: 'UPDATE_PLAYBACK_POSITION', payload: beat });
  }, []);

  const handleSave = useCallback(() => {
    if (state.score.id) {
      fetch(`/api/scores/${state.score.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.score),
      }).catch(() => {});
    }
  }, [state.score]);

  const handlePlay = useCallback(() => {
    dispatch({ type: 'START_PLAYBACK' });
  }, []);

  const handleStop = useCallback(() => {
    dispatch({ type: 'STOP_PLAYBACK' });
  }, []);

  const { score, comments, isPlaying, currentBeat, bpm, selectedVoiceId, viewMode } = state;

  return (
    <div className="flex flex-col h-screen md:flex-row" style={{ background: '#1e1e1e' }}>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#333', background: '#252525' }}>
        <button className="toolbar-btn flex items-center gap-1" onClick={() => setMobileVoiceOpen(!mobileVoiceOpen)}>
          <Menu size={16} /> 声部
        </button>
        <span className="note-mono text-sm" style={{ color: '#9e9e9e' }}>{score.title}</span>
        <button className="toolbar-btn flex items-center gap-1" onClick={() => setMobileStatsOpen(!mobileStatsOpen)}>
          <BarChart3 size={16} /> 统计
        </button>
      </div>

      {/* Left: Voice Panel */}
      <div
        className={`
          ${mobileVoiceOpen ? 'block' : 'hidden'} md:block
          w-full md:w-[20%] md:min-w-[200px] border-b md:border-b-0 md:border-r overflow-y-auto
        `}
        style={{ borderColor: '#333', background: '#252525' }}
      >
        <VoicePanel
          voices={score.voices}
          measures={score.measures}
          selectedVoiceId={selectedVoiceId}
          comments={comments}
          onSelectVoice={(id) => dispatch({ type: 'SET_SELECTED_VOICE', payload: id })}
          onAddVoiceToMeasure={handleAddVoiceToMeasure}
          onRemoveVoiceFromMeasure={handleRemoveVoiceFromMeasure}
          onAddComment={handleAddComment}
          onReplyToComment={handleReplyToComment}
          onMarkCommentRead={handleMarkCommentRead}
        />
      </div>

      {/* Middle: Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b flex-wrap" style={{ borderColor: '#333', background: '#252525' }}>
          <button
            className={`toolbar-btn flex items-center gap-1 ${isPlaying ? '' : ''}`}
            onClick={isPlaying ? handleStop : handlePlay}
          >
            {isPlaying ? <Square size={14} /> : <Play size={14} />}
            {isPlaying ? '停止' : '播放'}
          </button>

          <div className="flex items-center gap-1 px-2">
            <span className="text-xs" style={{ color: '#9e9e9e' }}>BPM</span>
            <input
              type="number"
              value={bpm}
              min={40}
              max={240}
              onChange={(e) => dispatch({ type: 'SET_BPM', payload: Number(e.target.value) })}
              className="note-mono w-14 px-2 py-1 rounded text-sm text-center"
              style={{ background: '#2d2d2d', color: '#e0e0e0', border: '1px solid #444' }}
            />
          </div>

          <div className="h-5 w-px mx-1" style={{ background: '#444' }} />

          <button
            className={`toolbar-btn flex items-center gap-1 ${viewMode === 'staff' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'staff' })}
          >
            <Music size={14} /> 五线谱
          </button>
          <button
            className={`toolbar-btn flex items-center gap-1 ${viewMode === 'pianoRoll' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'pianoRoll' })}
          >
            <ListMusic size={14} /> 钢琴卷帘
          </button>

          <div className="flex-1" />

          <button className="toolbar-btn flex items-center gap-1" onClick={handleSave}>
            <Save size={14} /> 保存
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto">
          <Editor
            measures={score.measures}
            voices={score.voices}
            bpm={bpm}
            isPlaying={isPlaying}
            currentBeat={currentBeat}
            selectedVoiceId={selectedVoiceId}
            viewMode={viewMode}
            comments={comments}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onMoveNote={handleMoveNote}
            onUpdatePlayback={handleUpdatePlayback}
            onStopPlayback={handleStopPlayback}
            onMoveCommentBubble={handleMoveCommentBubble}
            onMarkCommentRead={handleMarkCommentRead}
          />
        </div>
      </div>

      {/* Right: Stats Panel */}
      <div
        className={`
          ${mobileStatsOpen ? 'block' : 'hidden'} md:block
          w-full md:w-[25%] md:min-w-[200px] border-t md:border-t-0 md:border-l overflow-y-auto
        `}
        style={{ borderColor: '#333', background: '#252525' }}
      >
        <StatsPanel voices={score.voices} measures={score.measures} bpm={bpm} />
      </div>
    </div>
  );
}
