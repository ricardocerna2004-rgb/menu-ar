/**
 * Fix definitivo:
 * - Quaternion +90°X (del converter, deja toppings abajo) → -90°X (toppings arriba)
 * - Scale 0.125 en mesh → 25cm (geometría raw ~200cm)
 * - Root: SIN transforms extra (cualquier rotación en Root cancela el fix)
 * - Reduce precisión decimal + PNG→JPEG para reducir peso
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
console.log('📦 USDZ extraído')

// ── 2. Leer USDA ───────────────────────────────────────────────────────────
let usda = readFileSync(path.join(workDir, 'model.usda'), 'utf8')
console.log(`📄 USDA: ${(usda.length/1024/1024).toFixed(1)}MB`)

// ── 3. Quaternion: +90°X → -90°X ───────────────────────────────────────────
// +90°X (0.7071, +0.7071, 0, 0) = pizza plana pero TOPPINGS ABAJO
// -90°X (0.7071, -0.7071, 0, 0) = pizza plana con TOPPINGS ARRIBA ✓
const countBefore = (usda.match(/quatf xformOp:orient/g)||[]).length
usda = usda.replace(
  /quatf xformOp:orient = \(\s*0\.7071\d*,\s*0\.7071\d*,\s*0\.0+,\s*0\.0+\s*\)/g,
  'quatf xformOp:orient = (0.7071068, -0.7071068, 0, 0)'
)
const countAfter = (usda.match(/-0\.7071068/g)||[]).length
console.log(`🔄 Quaternion corregido: ${countAfter}/${countBefore} (−90°X → toppings arriba)`)

// ── 4. Scale 0.125 en mesh → 25cm ──────────────────────────────────────────
usda = usda.replace(
  /double3 xformOp:scale = \(\s*1\.0+,\s*1\.0+,\s*1\.0+\s*\)/g,
  'double3 xformOp:scale = (0.125, 0.125, 0.125)'
)
console.log('📐 Scale → 0.125 (25cm)')

// ── 5. Root: SOLO anchoring, SIN rotación ni scale extra ───────────────────
// Cualquier transform en Root puede cancelar el fix de orientación en iOS
usda = usda.replace(
  /def Xform "Root"\s*\{[\s\S]*?(?=def Scope|def Xform "(?!Root))/,
  (match) => {
    // Conservar solo las líneas de anchoring y la apertura del bloque
    const lines = match.split('\n')
    const clean = lines.filter(l =>
      l.includes('def Xform "Root"') ||
      l.includes('preliminary:anchoring') ||
      l.includes('preliminary:planeAnchoring') ||
      l.trim() === '{'
    )
    return clean.join('\n') + '\n'
  }
)
console.log('🏠 Root: solo anchoring, sin transforms')

// ── 6. Reducir precisión decimal (7 cifras → 4) ────────────────────────────
const sz0 = Buffer.byteLength(usda,'utf8')
usda = usda.replace(/(-?\d+\.\d{5,})/g, m => {
  const n = parseFloat(m)
  return Math.abs(n) < 0.0001
    ? parseFloat(n.toFixed(6)).toString()
    : parseFloat(n.toFixed(4)).toString()
})
const sz1 = Buffer.byteLength(usda,'utf8')
console.log(`📉 USDA: ${(sz0/1024/1024).toFixed(1)}MB → ${(sz1/1024/1024).toFixed(1)}MB`)

// ── 7. Textura PNG → JPEG ──────────────────────────────────────────────────
const texFiles = readdirSync(path.join(workDir, 'textures'))
const texName  = texFiles[0]
const jpegName = path.basename(texName, path.extname(texName)) + '.jpg'
const pngBytes  = readFileSync(path.join(workDir, 'textures', texName))
const jpegBytes = await sharp(pngBytes).jpeg({ quality: 82 }).toBuffer()
usda = usda.replace(new RegExp(texName.replace('.', '\\.'), 'g'), jpegName)
console.log(`🖼️  Textura: ${(pngBytes.length/1024/1024).toFixed(1)}MB → ${(jpegBytes.length/1024).toFixed(0)}KB`)

// ── 8. Reempacar USDZ (STORED) ─────────────────────────────────────────────
const jszip = new JSZip()
jszip.file('model.usda', Buffer.from(usda,'utf8'), { compression:'STORE' })
jszip.file(`textures/${jpegName}`, jpegBytes, { compression:'STORE' })
const content = await jszip.generateAsync({ type:'nodebuffer', compression:'STORE' })
writeFileSync(outPath, content)
console.log(`\n✅ USDZ: ${(content.length/1024/1024).toFixed(1)}MB → ${outPath}`)
