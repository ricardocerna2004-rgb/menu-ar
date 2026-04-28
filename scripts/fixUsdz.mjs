/**
 * Parchea el USDA dentro del USDZ:
 *  - Cambia quaternion del mesh de +90°X a -90°X → toppings arriba
 *  - Agrega scale 0.1 en Root → 20cm
 *  - Convierte textura PNG a JPEG → menos peso
 * Reempaca como USDZ válido (todos los archivos STORED, sin comprimir).
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import JSZip from 'jszip'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workDir   = path.join(__dirname, '..', 'public', 'models', 'usdz_work')
const outPath   = path.join(__dirname, '..', 'public', 'models', 'pizzamodel.usdz')

// ── 1. Leer USDA limpio ──────────────────────────────────────────────────────
let usda = readFileSync(path.join(workDir, 'model.usda'), 'utf8')
console.log(`📄 USDA leído: ${(usda.length / 1024 / 1024).toFixed(1)}MB`)

// ── 2. Cambiar quaternion del mesh: +90°X → -90°X (toppings arriba) ──────────
// +90°X = (0.7071067, +0.7071068, 0, 0) → toppings miran al suelo ✗
// -90°X = (0.7071067, -0.7071068, 0, 0) → toppings miran arriba  ✓
const before = (usda.match(/quatf xformOp:orient/g) || []).length
usda = usda.replace(
  /quatf xformOp:orient = \(0\.7071067, 0\.7071068, 0\.000000, 0\.000000\)/g,
  'quatf xformOp:orient = (0.7071067, -0.7071068, 0.000000, 0.000000)'
)
const after = (usda.match(/-0\.7071068/g) || []).length
console.log(`🔄 Quaternions corregidos: ${after} (de ${before} encontrados)`)

// ── 3. Añadir scale 0.1 en Root (solo scale, sin rotación extra) ─────────────
usda = usda.replace(
  /def Xform "Root"\s*\{/,
  `def Xform "Root"
{
    float3 xformOp:scale = (0.1, 0.1, 0.1)
    uniform token[] xformOpOrder = ["xformOp:scale"]`
)
console.log('📐 Scale 0.1 añadida en Root (→ 20cm)')

// ── 4. Reducir precisión decimal del USDA (de 7 a 4 decimales) ──────────────
// Para visualización de comida 4 decimales = 0.1mm de precisión, más que suficiente
const beforeSize = Buffer.byteLength(usda, 'utf8')
usda = usda.replace(/(-?\d+\.\d{5,})/g, (match) => {
  const n = parseFloat(match)
  // Conservar precisión extra en números muy pequeños (normales, etc.)
  if (Math.abs(n) < 0.0001) return parseFloat(n.toFixed(6)).toString()
  return parseFloat(n.toFixed(4)).toString()
})
const afterSize = Buffer.byteLength(usda, 'utf8')
console.log(`📉 USDA: ${(beforeSize/1024/1024).toFixed(1)}MB → ${(afterSize/1024/1024).toFixed(1)}MB (precisión reducida)`)

// ── 6. Textura PNG → JPEG para reducir peso ──────────────────────────────────
const texFiles = readdirSync(path.join(workDir, 'textures'))
const texName  = texFiles[0]
const texBase  = path.basename(texName, path.extname(texName))
const jpegName = texBase + '.jpg'

const jpegBytes = await sharp(path.join(workDir, 'textures', texName))
  .jpeg({ quality: 82 })
  .toBuffer()
console.log(`🖼️  Textura: PNG ${(readFileSync(path.join(workDir,'textures',texName)).length/1024/1024).toFixed(1)}MB → JPEG ${(jpegBytes.length/1024/1024).toFixed(1)}MB`)

// Actualizar referencia en USDA (de .png a .jpg)
usda = usda.replace(new RegExp(texName.replace('.', '\\.'), 'g'), jpegName)

// ── 7. Reempacar como USDZ (STORED) ─────────────────────────────────────────
const usda_bytes = Buffer.from(usda, 'utf8')
const zip = new JSZip()
zip.file('model.usda',             usda_bytes, { compression: 'STORE' })
zip.file(`textures/${jpegName}`,   jpegBytes,  { compression: 'STORE' })

const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' })
writeFileSync(outPath, content)
console.log(`\n✅ USDZ listo: ${(content.length / 1024 / 1024).toFixed(1)}MB → ${outPath}`)
