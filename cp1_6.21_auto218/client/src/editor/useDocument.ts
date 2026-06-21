import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as Diff from 'diff';
import { Document, Comment, Version } from '../types';

interface DocumentState {
  document: Document | null;
  comments: Comment[];
  versions: Version[];
  loading: boolean;
  saving: boolean;
  saved: boolean;
  viewingVersion: Version | null;
  error: string | null;
}

export function useDocument(docId: string | undefined) {
  const [state, setState] = useState<DocumentState>({
    document: null,
    comments: [],
    versions: [],
    loading: true,
    saving: false,
    saved: false,
    viewingVersion: null,
    error: null
  });

  const [lastSavedContent, setLastSavedContent] = useState('');

  useEffect(() => {
    if (!docId) return;

    const fetchDocument = async () => {
      try {
        const token = localStorage.getItem('token');
        const [docRes, verRes] = await Promise.all([
          axios.get(`/api/documents/${docId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`/api/documents/${docId}/versions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setState(prev => ({
          ...prev,
          document: docRes.data.document,
          comments: docRes.data.comments || [],
          versions: verRes.data.versions || [],
          loading: false
        }));
        setLastSavedContent(docRes.data.document.content);
      } catch (err: any) {
        setState(prev => ({
          ...prev,
          error: err.response?.data?.error || '加载文档失败',
          loading: false
        }));
      }
    };

    fetchDocument();
  }, [docId]);

  const saveDocument = useCallback(async (content: string) => {
    if (!state.document || content === lastSavedContent) return false;

    const patch = Diff.createPatch('document', lastSavedContent, content, '', '');
    const hasChanges = patch.split('\n').some(line => line.startsWith('+') || line.startsWith('-'));

    if (!hasChanges) return false;

    setState(prev => ({ ...prev, saving: true }));

    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`/api/documents/${state.document!.id}`, { content }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLastSavedContent(content);
      setState(prev => ({
        ...prev,
        document: res.data.document,
        saving: false,
        saved: true
      }));
      setTimeout(() => setState(prev => ({ ...prev, saved: false })), 2000);

      try {
        const verRes = await axios.get(`/api/documents/${docId}/versions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setState(prev => ({ ...prev, versions: verRes.data.versions || [] }));
      } catch {}

      return true;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.error || '保存失败',
        saving: false
      }));
      return false;
    }
  }, [state.document, lastSavedContent, docId]);

  const updateTitle = useCallback(async (title: string) => {
    if (!state.document) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`/api/documents/${state.document.id}`, { title }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setState(prev => ({ ...prev, document: res.data.document }));
    } catch {}
  }, [state.document]);

  const addComment = useCallback(async (content: string, replyTo?: string) => {
    if (!state.document || !content.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/documents/${state.document.id}/comments`, {
        content: content.trim(),
        replyTo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setState(prev => {
        if (replyTo) {
          return {
            ...prev,
            comments: prev.comments.map(c =>
              c.id === replyTo
                ? { ...c, replies: [...c.replies, res.data.comment] }
                : c
            )
          };
        }
        return { ...prev, comments: [...prev.comments, res.data.comment] };
      });
    } catch {}
  }, [state.document]);

  const switchToVersion = useCallback((version: Version | null) => {
    setState(prev => ({ ...prev, viewingVersion: version }));
  }, []);

  const currentContent = state.viewingVersion ? state.viewingVersion.content : (state.document?.content || '');

  return {
    ...state,
    currentContent,
    saveDocument,
    updateTitle,
    addComment,
    switchToVersion,
    hasUnsavedChanges: state.document ? state.document.content !== lastSavedContent : false
  };
}
