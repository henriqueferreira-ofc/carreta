import { useEffect, useState } from 'react'

export default function CountUp({ end, suffix = '', duration = 1100 }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setValue(end)
      return
    }

    let frame
    const start = performance.now()
    const easeOutQuart = progress => 1 - Math.pow(1 - progress, 4)

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(end * easeOutQuart(progress)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, end])

  return <>{value}{suffix}</>
}
