'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevoPlatillo() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    restaurantName: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name) return setError('El nombre es requerido')
    if (!file) return setError('El modelo 3D (.glb) es requerido')

    try {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)

      setSaving(true)
      const saveRes = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, modelPath: uploadData.path }),
      })
      if (!saveRes.ok) throw new Error('Error guardando el platillo')

      router.push('/admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setUploading(false)
      setSaving(false)
    }
  }

  const isLoading = uploading || saving
  const statusText = uploading ? 'Subiendo modelo 3D...' : saving ? 'Guardando platillo...' : 'Guardar y generar QR'

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
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { icon: '🍽️', label: 'Platillos', href: '/admin', active: false },
            { icon: '➕', label: 'Nuevo platillo', href: '/admin/nuevo', active: true },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                background: item.active ? 'rgba(255,107,43,0.1)' : 'transparent',
                color: item.active ? '#ff6b2b' : '#888',
                fontSize: '14px', fontWeight: item.active ? 600 : 400,
              }}>
                <span>{item.icon}</span><span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: '220px', padding: '40px', maxWidth: '800px' }}>
        <div style={{ marginBottom: '40px' }}>
          <Link href="/admin" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            ← Volver a platillos
          </Link>
          <h1 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '40px', letterSpacing: '0.04em', margin: 0,
          }}>NUEVO PLATILLO AR</h1>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
            Sube el modelo .glb y genera el QR en segundos
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Nombre del platillo *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej: Pizza Italiana Supreme"
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Restaurante
              </label>
              <input
                name="restaurantName"
                value={form.restaurantName}
                onChange={handleChange}
                placeholder="Ej: La Trattoria"
                className="input-field"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Descripción
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Ingredientes, modo de preparación, alérgenos..."
              className="input-field"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Precio
              </label>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Ej: $189"
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Categoría
              </label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field">
                <option value="">Seleccionar...</option>
                <option value="Pizza">Pizza</option>
                <option value="Pasta">Pasta</option>
                <option value="Ensaladas">Ensaladas</option>
                <option value="Carnes">Carnes</option>
                <option value="Mariscos">Mariscos</option>
                <option value="Postres">Postres</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Entradas">Entradas</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {/* FILE UPLOAD */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Modelo 3D (.glb / .gltf) *
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".glb,.gltf"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${file ? '#ff6b2b' : '#2a2a2a'}`,
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? 'rgba(255,107,43,0.04)' : '#0e0e0e',
                transition: 'all 0.2s',
              }}
            >
              {file ? (
                <>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#ff6b2b', margin: '0 0 4px' }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB — Clic para cambiar
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#ccc', margin: '0 0 6px' }}>
                    Arrastra o haz clic para subir el modelo
                  </p>
                  <p style={{ fontSize: '13px', color: '#555', margin: '0 0 16px' }}>
                    Archivos .glb o .gltf — hasta 50 MB
                  </p>
                  <div style={{
                    display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center',
                  }}>
                    {['Meshy.ai', 'Luma AI', 'TripoSR'].map((tool) => (
                      <span key={tool} style={{
                        fontSize: '11px', background: '#1d1d1d', border: '1px solid #2a2a2a',
                        color: '#888', padding: '4px 10px', borderRadius: '6px',
                      }}>{tool}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>
              💡 Genera tu modelo gratis en <strong style={{ color: '#aaa' }}>meshy.ai</strong> — sube fotos del platillo desde múltiples ángulos.
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
              color: '#f87171', fontSize: '14px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/admin">
              <button type="button" className="btn-ghost" style={{ padding: '14px 28px' }}>
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                padding: '14px 36px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {isLoading && (
                <span style={{
                  width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {statusText}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
