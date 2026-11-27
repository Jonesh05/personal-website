import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const THEMES = {
  purple: {
    bg1:    '#0b0618',
    bg2:    '#1e0f3c',
    accent: '#BF5EFF',
    dim:    '#7C3AED',
    glow:   'rgba(124,58,237,0.5)',
    strip:  'linear-gradient(90deg,transparent,#7C3AED,#BF5EFF,transparent)',
    pill:   'rgba(124,58,237,0.18)',
    pillBorder: 'rgba(191,94,255,0.3)',
    pillText:   '#d8b4fe',
  },
  green: {
    bg1:    '#020d09',
    bg2:    '#0a2318',
    accent: '#00FFB2',
    dim:    '#059669',
    glow:   'rgba(0,255,178,0.4)',
    strip:  'linear-gradient(90deg,transparent,#059669,#00FFB2,transparent)',
    pill:   'rgba(0,255,178,0.12)',
    pillBorder: 'rgba(0,255,178,0.25)',
    pillText:   '#6ee7b7',
  },
} as const

type ThemeKey = keyof typeof THEMES

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const title    = searchParams.get('title')    ?? 'Project'
  const category = (searchParams.get('category') ?? 'web').toUpperCase()
  const accentParam = (searchParams.get('accent') ?? 'purple') as ThemeKey
  const techParam   = searchParams.get('tech')   ?? ''
  const theme       = THEMES[accentParam] ?? THEMES.purple

  const techs = techParam
    ? techParam.split(',').map(t => t.trim()).filter(Boolean).slice(0, 4)
    : []

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: `linear-gradient(145deg, ${theme.bg1} 0%, ${theme.bg2} 100%)`,
          padding: '0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Glow orb top-right ── */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: theme.glow,
            filter: 'blur(55px)',
          }}
        />

        {/* ── Subtle dot grid ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle,rgba(255,255,255,0.055) 1px,transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* ── Bottom vignette so text pops ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '65%',
            background: `linear-gradient(to bottom, transparent, ${theme.bg1}dd)`,
          }}
        />

        {/* ── Top accent strip ── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: theme.strip,
          }}
        />

        {/* ── Author watermark ── */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.18)',
            fontSize: 11,
            fontFamily: 'monospace',
            letterSpacing: '0.08em',
          }}
        >
          jhonny.dev
        </div>

        {/* ── Content area ── */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '20px 24px 22px',
            gap: 10,
          }}
        >
          {/* Category badge */}
          <div
            style={{
              display: 'flex',
              padding: '3px 10px',
              borderRadius: 999,
              background: theme.pill,
              border: `1px solid ${theme.pillBorder}`,
              color: theme.pillText,
              fontSize: 11,
              fontFamily: 'monospace',
              letterSpacing: '0.14em',
            }}
          >
            {category}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 22 ? 22 : 26,
              fontWeight: 800,
              color: theme.accent,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontFamily: 'sans-serif',
              textShadow: `0 0 24px ${theme.glow}`,
              maxWidth: 340,
            }}
          >
            {title}
          </div>

          {/* Tech pills */}
          {techs.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {techs.map((tech) => (
                <div
                  key={tech}
                  style={{
                    display: 'flex',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    letterSpacing: '0.04em',
                  }}
                >
                  {tech}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 400, height: 250 },
  )
}
