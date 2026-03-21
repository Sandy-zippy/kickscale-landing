export default function Footer() {
  return (
    <footer className="bg-[#0c0c10] border-t border-[#2E2E36] py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        {/* Left */}
        <div className="text-[#9CA3AF] text-center md:text-left">
          &copy; 2026 ZippyScale &middot;{' '}
          <a href="mailto:hello@zippyscale.in" className="hover:text-[#FAFAFA] transition-colors">
            hello@zippyscale.in
          </a>
        </div>

        {/* Center */}
        <p className="text-[#6B7280] text-center">
          Data Finds Money. AI Multiplies It.
        </p>

        {/* Right */}
        <div className="text-[#9CA3AF] text-center md:text-right">
          <a
            href="https://instagram.com/zippy.scale"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#FAFAFA] transition-colors"
          >
            @zippy.scale
          </a>
        </div>
      </div>

      <p className="text-center text-[#6B7280] text-xs mt-4">
        Hyderabad, Telangana, India
      </p>
    </footer>
  )
}
