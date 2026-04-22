import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface Column {
  name: string
  badge?: string
  isUs?: boolean
}

interface Row {
  feature: string
  values: Array<string | { text: string; check: 'yes' | 'no' | 'partial' }>
}

interface Props {
  columns: Column[]
  rows: Row[]
}

const checkStyles = {
  yes: { bg: 'bg-[#22C55E]/10', text: 'text-[#22C55E]', icon: '✓' },
  no: { bg: 'bg-red-500/10', text: 'text-red-500', icon: '×' },
  partial: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: '~' },
}

export default function ComparisonTable({ columns, rows }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })
  const reduce = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
      className="overflow-x-auto"
    >
      <table className="w-full border-collapse min-w-[640px]">
        <thead>
          <tr>
            <th className="text-left p-3 lg:p-4 text-xs font-mono uppercase tracking-wider text-[#6B7280] font-normal align-bottom">
              Compared on
            </th>
            {columns.map((col) => (
              <th
                key={col.name}
                className={`p-3 lg:p-4 text-center align-bottom ${
                  col.isUs
                    ? 'bg-[#1A1A2E] text-[#D5EB4B] rounded-t-xl'
                    : 'text-[#1A1A2E]'
                }`}
              >
                <div className="font-bold text-sm lg:text-base mb-1">{col.name}</div>
                {col.badge && (
                  <div
                    className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                      col.isUs ? 'bg-[#D5EB4B] text-[#1A1A2E]' : 'bg-gray-100 text-[#6B7280]'
                    }`}
                  >
                    {col.badge}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FFFDF7]'}>
              <td className="p-3 lg:p-4 font-semibold text-[#1A1A2E] text-sm">{row.feature}</td>
              {row.values.map((val, j) => {
                const isUs = columns[j]?.isUs
                if (typeof val === 'string') {
                  return (
                    <td
                      key={j}
                      className={`p-3 lg:p-4 text-center text-sm ${
                        isUs ? 'bg-[#1A1A2E] text-white font-semibold' : 'text-[#4B5563]'
                      }`}
                    >
                      {val}
                    </td>
                  )
                }
                const style = checkStyles[val.check]
                return (
                  <td
                    key={j}
                    className={`p-3 lg:p-4 text-center text-sm ${
                      isUs ? 'bg-[#1A1A2E] text-white' : 'text-[#4B5563]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`inline-flex w-5 h-5 rounded-full ${style.bg} ${style.text} items-center justify-center text-xs font-bold`}
                        aria-label={val.check === 'yes' ? 'yes' : val.check === 'no' ? 'no' : 'partial'}
                      >
                        {style.icon}
                      </span>
                      <span className={isUs ? 'text-white' : ''}>{val.text}</span>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}
