import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
    threshold?: number
    rootMargin?: string
    triggerOnce?: boolean
}

export function useInView<T extends HTMLElement = HTMLDivElement>(options: UseInViewOptions = {}) {
    const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options
    const [inView, setInView] = useState(false)
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
    const elementRef = useRef<T | null>(null)

    useEffect(() => {
        const element = elementRef.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                const isIntersecting = entry.isIntersecting
                setInView(isIntersecting)
                setEntry(entry)

                if (triggerOnce && isIntersecting) {
                    observer.disconnect()
                }
            },
            {
                threshold,
                rootMargin,
            }
        )

        observer.observe(element)

        return () => observer.disconnect()
    }, [threshold, rootMargin, triggerOnce])

    return { ref: elementRef, inView, entry }
}

