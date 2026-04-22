import { lazy, Suspense } from 'react'
import { useReducedMotion } from 'framer-motion'

const Lottie = lazy(() => import('lottie-react'))

interface Props {
  animationData?: object
  fallbackSrc: string
  fallbackAlt: string
}

export default function StackFlowDiagram({ animationData, fallbackSrc, fallbackAlt }: Props) {
  const reduce = useReducedMotion()

  if (reduce || !animationData) {
    return (
      <img
        src={fallbackSrc}
        alt={fallbackAlt}
        className="w-full h-auto rounded-xl border border-[#E5E7EB]"
      />
    )
  }

  return (
    <Suspense fallback={<div className="w-full aspect-[16/9] bg-gray-100 rounded-xl animate-pulse" aria-label="Loading flow diagram" />}>
      <Lottie animationData={animationData} loop autoplay className="w-full h-auto rounded-xl" aria-label={fallbackAlt} />
    </Suspense>
  )
}
