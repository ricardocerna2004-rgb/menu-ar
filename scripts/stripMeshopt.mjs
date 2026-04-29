/**
 * Crea pizzamodel_clean.glb: igual que pizzamodel.glb pero
 * sin EXT_meshopt_compression (para que Blender pueda importarlo).
 * NO aplica ninguna rotación ni escala — Blender lo hará.
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { textureCompress } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import { statSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inputPath  = path.join(__dirname, '..', 'public', 'models', 'pizzamodel.glb')
const outputPath = path.join(__dirname, '..', 'public', 'models', 'pizzamodel_clean.glb')

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready])

// Leer con meshopt decoder
const ioRead = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })

const ioWrite = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)

console.log('📦 Leyendo', inputPath)
const doc = await ioRead.read(inputPath)

// 1. Quitar meshopt
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (ext.extensionName === 'EXT_meshopt_compression') {
    ext.dispose()
    console.log('✓ EXT_meshopt_compression eliminada')
  }
}

// 2. Convertir texturas WebP/EXR → JPEG (iOS no soporta WebP en USDZ)
console.log('🖼️  Convirtiendo texturas a JPEG...')
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: 'jpeg', quality: 90 })
)
console.log('✓ Texturas convertidas a JPEG')

// 3. Info de nodes
for (const node of doc.getRoot().listNodes()) {
  const s = node.getScale(); const r = node.getRotation(); const t = node.getTranslation()
  console.log(`  Node "${node.getName()}": scale=[${s.map(v=>v.toFixed(4))}] rot=[${r.map(v=>v.toFixed(4))}] trans=[${t.map(v=>v.toFixed(4))}]`)
}

await ioWrite.write(outputPath, doc)

const before = statSync(inputPath).size
const after  = statSync(outputPath).size
console.log(`\n✅ GLB limpio+JPEG: ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB`)
console.log(`   ${outputPath}`)
