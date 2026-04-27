'use client'
import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface Props {
  url: string
  size?: number
}

export default function QRGenerator({ url, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !url) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
  }, [url, size])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
