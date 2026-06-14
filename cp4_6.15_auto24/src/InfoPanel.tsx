import { useState, useCallback } from 'react'
import { useMoleculeStore, getAtomicWeight, type Atom, type Bond, type MoleculeData, type Measurement } from '@/store'
import { ChevronDown, ChevronRight, Search, Copy, Check, ArrowUpDown, Trash2 } from 'lucide-react'

type SortDir = 'asc' | 'desc'

interface SortState {
  column: string
  direction: SortDir
}

function MoleculeSummary({ data }: { data: MoleculeData }) {
  const cards = [
    { label: '原子总数', value: data.atoms.length },
    { label: '键总数', value: data.bonds.length },
    { label: '分子式', value: data.formula },
    { label: '分子量', value: data.molecularWeight.toFixed(2) },
    { label: '电荷', value: data.totalCharge },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg p-2"
          style={{ backgroundColor: '#0f3460' }}
        >
          <div className="text-xs" style={{ color: '#e0e0e0', opacity: 0.7 }}>
            {card.label}
          </div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: '#e0e0e0' }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function AtomTable({ atoms }: { atoms: Atom[] }) {
  const [expanded, setExpanded] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortState>({ column: '', direction: 'asc' })
  const highlightedAtomId = useMoleculeStore((s) => s.highlightedAtomId)
  const setHighlightedAtom = useMoleculeStore((s) => s.setHighlightedAtom)

  const toggleSort = useCallback((column: string) => {
    setSort((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const filtered = atoms.filter(
    (a) =>
      a.element.toLowerCase().includes(search.toLowerCase()) ||
      String(a.id).includes(search)
  )

  const sorted = [...filtered].sort((a, b) => {
    if (!sort.column) return 0
    let va: number | string = ''
    let vb: number | string = ''
    switch (sort.column) {
      case '序号': va = a.id; vb = b.id; break
      case '元素': va = a.element; vb = b.element; break
      case 'X': va = a.x; vb = b.x; break
      case 'Y': va = a.y; vb = b.y; break
      case 'Z': va = a.z; vb = b.z; break
      case '电荷': va = a.charge; vb = b.charge; break
    }
    if (va < vb) return sort.direction === 'asc' ? -1 : 1
    if (va > vb) return sort.direction === 'asc' ? 1 : -1
    return 0
  })

  const columns = ['序号', '元素', 'X', 'Y', 'Z', '电荷'] as const

  return (
    <div className="border-t" style={{ borderColor: '#0f3460' }}>
      <button
        className="flex items-center gap-1 w-full px-3 py-2 text-left text-sm font-medium"
        style={{ color: '#e0e0e0' }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        原子列表 ({atoms.length})
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          <div className="relative mb-2">
            <Search
              size={12}
              className="absolute left-2 top-1/2 -translate-y-1/2"
              style={{ color: '#e0e0e0', opacity: 0.5 }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索原子..."
              className="w-full rounded pl-7 pr-2 py-1 text-xs outline-none"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #0f3460',
                color: '#e0e0e0',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#e94560')}
              onBlur={(e) => (e.target.style.borderColor = '#0f3460')}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: '#e0e0e0' }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-1 py-1 text-left cursor-pointer select-none whitespace-nowrap"
                      style={{ color: '#e0e0e0', opacity: 0.7 }}
                      onClick={() => toggleSort(col)}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {col}
                        <ArrowUpDown size={10} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((atom) => (
                  <tr
                    key={atom.id}
                    className="table-row-hover rounded"
                    style={{
                      backgroundColor:
                        highlightedAtomId === atom.id
                          ? 'rgba(233, 69, 96, 0.25)'
                          : 'transparent',
                      transition: 'background-color 0.15s ease-out',
                    }}
                    onMouseEnter={() => setHighlightedAtom(atom.id)}
                    onMouseLeave={() => setHighlightedAtom(null)}
                  >
                    <td className="px-1 py-0.5">{atom.id}</td>
                    <td className="px-1 py-0.5">{atom.element}</td>
                    <td className="px-1 py-0.5">{atom.x.toFixed(3)}</td>
                    <td className="px-1 py-0.5">{atom.y.toFixed(3)}</td>
                    <td className="px-1 py-0.5">{atom.z.toFixed(3)}</td>
                    <td className="px-1 py-0.5">{atom.charge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const BOND_TYPE_LABELS: Record<Bond['type'], string> = {
  single: '单键',
  double: '双键',
  triple: '三键',
}

function BondTable({ bonds, atoms }: { bonds: Bond[]; atoms: Atom[] }) {
  const [expanded, setExpanded] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortState>({ column: '', direction: 'asc' })
  const highlightedBondId = useMoleculeStore((s) => s.highlightedBondId)
  const setHighlightedBond = useMoleculeStore((s) => s.setHighlightedBond)

  const toggleSort = useCallback((column: string) => {
    setSort((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const atomMap = new Map(atoms.map((a) => [a.id, a]))

  const getAtomLabel = (id: number): string => {
    const atom = atomMap.get(id)
    return atom ? `${atom.element}${atom.id}` : String(id)
  }

  const filtered = bonds.filter(
    (b) =>
      getAtomLabel(b.atom1Id).toLowerCase().includes(search.toLowerCase()) ||
      getAtomLabel(b.atom2Id).toLowerCase().includes(search.toLowerCase()) ||
      BOND_TYPE_LABELS[b.type].includes(search) ||
      String(b.id).includes(search)
  )

  const sorted = [...filtered].sort((a, b) => {
    if (!sort.column) return 0
    let va: number | string = ''
    let vb: number | string = ''
    switch (sort.column) {
      case '序号': va = a.id; vb = b.id; break
      case '原子1': va = getAtomLabel(a.atom1Id); vb = getAtomLabel(b.atom1Id); break
      case '原子2': va = getAtomLabel(a.atom2Id); vb = getAtomLabel(b.atom2Id); break
      case '键型': va = BOND_TYPE_LABELS[a.type]; vb = BOND_TYPE_LABELS[b.type]; break
    }
    if (va < vb) return sort.direction === 'asc' ? -1 : 1
    if (va > vb) return sort.direction === 'asc' ? 1 : -1
    return 0
  })

  const columns = ['序号', '原子1', '原子2', '键型'] as const

  return (
    <div className="border-t" style={{ borderColor: '#0f3460' }}>
      <button
        className="flex items-center gap-1 w-full px-3 py-2 text-left text-sm font-medium"
        style={{ color: '#e0e0e0' }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        键列表 ({bonds.length})
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          <div className="relative mb-2">
            <Search
              size={12}
              className="absolute left-2 top-1/2 -translate-y-1/2"
              style={{ color: '#e0e0e0', opacity: 0.5 }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索键..."
              className="w-full rounded pl-7 pr-2 py-1 text-xs outline-none"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #0f3460',
                color: '#e0e0e0',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#e94560')}
              onBlur={(e) => (e.target.style.borderColor = '#0f3460')}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: '#e0e0e0' }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-1 py-1 text-left cursor-pointer select-none whitespace-nowrap"
                      style={{ color: '#e0e0e0', opacity: 0.7 }}
                      onClick={() => toggleSort(col)}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {col}
                        <ArrowUpDown size={10} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((bond) => (
                  <tr
                    key={bond.id}
                    className="table-row-hover rounded"
                    style={{
                      backgroundColor:
                        highlightedBondId === bond.id
                          ? 'rgba(233, 69, 96, 0.25)'
                          : 'transparent',
                      transition: 'background-color 0.15s ease-out',
                    }}
                    onMouseEnter={() => setHighlightedBond(bond.id)}
                    onMouseLeave={() => setHighlightedBond(null)}
                  >
                    <td className="px-1 py-0.5">{bond.id}</td>
                    <td className="px-1 py-0.5">{getAtomLabel(bond.atom1Id)}</td>
                    <td className="px-1 py-0.5">{getAtomLabel(bond.atom2Id)}</td>
                    <td className="px-1 py-0.5">{BOND_TYPE_LABELS[bond.type]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const MEASURE_LABELS: Record<Measurement['type'], string> = {
  none: '',
  distance: '距离',
  angle: '键角',
  dihedral: '二面角',
}

const MEASURE_UNITS: Record<Measurement['type'], string> = {
  none: '',
  distance: 'Å',
  angle: '°',
  dihedral: '°',
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [value])

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded transition-colors duration-200"
      style={{ color: '#e0e0e0', opacity: 0.6 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.2)'
        e.currentTarget.style.opacity = '1'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.opacity = '0.6'
      }}
    >
      {copied ? <Check size={12} style={{ color: '#4ade80' }} /> : <Copy size={12} />}
    </button>
  )
}

function MeasurementsPanel({ measurements }: { measurements: Measurement[] }) {
  const removeMeasurement = useMoleculeStore((s) => s.removeMeasurement)
  const clearMeasurements = useMoleculeStore((s) => s.clearMeasurements)

  return (
    <div className="border-t p-3" style={{ borderColor: '#0f3460' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: '#e0e0e0' }}>
          测量结果
        </span>
        {measurements.length > 0 && (
          <button
            onClick={clearMeasurements}
            className="text-xs px-2 py-0.5 rounded transition-colors duration-200"
            style={{ color: '#e94560' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            清除全部
          </button>
        )}
      </div>
      {measurements.length === 0 ? (
        <div className="text-xs" style={{ color: '#e0e0e0', opacity: 0.4 }}>
          暂无测量
        </div>
      ) : (
        <div className="space-y-1">
          {measurements.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded px-2 py-1"
              style={{ backgroundColor: '#0f3460' }}
            >
              <span
                className="text-xs font-medium shrink-0"
                style={{ color: '#e94560' }}
              >
                {MEASURE_LABELS[m.type]}
              </span>
              <span className="text-xs flex-1" style={{ color: '#e0e0e0' }}>
                {m.value.toFixed(4)} {MEASURE_UNITS[m.type]}
              </span>
              <CopyButton value={`${m.value.toFixed(4)} ${MEASURE_UNITS[m.type]}`} />
              <button
                onClick={() => removeMeasurement(i)}
                className="p-1 rounded transition-colors duration-200"
                style={{ color: '#e0e0e0', opacity: 0.6 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.2)'
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.opacity = '0.6'
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function InfoPanel() {
  const moleculeData = useMoleculeStore((s) => s.moleculeData)
  const measurements = useMoleculeStore((s) => s.measurements)

  if (!moleculeData) {
    return (
      <div
        className="h-full flex items-center justify-center p-6"
        style={{ backgroundColor: '#16213e', color: '#e0e0e0', opacity: 0.5 }}
      >
        <span className="text-sm text-center">请上传分子文件或选择示例</span>
      </div>
    )
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: '#16213e' }}
    >
      <MoleculeSummary data={moleculeData} />
      <AtomTable atoms={moleculeData.atoms} />
      <BondTable bonds={moleculeData.bonds} atoms={moleculeData.atoms} />
      <MeasurementsPanel measurements={measurements} />
    </div>
  )
}
