'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const BASE_URL = 'https://menu-ar-blue.vercel.app'

// Todos los modelos USDZ que queremos pre-cachear
const MODELS = [
  { name: 'Pizza Margherita', url: `${BASE_URL}/models/pizzamodel.usdz` },
]

type Status = 'checking' | 'downloading' | 'done' | 'already_cached'

export default function WifiPage() {
  const [status, setStatus]         = useState<Status>('checking')
  const [progress, setProgress]     = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    async function initServiceWorker() {
      if (!('serviceWorker' in navigator)) {
        // Sin SW — descargar directamente igual
        await downloadDirect()
        return
      }

      // Registrar Service Worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Escuchar mensajes del SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, done, total, url } = event.data

        if (type === 'CACHE_PROGRESS') {
          const name = url.split('/').pop() || url
          setCurrentFile(name)
          setProgress(Math.round((done / total) * 100))
          setStatus('downloading')
        }

        if (type === 'CACHE_COMPLETE') {
          setProgress(100)
          setStatus('done')
        }

        if (type === 'CACHE_STATUS') {
          const allCached = Object.values(event.data.results).every(Boolean)
          if (allCached) {
            setStatus('already_cached')
          } else {
            // Pedir al SW que descargue los que faltan
            reg.active?.postMessage({
              type: 'PRECACHE_MODELS',
              urls: MODELS.map((m) => m.url),
            })
            setStatus('downloading')
          }
        }
      })

      // Verificar qué ya está en caché
      reg.active?.postMessage({
        type: 'CHECK_CACHE',
        urls: MODELS.map((m) => m.url),
      })

      // Si el SW no responde en 1s, lanzar descarga directamente
      setTimeout(() => {
        setStatus((prev) => {
          if (prev === 'checking') {
            reg.active?.postMessage({
              type: 'PRECACHE_MODELS',
              urls: MODELS.map((m) => m.url),
            })
            return 'downloading'
          }
          return prev
        })
      }, 1000)
    }

    async function downloadDirect() {
      // Fallback sin Service Worker: descargar en background con fetch
      setStatus('downloading')
      let done = 0
      for (const model of MODELS) {
        try {
          setCurrentFile(model.name)
          // Solo hacer fetch para llenar el HTTP cache del navegador
          await fetch(model.url, { cache: 'force-cache' })
        } catch {}
        done++
        setProgress(Math.round((done / MODELS.length) * 100))
      }
      setStatus('done')
    }

    initServiceWorker()
  }, [])

  const statusConfig = {
    checking: {
      emoji: '📡',
      title: 'Conectando...',
      subtitle: 'Verificando modelos 3D',
      color: '#888',
      showBar: false,
    },
    downloading: {
      emoji: '⬇️',
      title: 'Preparando el menú AR',
      subtitle: currentFile ? `Descargando ${currentFile}` : 'Descargando modelos 3D...',
      color: '#ff6b2b',
      showBar: true,
    },
    done: {
      emoji: '✅',
      title: '¡Listo!',
      subtitle: 'El menú AR cargará al instante',
      color: '#4ade80',
      showBar: false,
    },
    already_cached: {
      emoji: '⚡',
      title: '¡Ya tienes el menú!',
      subtitle: 'Los modelos 3D ya estaban guardados',
      color: '#4ade80',
      showBar: false,
    },
  }

  const cfg = statusConfig[status]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 30%, #0f0a06 0%, #050505 70%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      color: '#f0ece6', padding: '32px',
      userSelect: 'none',
    }}>

      {/* Logo */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '8px',
          background: 'linear-gradient(135deg, #ff6b2b, #ffc947)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 800, color: '#fff',
        }}>M</div>
        <span style={{ fontWeight: 700, fontSize: '15px' }}>MenuAR</span>
      </div>

      {/* WiFi badge */}
      <div style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '6px 16px', fontSize: '12px',
        color: 'rgba(255,255,255,0.5)', marginBottom: '48px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span>📶</span> Conectado al WiFi del restaurante
      </div>

      {/* Emoji principal */}
      <div style={{ fontSize: '72px', marginBottom: '24px', lineHeight: 1 }}>
        {cfg.emoji}
      </div>

      {/* Título */}
      <h1 style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px', fontWeight: 800,
        margin: '0 0 8px', textAlign: 'center',
        color: cfg.color,
      }}>
        {cfg.title}
      </h1>

      {/* Subtítulo */}
      <p style={{
        fontSize: '14px', color: 'rgba(255,255,255,0.5)',
        margin: '0 0 40px', textAlign: 'center', lineHeight: 1.6,
      }}>
        {cfg.subtitle}
      </p>

      {/* Barra de progreso */}
      {cfg.showBar && (
        <div style={{ width: '100%', maxWidth: '280px', marginBottom: '40px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: '99px',
            height: '6px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ff6b2b, #ffc947)',
              borderRadius: '99px',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#888', marginTop: '6px' }}>
            {progress}%
          </div>
        </div>
      )}

      {/* Botón cuando termina */}
      {(status === 'done' || status === 'already_cached') && (
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'linear-gradient(135deg, #ff6b2b, #ffc947)',
            border: 'none', borderRadius: '50px',
            padding: '16px 40px', fontSize: '16px',
            fontWeight: 700, color: '#fff', cursor: 'pointer',
            boxShadow: '0 0 30px rgba(255,107,43,0.35)',
            fontFamily: 'inherit',
          }}
        >
          Ver el Menú AR →
        </button>
      )}

      {/* Explicación */}
      <div style={{
        position: 'absolute', bottom: '32px',
        fontSize: '12px', color: 'rgba(255,255,255,0.25)',
        textAlign: 'center', lineHeight: 1.7, padding: '0 24px',
      }}>
        Los modelos 3D se guardan en tu teléfono<br />
        El menú AR funcionará sin esperas
      </div>
    </div>
  )
}
