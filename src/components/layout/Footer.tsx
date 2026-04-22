export default function Footer() {
  return (
    <footer className="bg-[#2A2A35] border-t border-[#3E3E48] py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
        {/* Left: copyright + email + city, all inline */}
        <div className="text-[#9CA3AF] text-center md:text-left flex flex-wrap items-center justify-center md:justify-start gap-x-2">
          <span>&copy; 2026 ZippyScale</span>
          <span className="text-[#4B5563]" aria-hidden="true">·</span>
          <a href="mailto:hello@zippyscale.in" className="hover:text-[#FAFAFA] transition-colors">
            hello@zippyscale.in
          </a>
          <span className="text-[#4B5563]" aria-hidden="true">·</span>
          <span className="text-[#6B7280]">Hyderabad, India</span>
        </div>

        {/* Center: tagline */}
        <p className="text-[#6B7280] text-center order-last md:order-none basis-full md:basis-auto">
          Data Finds Money. AI Multiplies It.
        </p>

        {/* Right: social */}
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
    </footer>
  )
}
