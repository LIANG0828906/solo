import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Teacher } from './TeacherService'
import './TeacherCard.css'

const subjectColors: Record<string, string> = {
  math: '#4a90d9',
  physics: '#e67e22',
  english: '#27ae60',
  chemistry: '#9b59b6',
  biology: '#16a085',
}

const subjectNames: Record<string, string> = {
  math: '数学',
  physics: '物理',
  english: '英语',
  chemistry: '化学',
  biology: '生物',
}

interface TeacherCardProps {
  teacher: Teacher
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/teachers/${teacher.id}`)
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="star full">
            ★
          </span>
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="star half">
            ★
          </span>
        )
      } else {
        stars.push(
          <span key={i} className="star empty">
            ★
          </span>
        )
      }
    }
    return stars
  }

  return (
    <div className="teacher-card" onClick={handleClick}>
      <div className="teacher-avatar">
        {teacher.avatar ? (
          <img src={teacher.avatar} alt={teacher.name} />
        ) : (
          <span className="avatar-letter">{teacher.name.charAt(0)}</span>
        )}
      </div>
      <div className="teacher-info">
        <h3 className="teacher-name">{teacher.name}</h3>
        <div className="teacher-subjects">
          {teacher.subjects.map((subject) => (
            <span
              key={subject}
              className="subject-tag"
              style={{ backgroundColor: subjectColors[subject] || '#95a5a6' }}
            >
              {subjectNames[subject] || subject}
            </span>
          ))}
        </div>
        <div className="teacher-rating">
          <div className="stars">{renderStars(teacher.rating)}</div>
          <span className="rating-score">{teacher.rating.toFixed(1)}</span>
          <span className="review-count">({teacher.reviewCount}条评价)</span>
        </div>
        <p className="teacher-bio">{teacher.bio}</p>
      </div>
    </div>
  )
}

export default TeacherCard
