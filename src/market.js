import {vendorGeometry} from './vendor.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export async function createMarket(scene,dusk){
 const response=await fetch('/data/market.json',{cache:'no-cache'});if(!response.ok)throw Error('Market data unavailable');const data=await response.json();
 function merged(parts){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return g;}
 const box=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z);
 const counter=merged([box(2.5,.85,1.35,0,.65,0),box(2.7,.12,1.6,0,1.12,0),...[-1,1].map(x=>box(.065,2.5,.065,x*1.25,1.4,-.55)),...[-1,0,1].map(x=>new THREE.CylinderGeometry(.21,.21,.12,8).translate(x*.6,1.24,.25)),box(.5,.5,.5,.8,1.38,-.38)]);
 const canopy=merged([box(2.9,.16,2,0,2.6,0),box(2.9,.32,.10,0,2.4,1)]);
 const lantern=merged([new THREE.SphereGeometry(.22,8,6).translate(-.9,2.05,.95),new THREE.SphereGeometry(.22,8,6).translate(.9,2.05,.95),box(2.3,.035,.06,0,2.25,.85)]);
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=256;const c=canvas.getContext('2d');
 const names=[['蚵仔煎','OYSTER OMELET'],['珍珠奶茶','BUBBLE TEA'],['鹽酥雞','FRIED CHICKEN'],['臭豆腐','STINKY TOFU'],['烤香腸','GRILLED SAUSAGE'],['冰品','SHAVED ICE']];
 names.forEach(([zh,en],i)=>{c.fillStyle=['#9c3530','#37756a','#d7a540','#536c88','#b85435','#697846'][i];c.fillRect(i*256,0,256,256);c.fillStyle='#fff0c3';c.textAlign='center';c.font='bold 40px sans-serif';c.fillText(zh,i*256+128,105);c.font='16px sans-serif';c.fillText(en,i*256+128,155);});
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const signMat=new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#fff0cf',emissiveIntensity:.5,roughness:.7});
 signMat.onBeforeCompile=s=>{s.vertexShader='attribute float signIndex;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
 vMapUv=vec2((uv.x*.96+signIndex+.02)/6.,uv.y);vEmissiveMapUv=vMapUv;`);};
 const signGeo=new THREE.PlaneGeometry(2.5,.75).translate(0,1.92,1.01);const indices=new THREE.InstancedBufferAttribute(new Float32Array(data.stalls.length),1);signGeo.setAttribute('signIndex',indices);
 const glow=new THREE.MeshStandardMaterial({color:'#ef8640',emissive:'#ff9b37',emissiveIntensity:.9});
 const defs={vendor:[vendorGeometry(-.3),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8})],counter:[counter,new THREE.MeshStandardMaterial({color:'#b4b5a8',metalness:.45,roughness:.6})],canopy:[canopy,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.8})],sign:[signGeo,signMat],lantern:[lantern,glow]},meshes={};
 const dummy=new THREE.Object3D(),clip=new THREE.Vector3(),color=new THREE.Color(),palette=['#a93d35','#37756a','#d5ac58','#596e8c','#bf673e','#657a4a'];
 for(const [name,[geometry,material]] of Object.entries(defs)){const mesh=new THREE.InstancedMesh(geometry,material,data.stalls.length);mesh.name=`Shilin: ${name}`;mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);meshes[name]=mesh;}
 let previous=-10;const stats={stalls:data.stalls.length,visibleStalls:0,drawCalls:0};
 function update(time,camera,quality){if(time-previous<.35||document.hidden)return;previous=time;let count=0;
  for(const stall of data.stalls){clip.set(stall.x,stall.y+1.5,stall.z);if(clip.distanceTo(camera.position)>(quality==='low'?600:1200))continue;clip.project(camera);if(Math.abs(clip.x)>1.15||Math.abs(clip.y)>1.15||clip.z<0||clip.z>1)continue;dummy.position.set(stall.x,stall.y,stall.z);dummy.rotation.set(0,stall.angle,0);dummy.updateMatrix();for(const mesh of Object.values(meshes))mesh.setMatrixAt(count,dummy.matrix);meshes.canopy.setColorAt(count,color.set(palette[stall.variant]));indices.setX(count,stall.variant);count++;}
  for(const mesh of Object.values(meshes)){mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;}if(meshes.canopy.instanceColor)meshes.canopy.instanceColor.needsUpdate=true;indices.needsUpdate=true;signMat.emissiveIntensity=.4+dusk.value*.6;glow.emissiveIntensity=.75+dusk.value;stats.visibleStalls=count;stats.drawCalls=count?5:0;
 }
 function destination(){const route=data.routes.reduce((a,b)=>a.p.length>b.p.length?a:b),a=route.p[Math.floor(route.p.length*.7)],b=route.p[Math.floor(route.p.length*.44)];return {pos:new THREE.Vector3(a[0],a[2]+18,a[1]),target:new THREE.Vector3(b[0],b[2]+4,b[1])};}
 return {update,stats,meshes,destination};
}
