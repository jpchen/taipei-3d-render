"""Grand Hotel exterior interpretation: mapped footprint, 14 floors, swept roofs."""
import bpy, math, os
from collections import defaultdict
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
colors={'vermilion':(.54,.035,.022),'gold':(.68,.36,.07),'cream':(.65,.58,.43),'glass':(.035,.085,.075),'jade':(.025,.18,.14),'stone':(.56,.53,.45)}
parts=defaultdict(lambda:[[],[]])
def mesh(material,vertices,faces):
 v,f=parts[material];n=len(v);v.extend(vertices);f.extend([tuple(n+i for i in face) for face in faces])
def box(material,x,y,z,w,d,h):
 mesh(material,[(x+sx*w/2,y+sy*d/2,z+sz*h/2) for sz in [-1,1] for sy in [-1,1] for sx in [-1,1]],[(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)])
def column(x,y,z,h,r=.65):
 vertices=[]
 for dz in [-h/2,h/2]:
  for i in range(10):
   a=i*math.tau/10;vertices.append((x+r*math.cos(a),y+r*math.sin(a),z+dz))
 mesh('vermilion',vertices,[tuple(range(9,-1,-1)),tuple(range(10,20))]+[(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)])
def roof(w,d,eave,rise):
 # A long hip-and-gable silhouette, curved eaves, and fine parallel tile ridges.
 def height(x,y):
  q=max(abs(y)/(d/2),max(0,(abs(x)-(w-d)*.5))/(d*.5));q=min(1,q)
  return eave+rise*(1-q)**1.65+2.9*q**10
 nx,ny=100,36;vertices=[((i/nx-.5)*w,(j/ny-.5)*d,height((i/nx-.5)*w,(j/ny-.5)*d)) for j in range(ny+1) for i in range(nx+1)]
 mesh('gold',vertices,[(j*(nx+1)+i,j*(nx+1)+i+1,(j+1)*(nx+1)+i+1,(j+1)*(nx+1)+i) for j in range(ny) for i in range(nx)])
 for i in range(-int(w/2),int(w/2)+1):
  for j in range(18):
   for side in [-1,1]:
    y0=side*j*d/36;y1=side*(j+1)*d/36;x=i
    mesh('cream',[(x-.045,y0,height(x,y0)+.035),(x+.045,y0,height(x,y0)+.035),(x+.045,y1,height(x,y1)+.035),(x-.045,y1,height(x,y1)+.035)],[(0,1,2,3)])
 box('gold',0,0,eave+rise+.25,w-d,.7,.8)
 # Bracket band below the roof and upswept corner finials.
 for side in [-1,1]:
  for x in range(-int(w/2)+6,int(w/2)-5,3):
   box('jade',x,side*(d/2-3),eave-.7,1.8,2,.65);box('gold',x,side*(d/2-2),eave,1.1,3,.45)
 for x in [-w/2+1,w/2-1]:
  for y in [-d/2+1,d/2-1]:box('gold',x,y,eave+3.1,.8,.8,2)
# Terrace and entrance steps, south is negative Blender Y.
box('stone',0,-5,1,128,80,2)
for i in range(12):box('stone',0,-49+i*1.3,.2+i*.15,50,1.5,.4+i*.3)
box('glass',0,0,35,100,41,64)
for floor in range(14):
 z=3+floor*4.65
 box('cream',0,0,z,111,53,.5)
 for side in [-1,1]:
  y=side*25.8
  box('vermilion',0,y,z+1.15,110,.22,.18)
  box('cream',0,y,z+.45,110,.20,.18)
  for i in range(113):box('cream',i-56,y,z+.8,.12,.15,.65)
  for i in range(19):
   x=(i-9)*5.8
   box('jade',x,side*22,z+3.8,5,.5,.4)
   box('cream',x,side*20.6,z+2.3,.12,.2,3.6)
 for side in [-1,1]:
  box('vermilion',side*55,0,z+1.15,.22,51,.18)
  for j in range(51):box('cream',side*55,j-25,z+.8,.15,.12,.65)
for i in range(19):
 for y in [-25.4,25.4]:column((i-9)*5.8,y,34,66)
for x in [-54,54]:
 for y in [-17,-8,1,10,19]:column(x,y,34,66)
roof(131,72,67.5,7)
box('vermilion',0,0,75.5,103,43,6)
for x in range(-48,49,4):
 for side in [-1,1]:box('jade',x,side*21.6,75.4,2.6,.3,3)
roof(122,63,78,9)
# Double-eaved arrival pavilion.
box('glass',0,-34,6,43,16,10)
for x in [-22,-14,-7,7,14,22]:column(x,-42,5.5,10,1)
# Translate roof geometry for the entrance after constructing it.
for base,w,d,rise in [(10,55,25,3),(15.5,49,22,3)]:
 starts={k:len(v[0]) for k,v in parts.items()};roof(w,d,base,rise)
 for k,(vertices,_) in parts.items():
  for i in range(starts.get(k,0),len(vertices)):
   x,y,z=vertices[i];vertices[i]=(x,y-35,z)
box('vermilion',0,-48,11,18,.3,2)
for name,(vertices,faces) in parts.items():
 m=bpy.data.materials.new(name);m.use_nodes=True;shader=m.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*colors[name],1);shader.inputs['Roughness'].default_value=.4 if name in ['gold','glass'] else .68;shader.inputs['Metallic'].default_value=.12 if name=='gold' else 0
 g=bpy.data.meshes.new(name);g.from_pydata(vertices,[],faces);g.materials.append(m);g.update();o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath('assets/grand-hotel.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/models/grand-hotel.glb'),export_format='GLB',export_yup=True)
