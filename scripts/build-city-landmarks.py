"""Reusable Blender interpretations of three recognizable Taipei landmarks."""
import bpy, math, os
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,rough=.65):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
stone=mat('Warm limestone',(.61,.52,.39));glass=mat('Blue green glass',(.12,.29,.31),.25,.25);gold=mat('Golden ceramic roof',(.76,.40,.095),.25,.38);red=mat('Terracotta roof tiles',(.47,.12,.055),.12,.6);silver=mat('Titanium stadium roof',(.62,.66,.65),.55,.35);dark=mat('Roof ribs',(.36,.4,.38),.35,.5)
allroots=[]
def box(name,loc,size,material,root):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);o.parent=root;return o
def hip(name,w,d,eave,rise,material,root,curved=False):
 verts=[];faces=[];n=24
 for j in range(n+1):
  for i in range(n+1):
   x=(i/n*2-1);y=(j/n*2-1);q=max(abs(x),abs(y));z=eave+rise*(1-q)+(q**8*3 if curved else 0);verts.append((x*w/2,y*d/2,z))
 for j in range(n):
  for i in range(n):
   a=j*(n+1)+i;faces.append((a,a+1,a+n+2,a+n+1))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.materials.append(material);o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.parent=root

def root(name):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);allroots.append(o);return o
r=root('Sun Yat-sen Memorial Hall')
box('Foundation',(0,0,1),(113,110,2),stone,r);box('Main hall',(0,0,10),(87,80,18),stone,r);box('Glazed front',(0,-40.2,11),(78,1,12),glass,r)
for x in range(-48,49,12):
 for y in [-44,44]:box('Portico column',(x,y,10),(2.2,2.2,19),stone,r)
hip('Swept golden roof',114,112,20,10,gold,r,True)
for x in range(-50,51,5):box('Roof edge detail',(x,-55.8,22.8),(.25,1.2,.5),gold,r)
r=root('Taipei Main Station')
box('Station concourse',(0,0,12),(168,133,24),stone,r)
for x in range(-75,76,8):box('Station facade glass',(x,-67,13),(5,1,15),glass,r)
for y in range(-56,57,8):
 for x in [-84,84]:box('Side glazing',(x,y,13),(1,5,15),glass,r)
hip('Station roof lower',180,147,24,12,red,r);box('Upper roof podium',(0,0,33),(80,67,7),stone,r);hip('Station roof upper',92,80,36,9,red,r)
r=root('Taipei Dome')
box('Stadium plinth',(0,0,8),(210,154,16),stone,r)
verts=[];faces=[];rings=20;segments=64
for j in range(rings+1):
 a=j/rings*math.pi/2
 for i in range(segments):
  t=i/segments*math.tau;verts.append((112*math.cos(t)*math.sin(a),80*math.sin(t)*math.sin(a),16+48*math.cos(a)))
for j in range(rings):
 for i in range(segments):
  a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,b,b+segments,a+segments))
mesh=bpy.data.meshes.new('Dome shell');mesh.from_pydata(verts,[],faces);mesh.materials.append(silver);o=bpy.data.objects.new('Elliptical titanium shell',mesh);bpy.context.collection.objects.link(o);o.parent=r
for p in mesh.polygons:p.use_smooth=True
for j in [6,11,16,20]:
 a=j/rings*math.pi/2;bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=4,location=(0,0,16+48*math.cos(a)),major_radius=112*math.sin(a),minor_radius=.38);o=bpy.context.object;o.scale.y=80/112;o.data.materials.append(dark);o.parent=r
os.makedirs('public/models',exist_ok=True)
for i,r in enumerate(allroots):
 bpy.ops.object.select_all(action='DESELECT');r.select_set(True)
 for c in r.children:c.select_set(True)
 filename=['sun-yat-sen','taipei-main-station','taipei-dome'][i]
 bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/models/'+filename+'.glb'),export_format='GLB',use_selection=True,export_yup=True)
for i,r in enumerate(allroots):r.location.x=i*300
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath('assets/taipei-landmarks.blend'))
