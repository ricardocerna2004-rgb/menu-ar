import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { scaleModelToRealSize } from '@/lib/scaleModel'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const realWidthCm = Number(formData.get('realWidthCm') ?? 0)

  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const ext = path.extname(file.name).toLowerCase()
  if (!['.glb', '.gltf'].includes(ext)) {
    return NextResponse.json({ error: 'Solo se permiten archivos .glb o .gltf' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const modelsDir = path.join(process.cwd(), 'public', 'models')
  await mkdir(modelsDir, { recursive: true })

  const filename = `${uuidv4()}${ext}`
  const filepath = path.join(modelsDir, filename)
  await writeFile(filepath, buffer)

  // Escala el modelo al tamaño real especificado
  if (realWidthCm > 0) {
    await scaleModelToRealSize(filepath, realWidthCm)
  }

  return NextResponse.json({ path: `/models/${filename}` })
}
