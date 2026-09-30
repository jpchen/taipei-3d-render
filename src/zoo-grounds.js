import * as T from 'three';import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';import {terrainHeight,drapeGeometry} from './terrain.js';
export function createZooGrounds(group,data,terrain){
 const parts=[],roofs=[],height=(x,z)=>terrainHeight(terrain,x,z);
 function colored(g,c){g.deleteAttribute('uv');const a=new Float32Array(g.attributes.position.count*3),v=new T.Color(c);for(let i=0;i<a.length;i+=3)v.toArray(a,i);g.setAttribute('color',new T.BufferAttribute(a,3));if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));return g;}
 function surface(poly,c,offset){const g=drapeGeometry(new T.ShapeGeometry(new T.Shape(poly.map(p=>new T.Vector2(p[0],-p[1])))).rotateX(-Math.PI/2),terrain,offset);parts.push(colored(g,c));}
 function box(x,y,z,w,h,d,c){parts.push(colored(new T.BoxGeometry(w,h,d).translate(x,y,z),c));}
 function rod(a,b,r,c){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),g=new T.CylinderGeometry(r,r,v.length(),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());parts.push(colored(g,c));}
 function line(a,b,w,c,offset){const dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz);if(d<.05)return;const nx=-dz/d*w/2,nz=dx/d*w/2;surface([[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]],c,offset);}
 surface(data.boundary,'#53684a',.025);
 for(const path of data.paths)for(let i=1;i<path.p.length;i++)line(path.p[i-1],path.p[i],path.width,'#b6ae91',.26);
 // A warm narrow trail marks a connected visitor itinerary, on top of existing mapped paths.
 const seen=new Set();for(const leg of data.trail)for(let i=1;i<leg.p.length;i++){const a=leg.p[i-1],b=leg.p[i],key=[a.join(','),b.join(',')].sort().join(':');if(seen.has(key))continue;seen.add(key);line(a,b,.5,'#e9ca83',.30);}
 for(const h of data.habitats){const ring=h.footprint;surface(ring,h.species==='flamingo'?'#648b82':h.species==='penguin'?'#aaa99b':h.indoor?'#90967a':'#92946e',.13);
  for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(d/3));
   for(let j=0;j<n;j++){const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;box(x,height(x,z)+.8,z,.13,1.6,.13,'#7d8271');}
   for(const y of [.65,1.3])rod([a[0],height(...a)+y,a[1]],[b[0],height(...b)+y,b[1]],.045,'#8b927c');
  }
  if(h.indoor){const shape=new T.Shape(ring.map(p=>new T.Vector2(p[0],-p[1]))),g=drapeGeometry(new T.ShapeGeometry(shape).rotateX(-Math.PI/2),terrain,7),mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:h.species==='panda'?'#6b8e75':'#759098',side:T.DoubleSide,roughness:.8}));mesh.name=`Cutaway roof: ${h.species}`;group.add(mesh);roofs.push({mesh,h});
   for(let i=0;i<ring.length;i+=3){const [x,z]=ring[i];box(x,height(x,z)+3.5,z,.35,7,.35,'#d3ceb4');}
  }
  const r=h.radius*.5;
  if(h.species==='penguin'){const pool=Array.from({length:12},(_,i)=>[h.x+Math.cos(i/12*Math.PI*2)*r,h.z+h.radius*.42+Math.sin(i/12*Math.PI*2)*r*.4]);surface(pool,'#5796a0',.18);}
  if(['panda','red-panda','monkey'].includes(h.species)){
   for(let j=0;j<4;j++){const angle=j*Math.PI/2,x=h.x+Math.cos(angle)*r,z=h.z+Math.sin(angle)*r,y=height(x,z);rod([x,y,z],[x,y+2.3,z],.13,'#71543a');rod([x,y+2,z],[h.x,y+1.2,h.z],.12,'#866345');}
   if(h.species==='panda')for(let j=0;j<20;j++){const a=j*.85,x=h.x+Math.cos(a)*(r+3),z=h.z+Math.sin(a)*(r+3),y=height(x,z);rod([x,y,z],[x+.2,y+2.5+(j%4)*.3,z],.035,'#668748');const g=new T.ConeGeometry(.6,1.3,5).translate(x,y+2.7,z);parts.push(colored(g,'#72924f'));}
  }
  for(let j=0;j<5;j++){const a=j*1.37,x=h.x+Math.cos(a)*(h.radius-2),z=h.z+Math.sin(a)*(h.radius-2),g=new T.IcosahedronGeometry(1,0).scale(1.4+(j%2),.6+j*.1,1.2).translate(x,height(x,z)+.4,z);parts.push(colored(g,'#9b9985'));}
 }
 const gateStart=parts.length;const [x,z]=data.entrance.p,y=height(x,z);for(const dx of [-15,-8,8,15])box(x+dx,y+3,z,1,6,1,'#d3c6a6');box(x,y+6,z,33,.7,7,'#748b68');for(const dx of [-12,12]){box(x+dx,y+1.2,z+3,5,2.4,4,'#b1a083');box(x+dx,y+2,z+5.1,3.8,.7,.08,'#435e5c');}
 const c=document.createElement('canvas');c.width=1024;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#365348';ctx.fillRect(0,0,1024,160);ctx.fillStyle='#f2e6c8';ctx.textAlign='center';ctx.font='52px sans-serif';ctx.fillText('臺北市立動物園',512,66);ctx.font='32px sans-serif';ctx.fillText('TAIPEI ZOO',512,120);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(22,3.4),new T.MeshStandardMaterial({map:texture,side:T.DoubleSide,roughness:.8}));sign.position.set(x,y+5.2,z-.6);sign.rotation.y=Math.PI;
 const gate=data.entrance.gate;if(gate){const transform=new T.Matrix4().makeTranslation(gate.center[0],height(...gate.center)-y,gate.center[1]).multiply(new T.Matrix4().makeRotationY(gate.angle)).multiply(new T.Matrix4().makeScale(gate.width/33,1,Math.max(1,gate.depth/7))).multiply(new T.Matrix4().makeTranslation(-x,0,-z));for(let i=gateStart;i<parts.length;i++)parts[i].applyMatrix4(transform);sign.applyMatrix4(transform);}group.add(sign);
 const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.9,side:T.DoubleSide}));mesh.name='Zoo entrance, mapped paths and exhibit furnishings';mesh.receiveShadow=true;group.add(mesh);
 return {roofs,update(camera){for(const {mesh,h} of roofs)mesh.visible=Math.hypot(camera.position.x-h.x,camera.position.z-h.z)>180||camera.position.y-height(h.x,h.z)>140;}};
}
