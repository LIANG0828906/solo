import React, { useState } from 'react';
import { useEditorStore } from '../store';

const ConflictAlert: React.FC = () => {
  const { conflict, showConflictDetail, setShowConflictDetail, setConflict } = useEditorStore();

  if (!conflict) return null;

  const handleToggleDetail = () => {
    setShowConflictDetail(!showConflictDetail);
  };

  const handleKeepLocal = () => {
    setConflict(null);
  };

  const handleAcceptRemote = () => {
    setConflict(null);
  };

  const renderDiff = (text: string, type: 'add' | 'remove') => {
    return <span className={type === 'add' ? 'diff-add' : 'diff-remove'}>{text}</span>;
  };

  return (
    <>
      <div className="conflict-alert" onClick={handleToggleDetail}>
        <span className="conflict-alert-icon">⚠️</span>
        <span className="conflict-alert-text">
          检测到编辑冲突 — {conflict.userName} 正在同一位置编辑
        </span>
        <span style={{ fontSize: '12px', color: '#856404' }}>
          {showConflictDetail ? '收起 ▲' : '展开详情 ▼'}
        </span>
      </div>

      {showConflictDetail && (
        <div className="conflict-detail-panel">
          <div className="conflict-detail-header">
            冲突详情对比
          </div>
          <div className="conflict-detail-content">
            <div className="conflict-side left">
              <div className="conflict-side-title">您的版本</div>
              <div className="conflict-text">
                {conflict.localContent.slice(0, conflict.localOp.position)}
                {conflict.localOp.type === 'insert' && conflict.localOp.text && (
                  <span className="diff-add">{conflict.localOp.text}</span>
                )}
                {conflict.localOp.type === 'delete' && (
                  <span className="diff-remove">
                    {conflict.localContent.slice(
                      conflict.localOp.position,
                      conflict.localOp.position + (conflict.localOp.length || 0)
                    )}
                  </span>
                )}
                {conflict.localContent.slice(
                  conflict.localOp.position +
                    (conflict.localOp.type === 'delete' ? conflict.localOp.length || 0 : 0)
                )}
              </div>
            </div>
            <div className="conflict-side right">
              <div className="conflict-side-title">{conflict.userName} 的版本</div>
              <div className="conflict-text">
                {conflict.remoteContent.slice(0, conflict.remoteOp.position)}
                {conflict.remoteOp.type === 'insert' && conflict.remoteOp.text && (
                  <span className="diff-add">{conflict.remoteOp.text}</span>
                )}
                {conflict.remoteOp.type === 'delete' && (
                  <span className="diff-remove">
                    {conflict.remoteContent.slice(
                      conflict.remoteOp.position,
                      conflict.remoteOp.position + (conflict.remoteOp.length || 0)
                    )}
                  </span>
                )}
                {conflict.remoteContent.slice(
                  conflict.remoteOp.position +
                    (conflict.remoteOp.type === 'delete' ? conflict.remoteOp.length || 0 : 0)
                )}
              </div>
            </div>
          </div>
          <div className="conflict-actions">
            <button className="conflict-btn secondary" onClick={handleKeepLocal}>
              保留我的版本
            </button>
            <button className="conflict-btn primary" onClick={handleAcceptRemote}>
              接受对方版本
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ConflictAlert;
