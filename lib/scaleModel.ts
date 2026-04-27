import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { getBounds } from '@gltf-transform/functions'

/**
 * Scales a GLB so its largest horizontal dimension matches `realWidthCm`.
 * Returns the path of the scaled file (overwrites in place).
 */
export async function scaleModelToRealSize(filePath: string, realWidthCm: number): Promise<void> {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const doc = await io.read(filePath)

  const scene = doc.getRoot().listScenes()[0]
  if (!scene) return

  const box = getBounds(scene)
  const sizeX = box.max[0] - box.min[0]
  const sizeZ = box.max[2] - box.min[2]
  const currentSize = Math.max(sizeX, sizeZ)

  if (currentSize <= 0) return

  const targetMeters = realWidthCm / 100
  const factor = targetMeters / currentSize

  // Apply uniform scale to every root node in the scene
  for (const node of scene.listChildren()) {
    const s = node.getScale()
    node.setScale([s[0] * factor, s[1] * factor, s[2] * factor])
  }

  await io.write(filePath, doc)
}
