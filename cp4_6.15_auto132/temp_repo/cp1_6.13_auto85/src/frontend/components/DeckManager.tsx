import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../utils/spacedRepetition';

interface Deck {
  id: string;
  name: string;
  cards: Card[];
  lastReviewed: string;
  createdAt: string;
}

interface DeckManagerProps {
  onSelectDeck: (deckId: string) => void;
}

const DeckManager: React.FC<DeckManagerProps> = ({ onSelectDeck }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const fetchDecks = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:3001/api/decks');
        setDecks(response.data);
      } catch (error) {
        console.error('Failed to fetch decks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecks();
  }, []);

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;

    try {
      const response = await axios.post('http://localhost:3001/api/decks', { name: newDeckName.trim() });
      setDecks(prev => [...prev, response.data]);
      setNewDeckName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create deck:', error);
    }
  };

  const handleRenameDeck = async (deckId: string) => {
    if (!editingName.trim()) return;

    try {
      const response = await axios.put(`http://localhost:3001/api/decks/${deckId}`, { name: editingName.trim() });
      setDecks(prev => prev.map(d => d.id === deckId ? response.data : d));
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to rename deck:', error);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      await axios.delete(`http://localhost:3001/api/decks/${deckId}`);
      setDecks(prev => prev.filter(d => d.id !== deckId));
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete deck:', error);
    }
  };

  const handleExportDeck = (deck: Deck) => {
    const dataStr = JSON.stringify(deck, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `${deck.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.json`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportDeck = async (file: File) => {
    try {
      const text = await file.text();
      const importedDeck = JSON.parse(text);
      if (importedDeck.name && Array.isArray(importedDeck.cards)) {
        const response = await axios.post('http://localhost:3001/api/decks', {
          name: importedDeck.name,
          cards: importedDeck.cards
        });
        setDecks(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Failed to import deck:', error);
      alert('Failed to import deck. Please ensure the file is a valid JSON export.');
    }
    setShowImportModal(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleImportDeck(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportDeck(file);
    }
  };

  if (isLoading) {
    return (
      <div className="manager-loading">
        <div className="loading-spinner"></div>
        <p>Loading decks...</p>
      </div>
    );
  }

  return (
    <div className="deck-manager">
      <div className="manager-header">
        <h1>My Decks</h1>
        <div className="header-actions">
          <button 
            className="action-btn import-btn" 
            onClick={() => setShowImportModal(true)}
          >
            Import
          </button>
          <button 
            className="action-btn create-btn" 
            onClick={() => setShowCreateModal(true)}
          >
            + New Deck
          </button>
        </div>
      </div>

      <div className="decks-grid">
        {decks.map(deck => (
          <div key={deck.id} className="deck-card" onClick={() => onSelectDeck(deck.id)}>
            <div className="deck-content">
              {editingId === deck.id ? (
                <div className="edit-name">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleRenameDeck(deck.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <h3 
                  className="deck-name" 
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(deck.id);
                    setEditingName(deck.name);
                  }}
                >
                  {deck.name}
                </h3>
              )}
              <div className="deck-meta">
                <span>{deck.cards.length} cards</span>
                <span>Last reviewed: {deck.lastReviewed}</span>
              </div>
            </div>
            <div className="deck-actions" onClick={(e) => e.stopPropagation()}>
              <button 
                className="action-icon export" 
                onClick={() => handleExportDeck(deck)}
                title="Export"
              >
                ↓
              </button>
              <button 
                className="action-icon delete" 
                onClick={() => setShowDeleteModal(deck.id)}
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {decks.length === 0 && (
        <div className="empty-state">
          <h2>No decks yet</h2>
          <p>Create your first deck to start learning!</p>
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            + New Deck
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Deck</h2>
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Enter deck name"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreateDeck()}
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleCreateDeck}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this deck? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </button>
              <button className="delete-btn" onClick={() => handleDeleteDeck(showDeleteModal)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Import Deck</h2>
            <div 
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <p>Drag a JSON file here</p>
              <p>or</p>
              <label className="file-input-label">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileSelect}
                  className="file-input"
                />
                Browse Files
              </label>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .deck-manager {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .manager-header h1 {
          color: #1F2937;
          font-size: 24px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .import-btn {
          background: #E5E7EB;
          color: #374151;
        }

        .import-btn:hover {
          background: #D1D5DB;
        }

        .create-btn {
          background: #4F46E5;
          color: white;
        }

        .create-btn:hover {
          background: #4338CA;
        }

        .decks-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .deck-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
        }

        .deck-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

        .deck-content {
          flex: 1;
          min-width: 0;
        }

        .deck-name {
          color: #1F2937;
          margin: 0 0 10px 0;
          font-size: 18px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .deck-name:hover {
          color: #4F46E5;
        }

        .edit-name input {
          width: 100%;
          padding: 8px;
          border: 2px solid #4F46E5;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
        }

        .deck-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
          color: #6B7280;
        }

        .deck-actions {
          display: flex;
          gap: 8px;
          margin-left: 10px;
        }

        .action-icon {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-icon.export {
          background: #E5E7EB;
          color: #374151;
        }

        .action-icon.export:hover {
          background: #D1D5DB;
        }

        .action-icon.delete {
          background: #FEE2E2;
          color: #DC2626;
          font-size: 20px;
        }

        .action-icon.delete:hover {
          background: #FECACA;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .empty-state h2 {
          color: #1F2937;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #6B7280;
          margin-bottom: 20px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 30px;
          width: 90%;
          max-width: 400px;
        }

        .modal-content h2 {
          color: #1F2937;
          margin-bottom: 20px;
        }

        .modal-content p {
          color: #6B7280;
          margin-bottom: 20px;
        }

        .modal-content input {
          width: 100%;
          padding: 12px;
          border: 2px solid #E5E7EB;
          border-radius: 8px;
          font-size: 16px;
          box-sizing: border-box;
          margin-bottom: 20px;
          outline: none;
          transition: border-color 0.2s;
        }

        .modal-content input:focus {
          border-color: #4F46E5;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .modal-actions button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn {
          background: #E5E7EB;
          color: #374151;
        }

        .cancel-btn:hover {
          background: #D1D5DB;
        }

        .confirm-btn {
          background: #4F46E5;
          color: white;
        }

        .confirm-btn:hover {
          background: #4338CA;
        }

        .delete-btn {
          background: #EF4444;
          color: white;
        }

        .delete-btn:hover {
          background: #DC2626;
        }

        .drop-zone {
          border: 2px dashed #E5E7EB;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          transition: all 0.2s;
          cursor: pointer;
        }

        .drop-zone.drag-over {
          border-color: #4F46E5;
          background: #F5F3FF;
        }

        .drop-zone p {
          margin: 8px 0;
        }

        .file-input-label {
          display: inline-block;
          padding: 10px 20px;
          background: #4F46E5;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 10px;
          transition: background 0.2s;
        }

        .file-input-label:hover {
          background: #4338CA;
        }

        .file-input {
          display: none;
        }

        .manager-loading {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 40vh;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #E5E7EB;
          border-top-color: #4F46E5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .decks-grid {
            grid-template-columns: 1fr;
          }

          .manager-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            width: 100%;
          }

          .action-btn {
            flex: 1;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default DeckManager;