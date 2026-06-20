import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Member, Skill } from '@/utils/recommendationEngine'
import { X, Plus, Trash2, Save, UserPlus, Users, Info } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface CollaborationEntry {
  otherMemberId: string
  projectCount: number
  lastDate: string
}

const getTodayDate = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function MemberFormModal() {
  const {
    showMemberModal,
    setShowMemberModal,
    editingMember,
    setEditingMember,
    addMember,
    updateMember,
    members,
    collaborations: storeCollaborations,
    fetchInitialData,
  } = useAppStore()

  const [name, setName] = useState('')
  const [skills, setSkills] = useState<Skill[]>([{ name: '', proficiency: 3 }])
  const [localCollaborations, setLocalCollaborations] = useState<CollaborationEntry[]>([])
  const [errors, setErrors] = useState<{ name?: string; skills?: string; collaborations?: string }>({})

  const isEditing = !!editingMember

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name)
      setSkills(
        editingMember.skills.length > 0
          ? editingMember.skills.map((s) => ({ ...s }))
          : [{ name: '', proficiency: 3 }]
      )
      const existingCollabs = storeCollaborations
        .filter(
          (c) => c.memberIdA === editingMember.id || c.memberIdB === editingMember.id
        )
        .map((c) => ({
          otherMemberId: c.memberIdA === editingMember.id ? c.memberIdB : c.memberIdA,
          projectCount: c.projectCount,
          lastDate: c.lastDate,
        }))
      setLocalCollaborations(existingCollabs.length > 0 ? existingCollabs : [])
    } else {
      setName('')
      setSkills([{ name: '', proficiency: 3 }])
      setLocalCollaborations([])
    }
    setErrors({})
  }, [editingMember, showMemberModal, storeCollaborations])

  const handleClose = () => {
    setShowMemberModal(false)
    setEditingMember(null)
  }

  const addSkill = () => {
    setSkills([...skills, { name: '', proficiency: 3 }])
  }

  const removeSkill = (index: number) => {
    if (skills.length <= 1) return
    setSkills(skills.filter((_, i) => i !== index))
  }

  const updateSkill = (index: number, field: 'name' | 'proficiency', value: string | number) => {
    const newSkills = [...skills]
    newSkills[index] = { ...newSkills[index], [field]: value } as Skill
    setSkills(newSkills)
  }

  const addCollaboration = () => {
    if (otherMembers.length === 0) return
    setLocalCollaborations([
      ...localCollaborations,
      { otherMemberId: otherMembers[0].id, projectCount: 1, lastDate: getTodayDate() },
    ])
  }

  const removeCollaboration = (index: number) => {
    setLocalCollaborations(localCollaborations.filter((_, i) => i !== index))
  }

  const updateCollaboration = (
    index: number,
    field: 'otherMemberId' | 'projectCount' | 'lastDate',
    value: string | number
  ) => {
    const newCollabs = [...localCollaborations]
    newCollabs[index] = { ...newCollabs[index], [field]: value }
    setLocalCollaborations(newCollabs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: { name?: string; skills?: string } = {}
    if (!name.trim()) newErrors.name = '请输入成员姓名'

    const validSkills = skills.filter((s) => s.name.trim())
    if (validSkills.length === 0) newErrors.skills = '请至少添加一项技能'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (!isEditing) {
      const existingNames = members.map((m) => m.name)
      if (existingNames.includes(name.trim())) {
        setErrors({ name: '该成员姓名已存在' })
        return
      }
    }

    if (isEditing) {
      const invalidCollabs = localCollaborations.filter(c => !c.otherMemberId || c.projectCount < 1 || !c.lastDate)
      if (invalidCollabs.length > 0) {
        setErrors({ ...newErrors, collaborations: '请完善所有协作记录（成员、项目数和日期均不能为空）' })
        return
      }

      const duplicateMembers = localCollaborations
        .map(c => c.otherMemberId)
        .filter((id, idx, arr) => arr.indexOf(id) !== idx)
      if (duplicateMembers.length > 0) {
        setErrors({ ...newErrors, collaborations: '同一成员不能有重复的协作记录' })
        return
      }
    }

    const memberId = editingMember?.id || uuidv4()
    const memberData: Member = {
      id: memberId,
      name: name.trim(),
      skills: validSkills.map((s) => ({
        name: s.name.trim(),
        proficiency: s.proficiency,
      })),
    }

    try {
      if (isEditing) {
        await updateMember(memberData)
      } else {
        await addMember(memberData)
      }

      if (isEditing) {
        const validCollabs = localCollaborations.filter((c) => c.otherMemberId && c.projectCount >= 1 && c.lastDate)
        for (const collab of validCollabs) {
          await fetch('/api/collaborations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberIdA: memberId,
              memberIdB: collab.otherMemberId,
              projectCount: collab.projectCount,
              lastDate: collab.lastDate,
            }),
          })
        }
      }

      await fetchInitialData()
      handleClose()
    } catch (err) {
      console.error('保存成员失败:', err)
    }
  }

  if (!showMemberModal) return null

  const otherMembers = members.filter((m) => m.id !== editingMember?.id)
  const canEditCollaborations = isEditing && otherMembers.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeInUp"
      onClick={handleClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(10, 22, 40, 0.75)', backdropFilter: 'blur(8px)' }} />

      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden animate-fadeInUp rounded-2xl"
        style={{
          background: 'linear-gradient(160deg, rgba(26, 39, 68, 0.98) 0%, rgba(48, 43, 99, 0.95) 100%)',
          border: '1px solid rgba(74, 237, 196, 0.2)',
          boxShadow: '0 25px 80px -20px rgba(0, 0, 0, 0.6), 0 0 60px -15px rgba(74, 237, 196, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'rgba(74, 237, 196, 0.1)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{
                background: isEditing
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(74, 237, 196, 0.2) 0%, rgba(45, 212, 168, 0.08) 100%)',
              }}
            >
              <UserPlus size={20} style={{ color: isEditing ? 'var(--amber)' : 'var(--mint)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-[Outfit]">
                {isEditing ? '编辑成员' : '添加新成员'}
              </h2>
              <p className="text-xs text-[color:var(--text-muted)]">
                {isEditing ? '更新成员信息和技能熟练度' : '录入成员基本信息与技能'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-180px)]">
          <div>
            <label className="block text-sm font-semibold mb-2 text-[color:var(--text-secondary)]">
              成员姓名 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：张三"
              className="w-full px-4 py-3 rounded-xl text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] transition-all"
              style={{
                background: 'rgba(10, 22, 40, 0.5)',
                border: `1px solid ${errors.name ? 'rgba(255, 107, 138, 0.5)' : 'rgba(74, 237, 196, 0.12)'}`,
              }}
              onFocus={(e) => {
                if (!errors.name) {
                  e.currentTarget.style.borderColor = 'rgba(74, 237, 196, 0.4)'
                }
              }}
              onBlur={(e) => {
                if (!errors.name) {
                  e.currentTarget.style.borderColor = 'rgba(74, 237, 196, 0.12)'
                }
              }}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[color:var(--text-secondary)]">
                技能列表 <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <button
                type="button"
                onClick={addSkill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: 'rgba(74, 237, 196, 0.1)',
                  color: 'var(--mint)',
                  border: '1px solid rgba(74, 237, 196, 0.2)',
                }}
              >
                <Plus size={14} />
                添加技能
              </button>
            </div>

            {errors.skills && (
              <p className="mb-2 text-xs" style={{ color: 'var(--danger)' }}>
                {errors.skills}
              </p>
            )}

            <div className="space-y-3">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl animate-fadeInUp"
                  style={{
                    background: 'rgba(10, 22, 40, 0.35)',
                    border: '1px solid rgba(74, 237, 196, 0.08)',
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => updateSkill(index, 'name', e.target.value)}
                      placeholder={`技能 ${index + 1} 名称，如 React`}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-black/30 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)]"
                      style={{ border: '1px solid rgba(74, 237, 196, 0.1)' }}
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[color:var(--text-muted)] w-16 shrink-0">熟练度</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={skill.proficiency}
                        onChange={(e) => updateSkill(index, 'proficiency', parseInt(e.target.value))}
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, var(--mint) 0%, var(--mint) ${
                            ((skill.proficiency - 1) / 4) * 100
                          }%, rgba(10,22,40,0.6) ${((skill.proficiency - 1) / 4) * 100}%, rgba(10,22,40,0.6) 100%)`,
                          accentColor: 'var(--mint)',
                        }}
                      />
                      <div className="flex gap-1 w-16 shrink-0">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{
                              background: n <= skill.proficiency ? 'var(--mint)' : 'rgba(10,22,40,0.6)',
                              opacity: n <= skill.proficiency ? 1 : 0.5,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    disabled={skills.length <= 1}
                    className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-500/20"
                    style={{ color: skills.length <= 1 ? 'var(--text-muted)' : 'var(--danger)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[color:var(--text-secondary)]">
                协作历史
              </label>
              <button
                type="button"
                onClick={addCollaboration}
                disabled={!canEditCollaborations}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(74, 237, 196, 0.1)',
                  color: 'var(--mint)',
                  border: '1px solid rgba(74, 237, 196, 0.2)',
                }}
              >
                <Plus size={14} />
                添加协作记录
              </button>
            </div>

            {errors.collaborations && (
              <p className="mb-2 text-xs" style={{ color: 'var(--danger)' }}>
                {errors.collaborations}
              </p>
            )}

            {!isEditing ? (
              <div
                className="flex items-center gap-2.5 p-4 rounded-xl text-xs"
                style={{
                  background: 'rgba(10, 22, 40, 0.3)',
                  border: '1px solid rgba(74, 237, 196, 0.08)',
                  color: 'var(--text-muted)',
                }}
              >
                <Info size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                <span>成员保存后可添加协作关系记录</span>
              </div>
            ) : otherMembers.length === 0 ? (
              <div
                className="flex items-center gap-2.5 p-4 rounded-xl text-xs"
                style={{
                  background: 'rgba(10, 22, 40, 0.3)',
                  border: '1px solid rgba(74, 237, 196, 0.08)',
                  color: 'var(--text-muted)',
                }}
              >
                <Info size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                <span>请先添加其他成员以建立协作关系</span>
              </div>
            ) : (
              <div className="space-y-3">
                {localCollaborations.length === 0 ? (
                  <p className="text-xs text-[color:var(--text-muted)]">
                    暂无协作记录，点击上方按钮添加
                  </p>
                ) : (
                  localCollaborations.map((collab, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl animate-fadeInUp space-y-2.5"
                      style={{
                        background: 'rgba(10, 22, 40, 0.35)',
                        border: '1px solid rgba(74, 237, 196, 0.08)',
                        animationDelay: `${index * 60}ms`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded-lg shrink-0"
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                          }}
                        >
                          <Users size={14} style={{ color: '#a78bfa' }} />
                        </div>
                        <select
                          value={collab.otherMemberId}
                          onChange={(e) => updateCollaboration(index, 'otherMemberId', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg text-sm bg-black/30 text-[color:var(--text-primary)]"
                          style={{ border: '1px solid rgba(74, 237, 196, 0.1)' }}
                        >
                          <option value="" disabled>
                            选择协作成员...
                          </option>
                          {otherMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCollaboration(index)}
                          className="p-2 rounded-lg transition-colors hover:bg-red-500/20"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1">
                          <label className="block text-[10px] font-medium mb-1 text-[color:var(--text-muted)]">
                            项目数量
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={collab.projectCount}
                            onChange={(e) =>
                              updateCollaboration(
                                index,
                                'projectCount',
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg text-sm bg-black/30 text-[color:var(--text-primary)]"
                            style={{ border: '1px solid rgba(74, 237, 196, 0.1)' }}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-medium mb-1 text-[color:var(--text-muted)]">
                            最近协作日期
                          </label>
                          <input
                            type="date"
                            value={collab.lastDate}
                            onChange={(e) => updateCollaboration(index, 'lastDate', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-black/30 text-[color:var(--text-primary)]"
                            style={{ border: '1px solid rgba(74, 237, 196, 0.1)' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </form>

        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: 'rgba(74, 237, 196, 0.1)' }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            取消
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, var(--mint-dark) 0%, var(--mint) 100%)',
              color: '#0a1628',
              boxShadow: '0 4px 20px -5px var(--mint-glow)',
            }}
          >
            <Save size={16} />
            {isEditing ? '保存修改' : '确认添加'}
          </button>
        </div>
      </div>
    </div>
  )
}
