import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import RippleButton from '@/components/RippleButton'
import Modal from '@/components/Modal'
import type { Job } from '@shared/types'
import { Plus, MapPin, DollarSign, Building2, Clock } from 'lucide-react'

const fmtSalary = (v: number) => `${v / 1000}k`

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SAL_MIN = 10000
const SAL_MAX = 100000
const SAL_STEP = 5000

const initForm = { title: '', department: '', location: '', salaryMin: 15000, salaryMax: 30000, description: '' }

export default function JobsPage() {
  const { jobs, loading, fetchJobs, createJob } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [form, setForm] = useState(initForm)

  useEffect(() => {
    if (jobs.length === 0) fetchJobs()
  }, [])

  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  const handleMinSlider = (v: number) => { if (v <= form.salaryMax) set('salaryMin', v) }
  const handleMaxSlider = (v: number) => { if (v >= form.salaryMin) set('salaryMax', v) }

  const handleSubmit = async () => {
    if (!form.title || !form.department || !form.location) return
    await createJob({
      title: form.title,
      department: form.department,
      location: form.location,
      salaryMin: form.salaryMin,
      salaryMax: form.salaryMax,
      description: form.description,
    })
    setModalOpen(false)
    setForm(initForm)
  }

  const minPct = ((form.salaryMin - SAL_MIN) / (SAL_MAX - SAL_MIN)) * 100
  const maxPct = ((form.salaryMax - SAL_MIN) / (SAL_MAX - SAL_MIN)) * 100

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e293b]">职位管理</h1>
        <RippleButton variant="primary" onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-1.5">
            <Plus size={16} />
            创建职位
          </span>
        </RippleButton>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[180px] animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="flex h-[180px] cursor-pointer flex-col justify-between rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
            >
              <div>
                <h3 className="mb-2 font-semibold text-lg text-[#1e293b]">{job.title}</h3>
                <span className="inline-flex items-center rounded-full bg-[#8b5cf6]/10 px-2.5 py-0.5 text-xs font-medium text-purple-600">
                  <Building2 size={12} className="mr-1" />
                  {job.department}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-[#3b82f6]">
                    <DollarSign size={14} />
                    {fmtSalary(job.salaryMin)}-{fmtSalary(job.salaryMax)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  {fmtDate(job.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedJob && (
        <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob.title}>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">部门</span>
              <p className="font-medium text-[#1e293b]">{selectedJob.department}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">工作地点</span>
              <p className="font-medium text-[#1e293b]">{selectedJob.location}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">薪资范围</span>
              <p className="font-medium text-[#3b82f6]">{fmtSalary(selectedJob.salaryMin)} - {fmtSalary(selectedJob.salaryMax)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">职位描述</span>
              <p className="text-sm text-[#1e293b]">{selectedJob.description}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">创建时间</span>
              <p className="text-sm text-gray-600">{fmtDate(selectedJob.createdAt)}</p>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm(initForm) }}
        title="创建职位"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">职位标题</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">部门</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">工作地点</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">薪资范围</label>
            <div className="mb-2 text-center text-sm font-medium text-[#3b82f6]">
              {fmtSalary(form.salaryMin)} - {fmtSalary(form.salaryMax)}
            </div>
            <div className="relative h-8">
              <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-gray-200">
                <div
                  className="absolute h-2 rounded-full bg-[#3b82f6]"
                  style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
                />
              </div>
              <input
                type="range"
                min={SAL_MIN}
                max={SAL_MAX}
                step={SAL_STEP}
                value={form.salaryMin}
                onChange={(e) => handleMinSlider(Number(e.target.value))}
                className="range-input absolute inset-x-0 w-full"
              />
              <input
                type="range"
                min={SAL_MIN}
                max={SAL_MAX}
                step={SAL_STEP}
                value={form.salaryMax}
                onChange={(e) => handleMaxSlider(Number(e.target.value))}
                className="range-input absolute inset-x-0 w-full"
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>10k</span>
              <span>100k</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">职位描述</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value.slice(0, 2000))}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-1 text-right text-xs text-gray-400">{form.description.length}/2000</div>
          </div>
          <RippleButton type="submit" variant="primary" className="w-full">
            创建职位
          </RippleButton>
        </form>
      </Modal>

      <style>{`
        .range-input {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          pointer-events: none;
          outline: none;
          height: 32px;
          margin: 0;
        }
        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          pointer-events: auto;
          position: relative;
          z-index: 2;
        }
        .range-input::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          pointer-events: auto;
          position: relative;
          z-index: 2;
        }
        .range-input::-webkit-slider-runnable-track { height: 0; }
        .range-input::-moz-range-track { height: 0; background: transparent; }
      `}</style>
    </div>
  )
}
