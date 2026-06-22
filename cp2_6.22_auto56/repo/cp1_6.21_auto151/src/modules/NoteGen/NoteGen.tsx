import { useState, useEffect } from 'react';
import { X, Sparkles, Save } from 'lucide-react';
import { useTravel } from '@/context/TravelContext';
import { Trip } from '@/types';
import './NoteGen.css';

export default function NoteGen() {
  const { state, dispatch, updateTrip, generateNote, getTripsByDate } = useTravel();
  const [editingNote, setEditingNote] = useState('');
  const [generating, setGenerating] = useState(false);

  const selectedDateTrips = getTripsByDate(state.selectedDate);

  useEffect(() => {
    if (state.selectedTrip) {
      setEditingNote(state.selectedTrip.note || '');
    }
  }, [state.selectedTrip]);

  const handleGenerateNote = async (trip: Trip) => {
    dispatch({ type: 'SET_SELECTED_TRIP', payload: trip });
    dispatch({ type: 'SET_NOTE_MODAL_VISIBLE', payload: true });
    setGenerating(true);
    
    try {
      const note = await generateNote(trip.title, trip.location, trip.rating);
      setEditingNote(note);
    } catch (error) {
      console.error('生成笔记失败:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!state.selectedTrip) return;
    
    try {
      await updateTrip(state.selectedTrip.id, { note: editingNote });
      dispatch({ type: 'SET_NOTE_MODAL_VISIBLE', payload: false });
      dispatch({ type: 'SET_SELECTED_TRIP', payload: null });
    } catch (error) {
      console.error('保存笔记失败:', error);
    }
  };

  const handleCloseModal = () => {
    dispatch({ type: 'SET_NOTE_MODAL_VISIBLE', payload: false });
    dispatch({ type: 'SET_SELECTED_TRIP', payload: null });
    setEditingNote('');
  };

  const renderStars = (rating: number) => {
    return (
      <div className="note-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`note-star ${star <= rating ? 'filled' : ''}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="notegen-main">
      <div className="notegen-header">
        <h2 className="notegen-title">{state.selectedDate} 行程安排</h2>
        <p className="notegen-subtitle">
          共 {selectedDateTrips.length} 个行程
        </p>
      </div>

      <div className="timeline-container">
        {selectedDateTrips.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">暂无行程安排</p>
            <p className="empty-state-hint">在左侧添加你的第一个行程吧</p>
          </div>
        ) : (
          <div className="timeline">
            <div className="timeline-line" />
            {selectedDateTrips.map((trip, index) => (
              <div key={trip.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="trip-detail-card">
                  <div className="card-header">
                    <h3 className="card-title">{trip.title}</h3>
                    {renderStars(trip.rating)}
                  </div>
                  
                  <div className="card-tag">{trip.tag}</div>
                  
                  <div className="card-meta">
                    <span className="card-location">📍 {trip.location}</span>
                    <span className="card-duration">⏱ {trip.duration >= 60 ? `${trip.duration / 60}小时` : `${trip.duration}分钟`}</span>
                  </div>
                  
                  <p className="card-description">{trip.description}</p>
                  
                  {trip.note && (
                    <div className="card-note">
                      <div className="note-label">旅行感悟</div>
                      <p className="note-content">{trip.note}</p>
                    </div>
                  )}
                  
                  <button
                    className="generate-btn"
                    onClick={() => handleGenerateNote(trip)}
                  >
                    <Sparkles size={16} />
                    {trip.note ? '重新生成笔记' : '生成笔记'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {state.noteModalVisible && state.selectedTrip && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Sparkles size={20} />
                AI 旅行感悟
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-trip-info">
                <h4>{state.selectedTrip.title}</h4>
                <p>{state.selectedTrip.location}</p>
              </div>
              
              {generating ? (
                <div className="generating">
                  <div className="loading-spinner" />
                  <p>正在生成旅行感悟...</p>
                </div>
              ) : (
                <textarea
                  className="note-textarea"
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  placeholder="AI生成的旅行感悟将显示在这里，你可以自由编辑..."
                  rows={8}
                />
              )}
            </div>
            
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={handleCloseModal}>
                取消
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleSaveNote}
                disabled={generating}
              >
                <Save size={16} />
                保存笔记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
