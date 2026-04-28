/**
 * Bake the real-world scale directly into mesh vertex positions.
 * Strategy: measure raw geometry (no node transforms), compute exact
 * factor, apply to vertices, zero out all node transforms.
 * The USDZ converter has no choice but to use the vertex data as-is.
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { getBounds, textureCompress, transformMesh } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'
import { mat4 } from 'gl-matrix'
import path from 'path'
import { fileURLToPath } from 'url'
import { statSync } from 'fs'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const inputPath  = path.join(__dirname, '..', 'public', 'models', 'pizzamodel.glb')
const outputPath = path.join(__dirname, '..', 'public', 'models', 'pizzamodel_usdz_ready.glb')

const REAL_WIDTH_CM = 20

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready])

// Leer con meshopt decoder (el input está comprimido)
const ioRead = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })

// Escribir SIN meshopt (Blender no soporta EXT_meshopt_compression)
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })

console.log('📦 Cargando modelo...')
const doc  = await ioRead.read(inputPath)
const root = doc.getRoot()
const scene = root.listScenes()[0]

// ── Paso 1: medir tamaño RAW (sin transforms de nodos) ─────────────────────
// Guardamos transforms actuales y los ponemos a identidad temporalmente
const savedTransforms = root.listNodes().map(node => ({
  node,
  scale: node.getScale().slice(),
  rotation: node.getRotation().slice(),
  translation: node.getTranslation().slice(),
}))

for (const { node } of savedTransforms) {
  node.setScale([1, 1, 1])
  node.setRotation([0, 0, 0, 1])
  node.setTranslation([0, 0, 0])
}

const rawBox  = getBounds(scene)
const rawSizeX = rawBox.max[0] - rawBox.min[0]
const rawSizeZ = rawBox.max[2] - rawBox.min[2]
const rawSizeY = rawBox.max[1] - rawBox.min[1]
const rawSize  = Math.max(rawSizeX, rawSizeZ, rawSizeY)
console.log(`📐 Geometría RAW: ${(rawSize * 100).toFixed(1)}cm`)

// ── Paso 2: calcular factor total ──────────────────────────────────────────
const targetMeters = REAL_WIDTH_CM / 100
const factor = targetMeters / rawSize
console.log(`🎯 Objetivo: ${REAL_WIDTH_CM}cm → factor: ${factor.toFixed(6)}`)

// ── Paso 3: restaurar transforms de nodos ──────────────────────────────────
for (const { node, scale, rotation, translation } of savedTransforms) {
  node.setScale(scale)
  node.setRotation(rotation)
  node.setTranslation(translation)
}

// ── Paso 4: construir matriz que combina node-transforms × scale-to-target ──
// Para cada nodo raíz, aplicamos: (node_world_matrix × scale_target) a sus meshes
// Luego ponemos todos los node transforms a identidad

// Escala total = node_accumulated_scale × factor
// Como los nodos tienen escalas acumuladas, calculamos la escala aparente
const apparentBox  = getBounds(scene)
const apparentSizeX = apparentBox.max[0] - apparentBox.min[0]
const apparentSizeZ = apparentBox.max[2] - apparentBox.min[2]
const apparentSizeY = apparentBox.max[1] - apparentBox.min[1]
const apparentSize  = Math.max(apparentSizeX, apparentSizeZ, apparentSizeY)
console.log(`📐 Geometría APARENTE (con transforms): ${(apparentSize * 100).toFixed(1)}cm`)

// Factor total a aplicar a los vértices RAW para llegar a 6cm
const totalFactor = targetMeters / rawSize

// ── Paso 5: bake en vértices – zeroing node transforms ANTES ───────────────
for (const { node } of savedTransforms) {
  node.setScale([1, 1, 1])
  node.setRotation([0, 0, 0, 1])
  node.setTranslation([0, 0, 0])
}

// Scale + rotate -90° en X para que la pizza quede PLANA sobre la mesa
const scaleM = mat4.create()
mat4.fromScaling(scaleM, [totalFactor, totalFactor, totalFactor])

const rotM = mat4.create()
mat4.rotateX(rotM, rotM, Math.PI / 2)   // +90° → cara de pizza mira hacia arriba, tabla abajo

const finalMatrix = mat4.create()
mat4.multiply(finalMatrix, rotM, scaleM)  // primero escala, luego rota

for (const mesh of root.listMeshes()) {
  transformMesh(mesh, finalMatrix)
}

// Verificar resultado
const finalBox  = getBounds(scene)
const finalSizeX = finalBox.max[0] - finalBox.min[0]
const finalSizeZ = finalBox.max[2] - finalBox.min[2]
const finalSizeY = finalBox.max[1] - finalBox.min[1]
const finalSize  = Math.max(finalSizeX, finalSizeZ, finalSizeY)
console.log(`✅ Geometría FINAL bakeada: ${(finalSize * 100).toFixed(2)}cm`)

// ── Paso 5b: eliminar extensión meshopt para que Blender pueda abrirlo ────
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (ext.extensionName === 'EXT_meshopt_compression') ext.dispose()
}

// ── Paso 6: texturas JPEG 1024px ──────────────────────────────────────────
console.log('🖼️  Optimizando texturas...')
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: 'jpeg', quality: 85, resize: [1024, 1024] })
)

await io.write(outputPath, doc)

const before = statSync(inputPath).size
const after  = statSync(outputPath).size
console.log(`\n📦 Tamaños: ${(before/1024/1024).toFixed(2)}MB → ${(after/1024/1024).toFixed(2)}MB`)
console.log(`\n👉 Convierte a USDZ este archivo:`)
console.log(`   ${outputPath}`)
