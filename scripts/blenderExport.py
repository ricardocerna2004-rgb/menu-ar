"""
Blender background script: importa el GLB de pizza (sin meshopt), corrige
orientación (toppings arriba), escala a 25cm y exporta USDZ.

Uso:
  blender --background --python scripts/blenderExport.py

Lógica de ejes para exportación correcta:
  - Blender Z-up → USD Y-up  (la conversión la hace Blender automáticamente)
  - Para que la pizza quede flat en AR: debe estar en el plano XY de Blender
    (eje delgado = Z, normal apuntando ±Z)
  - Toppings deben apuntar +Z en Blender (→ +Y en USD = arriba en iOS AR)
"""
import bpy
import bmesh
import math
import mathutils
import os
import sys

GLB_PATH = r"C:\Users\ricky\OneDrive\Escritorio\PIZZA QR\public\models\pizzamodel_clean.glb"
USDZ_OUT = r"C:\Users\ricky\OneDrive\Escritorio\PIZZA QR\public\models\pizzamodel.usdz"

def banner(msg):
    print(f"\n{'='*60}\n{msg}\n{'='*60}")

banner(f"PIZZA USDZ FIXER — Blender {bpy.app.version_string}")

# ── 1. Limpiar escena ──────────────────────────────────────────────────────
for obj in list(bpy.data.objects):   bpy.data.objects.remove(obj, do_unlink=True)
for m in list(bpy.data.meshes):      bpy.data.meshes.remove(m)
for m in list(bpy.data.materials):   bpy.data.materials.remove(m)
for m in list(bpy.data.images):      bpy.data.images.remove(m)
print("✓ Escena limpia")

# ── 2. Importar GLB ────────────────────────────────────────────────────────
if not os.path.exists(GLB_PATH):
    print(f"❌ GLB no encontrado: {GLB_PATH}"); sys.exit(1)

print(f"📦 Importando: {GLB_PATH}")
bpy.ops.import_scene.gltf(filepath=GLB_PATH, merge_vertices=False)
print(f"✓ Objetos en escena: {[o.name for o in bpy.context.scene.objects]}")

# ── 3. Bake world matrix → vertices ───────────────────────────────────────
# Aplicar la matrix_world de cada objeto directamente a los vértices
# Luego resetear el transform del objeto a identidad
print("\n🔧 Bakeando transforms...")
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for obj in meshes:
    world_mat = obj.matrix_world.copy()
    # Aplicar matrix a vértices con bmesh
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.transform(bm, matrix=world_mat, verts=bm.verts)
    bm.normal_update()   # recalcular normales en bmesh
    bm.to_mesh(obj.data)
    bm.free()
    # Resetear objeto a identidad
    obj.matrix_world = mathutils.Matrix.Identity(4)
    obj.data.update()
    print(f"  ✓ {obj.name} bakeado")

# ── 4. Medir bounding box actual ──────────────────────────────────────────
def get_global_verts():
    verts = []
    for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
        for v in obj.data.vertices:
            verts.append(v.co.copy())
    return verts

def bbox_from_verts(verts):
    xs=[v.x for v in verts]; ys=[v.y for v in verts]; zs=[v.z for v in verts]
    return (min(xs),max(xs)),(min(ys),max(ys)),(min(zs),max(zs))

verts = get_global_verts()
(xmin,xmax),(ymin,ymax),(zmin,zmax) = bbox_from_verts(verts)
sx=xmax-xmin; sy=ymax-ymin; sz=zmax-zmin

print(f"\n📐 Bounding box:")
print(f"   X {xmin:.4f}..{xmax:.4f}  size={sx:.4f}m ({sx*100:.1f}cm)")
print(f"   Y {ymin:.4f}..{ymax:.4f}  size={sy:.4f}m ({sy*100:.1f}cm)")
print(f"   Z {zmin:.4f}..{zmax:.4f}  size={sz:.4f}m ({sz*100:.1f}cm)")

thin_axis = min([('X',sx),('Y',sy),('Z',sz)], key=lambda t:t[1])[0]
print(f"   Eje delgado (plano pizza): {thin_axis}")

# ── 5. Rotar para que pizza quede flat en XY (eje delgado = Z) ─────────────
# Para exportar correctamente a USDZ: Blender XY-flat → USD XZ-flat (horizontal) ✓
def rotate_verts_deg(deg, axis):
    mat = mathutils.Matrix.Rotation(math.radians(deg), 4, axis)
    for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.transform(bm, matrix=mat, verts=bm.verts)
        bm.normal_update()
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
    print(f"  → {deg:+.0f}° en {axis} aplicado")

print("\n🔄 Ajustando plano de pizza...")
if thin_axis == 'Z':
    print("  Pizza ya flat en XY. Sin rotación extra. ✓")
elif thin_axis == 'Y':
    # Pizza flat en XZ → rotar +90°X para pasar a XY
    print("  Pizza flat en XZ → rotando +90°X para ir a XY...")
    rotate_verts_deg(90, 'X')
elif thin_axis == 'X':
    # Pizza flat en YZ → rotar -90°Y para pasar a XY
    print("  Pizza flat en YZ → rotando -90°Y para ir a XY...")
    rotate_verts_deg(-90, 'Y')

# ── 6. Verificar y corregir dirección de toppings (+Z = arriba en Blender) ─
print("\n🍕 Verificando dirección de toppings...")

