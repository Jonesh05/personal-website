import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #04080F 0%, #111936 100%)',
          borderRadius: 7,
          border: '1px solid rgba(167, 139, 250, 0.45)',
          color: '#F8FAFC',
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: '-0.05em',
          fontFamily: 'sans-serif',
        }}
      >
        JP
      </div>
    ),
    { ...size }
  )
}
