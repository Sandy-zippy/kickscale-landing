interface StickyCTAProps {
  isQuizVisible: boolean
}

export default function StickyCTA({ isQuizVisible }: StickyCTAProps) {
  if (isQuizVisible) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[rgba(20,20,24,0.95)] backdrop-blur-xl border-t border-[#2E2E36] p-4">
      <a
        href="#quiz"
        className="block w-full text-center rounded-lg bg-[#D5EB4B] py-3 text-sm font-semibold text-[#0c0c10] hover:bg-[#E4F57A] transition-colors"
      >
        Get Your Free Audit
      </a>
      <p className="text-center text-[#6B7280] text-xs mt-2">
        No commitment. We map your processes for free.
      </p>
    </div>
  )
}
