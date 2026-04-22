import { useEffect, type ReactNode } from 'react'
import Nav from '../layout/Nav'
import Footer from '../layout/Footer'
import StickyCTA from '../layout/StickyCTA'
import ScrollProgressBar from './ScrollProgressBar'
import StickyTOC from './StickyTOC'
import type { CaseStudyMetadata } from '../../pages/case-studies/types'

const SECTION_IDS = [
  { id: 'hero', label: 'Overview' },
  { id: 'summary', label: '60-Sec Summary' },
  { id: 'who', label: 'Who This Is For' },
  { id: 'pain', label: 'The Pain' },
  { id: 'before', label: 'Before State' },
  { id: 'stack', label: 'The Stack' },
  { id: 'sprint', label: '4-Week Plan' },
  { id: 'outcomes', label: 'Target Outcomes' },
  { id: 'roi', label: 'ROI Calculator' },
  { id: 'objections', label: 'Objections' },
  { id: 'proof', label: 'Proof' },
  { id: 'cta', label: 'Book Audit' },
]

function setMeta(name: string, value: string, prop = false) {
  const attr = prop ? 'property' : 'name'
  let tag = document.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

function setJsonLd(metadata: CaseStudyMetadata) {
  let ld = document.getElementById('ld-case-study') as HTMLScriptElement | null
  if (!ld) {
    ld = document.createElement('script') as HTMLScriptElement
    ld.id = 'ld-case-study'
    ld.type = 'application/ld+json'
    document.head.appendChild(ld)
  }
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: metadata.seoTitle || metadata.title,
    author: { '@type': 'Organization', name: 'ZippyScale' },
    datePublished: metadata.publishedAt,
    about: metadata.industry,
    image: metadata.ogImage ? `https://zippyscale.in${metadata.ogImage}` : undefined,
    url: `https://zippyscale.in/case-studies/${metadata.slug}`,
  })
}

export default function CaseStudyLayout({
  metadata,
  children,
}: {
  metadata: CaseStudyMetadata
  children: ReactNode
}) {
  useEffect(() => {
    if (metadata.seoTitle) document.title = metadata.seoTitle
    if (metadata.seoDescription) setMeta('description', metadata.seoDescription)
    if (metadata.seoTitle) setMeta('og:title', metadata.seoTitle, true)
    if (metadata.seoDescription) setMeta('og:description', metadata.seoDescription, true)
    if (metadata.ogImage) setMeta('og:image', `https://zippyscale.in${metadata.ogImage}`, true)
    setMeta('og:url', `https://zippyscale.in/case-studies/${metadata.slug}`, true)
    setMeta('og:type', 'article', true)
    setJsonLd(metadata)
  }, [metadata])

  return (
    <>
      <ScrollProgressBar />
      <Nav />
      <StickyTOC sections={SECTION_IDS} />
      <main className="bg-[#FFFDF7] text-[#1A1A2E]">
        {children}
      </main>
      <Footer />
      <StickyCTA isQuizVisible={false} ctaHref="/#quiz" ctaSource={`case-study-${metadata.slug}-sticky`} />
    </>
  )
}
