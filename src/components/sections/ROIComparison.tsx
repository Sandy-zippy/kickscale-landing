import ScrollReveal from '../ui/ScrollReveal'

const rows = [
  { task: 'Lead follow-up', manual: '2-4 hours/day', ai: 'Instant, 24/7' },
  { task: 'Monthly reports', manual: '3 days to compile', ai: 'Auto-generated daily' },
  { task: 'Invoice processing', manual: '45 min per invoice', ai: '30 seconds' },
  { task: 'Data entry', manual: '8 hours/week', ai: 'Zero' },
  { task: 'CRM updates', manual: 'Manual after calls', ai: 'Auto-synced real-time' },
]

export default function ROIComparison() {
  return (
    <section className="bg-[#141418] py-20 px-4">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <p className="text-center font-mono text-xs uppercase tracking-widest mb-4 text-[#D5EB4B]">
            THE ROI
          </p>
          <h2 className="mx-auto mb-4 max-w-xl text-center text-3xl font-bold text-white sm:text-4xl">
            Your Team Today vs. With AI
          </h2>
          <p className="mx-auto mb-12 max-w-md text-center text-sm text-[#9CA3AF]">
            Same tasks. Fraction of the time. Zero errors.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="overflow-x-auto">
            <table className="w-full overflow-hidden rounded-2xl border border-[#2E2E36] bg-[#1E1E24]">
              <thead>
                <tr className="bg-[#2E2E36]">
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    Task
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-[#EF4444]">
                    Manual
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-[#D5EB4B]">
                    With AI
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.task}
                    className={i < rows.length - 1 ? 'border-b border-[#2E2E36]' : ''}
                  >
                    <td className="px-6 py-5 text-sm font-medium text-white">
                      {row.task}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#EF4444]/70">
                      {row.manual}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#D5EB4B]/80">
                      {row.ai}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
