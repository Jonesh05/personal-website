'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '10px',
          background: 'var(--color-surface-2, #1e1e2e)',
          color: 'var(--color-text, #e2e8f0)',
          border: '1px solid var(--color-border, rgba(255,255,255,0.08))',
          fontSize: '14px',
          fontFamily: 'var(--font-mono, monospace)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
        success: {
          iconTheme: {
            primary: '#00FFB2',
            secondary: '#0a1a12',
          },
        },
        error: {
          iconTheme: {
            primary: '#f87171',
            secondary: '#1a0a0a',
          },
        },
      }}
    />
  )
}
