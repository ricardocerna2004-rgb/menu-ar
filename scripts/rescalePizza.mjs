import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { getBounds } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.join(__dirname, '..', 'public', 'models', 'pizzamodel.glb')
const REAL_WIDTH_CM = 20

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready])
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(filePath)
const scene = doc.getRoot().listScenes()[0]
const box = getBounds(scene)

const sizeX = box.max[0] - box.min[0]
const sizeZ = box.max[2] - box.min[2]
const current = Math.max(sizeX, sizeZ)
const target = REAL_WIDTH_CM / 100
const factor = target / current

console.log(`Tamaño actual: ${(current * 100).toFixed(1)}cm → escalando a ${REAL_WIDTH_CM}cm (factor: ${factor.toFixed(4)})`)

for (const node of scene.listChildren()) {
  const s = node.getScale()
  node.setScale([s[0] * factor, s[1] * factor, s[2] * factor])
}

await io.write(filePath, doc)
console.log('✅ Modelo escalado correctamente')
