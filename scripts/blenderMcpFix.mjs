/**
 * Conecta al Blender MCP socket (port 9876), importa la pizza,
 * inspecciona orientación y exporta USDZ correcto (toppings arriba).
 */
import net from 'net'

const GLB_PATH  = String.raw`C:\Users\ricky\OneDrive\Escritorio\PIZZA QR\public\models\pizzamodel.glb`
const USDZ_OUT  = String.raw`C:\Users\ricky\OneDrive\Escritorio\PIZZA QR\public\models\pizzamodel.usdz`

// Helper: send one command and return parsed response
function sendCommand(cmd, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()
    let buffer = ''
    const timer = setTimeout(() => { client.destroy(); reject(new Error('Timeout')) }, timeoutMs)

    client.connect(9876, 'localhost', () => client.write(JSON.stringify(cmd)))

    client.on('data', data => {
      buffer += data.toString()
      try {
        const resp = JSON.parse(buffer)
        clearTimeout(timer)
        client.destroy()
        resolve(resp)
      } catch { /* incomplete */ }
    })

    client.on('error', e => { clearTimeout(timer); reject(e) })
  })
}

async function blender(code) {
  const resp = await sendCommand({ type: 'execute_code', params: { code } })
  const out = resp.result || ''
  if (out) process.stdout.write(out + (out.endsWith('\n') ? '' : '\n'))
  if (resp.message) console.error('❌ BLENDER ERROR:', resp.message)
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1 — Limpiar e importar
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n━━━ PASO 1: Importando GLB ━━━')
await blender(`
import bpy, math, mathutils

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r"${GLB_PATH}")

for obj in bpy.context.scene.objects:
    print(f"OBJ: {obj.name!r}  type={obj.type}  rot_deg={[round(math.degrees(a),1) for a in obj.rotation_euler]}")
    if obj.type == 'MESH':
        vws = [obj.matrix_world @ mathutils.Vector(v) for v in obj.bound_box]
        xs=[v.x for v in vws]; ys=[v.y for v in vws]; zs=[v.z for v in vws]
        print(f"  WORLD_BBOX  X {min(xs):.3f}..{max(xs):.3f}  Y {min(ys):.3f}..{max(ys):.3f}  Z {min(zs):.3f}..{max(zs):.3f}")
        print(f"  WORLD_SIZE  X={max(xs)-min(xs):.3f}  Y={max(ys)-min(ys):.3f}  Z={max(zs)-min(zs):.3f}")
        obj.data.calc_normals_split()
        a_up  = sum(p.area for p in obj.data.polygons if (obj.matrix_world.to_3x3() @ p.normal).z >  0.7)
        a_dn  = sum(p.area for p in obj.data.polygons if (obj.matrix_world.to_3x3() @ p.normal).z < -0.7)
        print(f"  FACE_AREA   +Z(arriba)={a_up:.4f}  -Z(abajo)={a_dn:.4f}")
print("STEP1_DONE")
`)

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2 — Aplicar todas las transforms a los meshes y determinar orientación
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n━━━ PASO 2: Apply transforms + analizar orientación ━━━')
await blender(`
import bpy, math, mathutils

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    vs = obj.data.vertices
    xs=[v.co.x for v in vs]; ys=[v.co.y for v in vs]; zs=[v.co.z for v in vs]
    sx=max(xs)-min(xs); sy=max(ys)-min(ys); sz=max(zs)-min(zs)
    print(f"LOCAL_SIZE  X={sx:.4f}  Y={sy:.4f}  Z={sz:.4f}")
    obj.data.calc_normals_split()
    a_up  = sum(p.area for p in obj.data.polygons if p.normal.z >  0.7)
    a_dn  = sum(p.area for p in obj.data.polygons if p.normal.z < -0.7)
    print(f"LOCAL_NORMALS  +Z={a_up:.4f}  -Z={a_dn:.4f}")
print("STEP2_DONE")
`)

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3 — Corregir orientación: pizza flat en XZ, toppings a +Z
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n━━━ PASO 3: Corrigiendo orientación ━━━')
await blender(`
import bpy, math, mathutils

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not meshes:
    print("SIN MESHES"); raise SystemExit

obj = meshes[0]
vs = obj.data.vertices
xs=[v.co.x for v in vs]; ys=[v.co.y for v in vs]; zs=[v.co.z for v in vs]
sx=max(xs)-min(xs); sy=max(ys)-min(ys); sz=max(zs)-min(zs)

# ¿Cuál eje es el "delgado"? = cara del plato de pizza
thin = min(('X',sx),('Y',sy),('Z',sz), key=lambda t: t[1])[0]
print(f"EJE_DELGADO={thin}  (el plano de la pizza)")

def apply_rot(deg, axis):
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
    bpy.ops.transform.rotate(value=math.radians(deg), orient_axis=axis, orient_type='GLOBAL')
    bpy.ops.object.transform_apply(rotation=True)
    print(f"Aplicado {deg}° en {axis}")

# Si el delgado es Z → pizza plana en XY, necesita -90°X para pasar a XZ
if thin == 'Z':
    print("Pizza flat en XY → rotando -90°X")
    apply_rot(-90, 'X')

# Si el delgado es X → pizza flat en YZ, necesita 90°Y
elif thin == 'X':
    print("Pizza flat en YZ → rotando 90°Y")
    apply_rot(90, 'Y')

# Si el delgado es Y → ya está flat en XZ (ideal para Blender Z-up)
else:
    print("Pizza ya flat en XZ. OK.")

# Ahora recalcular normales (local space, sin world transform)
obj.data.calc_normals_split()
a_up  = sum(p.area for p in obj.data.polygons if p.normal.z >  0.7)
a_dn  = sum(p.area for p in obj.data.polygons if p.normal.z < -0.7)
print(f"TRAS FLAT  +Z={a_up:.4f}  -Z={a_dn:.4f}")

# Si los toppings miran hacia -Z → voltear 180°X
if a_dn > a_up * 1.05:
    print("Toppings miran ABAJO (-Z). Volteando 180°X...")
    apply_rot(180, 'X')
    obj.data.calc_normals_split()
    a2_up = sum(p.area for p in obj.data.polygons if p.normal.z >  0.7)
    a2_dn = sum(p.area for p in obj.data.polygons if p.normal.z < -0.7)
    print(f"TRAS FLIP  +Z={a2_up:.4f}  -Z={a2_dn:.4f}")
else:
    print("Toppings miran ARRIBA (+Z). Correcto!")

print("STEP3_DONE")
`)

// ─────────────────────────────────────────────────────────────────────────────
// PASO 4 — Escalar a 25cm real (pizza grande de restaurante)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n━━━ PASO 4: Escalando a 25cm ━━━')
await blender(`
import bpy, math

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not meshes:
    print("SIN MESHES"); raise SystemExit

# Medir tamaño actual
obj = meshes[0]
vs = obj.data.vertices
xs=[v.co.x for v in vs]; ys=[v.co.y for v in vs]; zs=[v.co.z for v in vs]
sx=max(xs)-min(xs); sy=max(ys)-min(ys); sz=max(zs)-min(zs)
diameter = max(sx, sz)  # diámetro horizontal de la pizza
print(f"DIAMETRO_ACTUAL = {diameter:.4f} m = {diameter*100:.1f} cm")

# Escalar a 0.25m (25 cm)
target = 0.25
factor = target / diameter if diameter > 0 else 1.0
print(f"FACTOR_ESCALA = {factor:.6f}")

bpy.ops.object.select_all(action='SELECT')
bpy.ops.transform.resize(value=(factor, factor, factor), orient_type='GLOBAL')
bpy.ops.object.transform_apply(scale=True)

# Verificar
vs2 = obj.data.vertices
xs2=[v.co.x for v in vs2]; zs2=[v.co.z for v in vs2]
diam2 = max(max(xs2)-min(xs2), max(zs2)-min(zs2))
print(f"DIAMETRO_FINAL = {diam2:.4f} m = {diam2*100:.1f} cm")
print("STEP4_DONE")
`)

// ─────────────────────────────────────────────────────────────────────────────
// PASO 5 — Exportar USDZ
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n━━━ PASO 5: Exportando USDZ ━━━')
await blender(`
import bpy, os

out = r"${USDZ_OUT}"
os.makedirs(os.path.dirname(out), exist_ok=True)

try:
    result = bpy.ops.wm.usd_export(
        filepath=out,
        export_textures=True,
        overwrite_textures=True,
        selected_objects_only=False,
        visible_objects_only=True,
        export_animation=False,
        export_uvmaps=True,
        export_normals=True,
        export_materials=True,
        use_instancing=False,
    )
    print(f"bpy.ops result: {result}")
    if os.path.exists(out):
        size = os.path.getsize(out)
        print(f"USDZ_OK  size={size/1024/1024:.2f}MB  path={out}")
    else:
        print("USDZ_FAIL: archivo no creado")
except Exception as e:
    print(f"EXPORT_ERROR: {e}")
    import traceback; traceback.print_exc()

print("STEP5_DONE")
`, 120000)

console.log('\n✅ Script completado.')
