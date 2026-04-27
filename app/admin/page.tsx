'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Dish } from '@/lib/dishes'
import QRGenerator from '@/components/QRGenerator'

export default function AdminPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQR, setSelectedQR] = useState<Dish | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dishes')
      .then((r) => r.json())
      .then((data) => { setDishes(data); setLoading(false) })
  }, [])

  async function deleteDish(id: string) {
    if (!confirm('¿Eliminar este platillo?')) return
    await fetch(`/api/dishes/${id}`, { method: 'DELETE' })
    setDishes((prev) => prev.filter((d) => d.id !== id))
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/ar/${id}`
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const arUrl = selectedQR ? `${typeof window !== 'undefined' ? window.location.origin : ''}/ar/${selectedQR.id}` : ''

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}>

      {/* SIDEBAR */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '220px',
        background: '#0e0e0e', borderRight: '1px solid #1a1a1a',
        display: 'flex', flexDirection: 'column', padding: '24px 20px',
        zIndex: 40,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '8px',
              background: 'linear-gradient(135deg, #ff6b2b, #ffc947)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 700, color: '#fff',
            }}>M</div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: '#f0ece6' }}>MenuAR</span>
          </div>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { icon: '🍽️', label: 'Platillos', href: '/admin', active: true },
            { icon: '➕', label: 'Nuevo platillo', href: '/admin/nuevo', active: false },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                background: item.active ? 'rgba(255,107,43,0.1)' : 'transparent',
                color: item.active ? '#ff6b2b' : '#888',
                fontSize: '14px', fontWeight: item.active ? 600 : 400,
                transition: 'all 0.2s',
              }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div style={{
          background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.2)',
          borderRadius: '8px', padding: '14px',
        }}>
          <p style={{ fontSize: '11px', color: '#ff6b2b', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tip</p>
          <p style={{ fontSize: '12px', color: '#aaa', margin: 0, lineHeight: 1.5 }}>
            Usa Meshy.ai para generar tu modelo .glb desde fotos.
          </p>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: '220px', padding: '40px' }}>

        {/* HEADER */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '40px',
        }}>
          <div>
            <h1 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '40px', letterSpacing: '0.04em', margin: '0 0 4px',
            }}>MIS PLATILLOS</h1>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              {dishes.length} platillo{dishes.length !== 1 ? 's' : ''} registrado{dishes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/admin/nuevo">
            <button className="btn-primary">+ Nuevo platillo</button>
          </Link>
        </div>

        {/* STATS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px',
        }}>
          {[
            { label: 'Total platillos', value: dishes.length, icon: '🍽️' },
            { label: 'Con modelo 3D', value: dishes.filter(d => d.modelPath).length, icon: '🎯' },
            { label: 'QR generados', value: dishes.length, icon: '🔲' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#131313', border: '1px solid #1a1a1a',
              borderRadius: '12px', padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <span style={{ fontSize: '28px' }}>{stat.icon}</span>
              <div>
                <div style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '32px', color: '#ff6b2b', lineHeight: 1,
                }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* DISHES LIST */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#555' }}>Cargando...</div>
        ) : dishes.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            border: '2px dashed #1a1a1a', borderRadius: '16px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Sin platillos todavía</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Agrega tu primer platillo y genera su QR en AR
            </p>
            <Link href="/admin/nuevo">
              <button className="btn-primary">+ Agregar primer platillo</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dishes.map((dish) => (
              <div key={dish.id} style={{
                background: '#131313', border: '1px solid #1a1a1a',
                borderRadius: '12px', padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: '20px',
              }}>
                {/* Model icon */}
                <div style={{
                  width: '56px', height: '56px', borderRadius: '10px',
                  background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', flexShrink: 0,
                }}>🍽️</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f0ece6' }}>{dish.name}</h3>
                    {dish.category && (
                      <span style={{
                        fontSize: '11px', background: 'rgba(255,201,71,0.1)',
                        color: '#ffc947', border: '1px solid rgba(255,201,71,0.2)',
                        padding: '2px 8px', borderRadius: '20px', fontWeight: 600,
                      }}>{dish.category}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px' }}>
                    {dish.description || 'Sin descripción'}
                  </p>
                  {dish.price && (
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#ff6b2b' }}>{dish.price}</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => copyLink(dish.id)}
                    style={{
                      background: copied === dish.id ? 'rgba(34,197,94,0.1)' : 'transparent',
                      border: `1px solid ${copied === dish.id ? 'rgba(34,197,94,0.3)' : '#2a2a2a'}`,
                      color: copied === dish.id ? '#22c55e' : '#888',
                      padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {copied === dish.id ? '✓ Copiado' : 'Copiar link'}
                  </button>
                  <button
                    onClick={() => setSelectedQR(dish)}
                    style={{
                      background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.25)',
                      color: '#ff6b2b', padding: '8px 14px', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                  >
                    Ver QR
                  </button>
                  <Link href={`/ar/${dish.id}`} target="_blank">
                    <button style={{
                      background: '#1d1d1d', border: '1px solid #2a2a2a',
                      color: '#ccc', padding: '8px 14px', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      transition: 'all 0.2s', fontFamily: 'inherit',
                    }}>
                      Ver AR →
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteDish(dish.id)}
                    style={{
                      background: 'transparent', border: '1px solid #2a2a2a',
                      color: '#555', padding: '8px 12px', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR MODAL */}
      {selectedQR && (
        <div
          onClick={() => setSelectedQR(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#131313', border: '1px solid #2a2a2a',
              borderRadius: '16px', padding: '40px',
              maxWidth: '380px', width: '100%', textAlign: 'center',
            }}
          >
            <h3 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '28px', letterSpacing: '0.04em', marginBottom: '4px',
            }}>{selectedQR.name}</h3>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '28px' }}>
              Escanea para ver en AR
            </p>
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '16px',
              display: 'inline-block', marginBottom: '20px',
            }}>
              <QRGenerator url={arUrl} size={220} />
            </div>
            <p style={{
              fontSize: '11px', color: '#555', marginBottom: '20px',
              wordBreak: 'break-all', fontFamily: 'monospace',
            }}>
              {arUrl}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => copyLink(selectedQR.id)}
                className="btn-ghost"
                style={{ flex: 1, padding: '12px', fontSize: '13px' }}
              >
                Copiar link
              </button>
              <Link href={`/ar/${selectedQR.id}`} target="_blank" style={{ flex: 1 }}>
                <button className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '13px' }}>
                  Abrir AR →
                </button>
              </Link>
            </div>
            <button
              onClick={() => setSelectedQR(null)}
              style={{
                marginTop: '16px', background: 'transparent', border: 'none',
                color: '#555', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
