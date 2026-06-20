import React, { useState, useEffect, useRef } from 'react'
import TeacherCard from '../modules/teachers/TeacherCard'
import { Teacher, getTeachers } from '../modules/teachers/TeacherService'
import './HomePage.css'

const HomePage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [animate, setAnimate] = useState(false)
  const prevSearchRef = useRef('')

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    filterTeachers()
    if (prevSearchRef.current !== searchQuery) {
      setAnimate(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true)
        })
      })
      prevSearchRef.current = searchQuery
    }
  }, [searchQuery, teachers])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const data = await getTeachers()
      setTeachers(data)
      setFilteredTeachers(data)
      setAnimate(true)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTeachers = () => {
    if (!searchQuery.trim()) {
      setFilteredTeachers(teachers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(query) ||
        teacher.subjects.some((subject) => subject.toLowerCase().includes(query))
    )
    setFilteredTeachers(filtered)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="home-page">
      <div className="search-section">
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder="搜索教师姓名或科目..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="teachers-section">
        <h2 className="section-title">
          {searchQuery ? '搜索结果' : '推荐教师'}
          <span className="result-count">共 {filteredTeachers.length} 位教师</span>
        </h2>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : filteredTeachers.length > 0 ? (
          <div className="teacher-grid">
            {filteredTeachers.map((teacher, index) => (
            <div
              key={teacher.id}
              className={`teacher-card-wrapper ${animate ? 'fade-in' : 'fade-out'}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <TeacherCard teacher={teacher} />
            </div>
          ))}
          </div>
        ) : (
          <div className="no-results">
            <p>暂无匹配的教师</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
