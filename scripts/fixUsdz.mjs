/**
 * Fix definitivo via escala negativa en Y:
 * - Mantiene el quaternion original +90°X (pizza horizontal)
 * - Cambia scale a (0.125, -0.125, 0.125): el Y negativo voltea la pizza
 *   para que los toppings queden arriba y la tabla abajo
 * - 25cm de diámetro (200cm raw × 0.125 = 25cm)
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import JSZip from 'jszip'
import sharp from 'sharp'

const require    = createRequire(import.meta.url)
const AdmZip     = require('adm-zip')
const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const srcPath    = 'C:\\Users\\ricky\\Downloads\\model (1).usdz'
const workDir    = path.join(__dirname, '..', 'public', 'models', 'usdz_work')
const outPath    = path.join(__dirname, '..', 'public', 'models', 'pizzamodel.usdz')

// ── 1. Extraer USDZ original limpio ────────────────────────────────────────
mkdirSync(workDir, { recursive: true })
new AdmZip(srcPath).extractAllTo(workDir, true)
console.log('📦 USDZ extraído (limpio)')

// ── 2. Leer USDA ───────────────────────────────────────────────────────────
let usda = readFileSync(path.join(workDir, 'model.usda'), 'utf8')
console.log(`📄 USDA: ${(usda.length/1024/1024).toFixed(1)}MB`)

// Verificar quaternion original
const q = usda.match(/quatf xformOp:orient = \([^)]+\)/)
console.log(`🔍 Quaternion encontrado: ${q ? q[0] : 'ninguno'}`)

// ── 3. NO tocar el quaternion — el +90°X original pone la pizza horizontal ──
// Solo cambiamos la escala: Y negativo = flip toppings arriba, tabla abajo
// scale (0.125, -0.125, 0.125) → pizza plana, 25cm, toppings arriba ✓
usda = usda.replace(
  /double3 xformOp:scale = \(\s*1\.0+,\s*1\.0+,\s*1\.0+\s*\)/g,
  'float3 xformOp:scale = (0.125, -0.125, 0.125)'
)
console.log('📐 Scale → (0.125, -0.125, 0.125) — flip Y + 25cm')

// ── 4. Root: mantener solo el anchoring, sin transforms extra ───────────────
// Quitar cualquier scale/rotate que hayamos añadido en runs anteriores
usda = usda.replace(
  /float3 xformOp:scale[^\n]*\n\s*uniform token\[\] xformOpOrder[^\n]*\n(\s*float3 xformOp:rotateXYZ[^\n]*\n\s*uniform token\[\] xformOpOrder[^\n]*\n)?/g,
  (match, _, offset) => {
    // Solo eliminar si está en el Root (primeras 500 chars del bloque Root)
    return match
  }
)

// Limpiar transforms residuales del Root de runs anteriores
usda = usda.replace(
  /(def Xform "Root"\s*\{[^{]*?)(float3 xformOp:scale[^\n]*\n[^\n]*\n(?:float3 xformOp:rotateXYZ[^\n]*\n[^\n]*\n)?)/s,
  '$1'
)
console.log('🏠 Root limpiado')

// ── 5. Reducir precisión decimal ────────────────────────────────────────────
const sz0 = Buffer.byteLength(usda,'utf8')
usda = usda.replace(/(-?\d+\.\d{5,})/g, m => {
  const n = parseFloat(m)
  return Math.abs(n) < 0.0001
    ? parseFloat(n.toFixed(6)).toString()
    : parseFloat(n.toFixed(4)).toString()
})
const sz1 = Buffer.byteLength(usda,'utf8')
console.log(`📉 USDA: ${(sz0/1024/1024).toFixed(1)}MB → ${(sz1/1024/1024).toFixed(1)}MB`)

// ── 6. Textura PNG → JPEG ──────────────────────────────────────────────────
const texFiles  = readdirSync(path.join(workDir, 'textures'))
const texName   = texFiles[0]
const jpegName  = path.basename(texName, path.extname(texName)) + '.jpg'
const pngBytes  = readFileSync(path.join(workDir, 'textures', texName))
const jpegBytes = await sharp(pngBytes).jpeg({ quality: 82 }).toBuffer()
usda = usda.replace(new RegExp(texName.replace('.', '\\.'), 'g'), jpegName)
console.log(`🖼️  Textura: ${(pngBytes.length/1024/1024).toFixed(1)}MB → ${(jpegBytes.length/1024).toFixed(0)}KB`)

// ── 7. Reempacar USDZ (STORED) ─────────────────────────────────────────────
const jszip = new JSZip()
jszip.file('model.usda', Buffer.from(usda,'utf8'), { compression:'STORE' })
jszip.file(`textures/${jpegName}`, jpegBytes, { compression:'STORE' })
const content = await jszip.generateAsync({ type:'nodebuffer', compression:'STORE' })
writeFileSync(outPath, content)
console.log(`\n✅ USDZ: ${(content.length/1024/1024).toFixed(1)}MB → ${outPath}`)