def get_face_areas_z(threshold=0.5):
    """Calcula área de caras apuntando ±Z (en vertex/local space = world ya es identidad)."""
    area_up = area_down = 0.0
    for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
        obj.data.update()
        for poly in obj.data.polygons:
            nz = poly.normal.z
            if   nz >  threshold: area_up   += poly.area
            elif nz < -threshold: area_down += poly.area
    return area_up, area_down

area_up, area_down = get_face_areas_z()
print(f"   Área cara +Z (toppings arriba?): {area_up:.6f}")
print(f"   Área cara -Z (tabla abajo?):     {area_down:.6f}")

if area_down > area_up * 1.05:
    print("   → Toppings miran ABAJO. Aplicando flip 180°Z (voltear sin cambiar flat)...")
    # 180°Z mantiene la pizza flat en XY pero invierte toppings arriba/abajo
    rotate_verts_deg(180, 'Z')
    # Alternativamente 180°X, pero 180°Z mantiene XY mejor
    area_up2, area_down2 = get_face_areas_z()
    print(f"   Tras flip: +Z={area_up2:.6f}  -Z={area_down2:.6f}")
    if area_up2 >= area_down2:
        print("   ✅ Toppings ahora miran ARRIBA (+Z). ¡Correcto!")
    else:
        # Try 180°X instead
        print("   180°Z no funcionó, intentando 180°X...")
        rotate_verts_deg(180, 'X')
        area_up3, area_down3 = get_face_areas_z()
        print(f"   Tras 180°X: +Z={area_up3:.6f}  -Z={area_down3:.6f}")
else:
    print("   ✅ Toppings ya miran ARRIBA (+Z). ¡Correcto!")

# ── 7. Centrar horizontalmente (X e Y), base en Z=0 ──────────────────────
print("\n📍 Centrando modelo...")
verts2 = get_global_verts()
(xmin2,xmax2),(ymin2,ymax2),(zmin2,zmax2) = bbox_from_verts(verts2)
cx = (xmin2+xmax2)/2; cy = (ymin2+ymax2)/2; cz = zmin2  # base en Z=0

t_mat = mathutils.Matrix.Translation((-cx, -cy, -cz))
for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.transform(bm, matrix=t_mat, verts=bm.verts)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
print(f"  Offset aplicado: ({-cx:.4f}, {-cy:.4f}, {-cz:.4f})")

# ── 8. Escalar a 25cm de diámetro ─────────────────────────────────────────
print("\n📏 Escalando a 25cm de diámetro...")
verts3 = get_global_verts()
(xmin3,xmax3),(ymin3,ymax3),(zmin3,zmax3) = bbox_from_verts(verts3)
sx3=xmax3-xmin3; sy3=ymax3-ymin3; sz3=zmax3-zmin3

# Diámetro = el más grande de X e Y (pizza flat en XY)
diam = max(sx3, sy3)
print(f"   Tamaño: X={sx3*100:.1f}cm  Y={sy3*100:.1f}cm  Z(grosor)={sz3*100:.1f}cm")
print(f"   Diámetro actual: {diam*100:.1f}cm")

TARGET_M = 0.25
scale_f = TARGET_M / diam if diam > 0 else 1.0
s_mat = mathutils.Matrix.Scale(scale_f, 4)

for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.transform(bm, matrix=s_mat, verts=bm.verts)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

verts4 = get_global_verts()
(xmin4,xmax4),(ymin4,ymax4),(zmin4,zmax4) = bbox_from_verts(verts4)
diam_f = max(xmax4-xmin4, ymax4-ymin4)
print(f"   Diámetro final: {diam_f*100:.2f}cm  ✓")
print(f"   Grosor final:   {(zmax4-zmin4)*100:.2f}cm")

# ── 9. Reportar texturas ──────────────────────────────────────────────────
print("\n🖼️  Texturas en escena:")
for img in bpy.data.images:
    if img.type == 'IMAGE' and img.size[0] > 0:
        print(f"  {img.name!r}  formato={img.file_format}  size={img.size[:]}  packed={img.packed_file is not None}")

# ── 10. Exportar USDZ ─────────────────────────────────────────────────────
print(f"\n📤 Exportando USDZ...")
print(f"   Destino: {USDZ_OUT}")
os.makedirs(os.path.dirname(USDZ_OUT), exist_ok=True)

try:
    res = bpy.ops.wm.usd_export(
        filepath=USDZ_OUT,
        export_textures_mode='NEW',    # Blender 5.x: KEEP/PRESERVE/NEW
        overwrite_textures=True,
        selected_objects_only=False,
        export_animation=False,
        export_hair=False,
        export_uvmaps=True,
        export_normals=True,
        export_materials=True,
        generate_preview_surface=True,
        use_instancing=False,
        convert_orientation=True,      # Blender Z-up → USD Y-up
        export_global_up_selection='Z',
        export_global_forward_selection='Y',
        triangulate_meshes=True,       # mejor compatibilidad iOS
        meters_per_unit=1.0,           # 1 unidad Blender = 1 metro
    )
    print(f"   Resultado: {res}")
except Exception as e:
    print(f"❌ Error exportando: {e}")
    import traceback; traceback.print_exc()
    sys.exit(1)

if os.path.exists(USDZ_OUT):
    size_mb = os.path.getsize(USDZ_OUT) / 1024 / 1024
    print(f"\n✅ USDZ creado: {size_mb:.2f} MB → {USDZ_OUT}")
else:
    print("❌ Archivo USDZ no fue creado."); sys.exit(1)

banner("DONE 🍕 — pizza lista, toppings arriba, 25cm")
