'use client'

/**
 * HeroClient.tsx — Client Component
 * Handles: typewriter role animation, scroll-based CTA
 *
 * Phase 3.1 extract: only interactive logic lives here.
 * Parent Hero.tsx stays as a pure Server Component.
 */

import { useState, useEffect, useRef } from 'react'

const ROLES = [
    'Web3 & Blockchain Developer',
    'AWS Cloud Architect',
    'Full Stack Engineer',
    'Cybersecurity Student',
    'DeFi Protocol Builder',
]

export function HeroClient() {
    const [roleIndex, setRoleIndex] = useState(0)
    const [displayed, setDisplayed] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [paused, setPaused] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        const current = ROLES[roleIndex]

        if (paused) {
            timeoutRef.current = setTimeout(() => {
                setPaused(false)
                setDeleting(true)
            }, 2400)
            return () => clearTimeout(timeoutRef.current!)
        }

        if (!deleting) {
            if (displayed.length < current.length) {
                timeoutRef.current = setTimeout(() => {
                    setDisplayed(current.slice(0, displayed.length + 1))
                }, 48)
            } else {
                setPaused(true)
            }
        } else {
            if (displayed.length > 0) {
                timeoutRef.current = setTimeout(() => {
                    setDisplayed(displayed.slice(0, -1))
                }, 28)
            } else {
                setDeleting(false)
                setRoleIndex((i) => (i + 1) % ROLES.length)
            }
        }

        return () => clearTimeout(timeoutRef.current!)
    }, [displayed, deleting, paused, roleIndex])

    return (
        <div
            className="mt-4 reveal-up"
            style={{ animationDelay: '200ms' }}
        >
            <p
                className="text-xl sm:text-2xl md:text-3xl"
                style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-muted)',
                    minHeight: '2em',
                    letterSpacing: '-0.01em',
                }}
            >
                <span
                    style={{
                        color: 'var(--color-purple-neon)',
                        marginRight: '4px',
                        opacity: 0.7,
                        fontFamily: 'var(--font-mono)',
                    }}
                >
                    ~/
                </span>
                <span style={{ color: 'var(--color-text)' }}>{displayed}</span>
                <span
                    className="cursor-blink"
                    style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '1.1em',
                        background: 'var(--color-green-neon)',
                        marginLeft: '2px',
                        verticalAlign: 'middle',
                        boxShadow: '0 0 8px var(--color-green-neon)',
                    }}
                    aria-hidden="true"
                />
            </p>
        </div>
    )
}