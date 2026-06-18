import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiMapPin, FiClock, FiUser, FiX } from 'react-icons/fi';
import { TimelineNode, LocationPoint, stageColors, stageNames } from '../data/batchData';

interface TimelineProps {
  nodes: TimelineNode[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
  onLocationClick: (location: LocationPoint) => void;
}

function Timeline({ nodes, selectedNodeId, onNodeSelect, onLocationClick }: TimelineProps) {
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({});
  const [detailModal, setDetailModal] = useState<{ node: TimelineNode; record: any } | null>(null);

  const togglePanel = useCallback((nodeId: string) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, []);

  const handleRecordClick = useCallback(
    (node: TimelineNode, record: any) => {
      setDetailModal({ node, record });
    },
    []
  );

  const closeModal = useCallback(() => {
    setDetailModal(null);
  }, []);

  return (
    <div className="timeline-container">
      <h3 className="timeline-title">供应链时间轴</h3>
      <div className="timeline">
        {nodes.map((node, index) => (
          <TimelineItem
            key={node.id}
            node={node}
            index={index}
            isSelected={selectedNodeId === node.id}
            isExpanded={expandedPanels[node.id] || false}
            onSelect={() => onNodeSelect(node.id)}
            onTogglePanel={() => togglePanel(node.id)}
            onLocationClick={() => onLocationClick(node.location)}
            onRecordClick={(record) => handleRecordClick(node, record)}
            isLast={index === nodes.length - 1}
          />
        ))}
      </div>

      <AnimatePresence>
        {detailModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h4>详细信息</h4>
                <button className="modal-close" onClick={closeModal}>
                  <FiX size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-section">
                  <span className="modal-label">所属阶段：</span>
                  <span
                    className="modal-value"
                    style={{
                      color: stageColors[detailModal.node.stage],
                      fontWeight: 600,
                    }}
                  >
                    {stageNames[detailModal.node.stage]}
                  </span>
                </div>
                <div className="modal-section">
                  <span className="modal-label">时间：</span>
                  <span className="modal-value">{detailModal.record.date}</span>
                </div>
                <div className="modal-section">
                  <span className="modal-label">类型：</span>
                  <span className="modal-value">{detailModal.record.type}</span>
                </div>
                <div className="modal-section">
                  <span className="modal-label">操作人：</span>
                  <span className="modal-value">{detailModal.record.operator}</span>
                </div>
                {Object.entries(detailModal.record)
                  .filter(
                    ([key]) =>
                      !['id', 'date', 'type', 'operator'].includes(key)
                  )
                  .map(([key, value]) => (
                    <div key={key} className="modal-section">
                      <span className="modal-label">
                        {key.charAt(0).toUpperCase() + key.slice(1)}：
                      </span>
                      <span className="modal-value">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .timeline-container {
          background: var(--color-bg-white);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-card);
          flex-shrink: 0;
        }

        .timeline-title {
          font-size: 16px;
          margin-bottom: 20px;
          color: var(--color-text-title);
        }

        .timeline {
          position: relative;
          padding-left: 24px;
        }

        .timeline-item {
          position: relative;
          padding-bottom: 24px;
        }

        .timeline-item:last-child {
          padding-bottom: 0;
        }

        .timeline-item::before {
          content: '';
          position: absolute;
          left: -18px;
          top: 6px;
          width: 1.5px;
          height: calc(100% + 12px);
          background: var(--color-border);
        }

        .timeline-item:last-child::before {
          display: none;
        }

        .timeline-node {
          position: absolute;
          left: -24px;
          top: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          cursor: pointer;
          transition: all var(--transition-slow) ease;
          z-index: 1;
          will-change: transform;
        }

        .timeline-node:hover {
          transform: scale(1.3);
        }

        .timeline-node.selected {
          transform: scale(1.5);
          box-shadow: 0 0 0 4px rgba(0, 184, 148, 0.2);
        }

        .timeline-content {
          cursor: pointer;
          transition: all var(--transition-normal) ease;
          border-radius: var(--radius-md);
          padding: 8px;
          margin-left: 8px;
        }

        .timeline-content:hover {
          background: var(--color-bg-card);
        }

        .timeline-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .timeline-stage-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          color: #fff;
          font-weight: 500;
        }

        .timeline-title-item {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-title);
        }

        .timeline-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-text-body);
          margin-top: 4px;
        }

        .timeline-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-text-body);
          margin-top: 2px;
          cursor: pointer;
          transition: color var(--transition-normal) ease;
        }

        .timeline-location:hover {
          color: var(--color-primary);
        }

        .timeline-description {
          font-size: 12px;
          color: var(--color-text-body);
          margin-top: 8px;
          line-height: 1.5;
        }

        .detail-card-wrapper {
          overflow: hidden;
          margin-top: 12px;
        }

        .detail-card {
          background: var(--color-bg-card);
          border-radius: var(--radius-md);
          padding: 16px;
          border-left: 3px solid var(--color-primary);
        }

        .detail-card h4 {
          font-size: 14px;
          margin-bottom: 12px;
          color: var(--color-text-title);
        }

        .detail-info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          margin-bottom: 6px;
          color: var(--color-text-body);
        }

        .expand-panel {
          margin-top: 12px;
        }

        .expand-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--color-bg-white);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-normal) ease;
        }

        .expand-header:hover {
          background: var(--color-border-light);
        }

        .expand-title {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-title);
        }

        .expand-icon {
          transition: transform var(--transition-slow) ease;
        }

        .expand-icon.rotated {
          transform: rotate(90deg);
        }

        .expand-content {
          overflow: hidden;
          margin-top: 8px;
        }

        .detail-list {
          max-height: 300px;
          overflow-y: auto;
          background: var(--color-bg-white);
          border-radius: var(--radius-sm);
        }

        .detail-list-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-body);
          background: var(--color-bg-card);
          border-bottom: 1px solid var(--color-border-light);
          position: sticky;
          top: 0;
        }

        .detail-list-item {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          padding: 10px 12px;
          font-size: 12px;
          border-bottom: 1px solid var(--color-border-light);
          cursor: pointer;
          transition: background var(--transition-normal) ease;
        }

        .detail-list-item:last-child {
          border-bottom: none;
        }

        .detail-list-item:hover {
          background: var(--color-border-light);
        }

        .show-more {
          padding: 10px 12px;
          text-align: center;
          font-size: 12px;
          color: var(--color-primary);
          cursor: pointer;
          transition: background var(--transition-normal) ease;
        }

        .show-more:hover {
          background: var(--color-bg-card);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          width: 400px;
          max-width: 90vw;
          background: var(--color-bg-white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border-light);
        }

        .modal-header h4 {
          font-size: 16px;
          color: var(--color-text-title);
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-body);
          transition: all var(--transition-normal) ease;
        }

        .modal-close:hover {
          background: var(--color-bg-card);
          color: var(--color-text-title);
        }

        .modal-body {
          padding: 20px;
        }

        .modal-section {
          display: flex;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .modal-section:last-child {
          margin-bottom: 0;
        }

        .modal-label {
          color: var(--color-text-body);
          min-width: 80px;
        }

        .modal-value {
          color: var(--color-text-title);
          flex: 1;
        }

        @media (max-width: 768px) {
          .timeline-container {
            padding: 16px;
          }

          .detail-list-header,
          .detail-list-item {
            grid-template-columns: 1fr 1fr;
          }

          .detail-list-header > :last-child,
          .detail-list-item > :last-child {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

interface TimelineItemProps {
  node: TimelineNode;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  isLast: boolean;
  onSelect: () => void;
  onTogglePanel: () => void;
  onLocationClick: () => void;
  onRecordClick: (record: any) => void;
}

function TimelineItem({
  node,
  index,
  isSelected,
  isExpanded,
  isLast,
  onSelect,
  onTogglePanel,
  onLocationClick,
  onRecordClick,
}: TimelineItemProps) {
  const [showAllDetails, setShowAllDetails] = useState(false);

  const displayDetails = showAllDetails
    ? node.details
    : node.details.slice(0, 20);

  const hasMore = node.details.length > 20;

  return (
    <motion.div
      className="timeline-item"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div
        className={`timeline-node ${isSelected ? 'selected' : ''}`}
        style={{ background: stageColors[node.stage] }}
        onClick={onSelect}
      />
      <div className="timeline-content" onClick={onSelect}>
        <div className="timeline-header">
          <span
            className="timeline-stage-badge"
            style={{ background: stageColors[node.stage] }}
          >
            {stageNames[node.stage]}
          </span>
          <span className="timeline-title-item">{node.title}</span>
        </div>
        <div className="timeline-time">
          <FiClock size={12} />
          {node.startTime} ~ {node.endTime}
        </div>
        <div className="timeline-location" onClick={(e) => { e.stopPropagation(); onLocationClick(); }}>
          <FiMapPin size={12} />
          {node.location.name}
        </div>
        <div className="timeline-person" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-body)', marginTop: 2 }}>
          <FiUser size={12} />
          负责人：{node.location.personInCharge}
        </div>
      </div>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="detail-card-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="detail-card">
              <h4>阶段详情</h4>
              <p className="timeline-description">{node.description}</p>
              <div className="detail-info-row">
                <FiClock size={14} />
                <span>总耗时：{node.totalHours} 小时</span>
              </div>
              <div className="detail-info-row">
                <FiUser size={14} />
                <span>经手机构：{node.organizations} 家</span>
              </div>
              <div className="detail-info-row">
                <span>🌡️</span>
                <span>
                  温度区间：{node.temperatureRange[0]}°C ~ {node.temperatureRange[1]}°C
                </span>
              </div>
              <div className="detail-info-row">
                <span>⚠️</span>
                <span style={{ color: node.anomalies > 0 ? 'var(--color-danger)' : 'inherit' }}>
                  异常事件：{node.anomalies} 次
                </span>
              </div>

              <div className="expand-panel">
                <div className="expand-header" onClick={(e) => { e.stopPropagation(); onTogglePanel(); }}>
                  <span className="expand-title">查看详细记录 ({node.details.length}条)</span>
                  <FiChevronDown
                    className={`expand-icon ${isExpanded ? 'rotated' : ''}`}
                    size={16}
                    color="var(--color-text-body)"
                  />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="expand-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="detail-list">
                        <div className="detail-list-header">
                          <span>日期</span>
                          <span>操作类型</span>
                          <span>操作人</span>
                        </div>
                        {displayDetails.map((record) => (
                          <div
                            key={record.id}
                            className="detail-list-item"
                            onClick={(e) => { e.stopPropagation(); onRecordClick(record); }}
                          >
                            <span>{record.date}</span>
                            <span>{record.type}</span>
                            <span>{record.operator}</span>
                          </div>
                        ))}
                        {hasMore && !showAllDetails && (
                          <div
                            className="show-more"
                            onClick={(e) => { e.stopPropagation(); setShowAllDetails(true); }}
                          >
                            查看更多 ({node.details.length - 20}条)
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Timeline;
