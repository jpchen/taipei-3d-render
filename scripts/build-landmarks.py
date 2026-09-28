"""Build a reusable, meter-scale Taipei 101 model. Blender Z up exports to glTF Y up."""
import bpy, math, os
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metallic=0, roughness=.4, emission=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metallic; p.inputs['Roughness'].default_value=roughness
 if emission: p.inputs['Emission Color'].default_value=(*color,1); p.inputs['Emission Strength'].default_value=emission
 return m
glass=material('Jade blue curtain glass',(.09,.27,.28),.65,.23)
trim=material('Pale aluminum fins',(.34,.44,.40),.7,.28)
stone=material('Podium limestone',(.44,.42,.35),.1,.7)
light=material('Warm architectural lights',(.95,.62,.25),.2,.4,2)

def box(name, xyz, scale, mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz); o=bpy.context.object; o.name=name; o.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(mat); return o

def taper(name,z,h,bottom,top,mat):
 verts=[(x*s/2,y*s/2,zz) for zz,s in [(z,bottom),(z+h,top)] for x,y in [(-1,-1),(1,-1),(1,1),(-1,1)]]
 mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]); mesh.materials.append(mat); ob=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(ob)

box('Retail podium',(0,0,12),(155,120,24),stone)
box('Tower foundation',(0,0,35),(70,70,70),glass)
taper('Sloping lower tower',30,105,68,52,glass)
# The eight stacked pagoda modules are Taipei 101’s defining silhouette.
for tier in range(8):
 z=135+tier*36
 taper('Bamboo tier %02d'%tier,z,33,45,59,glass)
 box('Tier cornice',(0,0,z+33),(61,61,2.2),trim)
 box('Tier light',(0,0,z+34.3),(60,60,.65),light)
 for floor in range(1,9):
  f=floor/9; w=45+14*f
  zz=z+33*f
  for side in [-1,1]:
   box('Horizontal mullion',(0,side*w/2,zz),(w,.3,.5),trim)
   box('Horizontal mullion',(side*w/2,0,zz),(.3,w,.5),trim)
 for side in [-1,1]:
  for k in [-.32,-.16,0,.16,.32]:
   # Slanted ribs on each glass face.
   for axis in [0,1]:
    a=Vector((k*45,side*22.5,z)); b=Vector((k*59,side*29.5,z+33))
    if axis: a.x,a.y=a.y,a.x; b.x,b.y=b.y,b.x
    mid=(a+b)/2; o=box('Vertical aluminum rib',mid,(.45,.45,(b-a).length),trim); o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
taper('Crown',423,30,35,28,glass)
box('Lantern',(0,0,464),(18,18,22),glass)
for z in range(454,477,4): box('Lantern ring',(0,0,z),(20,20,.8),light)
taper('Spire base',475,17,10,4,trim)
bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=2.1,radius2=.3,depth=16,location=(0,0,500)); bpy.context.object.data.materials.append(trim)
# A restrained beacon at the 508 m tip.
bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=.8,location=(0,0,508)); bpy.context.object.data.materials.append(light)
os.makedirs('assets',exist_ok=True); os.makedirs('public/models',exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath('assets/taipei-101.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/models/taipei-101.glb'),export_format='GLB',export_yup=True)
print('Taipei 101 saved and exported')
