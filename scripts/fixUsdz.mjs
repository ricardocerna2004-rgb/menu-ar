/**
 * Parchea el USDA:
 *  - Quita la rotación del converter (identity quaternion)
 *  - Scale 0.125 directo en el mesh → 25cm (geometría raw ~200cm)
 *  - Reduce precisión decimal para reducir peso
 *  - Convierte textura PNG → JPEG
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import JSZip from 'jszip'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcPath   = path.join('C:\\Users\\ricky\\Downloads\\model (1).usdz')
const workDir   = path.join(__dirname, '..', 'public', 'models', 'usdz_work')
const outPath   = path.join(__dirname, '..', 'public', 'models', 'pizzamodel.usdz')

// ── 1. Extraer USDA fresco del original ────────────────────────────────────
import { createWriteStream, mkdirSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const AdmZip  = require('adm-zip')

const zip = new AdmZip(srcPath)
mkdirSync(workDir, { recursive: true })
zip.extractAllTo(workDir, /*overwrite*/true)
console.log('📦 USDZ extraído')

// ── 2. Leer USDA ───────────────────────────────────────────────────────────
let usda = readFileSync(path.join(workDir, 'model.usda'), 'utf8')
console.log(`📄 USDA: ${(usda.length/1024/1024).toFixed(1)}MB`)

// ── 3. Quitar rotación del converter — dejar identity (1,0,0,0) ────────────
// El converter añadió +90°X que dejaba la pizza plana pero AL REVÉS.
// Con identity la pizza queda en su orientación natural del modelo (flat, toppings arriba).
usda = usda.replace(
  /quatf xformOp:orient = \([^)]+\)/g,
  'quatf xformOp:orient = (1, 0, 0, 0)'
)
console.log('🔄 Quaternion → identity (sin rotación)')

// ── 4. Scale 0.125 en el mesh → 25cm ──────────────────────────────────────
// Raw geometry = ~200cm, 25cm/200cm = 0.125
usda = usda.replace(
  /double3 xformOp:scale = \(1\.000000, 1\.000000, 1\.000000\)/g,
  'double3 xformOp:scale = (0.125, 0.125, 0.125)'
)
console.log('📐 Scale → 0.125 (25cm)')

// ── 5. Root sin transform extra ────────────────────────────────────────────
usda = usda.replace(
  /def Xform "Root"\s*\{/,
  `def Xform "Root"\n{`
)

// ── 6. Reducir precisión decimal (7 cifras → 4) ────────────────────────────
const before = Buffer.byteLength(usda, 'utf8')
usda = usda.replace(/(-?\d+\.\d{5,})/g, (m) => {
  const n = parseFloat(m)
  return Math.abs(n) < 0.0001
    ? parseFloat(n.toFixed(6)).toString()
    : parseFloat(n.toFixed(4)).toString()
})
const after = Buffer.byteLength(usda, 'utf8')
console.log(`📉 USDA: ${(before/1024/1024).toFixed(1)}MB → ${(after/1024/1024).toFixed(1)}MB`)

// ── 7. Textura PNG → JPEG ──────────────────────────────────────────────────
const texFiles = readdirSync(path.join(workDir, 'textures'))
const texName  = texFiles[0]
const jpegName = path.basename(texName, path.extname(texName)) + '.jpg'
const pngBytes = readFileSync(path.join(workDir, 'textures', texName))
const jpegBytes = await sharp(pngBytes).jpeg({ quality: 82 }).toBuffer()
usda = usda.replace(new RegExp(texName.replace('.', '\\.'), 'g'), jpegName)
console.log(`🖼️  Textura: ${(pngBytes.length/1024/1024).toFixed(1)}MB → ${(jpegBytes.length/1024).toFixed(0)}KB`)

// ── 8. Reempacar como USDZ válido (todos los archivos STORED) ──────────────
const jszip = new JSZip()
jszip.file('model.usda', Buffer.from(usda, 'utf8'), { compression: 'STORE' })
jszip.file(`textures/${jpegName}`, jpegBytes, { compression: 'STORE' })

const content = await jszip.generateAsync({ type: 'nodebuffer', compression: 'STORE' })
writeFileSync(outPath, content)
console.log(`\n✅ USDZ: ${(content.length/1024/1024).toFixed(1)}MB → ${outPath}`)
