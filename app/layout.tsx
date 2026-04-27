import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MenuAR — El menú del futuro',
  description: 'Transforma tu menú físico en una experiencia de realidad aumentada. Tus clientes ven cada platillo en 3D, a tamaño real, antes de ordenar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
