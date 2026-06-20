import React, { useState, useEffect } from 'react'
import { DiaryEntry } from '../data/moodData'
import DiaryCard from './DiaryCard'

interface TimelineProps {
  entries: DiaryEntry[]
  onAddEntry: (entry: DiaryEntry) => void
}

const Timeline: React.FC<TimelineProps> = ({ entries, onAddEntry }) => {
  const [showNewCard, setShowNewCard] = useState(false)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = (entry: DiaryEntry) => {
    onAddEntry(entry)
    setShowNewCard(false)
  }

  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const renderCard = (entry: DiaryEntry, index: number) => {
    if (isMobile) {
      return (
        <div
          key={entry.id}
          style={styles.mobileTimelineItem}
          onMouseEnter={() => setHoverIndex(index)}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <div style={styles.mobileTimelineLine} />
          <div style={styles.mobileCenterDot} />
          <div style={styles.mobileConnector} />
          <div
            style={{
              ...styles.mobileCardContainer,
              transform: hoverIndex === index ? 'translateY(-4px)' : 'translateY(0)',
              transition: 'transform 0.25s ease-out',
            }}
          >
            <DiaryCard entry={entry} />
          </div>
        </div>
      )
    }

    const isLeft = index % 2 === 0
    return (
      <div
        key={entry.id}
        style={{
          ...styles.timelineItem,
          flexDirection: isLeft ? 'row' : 'row-reverse',
        }}
        onMouseEnter={() => setHoverIndex(index)}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <div style={styles.cardWrapper}>
          <div
            style={{
              ...styles.cardContainer,
              transform: hoverIndex === index ? 'translateY(-4px)' : 'translateY(0)',
              transition: 'transform 0.25s ease-out',
            }}
          >
            <DiaryCard entry={entry} />
          </div>
        </div>
        <div
          style={{
            ...styles.connectorLine,
            background: '#d4a574',
            ...(isLeft ? { marginRight: '-30px' } : { marginLeft: '-30px' }),
          }}
        />
        <div style={styles.centerDot} />
        <div style={styles.cardWrapper} />
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {!showNewCard && (
        <button onClick={() => setShowNewCard(true)} style={styles.addButton}>
          <span style={styles.addButtonIcon}>+</span>
          <span style={styles.addButtonText}>记录今日心情</span>
        </button>
      )}

      {showNewCard && (
        <div style={styles.newCardSection}>
          <DiaryCard isNew onSubmit={handleSubmit} />
        </div>
      )}

      <div style={isMobile ? styles.mobileTimeline : styles.timeline}>
        {!isMobile && <div style={styles.timelineLine} />}
        {sortedEntries.map((entry, index) => renderCard(entry, index))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px 20px 60px',
    position: 'relative',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    maxWidth: '340px',
    height: '52px',
    margin: '0 auto 32px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.75)',
    border: '1px dashed #c97b5d',
    color: '#c97b5d',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.25s ease',
  },
  addButtonIcon: {
    fontSize: '22px',
    lineHeight: 1,
  },
  addButtonText: {},
  newCardSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  timeline: {
    position: 'relative',
    padding: '20px 0',
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '0px',
    borderLeft: '2px dashed #d4a574',
    transform: 'translateX(-50%)',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '40px',
    position: 'relative',
  },
  cardWrapper: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '0 40px',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '340px',
  },
  connectorLine: {
    width: '30px',
    height: '2px',
    alignSelf: 'flex-start',
    marginTop: '26px',
    flexShrink: 0,
    zIndex: 1,
  },
  centerDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#c97b5d',
    border: '3px solid #f5e6d3',
    flexShrink: 0,
    zIndex: 2,
    marginTop: '20px',
    boxShadow: '0 0 0 2px #c97b5d',
  },
  mobileTimeline: {
    position: 'relative',
    padding: '20px 0',
    paddingLeft: '30px',
  },
  mobileTimelineItem: {
    position: 'relative',
    marginBottom: '32px',
  },
  mobileTimelineLine: {
    position: 'absolute',
    left: '-30px',
    top: 0,
    bottom: '-32px',
    width: '0px',
    borderLeft: '2px dashed #d4a574',
  },
  mobileCenterDot: {
    position: 'absolute',
    left: '-30px',
    top: '20px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#c97b5d',
    border: '3px solid #f5e6d3',
    zIndex: 2,
    transform: 'translateX(-50%)',
    boxShadow: '0 0 0 2px #c97b5d',
  },
  mobileConnector: {
    position: 'absolute',
    left: '-30px',
    top: '26px',
    width: '30px',
    height: '2px',
    background: '#d4a574',
    transform: 'translateX(-50%)',
  },
  mobileCardContainer: {
    width: '100%',
  },
}

export default Timeline
