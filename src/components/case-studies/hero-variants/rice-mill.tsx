import HeroAnimationFrame from '../HeroAnimationFrame'

export default function HeroRiceMill() {
  return (
    <HeroAnimationFrame
      slug="rice-mill-fmcg-production-distributor-automation"
      statusLeft="Plant + 40 distributors"
      statusTime="8:00 PM"
      statusTimeResolved="1-day close"
      counterMaxValue={3}
      counterUnit="Days"
      counterDanger="month-end stuck"
      bubbles={[
        { text: 'Whiteboard photo at 8pm', x: 8, y: 8 },
        { text: '40 distributors, 1 WA group', x: 50, y: 4 },
        { text: '8h/wk Excel→Tally typing', x: 12, y: 30 },
        { text: 'Month-end 3 days', x: 50, y: 30 },
        { text: 'Weighbridge data lost', x: 6, y: 54 },
        { text: 'Distributor stmts manual', x: 52, y: 54 },
        { text: 'Sunday on accounts', x: 14, y: 78 },
        { text: 'Sister-concern untracked', x: 50, y: 76 },
      ]}
      resolutionTitle="Month-end in 1 day. Whiteboard stays."
      resolutionSubtitle="4-week sprint · OCR + n8n + Tally bridge"
      ariaLabel="A rice mill's whiteboard production tracking transitions from a 3-day month-end close to a 1-day close with OCR feeding Tally."
    />
  )
}
