"""Small reusable animal silhouettes; no texture downloads or skeletal rigs."""
import bpy,math,os
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
materials={}
def mat(color):
 if color not in materials:
  m=bpy.data.materials.new(str(color));m.diffuse_color=(*color,1);m.use_nodes=True;s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*color,1);s.inputs['Roughness'].default_value=.85;materials[color]=m
 return materials[color]
def ell(name,pos,scale,color):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=pos);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat(color));bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return o
def rod(name,a,b,r,color):
 from mathutils import Vector
 v=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=r,radius2=r*.8,depth=v.length,location=(Vector(a)+Vector(b))/2);o=bpy.context.object;o.name=name;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();o.data.materials.append(mat(color));return o
# Blender Z up and -Y forward become Three Y up and +Z forward.
brown=(.32,.16,.055);tan=(.72,.48,.18);black=(.025,.025,.022);white=(.79,.78,.68);gray=(.40,.43,.40);pink=(.87,.32,.36)
roots=[]
for species in ['giraffe','zebra','elephant','flamingo']:
 before=set(bpy.data.objects)
 if species=='giraffe':
  ell('Torso',(0,0,2.45),(.56,1.08,.75),tan)
  for x in [-.34,.34]:
   for y in [-.66,.65]:rod('Leg',(x,y,.13),(x,y,2.55),.095,tan);ell('Hoof',(x,y-.04,.13),(.12,.18,.11),brown)
  rod('Long neck',(0,-.65,2.6),(0,-1.05,4.6),.24,tan);ell('Head',(0,-1.25,4.65),(.24,.49,.27),tan)
  for x in [-.2,.2]:ell('Ear',(x,-.9,4.84),(.2,.10,.07),tan);rod('Ossicone',(x*.6,-1,4.84),(x*.6,-1,5.12),.04,brown);ell('Eye',(x,-1.37,4.74),(.035,.035,.035),black)
  for side in [-1,1]:
   for j in range(5):
    for k in range(3):ell('Coat patch',(side*.53,-.72+j*.35,2.08+k*.31),(.025,.13,.1),brown)
   for j in range(6):ell('Neck patch',(side*.22,-.72-j*.05,2.9+j*.27),(.025,.09,.10),brown)
  rod('Tail',(0,1,2.45),(0,1.35,1.75),.045,brown)
 elif species=='zebra':
  ell('Torso',(0,0,1.3),(.43,.93,.51),white)
  for x in [-.28,.28]:
   for y in [-.55,.55]:rod('Leg',(x,y,.1),(x,y,1.25),.075,white);ell('Hoof',(x,y-.03,.1),(.10,.13,.08),black)
  rod('Neck',(0,-.6,1.4),(0,-.9,2.05),.22,white);ell('Head',(0,-1.1,2.05),(.22,.4,.25),white)
  for x in [-.14,.14]:ell('Ear',(x,-.93,2.35),(.075,.07,.22),white);ell('Eye',(x*1.5,-1.17,2.14),(.03,.03,.03),black)
  for y in [-.66,-.43,-.2,.04,.27,.5,.7]:
   bpy.ops.mesh.primitive_torus_add(major_segments=16,minor_segments=4,major_radius=1,minor_radius=.08,location=(0,y,1.3),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name='Black coat stripe';o.scale=(.40*math.sqrt(max(.25,1-y*y)),.49*math.sqrt(max(.25,1-y*y)),.4);o.data.materials.append(mat(black))
  rod('Mane',(0,-.65,1.7),(0,-.88,2.26),.09,black);rod('Tail',(0,.8,1.5),(0,1.2,.95),.04,black)
 elif species=='elephant':
  ell('Torso',(0,0,1.9),(1,1.55,1.15),gray)
  for x in [-.62,.62]:
   for y in [-.8,.8]:rod('Leg',(x,y,.2),(x,y,1.7),.24,gray)
  ell('Head',(0,-1.32,2.23),(.72,.7,.9),gray)
  for x in [-.88,.88]:ell('Large ear',(x,-1.18,2.2),(.6,.18,.93),(.46,.43,.4));ell('Eye',(x*.59,-1.86,2.46),(.045,.04,.045),black)
  for a,b,r in [((0,-1.82,2.1),(0,-2.1,1.35),.24),((0,-2.1,1.35),(0,-2.2,.7),.18),((0,-2.2,.7),(0,-2.48,.46),.13)]:rod('Trunk',a,b,r,gray)
  for x in [-.38,.38]:rod('Tusk',(x,-1.8,1.9),(x,-2.35,1.52),.07,white)
  rod('Tail',(0,1.4,2),(0,1.85,1.05),.055,gray)
 else:
  ell('Body',(0,0,1.05),(.19,.4,.25),pink)
  for x in [-.10,.10]:rod('Thin leg',(x,0,.06),(x,0,1.05),.022,(.65,.3,.27))
  rod('Lower neck',(0,-.2,1.2),(0,-.05,1.62),.065,pink);rod('Upper neck',(0,-.05,1.62),(0,-.25,1.9),.055,pink);ell('Head',(0,-.32,1.9),(.09,.13,.12),pink);rod('Bill',(0,-.4,1.9),(0,-.48,1.77),.05,black)
  for x in [-.075,.075]:ell('Eye',(x,-.35,1.94),(.012,.014,.014),black)
 parts=[o for o in bpy.data.objects if o not in before];root=bpy.data.objects.new(species,None);bpy.context.collection.objects.link(root)
 for o in parts:o.parent=root
 roots.append(root)
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in parts:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/models/zoo-'+species+'.glb'),export_format='GLB',use_selection=True,export_yup=True)
for i,r in enumerate(roots):r.location.x=i*6
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath('assets/zoo-animals.blend'))
