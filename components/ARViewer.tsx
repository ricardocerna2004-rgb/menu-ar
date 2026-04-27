'use client'
import { useEffect, useRef, useState } from 'react'
import type { Dish } from '@/lib/dishes'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string; alt?: string; ar?: boolean; 'ar-modes'?: string
        'camera-controls'?: boolean; 'auto-rotate'?: boolean
        'shadow-intensity'?: string; style?: React.CSSProperties
        'ios-src'?: string; 'ar-scale'?: string
      }, HTMLElement>
    }
  }
}

const BASE_URL = 'https://menu-ar-blue.vercel.app'

type Platform = 'ios' | 'android' | 'desktop'

export default function ARViewer({ dish }: { dish: Dish }) {
  const [platform, setPlatform] = useState<Platform>('desktop')
  const [tapped, setTapped] = useState(false)
  const iosLinkRef = useRef<HTMLAnchorElement>(null)

  const modelUrl  = `${BASE_URL}${dish.modelPath}`
  const usdzUrl   = `${BASE_URL}${dish.modelPath.replace(/\.glb$/i, '.usdz')}`

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua))               setPlatform('android')
    else if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios')
    else                                   setPlatform('desktop')
  }, [])

  function launchAR() {
    setTapped(true)

    if (platform === 'ios') {
      // iOS: click hidden <a rel="ar"> — único método que funciona en Safari
      iosLinkRef.current?.click()
      setTimeout(() => setTapped(false), 2000)
      return
    }

    if (platform === 'android') {
      const fallback = encodeURIComponent(window.location.href)
      const intent =
        `intent://arvr.google.com/scene-viewer/1.0` +
        `?file=${encodeURIComponent(modelUrl)}` +
        `&mode=ar_preferred` +
        `&title=${encodeURIComponent(dish.name)}` +
        `#Intent;scheme=https;` +
        `package=com.google.android.googlequicksearchbox;` +
        `action=android.intent.action.VIEW;` +
        `S.browser_fallback_url=${fallback};end;`
      window.location.href = intent
      setTimeout(() => setTapped(false), 3000)
    }
  }

  // ── DESKTOP: visor 3D completo ──────────────────────────────────────────
  if (platform === 'desktop') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <model-viewer
          src={modelUrl}
          ios-src={usdzUrl}
          alt={dish.name}
          ar ar-modes="webxr scene-viewer quick-look"
          camera-controls auto-rotate
          shadow-intensity="1"
          style={{ width: '100%', height: '100%' }}
        >
          <button slot="ar-button" style={{
            position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
            background: '#ff6b2b', color: '#fff', border: 'none', padding: '14px 28px',
            borderRadius: '50px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>Ver en AR</button>
        </model-viewer>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
          padding: '48px 24px 32px',
        }}>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '36px', margin: '0 0 4px', letterSpacing: '0.03em' }}>{dish.name}</h1>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{dish.description}</p>
        </div>
      </div>
    )
  }

  // ── MOBILE: pantalla fullscreen tap-to-AR ───────────────────────────────
  return (
    <>
      {/* iOS: enlace oculto con rel="ar" — Safari lo convierte en Quick Look */}
      {platform === 'ios' && (
        <a
          ref={iosLinkRef}
          rel="ar"
          href={usdzUrl}
          style={{ display: 'none', position: 'absolute' }}
        >
          {/* iOS necesita un hijo img para activar Quick Look */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={usdzUrl} alt={dish.name} />
        </a>
      )}

      {/* Pantalla tap-to-AR */}
      <div
        onClick={launchAR}
        style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, #1a0e08 0%, #080808 70%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          cursor: 'pointer', userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          overflow: 'hidden',
        }}
      >
        {/* Glow de fondo */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(255,107,43,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Icono con anillos pulsantes */}
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
              borderRadius: '50%',
              border: '1px solid rgba(255,107,43,' + (0.3 - i * 0.08) + ')',
              animation: `pulse ${1.2 + i * 0.3}s ease-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff6b2b, #ffc947)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px',
            boxShadow: '0 0 40px rgba(255,107,43,0.4)',
          }}>
            {tapped ? '⏳' : '📱'}
          </div>
        </div>

        {/* Texto principal */}
        <h1 style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '42px', letterSpacing: '0.04em',
          margin: '0 0 8px', color: '#f0ece6', textAlign: 'center',
          padding: '0 32px',
        }}>
          {tapped ? 'ABRIENDO AR...' : 'TOCA PARA VER EN AR'}
        </h1>

        <p style={{
          fontSize: '14px', color: '#888', textAlign: 'center',
          margin: '0 0 48px', lineHeight: 1.5, padding: '0 40px',
        }}>
          {tapped
            ? `Preparando ${dish.name} en tu cámara`
            : 'La pizza aparecerá sobre tu mesa a tamaño real'
          }
        </p>

        {/* Info del platillo */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '32px 24px 40px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 80%, transparent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              {dish.category && (
                <span style={{
                  fontSize: '11px', color: '#ff6b2b',
                  background: 'rgba(255,107,43,0.12)', border: '1px solid rgba(255,107,43,0.25)',
                  padding: '3px 10px', borderRadius: '20px', fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  display: 'inline-block', marginBottom: '6px',
                }}>{dish.category}</span>
              )}
              <h2 style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '32px', margin: 0, letterSpacing: '0.03em', color: '#fff',
              }}>{dish.name}</h2>
              {dish.description && (
                <p style={{
                  fontSize: '13px', color: 'rgba(255,255,255,0.45)',
                  margin: '4px 0 0', lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{dish.description}</p>
              )}
            </div>
            {dish.price && (
              <div style={{
                background: 'rgba(255,107,43,0.15)', border: '1px solid rgba(255,107,43,0.3)',
                borderRadius: '10px', padding: '10px 16px', flexShrink: 0, marginLeft: '16px',
              }}>
                <span style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '28px', color: '#ff6b2b', letterSpacing: '0.02em',
                }}>{dish.price}</span>
              </div>
            )}
          </div>
        </div>

        {/* Branding */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '7px',
            background: 'linear-gradient(135deg, #ff6b2b, #ffc947)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#fff',
          }}>M</div>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>MenuAR</span>
        </div>

        {dish.restaurantName && (
          <div style={{
            position: 'absolute', top: '20px', right: '20px',
            fontSize: '12px', color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            padding: '4px 12px', borderRadius: '20px',
          }}>{dish.restaurantName}</div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
        @keyframes pulse {
          0%   { transform: translate(-50%,-50%) scale(0.95); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(1.6);  opacity: 0; }
        }
        * { box-sizing: border-box; }
      `}</style>
    </>
  )
}
