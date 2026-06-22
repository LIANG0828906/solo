import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, User, Calendar, Clock, Check, X, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { CourseManager } from '@/modules/course/CourseManager'
import { StudentManager } from '@/modules/student/StudentManager'
import { TaskManager } from '@/modules/task/TaskManager'
import { TaskCard } from '@/modules/task/TaskCard'
import { StarRating } from '@/components/StarRating'
import { AttendanceBar } from '@/components/AttendanceBar'
import { Modal } from '@/components/Modal'
import type { AttendanceStatus } from '@/types'

export const CourseDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const course = CourseManager.getById(id || '')
  const students = StudentManager.getByCourseId(id || '')
  const tasks = TaskManager.getByCourseId(id || '')
  const setCurrentCourseId = useStore(state => state.set