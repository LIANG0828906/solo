import React, { useState } from 'react'
import { DiaryEntry, MOOD_CONFIG, MoodType } from '../data/moodData'

interface DiaryCardProps {
  entry?: DiaryEntry
  isNew?: boolean
  onSubmit?: (entry: DiaryEntry) => void
}

const MOOD_LIST: MoodType[] = ['happy', 'calm', 'sad', 'angry', 'anxious', 'tired']

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 ${weekday}`
}

function getTodayDate(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const DiaryCard: React.FC<DiaryCardProps> = ({ entry, isNew = false, onSubmit }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(entry?.mood ?? null)
  const [intensity, setIntensity] = useState<number>(entry?.intensity ?? 3)
  const [description, setDescription] = useState<string>(entry?.description ?? '')

  const today = getTodayDate()
  const displayDate = entry ? formatDisplayDate(entry.date) : formatDisplayDate(today)
  const moodEmoji = selectedMood ? MOOD_CONFIG[selectedMood].emoji : '📝'

  const handleSubmit = () => {
    if (!selectedMood || !onSubmit) return
    const newEntry: DiaryEntry = {
      id: `entry-${today}`,
      date: today,
      mood: selectedMood,
      intensity,
      description: description.trim(),
    }
    onSubmit(newEntry)
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.dateText}>{displayDate}</span>
        <span style={styles.moodEmoji}>{moodEmoji}</span>
      </div>

      {isNew ? (
        <>
          <div style={styles.moodSelector}>
            {MOOD_LIST.map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                style={{
                  ...styles.moodButton,
                  ...(selectedMood === mood ? styles.moodButtonActive : {}),
                }}
                title={MOOD_CONFIG[mood].label}
              >
                <span style={styles.moodButtonEmoji}>{MOOD_CONFIG[mood].emoji}</span>
              </button>
            ))}
          </div>

          <div style={styles.intensitySection}>
            <span style={styles.intensityLabel}>强度</span>
            <div style={styles.intensityBar}>
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setIntensity(level)}
                  style={{
                    ...styles.intensityDot,
                    ...(level <= intensity ? styles.intensityDotActive : {}),
                  }}
                />
              ))}
            </div>
            <span style={styles.intensityValue}>{intensity}/5</span>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="今天的感受..."
            style={styles.textarea}
          />

          <button
            onClick={handleSubmit}
            disabled={!selectedMood}
            style={{
              ...styles.submitButton,
              ...(!selectedMood ? styles.submitButtonDisabled : {}),
            }}
          >
            提交
          </button>
        </>
      ) : (
        entry && (
          <>
            <div style={styles.moodLabelRow}>
              <span style={styles.moodLabel}>
                {MOOD_CONFIG[entry.mood].label}
              </span>
              <div style={styles.intensityBarSmall}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    style={{
                      ...styles.intensityDotSmall,
                      ...(level <= entry.intensity ? styles.intensityDotActive : {}),
                    }}
                  />
                ))}
              </div>
            </div>
            <p style={styles.descriptionText}>{entry.description}</p>
          </>
        )
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: '100%',
    maxWidth: '340px',
    padding: '20px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.75)',
    border: '1px solid #e0c9b0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    transition: 'transform 0.25s ease-out, box-shadow 0.25s ease-out',
    cursor: 'default',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  dateText: {
    fontSize: '15px',
    color: '#4a3326',
    fontWeight: 'bold',
  },
  moodEmoji: {
    fontSize: '28px',
  },
  moodSelector: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
    gap: '6px',
  },
  moodButton: {
    flex: 1,
    height: '44px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid #e0c9b0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s ease',
  },
  moodButtonActive: {
    background: '#f5e6d3',
    border: '2px solid #c97b5d',
    transform: 'scale(1.08)',
  },
  moodButtonEmoji: {
    fontSize: '22px',
  },
  intensitySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  intensityLabel: {
    fontSize: '14px',
    color: '#4a3326',
    minWidth: '36px',
  },
  intensityBar: {
    display: 'flex',
    gap: '8px',
    flex: 1,
  },
  intensityBarSmall: {
    display: 'flex',
    gap: '5px',
  },
  intensityDot: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#e0c9b0',
    border: 'none',
    padding: 0,
    transition: 'all 0.25s ease',
    cursor: 'pointer',
  },
  intensityDotSmall: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#e0c9b0',
  },
  intensityDotActive: {
    background: '#c97b5d',
  },
  intensityValue: {
    fontSize: '13px',
    color: '#7a6653',
    minWidth: '30px',
    textAlign: 'right',
  },
  textarea: {
    width: '100%',
    minHeight: '80px',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #d4a574',
    background: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
    color: '#4a3326',
    resize: 'vertical',
    lineHeight: '1.6',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
    marginBottom: '14px',
  },
  submitButton: {
    width: '100%',
    height: '42px',
    borderRadius: '10px',
    background: '#c97b5d',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 'bold',
    transition: 'all 0.25s ease',
  },
  submitButtonDisabled: {
    background: '#d4a574',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  moodLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  moodLabel: {
    fontSize: '15px',
    color: '#4a3326',
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: '14px',
    color: '#7a6653',
    lineHeight: '1.7',
  },
}

export default DiaryCard
