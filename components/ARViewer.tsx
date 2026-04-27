'use client'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import type { Dish } from '@/lib/dishes'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string
        alt?: string
        ar?: boolean
        'ar-modes'?: string
        'camera-controls'?: boolean
        'auto-rotate'?: boolean
        'shadow-intensity'?: string
        'environment-image'?: string
        exposure?: string
        style?: React.CSSProperties
      }, HTMLElement>
    }
  }
}

const BASE_URL = 'https://menu-ar-blue.vercel.app'

export default function ARViewer({ dish }: { dish: Dish }) {
  const [redirecting, setRedirecting] = useState(false)
  const modelSrc = dish.modelPath.startsWith('http') ? dish.modelPath : dish.modelPath

  useEffect(() => {
    const ua = navigator.userAgent
    const isAndroid = /android/i.test(ua)

    if (isAndroid) {
      setRedirecting(true)
      const modelAbsoluteUrl = `${BASE_URL}${dish.modelPath}`
      const fallback = encodeURIComponent(window.location.href)
      const intentUrl =
        `intent://arvr.google.com/scene-viewer/1.0` +
        `?file=${encodeURIComponent(modelAbsoluteUrl)}` +
        `&mode=ar_preferred` +
        `&title=${encodeURIComponent(dish.name)}` +
        `#Intent;scheme=https;` +
        `package=com.google.android.googlequicksearchbox;` +
        `action=android.intent.action.VIEW;` +
        `S.browser_fallback_url=${fallback};end;`
      window.location.href = intentUrl
    }
  }, [dish])

  return (
    <>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"
        strategy="afterInteractive"
      />

      {/* ANDROID REDIRECT SCREEN */}
      {redirecting && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: '#080808',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)',
          gap: '20px', padding: '40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '64px' }}>📱</div>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '36px', letterSpacing: '0.04em',
            margin: 0, color: '#f0ece6',
          }}>ABRIENDO EN AR...</h2>
          <p style={{ color: '#888', fontSize: '15px', maxWidth: '280px', lineHeight: 1.6 }}>
            Se está abriendo la cámara con <strong style={{ color: '#ff6b2b' }}>{dish.name}</strong> en 3D.
          </p>
          <p style={{ color: '#555', fontSize: '13px' }}>
            Si no abre automáticamente, asegúrate de tener Google instalado.
          </p>
        </div>
      )}

      <div style={{
        position: 'fixed', inset: 0,
        background: '#0a0a0a',
        fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* TOP BAR */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '7px',
              background: 'linear-gradient(135deg, #ff6b2b, #ffc947)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: '#fff',
            }}>M</div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>MenuAR</span>
          </div>
          {dish.restaurantName && (
            <span style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              padding: '4px 12px', borderRadius: '20px',
            }}>{dish.restaurantName}</span>
          )}
        </div>

        {/* MODEL VIEWER — full screen */}
        <model-viewer
          src={modelSrc}
          alt={dish.name}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1"
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
          }}
        >
          {/* AR button — shown on mobile when AR is available */}
          <button
            slot="ar-button"
            style={{
              position: 'absolute',
              bottom: '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ff6b2b',
              color: '#fff',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 32px rgba(255,107,43,0.5)',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '20px' }}>📱</span>
            Ver en mi mesa (AR)
          </button>
        </model-viewer>

        {/* BOTTOM INFO */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent)',
          padding: '48px 24px 32px',
          zIndex: 10,
        }}>
          <div style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                {dish.category && (
                  <span style={{
                    fontSize: '11px', background: 'rgba(255,107,43,0.15)',
                    color: '#ff8244', border: '1px solid rgba(255,107,43,0.25)',
                    padding: '3px 10px', borderRadius: '20px',
                    fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                    display: 'inline-block', marginBottom: '8px',
                  }}>{dish.category}</span>
                )}
                <h1 style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '36px', letterSpacing: '0.03em',
                  margin: 0, color: '#fff', lineHeight: 1.1,
                }}>{dish.name}</h1>
                {dish.description && (
                  <p style={{
                    fontSize: '13px', color: 'rgba(255,255,255,0.5)',
                    margin: '6px 0 0', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{dish.description}</p>
                )}
              </div>
              {dish.price && (
                <div style={{
                  background: 'rgba(255,107,43,0.15)', border: '1px solid rgba(255,107,43,0.3)',
                  borderRadius: '10px', padding: '10px 16px', flexShrink: 0, textAlign: 'center',
                }}>
                  <span style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: '26px', color: '#ff6b2b', letterSpacing: '0.02em',
                    display: 'block',
                  }}>{dish.price}</span>
                </div>
              )}
            </div>

            {/* HINT */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginTop: '16px', padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: '16px' }}>👆</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                Arrastra para rotar · Pellizca para hacer zoom · Toca <strong style={{ color: 'rgba(255,107,43,0.8)' }}>"Ver en mi mesa"</strong> para AR
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
