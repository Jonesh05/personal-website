import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 25% 20%, rgba(124, 58, 237, 0.35), transparent 55%), linear-gradient(145deg, #04080F 0%, #0D1428 100%)',
          borderRadius: 38,
          border: '2px solid rgba(167, 139, 250, 0.35)',
          color: '#F8FAFC',
          fontSize: 78,
          fontWeight: 800,
          letterSpacing: '-0.06em',
          fontFamily: 'sans-serif',
        }}
      >
        JP
      </div>
    ),
    { ...size }
  )
}
