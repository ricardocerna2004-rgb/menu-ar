import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '0 40px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #1a1a1a',
        backdropFilter: 'blur(12px)',
        background: 'rgba(8,8,8,0.85)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, #ff6b2b, #ffc947)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700
          }}>M</div>
          <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>MenuAR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#como-funciona" style={{ color: '#aaa', fontSize: '14px', textDecoration: 'none' }}>Cómo funciona</a>
          <a href="#precios" style={{ color: '#aaa', fontSize: '14px', textDecoration: 'none' }}>Precios</a>
          <Link href="/admin">
            <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
              Panel admin →
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(255,107,43,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '900px', textAlign: 'center', position: 'relative' }}>
          <div className="animate-slide-up" style={{ animationDelay: '0s' }}>
            <span className="tag" style={{ marginBottom: '24px', display: 'inline-block' }}>
              Realidad Aumentada · Menús 3D
            </span>
          </div>

          <h1 className="animate-slide-up" style={{
            animationDelay: '0.1s',
            fontFamily: '"Bebas Neue", var(--font-bebas), sans-serif',
            fontSize: 'clamp(64px, 10vw, 120px)',
            lineHeight: 1.0,
            letterSpacing: '0.02em',
            margin: '0 0 24px',
            color: '#f0ece6',
          }}>
            EL MENÚ<br />
            <span style={{ color: '#ff6b2b' }}>DEL FUTURO</span><br />
            YA LLEGÓ
          </h1>

          <p className="animate-slide-up" style={{
            animationDelay: '0.2s',
            fontSize: '18px', lineHeight: 1.7, color: '#aaa',
            maxWidth: '580px', margin: '0 auto 40px',
          }}>
            Tus clientes escanean un QR en el menú físico y ven el platillo en 3D,
            a tamaño real, sobre su propia mesa. Sin apps. Sin descargas. Solo apuntan la cámara.
          </p>

          <div className="animate-slide-up" style={{
            animationDelay: '0.3s',
            display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap'
          }}>
            <Link href="/admin">
              <button className="btn-primary" style={{ fontSize: '16px', padding: '16px 36px' }}>
                Crear mi menú AR →
              </button>
            </Link>
            <a href="#como-funciona">
              <button className="btn-ghost" style={{ fontSize: '16px', padding: '16px 36px' }}>
                Ver demo
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{
        borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
        padding: '32px 40px', background: '#0e0e0e',
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '48px', flexWrap: 'wrap',
        }}>
          {[
            { num: '3D', label: 'Modelos reales' },
            { num: 'AR', label: 'Sin descargar app' },
            { num: 'iOS + Android', label: 'Compatible' },
            { num: 'QR', label: 'Imprimible en menú' },
          ].map((item) => (
            <div key={item.num} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '32px', color: '#ff6b2b', letterSpacing: '0.04em'
              }}>{item.num}</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" style={{ padding: '120px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <span className="tag" style={{ marginBottom: '16px', display: 'inline-block' }}>Proceso</span>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(40px, 6vw, 72px)',
            letterSpacing: '0.03em', margin: 0,
          }}>CÓMO FUNCIONA</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {[
            {
              step: '01',
              icon: '📸',
              title: 'Fotografía el platillo',
              desc: 'Toma 20-40 fotos desde distintos ángulos de tu platillo real.',
            },
            {
              step: '02',
              icon: '🤖',
              title: 'Genera el modelo 3D',
              desc: 'Sube las fotos a Meshy.ai o Luma AI y descarga el archivo .glb en minutos.',
            },
            {
              step: '03',
              icon: '⬆️',
              title: 'Sube al panel',
              desc: 'Agrega el nombre, precio, categoría y el archivo .glb de tu platillo.',
            },
            {
              step: '04',
              icon: '🔲',
              title: 'Genera el QR',
              desc: 'El sistema crea automáticamente un QR único para ese platillo.',
            },
            {
              step: '05',
              icon: '🍕',
              title: 'Imprime en el menú',
              desc: 'El cliente apunta la cámara, escanea y ve el platillo en AR sobre su mesa.',
            },
          ].map((item, i) => (
            <div key={i} className="card" style={{ padding: '28px 24px' }}>
              <div style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '13px', color: '#ff6b2b', letterSpacing: '0.1em',
                marginBottom: '12px',
              }}>{item.step}</div>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#f0ece6' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{
        padding: '80px 40px', background: '#0e0e0e',
        borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(36px, 5vw, 64px)',
              letterSpacing: '0.03em', margin: 0,
            }}>POR QUÉ LOS RESTAURANTES<br /><span style={{ color: '#ff6b2b' }}>LO VAN A QUERER</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: '📈', title: 'Aumenta el ticket promedio', desc: 'Cuando el cliente ve el platillo en tamaño real y apetitoso, ordena más.' },
              { icon: '🤩', title: 'Experiencia memorable', desc: 'El factor sorpresa hace que los clientes lo compartan en redes sociales.' },
              { icon: '📱', title: 'Sin descargar ninguna app', desc: 'Funciona directo desde la cámara del teléfono. iOS y Android.' },
              { icon: '🖨️', title: 'Menú físico mejorado', desc: 'El menú físico sigue igual, solo se agrega el QR. Sin cambiar la experiencia.' },
              { icon: '⚡', title: 'Configuración en minutos', desc: 'Sube el modelo .glb, llena los datos, descarga el QR. Listo.' },
              { icon: '🔄', title: 'Actualizable en tiempo real', desc: 'Cambia los modelos cuando quieras. El QR sigue funcionando igual.' },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: '28px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: '#f0ece6' }}>{f.title}</h3>
                  <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" style={{ padding: '120px 40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span className="tag" style={{ marginBottom: '16px', display: 'inline-block' }}>Precios sugeridos</span>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(36px, 5vw, 64px)',
            letterSpacing: '0.03em', margin: 0,
          }}>PLANES PARA RESTAURANTES</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            {
              name: 'Starter', price: '$199', period: '/mes',
              items: ['Hasta 10 platillos en AR', 'Generación de QR ilimitada', 'Soporte básico'],
              highlight: false,
            },
            {
              name: 'Restaurante', price: '$399', period: '/mes',
              items: ['Hasta 40 platillos en AR', 'QR personalizados con logo', 'Estadísticas de escaneos', 'Soporte prioritario'],
              highlight: true,
            },
            {
              name: 'Cadena', price: 'Custom', period: '',
              items: ['Platillos ilimitados', 'Múltiples sucursales', 'API access', 'Manager dedicado'],
              highlight: false,
            },
          ].map((plan, i) => (
            <div key={i} style={{
              padding: '32px 28px',
              borderRadius: '12px',
              border: plan.highlight ? '1px solid #ff6b2b' : '1px solid #2a2a2a',
              background: plan.highlight ? 'rgba(255,107,43,0.05)' : '#131313',
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: '#ff6b2b', color: '#fff', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.08em', padding: '4px 14px', borderRadius: '20px',
                  textTransform: 'uppercase',
                }}>Más popular</div>
              )}
              <div style={{ fontSize: '13px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '48px', color: plan.highlight ? '#ff6b2b' : '#f0ece6' }}>{plan.price}</span>
                <span style={{ color: '#666', fontSize: '14px' }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.items.map((item, j) => (
                  <li key={j} style={{ fontSize: '14px', color: '#ccc', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: '#ff6b2b', fontSize: '16px' }}>✓</span>{item}
                  </li>
                ))}
              </ul>
              <Link href="/admin">
                <button
                  className={plan.highlight ? 'btn-primary' : 'btn-ghost'}
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  Empezar
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{
        padding: '100px 40px', textAlign: 'center',
        borderTop: '1px solid #1a1a1a',
        background: 'radial-gradient(ellipse at center, rgba(255,107,43,0.08) 0%, transparent 70%)',
      }}>
        <h2 style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(40px, 7vw, 88px)',
          letterSpacing: '0.02em', margin: '0 0 24px',
        }}>DALE A TU RESTAURANTE<br /><span style={{ color: '#ff6b2b' }}>EL MENÚ QUE MERECE</span></h2>
        <p style={{ fontSize: '16px', color: '#888', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
          Empieza hoy. Sube tu primer platillo en 3D y genera tu QR en menos de 5 minutos.
        </p>
        <Link href="/admin">
          <button className="btn-primary" style={{ fontSize: '18px', padding: '18px 48px' }}>
            Crear mi primer platillo AR →
          </button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid #1a1a1a', padding: '32px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 24, height: 24, borderRadius: '6px',
            background: 'linear-gradient(135deg, #ff6b2b, #ffc947)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700,
          }}>M</div>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>MenuAR</span>
        </div>
        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
          © 2026 MenuAR. Todos los derechos reservados.
        </p>
      </footer>

    </main>
  )
}
