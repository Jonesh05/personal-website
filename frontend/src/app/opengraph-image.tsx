import { ImageResponse } from 'next/og'

export const alt = 'Jhonny Pimiento — Senior Software & Web3 Engineer'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background:
            'radial-gradient(circle at 85% 18%, rgba(124, 58, 237, 0.28), transparent 45%), radial-gradient(circle at 12% 88%, rgba(16, 185, 129, 0.16), transparent 45%), linear-gradient(135deg, #04080F 0%, #091022 55%, #060B16 100%)',
          color: '#F8FAFC',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top bar: monogram + domain badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(124, 58, 237, 0.18)',
                border: '1px solid rgba(167, 139, 250, 0.45)',
                color: '#E9D5FF',
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.04em',
              }}
            >
              JP
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#CBD5E1',
                letterSpacing: '0.02em',
              }}
            >
              Portfolio &amp; Engineering Notes
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#A78BFA',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            jonesh.me
          </div>
        </div>

        {/* Center editorial typography */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxWidth: 960,
          }}
        >
          <div
            style={{
              width: 72,
              height: 4,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #A78BFA 0%, #34D399 100%)',
            }}
          />
          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#F8FAFC',
            }}
          >
            Jhonny Pimiento
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.3,
              color: '#CBD5E1',
            }}
          >
            Senior Software &amp; Web3 Engineer
          </div>
        </div>

        {/* Bottom focus areas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(148, 163, 184, 0.18)',
            paddingTop: 28,
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
            }}
          >
            {['Web3 & Blockchain', 'Distributed Systems', 'Cloud Architecture', 'TypeScript'].map(
              (topic) => (
                <div
                  key={topic}
                  style={{
                    display: 'flex',
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#E2E8F0',
                    fontSize: 18,
                    fontWeight: 500,
                  }}
                >
                  {topic}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
