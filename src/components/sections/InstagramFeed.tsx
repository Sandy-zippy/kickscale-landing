import { motion } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'

const posts = [
  {
    image: '/instagram/post-5-award.jpg',
    caption:
      'Awarded "Fastest Growing AI-Based Growth Marketing Agency in India" at Visionary Achievers Awards',
    link: 'https://www.instagram.com/p/DVGqmdRDyag/',
    highlight: true,
  },
  {
    image: '/instagram/post-1-nubuild.jpg',
    caption: 'ZippyScale x NUBuild. Growth partner, locked in.',
    link: 'https://www.instagram.com/p/DWEQMWeDxXd/',
  },
  {
    image: '/instagram/post-2-claude.jpg',
    caption:
      'Building full campaigns with AI. Landing pages, creatives, automations.',
    link: 'https://www.instagram.com/p/DV_YqecCed0/',
  },
  {
    image: '/instagram/post-3-team.jpg',
    caption:
      'The content looks effortless. The people behind it? Absolutely not.',
    link: 'https://www.instagram.com/p/DVscT7PjxZe/',
  },
  {
    image: '/instagram/post-4-pawme.jpg',
    caption: 'Testing @pawme.ai robot. AI meets real life.',
    link: 'https://www.instagram.com/p/DVdrUa_Eooc/',
  },
  {
    image: '/instagram/post-6-credibility.jpg',
    caption:
      'True credibility is built through years of trust and sharp thinking.',
    link: 'https://www.instagram.com/p/DTCaUHziDaa/',
  },
]

const InstagramIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

function PostCard({
  post,
  className = '',
}: {
  post: (typeof posts)[number]
  className?: string
}) {
  return (
    <motion.a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative rounded-2xl overflow-hidden group block ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.25 }}
    >
      <img
        src={post.image}
        alt={post.caption}
        className="w-full h-full object-cover object-center"
        loading="lazy"
      />

      {post.highlight && (
        <span className="absolute top-3 left-3 z-10 bg-[#D5EB4B] text-[#0c0c10] text-xs font-bold px-3 py-1 rounded-full font-[Space_Grotesk]">
          Award Winner
        </span>
      )}

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
        <InstagramIcon />
        <p className="text-white text-sm mt-3 mb-2 font-[Space_Grotesk] leading-snug max-w-[220px]">
          {post.caption}
        </p>
        <span className="text-[#D5EB4B] text-xs font-[JetBrains_Mono] mt-1">
          View on Instagram
        </span>
      </div>
    </motion.a>
  )
}

export default function InstagramFeed() {
  return (
    <section className="bg-[#FFFDF7] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="text-center font-mono text-xs uppercase tracking-widest text-[#B8CF2E] mb-4">
            Follow the Journey
          </p>
          <h2 className="font-[Space_Grotesk] text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4 text-center">
            Real Work. Real Team. Real Results.
          </h2>
          <p className="text-[#4A5568] mb-12 text-sm text-center">
            See what we're building on Instagram{' '}
            <a
              href="https://instagram.com/zippy.scale"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B8CF2E] hover:underline"
            >
              @zippy.scale
            </a>
          </p>
        </ScrollReveal>

        {/* Desktop grid — uniform 3-col with aspect-square */}
        <ScrollReveal delay={0.15}>
          <div className="hidden md:grid grid-cols-3 gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.link}
                post={post}
                className="aspect-square"
              />
            ))}
          </div>
        </ScrollReveal>

        {/* Mobile carousel */}
        <ScrollReveal delay={0.15}>
          <div className="md:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {posts.map((post) => (
              <PostCard
                key={post.link}
                post={post}
                className="min-w-[280px] h-[320px] snap-center flex-shrink-0"
              />
            ))}
          </div>
        </ScrollReveal>

        {/* Follow button */}
        <ScrollReveal delay={0.3}>
          <div className="flex justify-center mt-10">
            <a
              href="https://instagram.com/zippy.scale"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#B8CF2E] text-[#B8CF2E] rounded-full px-6 py-3 font-[Space_Grotesk] font-medium text-sm hover:bg-[#D5EB4B] hover:text-[#0c0c10] transition-colors duration-300"
            >
              <InstagramIcon />
              Follow @zippy.scale
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
