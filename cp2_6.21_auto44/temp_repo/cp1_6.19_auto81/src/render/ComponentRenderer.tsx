import React, { useState } from 'react'
import { motion, type TargetAndTransition } from 'framer-motion'
import { Image as ImageIcon, ChevronDown, Check } from 'lucide-react'
import type { UIComponent, UIComponentProps, ComponentType } from '@/types'

const ENTRY_INITIAL = { opacity: 0, scale: 0.9 }
const ENTRY_ANIMATE = { opacity: 1, scale: 1 }
const ENTRY_TRANSITION = {
  opacity: { duration: 0.15 },
  scale: { type: 'spring' as const, stiffness: 300, damping: 20, duration: 0.25 },
}

const DEFAULT_HOVER: TargetAndTransition = { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
const DEFAULT_TAP: TargetAndTransition = { scale: 0.98 }

function Wrapper({
  component,
  isSelected,
  onSelect,
  hover,
  tap,
  children,
}: {
  component: UIComponent
  isSelected: boolean
  onSelect: (id: string) => void
  hover?: TargetAndTransition
  tap?: TargetAndTransition
  children: React.ReactNode
}) {
  const p = component.props
  return (
    <motion.div
      initial={ENTRY_INITIAL}
      animate={ENTRY_ANIMATE}
      transition={ENTRY_TRANSITION}
      whileHover={hover ?? DEFAULT_HOVER}
      whileTap={tap ?? DEFAULT_TAP}
      onClick={(e) => { e.stopPropagation(); onSelect(component.id) }}
      style={{
        position: 'absolute',
        left: p.x,
        top: p.y,
        width: p.width,
        height: p.height,
        opacity: p.opacity,
        boxSizing: 'border-box',
      }}
    >
      {children}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            inset: -1,
            border: '2px dashed #4A90D9',
            borderRadius: p.borderRadius ?? 4,
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.div>
  )
}

function ButtonContent({ p }: { p: UIComponentProps }) {
  return (
    <div
      className="flex items-center justify-center w-full h-full select-none"
      style={{
        backgroundColor: p.backgroundColor || '#3B82F6',
        color: p.textColor || '#FFFFFF',
        borderRadius: p.borderRadius ?? 6,
        fontSize: p.fontSize || 14,
        fontWeight: p.fontWeight,
      }}
    >
      {p.text || 'Button'}
    </div>
  )
}

function InputContent({ p }: { p: UIComponentProps }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      className="w-full h-full px-3 outline-none"
      style={{
        border: `1px solid ${focused ? '#4A90D9' : (p.borderColor || '#D1D5DB')}`,
        borderRadius: p.borderRadius ?? 4,
        boxShadow: focused ? '0 0 0 2px rgba(74,144,217,0.2)' : 'none',
        fontSize: p.fontSize || 14,
        color: p.textColor,
      }}
      placeholder={p.placeholder || 'Enter text...'}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function CardContent({ p }: { p: UIComponentProps }) {
  return (
    <div
      className="bg-white border border-gray-200 p-3 w-full h-full flex flex-col"
      style={{ borderRadius: p.borderRadius ?? 8, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
    >
      <div className="font-semibold text-sm mb-2" style={{ color: p.textColor || '#1F2937' }}>
        {p.text || 'Card Title'}
      </div>
      <div className="flex-1 bg-gray-50 rounded text-xs text-gray-400 flex items-center justify-center">
        Content area
      </div>
    </div>
  )
}

function NavbarContent({ p }: { p: UIComponentProps }) {
  return (
    <div
      className="flex items-center justify-between px-4 w-full h-full"
      style={{ backgroundColor: p.backgroundColor || '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}
    >
      <span className="font-bold text-sm" style={{ color: p.textColor || '#1F2937' }}>
        {p.text || 'Logo'}
      </span>
      <div className="flex gap-3">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <div className="w-2 h-2 rounded-full bg-gray-400" />
      </div>
    </div>
  )
}

function TableContent({ p }: { p: UIComponentProps }) {
  const headers = (p.text || 'Col1,Col2,Col3').split(',').map((s) => s.trim())
  const rows = [
    headers.map((_, i) => `Row 1`),
    headers.map((_, i) => `Row 2`),
    headers.map((_, i) => `Row 3`),
  ]
  return (
    <div
      className="w-full h-full border border-gray-200 overflow-hidden"
      style={{ borderRadius: p.borderRadius ?? 4, fontSize: p.fontSize || 12 }}
    >
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((h, i) => (
              <th key={i} className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-gray-200 px-2 py-1 text-gray-600">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TextContent({ p }: { p: UIComponentProps }) {
  return (
    <div
      className="w-full h-full flex items-center"
      style={{
        color: p.textColor || '#1F2937',
        fontSize: p.fontSize || 14,
        fontWeight: p.fontWeight,
      }}
    >
      {p.text || 'Text'}
    </div>
  )
}

function ImageContent({ p }: { p: UIComponentProps }) {
  return (
    <div
      className="w-full h-full bg-gray-100 flex items-center justify-center"
      style={{ borderRadius: p.borderRadius ?? 4 }}
    >
      <ImageIcon className="w-8 h-8 text-gray-400" />
    </div>
  )
}

function CheckboxContent({ p }: { p: UIComponentProps }) {
  const isChecked = (p.text || '').toLowerCase().includes('checked')
  const label = (p.text || '').replace(/checked/gi, '').trim() || 'Checkbox'
  return (
    <div className="flex items-center gap-2 w-full h-full px-1">
      <div
        className="w-4 h-4 border rounded flex items-center justify-center flex-shrink-0"
        style={{
          borderColor: isChecked ? '#3B82F6' : '#D1D5DB',
          backgroundColor: isChecked ? '#3B82F6' : 'transparent',
        }}
      >
        {isChecked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm truncate" style={{ color: p.textColor, fontSize: p.fontSize }}>
        {label}
      </span>
    </div>
  )
}

function SelectContent({ p }: { p: UIComponentProps }) {
  return (
    <div
      className="w-full h-full flex items-center px-3 bg-white border border-gray-300"
      style={{ borderRadius: p.borderRadius ?? 4, fontSize: p.fontSize || 14 }}
    >
      <span className="flex-1 text-gray-400 truncate">{p.placeholder || 'Select...'}</span>
      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
    </div>
  )
}

function TextareaContent({ p }: { p: UIComponentProps }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      className="w-full h-full p-2 resize-none outline-none text-sm"
      style={{
        border: `1px solid ${focused ? '#4A90D9' : (p.borderColor || '#D1D5DB')}`,
        borderRadius: p.borderRadius ?? 4,
        boxShadow: focused ? '0 0 0 2px rgba(74,144,217,0.2)' : 'none',
        color: p.textColor,
        fontSize: p.fontSize,
      }}
      placeholder={p.placeholder || 'Enter text...'}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function DividerContent({ p }: { p: UIComponentProps }) {
  return (
    <div className="w-full h-full flex items-center px-2">
      <div className="w-full border-t" style={{ borderColor: p.borderColor || '#E5E7EB' }} />
    </div>
  )
}

function AvatarContent({ p }: { p: UIComponentProps }) {
  const letter = (p.text || 'U').charAt(0).toUpperCase()
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold w-full h-full"
      style={{
        backgroundColor: p.backgroundColor || '#6B7280',
        fontSize: p.fontSize || 16,
      }}
    >
      {letter}
    </div>
  )
}

function BadgeContent({ p }: { p: UIComponentProps }) {
  return (
    <div
      className="flex items-center justify-center w-full h-full px-3 font-medium"
      style={{
        backgroundColor: p.backgroundColor || '#3B82F6',
        color: p.textColor || '#FFFFFF',
        borderRadius: p.borderRadius ?? 9999,
        fontSize: p.fontSize || 12,
      }}
    >
      {p.text || 'Badge'}
    </div>
  )
}

function SwitchContent({ p }: { p: UIComponentProps }) {
  const isOn = (p.text || '').toLowerCase().includes('on')
  return (
    <div className="flex items-center w-full h-full px-1">
      <div
        className="relative w-10 h-5 rounded-full"
        style={{ backgroundColor: isOn ? '#3B82F6' : '#D1D5DB' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
          style={{ left: isOn ? 22 : 2, transition: 'left 0.2s ease' }}
        />
      </div>
    </div>
  )
}

function SliderContent({ p }: { p: UIComponentProps }) {
  return (
    <div className="flex items-center w-full h-full px-2">
      <div className="w-full h-2 bg-gray-200 rounded-full relative">
        <div
          className="h-full rounded-full"
          style={{ width: '50%', backgroundColor: p.backgroundColor || '#3B82F6' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-sm"
          style={{ left: 'calc(50% - 8px)', borderColor: p.backgroundColor || '#3B82F6' }}
        />
      </div>
    </div>
  )
}

function ProgressContent({ p }: { p: UIComponentProps }) {
  return (
    <div className="flex items-center w-full h-full px-1">
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: '60%', backgroundColor: p.backgroundColor || '#3B82F6' }}
        />
      </div>
    </div>
  )
}

const renderers: Record<ComponentType, (p: UIComponentProps) => React.ReactNode> = {
  button: (p) => <ButtonContent p={p} />,
  input: (p) => <InputContent p={p} />,
  card: (p) => <CardContent p={p} />,
  navbar: (p) => <NavbarContent p={p} />,
  table: (p) => <TableContent p={p} />,
  text: (p) => <TextContent p={p} />,
  image: (p) => <ImageContent p={p} />,
  checkbox: (p) => <CheckboxContent p={p} />,
  select: (p) => <SelectContent p={p} />,
  textarea: (p) => <TextareaContent p={p} />,
  divider: (p) => <DividerContent p={p} />,
  avatar: (p) => <AvatarContent p={p} />,
  badge: (p) => <BadgeContent p={p} />,
  switch: (p) => <SwitchContent p={p} />,
  slider: (p) => <SliderContent p={p} />,
  progress: (p) => <ProgressContent p={p} />,
}

export function renderComponent(
  component: UIComponent,
  isSelected: boolean,
  onSelect: (id: string) => void,
): React.ReactNode {
  const hover: TargetAndTransition | undefined =
    component.type === 'button'
      ? { scale: 1.02, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
      : undefined
  const tap: TargetAndTransition | undefined =
    component.type === 'button'
      ? { scale: 0.98 }
      : undefined

  return (
    <Wrapper
      component={component}
      isSelected={isSelected}
      onSelect={onSelect}
      hover={hover}
      tap={tap}
    >
      {renderers[component.type]?.(component.props)}
    </Wrapper>
  )
}

interface ComponentRendererProps {
  components: UIComponent[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function ComponentRenderer({ components, selectedId, onSelect }: ComponentRendererProps) {
  return (
    <>
      {components.map((comp) => (
        <React.Fragment key={comp.id}>
          {renderComponent(comp, comp.id === selectedId, onSelect)}
        </React.Fragment>
      ))}
    </>
  )
}
